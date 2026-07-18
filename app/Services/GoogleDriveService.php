<?php

namespace App\Services;

use Google\Client;
use Google\Service\Drive;
use Illuminate\Support\Facades\Cache;

class GoogleDriveService
{
    protected $client;
    protected $service;
    protected $folderId;

    public function __construct()
    {
        try {
            $this->client = new Client();
            $this->client->setClientId(config('services.google.client_id'));
            $this->client->setClientSecret(config('services.google.client_secret'));
            $this->client->setScopes([
                'https://www.googleapis.com/auth/drive'
            ]);
            $this->client->setAccessType('offline');
            $this->client->setPrompt('select_account consent');

            $refreshToken = config('services.google.refresh_token');

            if (!$refreshToken) {
                \Log::warning('Google Drive Refresh Token not configured in .env (GOOGLE_DRIVE_REFRESH_TOKEN).');
                return;
            }

            // Try to get access token from cache
            $cacheKey = 'google_drive_access_token';
            $accessToken = Cache::get($cacheKey);

            if ($accessToken) {
                $this->client->setAccessToken($accessToken);
            }

            // If token is expired or not in cache, refresh it
            if ($this->client->isAccessTokenExpired()) {
                $newToken = $this->client->fetchAccessTokenWithRefreshToken($refreshToken);

                if (isset($newToken['error'])) {
                    $errorMsg = $newToken['error_description'] ?? $newToken['error'] ?? 'Unknown error';
                    \Log::error('Google Drive Token Refresh Failed', [
                        'error' => $newToken['error'],
                        'error_description' => $errorMsg,
                        'hint' => 'If error is "invalid_grant", your refresh token might be expired (Testing mode) or revoked.'
                    ]);

                    if ($newToken['error'] === 'invalid_grant') {
                        throw new \Exception('Google Drive authentication expired. Please re-authenticate in the admin settings.');
                    }

                    $this->client = null;
                    return;
                }

                // Cache the new token (Google tokens usually last 1 hour, we cache for 55 mins)
                Cache::put($cacheKey, $newToken, 3300);
                $this->client->setAccessToken($newToken);
            }

            $this->service = new Drive($this->client);
            $this->folderId = config('services.google.folder_id');

        } catch (\Exception $e) {
            \Log::error('Google Drive Service Init Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            $this->client = null;
        }
    }

    public function listFiles($folderId = null)
    {
        if (!$this->service) {
            throw new \Exception('Google Drive service not initialized. Please check your refresh token and credentials in .env.');
        }

        $targetFolderId = $folderId ?: $this->folderId;

        return Cache::remember("google_drive_files_{$targetFolderId}", 3600, function () use ($targetFolderId) {
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
            throw new \Exception('Google Drive service not initialized. Please check your refresh token and credentials in .env.');
        }

        try {
            $targetFolderId = $folderId ?: $this->folderId;

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

            // Clear cache for this folder
            Cache::forget("google_drive_files_{$targetFolderId}");

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
            throw new \Exception('Google Drive service not initialized. Please check your refresh token and credentials in .env.');
        }

        try {
            $targetParentId = $parentFolderId ?: $this->folderId;

            $fileMetadata = new \Google\Service\Drive\DriveFile([
                'name' => $folderName,
                'mimeType' => 'application/vnd.google-apps.folder',
                'parents' => [$targetParentId]
            ]);

            $folder = $this->service->files->create($fileMetadata, [
                'fields' => 'id, name, mimeType'
            ]);

            // Clear cache for this folder
            Cache::forget("google_drive_files_{$targetParentId}");

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
            throw new \Exception('Google Drive service not initialized. Please check your refresh token and credentials in .env.');
        }

        try {
            $this->service->files->delete($fileId);

            // Clear cache for the parent folder
            $targetParentId = $parentFolderId ?: $this->folderId;
            Cache::forget("google_drive_files_{$targetParentId}");

            return true;
        } catch (\Exception $e) {
            \Log::error('Google Drive Delete Error: ' . $e->getMessage(), [
                'file_id' => $fileId,
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Failed to delete: ' . $e->getMessage());
        }
    }

    public function getClient()
    {
        return $this->client;
    }
}
