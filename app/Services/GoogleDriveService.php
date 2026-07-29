<?php

namespace App\Services;

use Google\Client;
use Google\Service\Drive;
use Illuminate\Support\Facades\Cache;
use App\Models\Admin;
use App\Models\GoogleDriveConnection;

class GoogleDriveService
{
    protected $client;
    protected $service;
    protected $folderId;
    protected $admin;
    protected $connection;

    public function __construct($adminId = null)
    {
        $this->admin = $this->resolveAdminContext($adminId);
        $this->initService();
    }

    public static function forAdmin($adminId)
    {
        return new self($adminId);
    }

    protected function resolveAdminContext($adminId = null)
    {
        if ($adminId) {
            return Admin::find($adminId);
        }

        if (auth()->check()) {
            $user = auth()->user();
            if ($user instanceof Admin) {
                return $user;
            }

            return Admin::where('email', $user->email)->first()
                ?? Admin::find($user->admin_id ?? 0)
                ?? Admin::first();
        }

        return null;
    }

    protected function initService()
    {
        try {
            $this->connection = $this->admin ? $this->admin->googleDriveConnection : null;

            if (!$this->connection || !$this->connection->refresh_token) {
                \Log::info('Google Drive: No connected account in database for Admin ID: ' . ($this->admin->id ?? 'unknown'));
                $this->client = null;
                $this->service = null;
                return;
            }

            $clientId = $this->connection->client_id ?: config('services.google.client_id');
            $clientSecret = $this->connection->client_secret ?: config('services.google.client_secret');

            $this->client = new Client();
            $this->client->setClientId($clientId);
            $this->client->setClientSecret($clientSecret);
            $this->client->setScopes([
                'https://www.googleapis.com/auth/drive'
            ]);
            $this->client->setAccessType('offline');
            $this->client->setPrompt('consent');

            $refreshToken = $this->connection->refresh_token;
            $this->folderId = $this->connection->root_folder_id;

            // Set cached access token if valid
            $cacheKey = 'google_drive_access_token_' . ($this->admin->id ?? 'global');
            $accessToken = Cache::get($cacheKey);

            if ($accessToken) {
                $this->client->setAccessToken($accessToken);
            }

            // If token is expired or not in cache, refresh it using refresh_token
            if ($this->client->isAccessTokenExpired()) {
                $newToken = $this->client->fetchAccessTokenWithRefreshToken($refreshToken);

                if (isset($newToken['error'])) {
                    $errorMsg = $newToken['error_description'] ?? $newToken['error'] ?? 'Unknown error';
                    \Log::error('Google Drive Token Refresh Failed for Admin: ' . ($this->admin->id ?? 'global'), [
                        'error' => $newToken['error'],
                        'error_description' => $errorMsg
                    ]);

                    if ($newToken['error'] === 'invalid_grant') {
                        throw new \Exception('Google Drive authentication expired for this account. Please reconnect Google Drive.');
                    }

                    $this->client = null;
                    return;
                }

                Cache::put($cacheKey, $newToken, 3300);
                $this->client->setAccessToken($newToken);

                if ($this->connection) {
                    $this->connection->update([
                        'token_expires_at' => now()->addSeconds($newToken['expires_in'] ?? 3600),
                    ]);
                }
            }

            $this->service = new Drive($this->client);
        } catch (\Exception $e) {
            \Log::error('Google Drive Service Init Error: ' . $e->getMessage(), [
                'admin_id' => $this->admin->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            $this->client = null;
        }
    }

    public function isConnected()
    {
        return $this->service !== null;
    }

    public function clearCache($folderId = null)
    {
        $adminKey = $this->admin->id ?? 'global';
        $targetFolderId = $folderId ?: ($this->folderId ?: 'root');
        if ($targetFolderId) {
            Cache::forget("google_drive_files_{$adminKey}_{$targetFolderId}");
        }
        Cache::forget("google_drive_access_token_{$adminKey}");
    }

    public function listFiles($folderId = null)
    {
        if (!$this->service) {
            throw new \Exception('Google Drive service not initialized. Please connect a Google Drive account.');
        }

        $targetFolderId = $folderId ?: ($this->folderId ?: 'root');
        $adminKey = $this->admin->id ?? 'global';

        return Cache::remember("google_drive_files_{$adminKey}_{$targetFolderId}", 15, function () use ($targetFolderId) {
            $optParams = [
                'q' => "'{$targetFolderId}' in parents and trashed = false",
                'fields' => 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink)',
                'orderBy' => 'folder, createdTime desc'
            ];

            $results = $this->service->files->listFiles($optParams);
            $files = [];

            foreach ($results->getFiles() as $file) {
                $files[] = [
                    'id' => $file->getId(),
                    'name' => $file->getName(),
                    'mimeType' => $file->getMimeType(),
                    'webViewLink' => $file->getWebViewLink(),
                    'webContentLink' => $file->getWebContentLink(),
                    'thumbnailLink' => $file->getThumbnailLink(),
                    'type' => $file->getMimeType() === 'application/vnd.google-apps.folder' ? 'folder' : (strpos($file->getMimeType(), 'video') !== false ? 'video' : 'image')
                ];
            }

            return $files;
        });
    }

    public function uploadFile($file, $folderId = null)
    {
        if (!$this->service) {
            throw new \Exception('Google Drive service not initialized. Please connect a Google Drive account.');
        }

        try {
            $targetFolderId = $folderId ?: ($this->folderId ?: 'root');

            $fileMetadata = new \Google\Service\Drive\DriveFile([
                'name' => $file->getClientOriginalName(),
                'parents' => [$targetFolderId]
            ]);

            $content = file_get_contents($file->getRealPath());
            $mimeType = $file->getMimeType();

            $uploadedFile = $this->service->files->create($fileMetadata, [
                'data' => $content,
                'mimeType' => $mimeType,
                'uploadType' => 'multipart',
                'fields' => 'id, name, mimeType, webViewLink, thumbnailLink'
            ]);

            $adminKey = $this->admin->id ?? 'global';
            Cache::forget("google_drive_files_{$adminKey}_{$targetFolderId}");

            return [
                'id' => $uploadedFile->getId(),
                'name' => $uploadedFile->getName(),
                'mimeType' => $uploadedFile->getMimeType(),
                'webViewLink' => $uploadedFile->getWebViewLink(),
                'thumbnailLink' => $uploadedFile->getThumbnailLink(),
            ];
        } catch (\Exception $e) {
            \Log::error('Google Drive Upload Error: ' . $e->getMessage(), [
                'file_name' => $file->getClientOriginalName(),
                'folder_id' => $folderId,
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Upload failed: ' . $e->getMessage());
        }
    }

    public function createFolder($folderName, $parentFolderId = null)
    {
        if (!$this->service) {
            throw new \Exception('Google Drive service not initialized. Please connect a Google Drive account.');
        }

        try {
            $targetParentId = $parentFolderId ?: ($this->folderId ?: 'root');

            $fileMetadata = new \Google\Service\Drive\DriveFile([
                'name' => $folderName,
                'mimeType' => 'application/vnd.google-apps.folder',
                'parents' => [$targetParentId]
            ]);

            $folder = $this->service->files->create($fileMetadata, [
                'fields' => 'id, name, mimeType'
            ]);

            $adminKey = $this->admin->id ?? 'global';
            Cache::forget("google_drive_files_{$adminKey}_{$targetParentId}");

            return [
                'id' => $folder->getId(),
                'name' => $folder->getName(),
                'mimeType' => $folder->getMimeType(),
            ];
        } catch (\Exception $e) {
            \Log::error('Google Drive Create Folder Error: ' . $e->getMessage(), [
                'folder_name' => $folderName,
                'parent_id' => $parentFolderId,
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Failed to create folder: ' . $e->getMessage());
        }
    }

    public function deleteFile($fileId, $parentFolderId = null)
    {
        if (!$this->service) {
            throw new \Exception('Google Drive service not initialized. Please connect a Google Drive account.');
        }

        try {
            $this->service->files->delete($fileId);

            $targetParentId = $parentFolderId ?: $this->folderId;
            $adminKey = $this->admin->id ?? 'global';
            Cache::forget("google_drive_files_{$adminKey}_{$targetParentId}");

            return true;
        } catch (\Exception $e) {
            \Log::error('Google Drive Delete Error: ' . $e->getMessage(), [
                'file_id' => $fileId,
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Failed to delete: ' . $e->getMessage());
        }
    }

    public function renameFileOrFolder($fileId, $newName, $parentFolderId = null)
    {
        if (!$this->service) {
            throw new \Exception('Google Drive service not initialized. Please connect a Google Drive account.');
        }

        try {
            $fileMetadata = new \Google\Service\Drive\DriveFile([
                'name' => $newName
            ]);

            $updatedFile = $this->service->files->update($fileId, $fileMetadata, [
                'fields' => 'id, name, mimeType, webViewLink, thumbnailLink'
            ]);

            $targetParentId = $parentFolderId ?: $this->folderId;
            $adminKey = $this->admin->id ?? 'global';
            Cache::forget("google_drive_files_{$adminKey}_{$targetParentId}");

            return [
                'id' => $updatedFile->getId(),
                'name' => $updatedFile->getName(),
                'mimeType' => $updatedFile->getMimeType(),
                'webViewLink' => $updatedFile->getWebViewLink(),
                'thumbnailLink' => $updatedFile->getThumbnailLink(),
            ];
        } catch (\Exception $e) {
            \Log::error('Google Drive Rename Error: ' . $e->getMessage(), [
                'file_id' => $fileId,
                'new_name' => $newName,
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Failed to rename: ' . $e->getMessage());
        }
    }

    public function getClient()
    {
        return $this->client;
    }

    public function getFolderId()
    {
        return $this->folderId;
    }

    public function getConnection()
    {
        return $this->connection;
    }
}
