<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Google\Client;
use App\Models\Admin;
use App\Models\GoogleDriveConnection;
use App\Services\GoogleDriveService;

class GoogleDriveAuthController extends Controller
{
    protected function getAdminContext()
    {
        $user = auth()->user();
        if (!$user) return null;

        return Admin::where('email', $user->email)->first()
            ?? Admin::find($user->admin_id);
    }

    public function redirect(Request $request)
    {
        $admin = $this->getAdminContext();
        $connection = $admin ? $admin->googleDriveConnection : null;

        $clientId = $connection?->client_id 
            ?: Setting::where('key', 'google_drive_client_id')->value('value') 
            ?: Setting::where('key', 'google_client_id')->value('value') 
            ?: config('services.google.client_id');

        $clientSecret = $connection?->client_secret 
            ?: Setting::where('key', 'google_drive_client_secret')->value('value') 
            ?: Setting::where('key', 'google_client_secret')->value('value') 
            ?: config('services.google.client_secret');

        if (!$clientId || !$clientSecret) {
            return redirect()->route('drive.index', ['open_settings' => '1'])->with('error', 'Google Client ID & Client Secret are required to initiate Google OAuth login. Please configure them below or in .env.');
        }

        $client = new Client();
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setRedirectUri(route('google-drive.callback'));
        $client->addScope('https://www.googleapis.com/auth/drive');
        $client->setAccessType('offline');
        $client->setPrompt('consent');

        $authUrl = $client->createAuthUrl();

        return redirect()->away($authUrl);
    }

    public function callback(Request $request)
    {
        try {
            $code = $request->query('code');
            $admin = $this->getAdminContext();

            if (!$code) {
                return redirect()->route('drive.index')->with('error', 'Authorization code missing from Google Callback.');
            }

            if (!$admin) {
                return redirect()->route('drive.index')->with('error', 'Admin account context not found.');
            }

            $connection = $admin->googleDriveConnection;
            $clientId = $connection?->client_id 
                ?: Setting::where('key', 'google_drive_client_id')->value('value') 
                ?: Setting::where('key', 'google_client_id')->value('value') 
                ?: config('services.google.client_id');

            $clientSecret = $connection?->client_secret 
                ?: Setting::where('key', 'google_drive_client_secret')->value('value') 
                ?: Setting::where('key', 'google_client_secret')->value('value') 
                ?: config('services.google.client_secret');

            $client = new Client();
            $client->setClientId($clientId);
            $client->setClientSecret($clientSecret);
            $client->setRedirectUri(route('google-drive.callback'));

            $token = $client->fetchAccessTokenWithAuthCode($code);

            if (isset($token['error'])) {
                return redirect()->route('drive.index')->with('error', 'Google Auth Error: ' . ($token['error_description'] ?? $token['error']));
            }

            $connectionData = [
                'token_expires_at' => now()->addSeconds($token['expires_in'] ?? 3600),
            ];

            if (!empty($token['refresh_token'])) {
                $connectionData['refresh_token'] = $token['refresh_token'];
            }

            $connection = GoogleDriveConnection::updateOrCreate(
                ['admin_id' => $admin->id],
                $connectionData
            );

            // Initialize drive service to ensure default root folder is generated
            $driveService = new GoogleDriveService($admin->id);

            $targetRoute = in_array($admin->role, ['superadmin', 'super_admin', 'admin']) ? 'admin.settings.index' : 'drive.index';

            return redirect()->route($targetRoute)->with('success', 'Google Drive account connected successfully!');


        } catch (\Exception $e) {
            \Log::error('Google Drive Callback Exception: ' . $e->getMessage());
            return redirect()->route('drive.index')->with('error', 'Failed to connect Google Drive: ' . $e->getMessage());
        }
    }

    public function status(Request $request)
    {
        $admin = $this->getAdminContext();

        if (!$admin) {
            return response()->json(['connected' => false, 'message' => 'No admin context found.']);
        }

        $connection = $admin->googleDriveConnection;
        $driveService = new GoogleDriveService($admin->id);

        return response()->json([
            'connected' => $driveService->isConnected(),
            'has_custom_connection' => $connection && !empty($connection->refresh_token),
            'admin_id' => $admin->id,
            'client_id' => $connection?->client_id ?? '',
            'client_secret' => $connection?->client_secret ?? '',
            'refresh_token' => $connection?->refresh_token ?? '',
            'root_folder_id' => $driveService->getFolderId() ?? '',
            'created_at' => $connection?->created_at?->toDateTimeString(),
            'token_expires_at' => $connection?->token_expires_at?->toDateTimeString(),
        ]);
    }

    public function disconnect(Request $request)
    {
        try {
            $admin = $this->getAdminContext();

            if ($admin && $admin->googleDriveConnection) {
                $service = new GoogleDriveService($admin->id);
                $service->clearCache();
                $admin->googleDriveConnection->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Google Drive connection parameters cleared successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function saveManualConnection(Request $request)
    {
        try {
            $request->validate([
                'client_id' => 'nullable|string',
                'client_secret' => 'nullable|string',
                'refresh_token' => 'nullable|string',
                'root_folder_id' => 'nullable|string'
            ]);

            $admin = $this->getAdminContext();

            if (!$admin) {
                return response()->json(['success' => false, 'error' => 'Admin context not found.'], 404);
            }

            $dataToSave = [];

            if ($request->has('refresh_token') && !empty($request->input('refresh_token'))) {
                $dataToSave['refresh_token'] = trim($request->input('refresh_token'));
            }

            if ($request->has('root_folder_id')) {
                $dataToSave['root_folder_id'] = trim($request->input('root_folder_id')) ?: null;
            }

            if ($request->has('client_id')) {
                $clientIdVal = trim($request->input('client_id')) ?: null;
                $dataToSave['client_id'] = $clientIdVal;
                if ($clientIdVal) {
                    \App\Models\Setting::updateOrCreate(['key' => 'google_drive_client_id'], ['value' => $clientIdVal]);
                }
            }

            if ($request->has('client_secret')) {
                $clientSecretVal = trim($request->input('client_secret')) ?: null;
                $dataToSave['client_secret'] = $clientSecretVal;
                if ($clientSecretVal) {
                    \App\Models\Setting::updateOrCreate(['key' => 'google_drive_client_secret'], ['value' => $clientSecretVal]);
                }
            }

            if (!empty($dataToSave)) {
                $connection = GoogleDriveConnection::updateOrCreate(
                    ['admin_id' => $admin->id],
                    $dataToSave
                );
            }

            // Re-initialize service & clear stale cache
            $service = new GoogleDriveService($admin->id);
            $service->clearCache();

            return response()->json([
                'success' => true,
                'message' => 'Google Drive OAuth parameters saved successfully.',
                'connected' => $service->isConnected(),
                'root_folder_id' => $service->getFolderId(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
