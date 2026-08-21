<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DatabaseBackup;
use App\Models\Setting;
use App\Services\DatabaseBackupService;
use App\Services\GoogleDriveBackupService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;

class DatabaseBackupController extends Controller
{
    protected DatabaseBackupService $backupService;
    protected GoogleDriveBackupService $gdriveService;

    public function __construct(DatabaseBackupService $backupService, GoogleDriveBackupService $gdriveService)
    {
        $this->backupService = $backupService;
        $this->gdriveService = $gdriveService;
    }

    /**
     * Display the Database Backup settings & history page.
     */
    public function index(Request $request)
    {
        $settings = [
            'backup_auto_enabled' => Setting::where('key', 'backup_auto_enabled')->value('value') === '1',
            'backup_daily_time' => Setting::where('key', 'backup_daily_time')->value('value') ?: '23:59',
            'backup_google_drive_folder' => Setting::where('key', 'backup_google_drive_folder')->value('value') ?: 'WorkNest Backups',
            'backup_notification_email' => Setting::where('key', 'backup_notification_email')->value('value') ?: ($request->user()->email ?? ''),
            'timezone' => config('app.timezone', 'Asia/Kolkata'),
        ];

        $gdriveTest = $this->gdriveService->testConnection();
        $gdriveStatus = [
            'connected' => $gdriveTest['success'],
            'email' => $gdriveTest['email'] ?? null,
            'message' => $gdriveTest['message'],
        ];

        $backups = DatabaseBackup::latest()->paginate(15)->through(function ($backup) {
            return [
                'id' => $backup->id,
                'file_name' => $backup->file_name,
                'google_drive_file_id' => $backup->google_drive_file_id,
                'google_drive_folder_id' => $backup->google_drive_folder_id,
                'file_size' => $backup->file_size,
                'formatted_file_size' => $backup->formatted_file_size,
                'status' => $backup->status,
                'trigger_type' => $backup->trigger_type ?: 'manual',
                'backup_started_at' => $backup->backup_started_at ? $backup->backup_started_at->toDateTimeString() : null,
                'backup_completed_at' => $backup->backup_completed_at ? $backup->backup_completed_at->toDateTimeString() : null,
                'google_drive_link' => $backup->google_drive_link,
                'error_message' => $backup->error_message,
                'created_at' => $backup->created_at->toDateTimeString(),
            ];
        });

        $activeBackup = DatabaseBackup::where('status', 'processing')
            ->where('created_at', '>=', now()->subMinutes(15))
            ->first();

        return Inertia::render('Admin/Settings/BackupIndex', [
            'backupSettings' => $settings,
            'gdriveStatus' => $gdriveStatus,
            'backups' => $backups,
            'isProcessing' => !empty($activeBackup),
        ]);
    }

    /**
     * Update backup configuration settings.
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'backup_auto_enabled' => 'required|boolean',
            'backup_daily_time' => 'required|string',
            'backup_google_drive_folder' => 'required|string|max:255',
            'backup_notification_email' => 'nullable|email|max:255',
        ]);

        $rawTime = trim($validated['backup_daily_time']);
        $timezone = config('app.timezone', 'Asia/Kolkata');

        try {
            // Normalize time string to 24-hour H:i format (e.g. "02:15 PM" -> "14:15")
            $normalizedTime = \Carbon\Carbon::parse($rawTime, $timezone)->format('H:i');
        } catch (\Exception $e) {
            $normalizedTime = $rawTime;
        }

        Setting::updateOrCreate(
            ['key' => 'backup_auto_enabled'],
            ['value' => $validated['backup_auto_enabled'] ? '1' : '0']
        );

        Setting::updateOrCreate(
            ['key' => 'backup_daily_time'],
            ['value' => $normalizedTime]
        );


        Setting::updateOrCreate(
            ['key' => 'backup_google_drive_folder'],
            ['value' => trim($validated['backup_google_drive_folder']) ?: 'WorkNest Backups']
        );

        Setting::updateOrCreate(
            ['key' => 'backup_notification_email'],
            ['value' => trim($validated['backup_notification_email'] ?? '')]
        );

        Cache::forget('global_settings_map');

        return back()->with('success', 'Database backup settings updated successfully.');
    }

    /**
     * Test Google Drive Connection.
     */
    public function testConnection()
    {
        $result = $this->gdriveService->testConnection();

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'email' => $result['email'] ?? null,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message'],
        ], 422);
    }

    /**
     * Trigger immediate manual database backup ("Backup Now").
     */
    public function runBackup(Request $request)
    {
        try {
            $backup = $this->backupService->runBackup('manual');

            return back()->with('success', "Database backup completed successfully! File: {$backup->file_name} ({$backup->formatted_file_size})");
        } catch (\Throwable $e) {
            \Log::error("Manual Database Backup Failed: " . $e->getMessage());
            return back()->with('error', "Backup Failed: " . $e->getMessage());
        }
    }

    /**
     * Delete a backup history record.
     */
    public function destroy($id)
    {
        $backup = DatabaseBackup::findOrFail($id);
        $backup->delete();

        return back()->with('success', 'Backup history entry deleted successfully.');
    }
}
