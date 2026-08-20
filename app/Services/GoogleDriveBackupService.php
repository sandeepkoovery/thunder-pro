<?php

namespace App\Services;

use Google\Service\Drive\DriveFile;
use App\Services\GoogleDriveService;
use App\Models\Setting;
use App\Models\Admin;

class GoogleDriveBackupService
{
    protected ?GoogleDriveService $driveService = null;

    public function __construct()
    {
        // Resolve superadmin context if available
        $superAdmin = Admin::where('role', 'superadmin')->first();
        $adminId = $superAdmin ? $superAdmin->id : null;

        $this->driveService = new GoogleDriveService($adminId);
    }

    /**
     * Check if Google Drive service is authenticated and ready.
     */
    public function isConnected(): bool
    {
        return $this->driveService->isConnected();
    }

    /**
     * Test connection to Google Drive API.
     */
    public function testConnection(): array
    {
        if (!$this->isConnected()) {
            return [
                'success' => false,
                'message' => 'Google Drive account is not connected. Please authorize a Google Drive account.'
            ];
        }

        try {
            $client = $this->driveService->getClient();
            $service = new \Google\Service\Drive($client);
            
            // Perform a lightweight API call to test connection
            $about = $service->about->get(['fields' => 'user, storageQuota']);
            $email = $about->getUser() ? $about->getUser()->getEmailAddress() : 'Unknown Google Account';

            return [
                'success' => true,
                'message' => "Google Drive connection test successful! Connected as: {$email}",
                'email' => $email
            ];
        } catch (\Exception $e) {
            \Log::error('Google Drive Test Connection Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Google Drive connection test failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Ensure the base, year, month, and day folder hierarchy exists on Google Drive.
     * Hierarchy: BaseFolder / YYYY / MM / DD
     */
    public function ensureFolderHierarchy(string $baseFolderName, \DateTimeInterface $date): array
    {
        if (!$this->isConnected()) {
            throw new \Exception('Google Drive service is not connected.');
        }

        $client = $this->driveService->getClient();
        $service = new \Google\Service\Drive($client);

        $rootFolderId = $this->driveService->getFolderId() ?: 'root';

        $year = $date->format('Y');
        $month = $date->format('m');
        $day = $date->format('d');

        // 1. Base Folder
        $baseFolderId = $this->findOrCreateFolder($service, $baseFolderName, $rootFolderId);

        // 2. Year Folder (YYYY)
        $yearFolderId = $this->findOrCreateFolder($service, $year, $baseFolderId);

        // 3. Month Folder (MM)
        $monthFolderId = $this->findOrCreateFolder($service, $month, $yearFolderId);

        // 4. Day Folder (DD)
        $dayFolderId = $this->findOrCreateFolder($service, $day, $monthFolderId);

        return [
            'base_folder_id' => $baseFolderId,
            'year_folder_id' => $yearFolderId,
            'month_folder_id' => $monthFolderId,
            'day_folder_id' => $dayFolderId,
        ];
    }

    /**
     * Upload a local backup file to Google Drive under the configured date directory structure.
     */
    public function uploadBackup(string $localFilePath, string $fileName, \DateTimeInterface $date): array
    {
        if (!file_exists($localFilePath)) {
            throw new \Exception("Backup file does not exist at local path: {$localFilePath}");
        }

        if (!$this->isConnected()) {
            throw new \Exception('Google Drive client is not connected.');
        }

        $baseFolderName = Setting::where('key', 'backup_google_drive_folder')->value('value') ?: 'WorkNest Backups';

        // 1. Ensure folder structure exists
        $folderHierarchy = $this->ensureFolderHierarchy($baseFolderName, $date);
        $targetFolderId = $folderHierarchy['day_folder_id'];

        // 2. Upload file to target day folder
        $client = $this->driveService->getClient();
        $service = new \Google\Service\Drive($client);

        $fileMetadata = new DriveFile([
            'name' => $fileName,
            'parents' => [$targetFolderId]
        ]);

        $content = file_get_contents($localFilePath);
        $fileSize = filesize($localFilePath);

        $uploadedFile = $service->files->create($fileMetadata, [
            'data' => $content,
            'mimeType' => 'application/sql',
            'uploadType' => 'multipart',
            'fields' => 'id, name, mimeType, webViewLink, size'
        ]);

        if (!$uploadedFile || !$uploadedFile->getId()) {
            throw new \Exception('Google Drive upload returned invalid response without file ID.');
        }

        return [
            'file_id' => $uploadedFile->getId(),
            'folder_id' => $targetFolderId,
            'web_view_link' => $uploadedFile->getWebViewLink(),
            'file_size' => $uploadedFile->getSize() ?: $fileSize,
        ];
    }

    /**
     * Helper to find or create a folder inside a parent folder.
     */
    protected function findOrCreateFolder(\Google\Service\Drive $service, string $folderName, string $parentId): string
    {
        $escapedName = str_replace("'", "\\'", $folderName);
        $escapedParent = str_replace("'", "\\'", $parentId);

        $optParams = [
            'q' => "'{$escapedParent}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '{$escapedName}'",
            'fields' => 'files(id, name)',
            'pageSize' => 1
        ];

        $results = $service->files->listFiles($optParams);
        $files = $results->getFiles();

        if (count($files) > 0) {
            return $files[0]->getId();
        }

        $fileMetadata = new DriveFile([
            'name' => $folderName,
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [$parentId]
        ]);

        $folder = $service->files->create($fileMetadata, [
            'fields' => 'id, name'
        ]);

        return $folder->getId();
    }
}
