<?php

namespace App\Http\Controllers;

use App\Services\GoogleDriveService;
use Illuminate\Http\Request;

class GoogleDriveController extends Controller
{
    protected function getService()
    {
        return new GoogleDriveService();
    }

    public function index(Request $request)
    {
        try {
            $folderId = $request->query('folder_id');
            $files = $this->getService()->listFiles($folderId);
            return response()->json($files);
        } catch (\Exception $e) {
            $status = 500;
            if (str_contains(strtolower($e->getMessage()), 're-authenticate') || str_contains(strtolower($e->getMessage()), 'expired')) {
                $status = 401;
            }
            return response()->json(['error' => $e->getMessage()], $status);
        }
    }

    public function upload(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,webm,pdf,doc,docx,xls,xlsx,zip,rar,txt|max:102400', // 100MB max
                'folder_id' => 'nullable|string'
            ]);

            $file = $request->file('file');
            $folderId = $request->input('folder_id');

            $uploadedFile = $this->getService()->uploadFile($file, $folderId);

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

            $folder = $this->getService()->createFolder($folderName, $parentFolderId);

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

    public function rename(Request $request)
    {
        try {
            $request->validate([
                'file_id' => 'required|string',
                'name' => 'required|string|max:255',
                'parent_folder_id' => 'nullable|string'
            ]);

            $fileId = $request->input('file_id');
            $newName = $request->input('name');
            $parentFolderId = $request->input('parent_folder_id');

            $item = $this->getService()->renameFileOrFolder($fileId, $newName, $parentFolderId);

            return response()->json([
                'success' => true,
                'item' => $item,
                'message' => 'Renamed successfully'
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
        try {
            $request->validate([
                'file_id' => 'required|string',
                'parent_folder_id' => 'nullable|string'
            ]);

            $fileId = $request->input('file_id');
            $parentFolderId = $request->input('parent_folder_id');

            $this->getService()->deleteFile($fileId, $parentFolderId);

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
}
