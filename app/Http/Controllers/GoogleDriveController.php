<?php

namespace App\Http\Controllers;

use App\Services\GoogleDriveService;
use Illuminate\Http\Request;

class GoogleDriveController extends Controller
{
    protected $googleDriveService;

    public function __construct(GoogleDriveService $googleDriveService)
    {
        $this->googleDriveService = $googleDriveService;
    }

    public function index(Request $request)
    {
        try {
            $folderId = $request->query('folder_id');
            $files = $this->googleDriveService->listFiles($folderId);
            return response()->json($files);
        } catch (\Exception $e) {
            $status = 500;
            if (str_contains($e->getMessage(), 're-authenticate')) {
                $status = 401;
            }
            return response()->json(['error' => $e->getMessage()], $status);
        }
    }

    public function upload(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,webm|max:102400', // 100MB max
                'folder_id' => 'nullable|string'
            ]);

            $file = $request->file('file');
            $folderId = $request->input('folder_id');

            $uploadedFile = $this->googleDriveService->uploadFile($file, $folderId);

            return response()->json([
                'success' => true,
                'file' => $uploadedFile,
                'message' => 'File uploaded successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createFolder(Request $request)
    {
        try {
            $request->validate([
                'folder_name' => 'required|string|max:255',
                'parent_folder_id' => 'nullable|string'
            ]);

            $folderName = $request->input('folder_name');
            $parentFolderId = $request->input('parent_folder_id');

            $folder = $this->googleDriveService->createFolder($folderName, $parentFolderId);

            return response()->json([
                'success' => true,
                'folder' => $folder,
                'message' => 'Folder created successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function delete(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized. Only admins can delete files.'
            ], 403);
        }

        try {
            $request->validate([
                'file_id' => 'required|string',
                'parent_folder_id' => 'nullable|string'
            ]);

            $fileId = $request->input('file_id');
            $parentFolderId = $request->input('parent_folder_id');

            $this->googleDriveService->deleteFile($fileId, $parentFolderId);

            return response()->json([
                'success' => true,
                'message' => 'Deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateAuthUrl()
    {
        $client = $this->googleDriveService->getClient();
        if (!$client) {
            return "Google Client not initialized. Check your Client ID and Secret in .env.";
        }

        $client->setRedirectUri(route('admin.google.callback'));
        $authUrl = $client->createAuthUrl();

        return redirect()->away($authUrl);
    }

    public function handleCallback(Request $request)
    {
        $client = $this->googleDriveService->getClient();
        $client->setRedirectUri(route('admin.google.callback'));

        if ($request->has('code')) {
            $token = $client->fetchAccessTokenWithAuthCode($request->input('code'));

            if (isset($token['error'])) {
                return response()->json($token);
            }

            return response()->json([
                'message' => 'Copy the refresh_token below and paste it into your .env file as GOOGLE_DRIVE_REFRESH_TOKEN',
                'refresh_token' => $token['refresh_token'] ?? 'No refresh token returned. Make sure you revoked access first or set prompt to consent.',
                'full_token' => $token
            ]);
        }

        return "No code provided.";
    }
}
