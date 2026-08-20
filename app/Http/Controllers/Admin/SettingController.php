<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\DailyWorksheetSetting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');

        $user = auth()->user();
        $admin = null;
        if ($user instanceof \App\Models\Admin) {
            $admin = $user;
        } else if ($user->role === 'admin') {
            $admin = \App\Models\Admin::where('email', $user->email)->first();
        } else if (!empty($user->admin_id)) {
            $admin = \App\Models\Admin::find($user->admin_id);
        }

        $settings['month_start_day'] = $admin ? ($admin->month_start_day ?? 25) : 25;
        $settings['month_end_day'] = $admin ? ($admin->month_end_day ?? 24) : 24;

        $adminId = $admin ? $admin->id : 0;
        $settings['admin_email'] = $settings["admin_email_{$adminId}"] ?? ($admin ? $admin->email : ($settings['admin_email'] ?? ($user->email ?? '')));
        $settings['monthly_working_days'] = $settings["monthly_working_days_{$adminId}"] ?? ($settings['monthly_working_days'] ?? null);

        if (!isset($settings['designers_task_type_options'])) {
            $settings['designers_task_type_options'] = 'Poster, Thumbnail, Story, Carousel, Grid, Other';
        }

        // Automatically calculate working days for current month if not set
        if (!isset($settings['monthly_working_days'])) {
            $settings['monthly_working_days'] = $this->calculateWorkingDays(Carbon::now());
        }

        $userQuery = \App\Models\User::where('is_active', true);
        if ($admin) {
            $userQuery->where('admin_id', $admin->id);
        }
        $users = $userQuery->orderBy('name')->get(['id', 'name', 'email']);

        $worksheetSettingsQuery = DailyWorksheetSetting::query();
        if ($admin) {
            $worksheetSettingsQuery->where('admin_id', $admin->id);
        }
        $worksheetSettings = $worksheetSettingsQuery->whereNotNull('user_id')->get()->keyBy('user_id');

        $backupProps = [];
        if ($user->role === 'superadmin') {
            $gdriveService = app(\App\Services\GoogleDriveBackupService::class);
            $gdriveTest = $gdriveService->testConnection();

            $backupProps = [
                'backupSettings' => [
                    'backup_auto_enabled' => ($settings['backup_auto_enabled'] ?? '0') === '1',
                    'backup_daily_time' => $settings['backup_daily_time'] ?? '23:59',
                    'backup_google_drive_folder' => $settings['backup_google_drive_folder'] ?? 'WorkNest Backups',
                    'timezone' => config('app.timezone', 'Asia/Kolkata'),
                ],
                'gdriveStatus' => [
                    'connected' => $gdriveTest['success'],
                    'email' => $gdriveTest['email'] ?? null,
                    'message' => $gdriveTest['message'],
                ],
                'backups' => \App\Models\DatabaseBackup::latest()->paginate(15)->through(function ($backup) {
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
                }),
                'isProcessing' => \App\Models\DatabaseBackup::where('status', 'processing')
                    ->where('created_at', '>=', now()->subMinutes(15))
                    ->exists(),
            ];
        }

        return Inertia::render('Admin/Settings/Index', array_merge([
            'settings' => $settings,
            'users' => $users,
            'worksheetSettings' => $worksheetSettings,
        ], $backupProps));
    }


    public function update(Request $request)
    {
        $data = $request->validate([
            'admin_email' => 'nullable|email',
            'monthly_working_days' => 'nullable|integer|min:0|max:31',
            'month_start_day' => 'nullable|integer|min:1|max:31',
            'month_end_day' => 'nullable|integer|min:1|max:31',
            'beta_menu_items' => 'nullable|array',
            'hidden_modules' => 'nullable|array',
        ]);

        $user = auth()->user();
        $admin = null;
        if ($user instanceof \App\Models\Admin) {
            $admin = $user;
        } else if ($user->role === 'admin') {
            $admin = \App\Models\Admin::where('email', $user->email)->first();
        } else if (!empty($user->admin_id)) {
            $admin = \App\Models\Admin::find($user->admin_id);
        }

        if ($admin) {
            $admin->update([
                'month_start_day' => $data['month_start_day'] ?? 25,
                'month_end_day' => $data['month_end_day'] ?? 24,
            ]);
        }

        $adminId = $admin ? $admin->id : 0;

        foreach ($data as $key => $value) {
            if (in_array($key, ['month_start_day', 'month_end_day'])) continue;
            
            $saveKey = $key;
            if (in_array($key, ['admin_email', 'monthly_working_days'])) {
                $saveKey = "{$key}_{$adminId}";
            }

            $val = is_array($value) ? json_encode($value) : $value;
            Setting::updateOrCreate(['key' => $saveKey], ['value' => $val]);
        }

        \Illuminate\Support\Facades\Cache::forget('global_settings_map');

        return back()->with('success', 'Settings updated successfully.');
    }

    public function updateWorksheetSetting(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'client_name_enabled' => 'boolean',
            'task_type_enabled' => 'boolean',
            'status_enabled' => 'boolean',
            'file_name_enabled' => 'boolean',
            'drive_link_enabled' => 'boolean',
            'project_enabled' => 'boolean',
            'task_type_freetext' => 'boolean',
            'task_type_options' => 'nullable|string',
        ]);

        $user = auth()->user();
        $admin = null;
        if ($user instanceof \App\Models\Admin) {
            $admin = $user;
        } else if ($user->role === 'admin') {
            $admin = \App\Models\Admin::where('email', $user->email)->first();
        } else if (!empty($user->admin_id)) {
            $admin = \App\Models\Admin::find($user->admin_id);
        }
        $adminId = $admin ? $admin->id : null;

        DailyWorksheetSetting::updateOrCreate(
            ['user_id' => $validated['user_id'], 'admin_id' => $adminId],
            array_merge($validated, ['admin_id' => $adminId])
        );

        return back()->with('success', 'User worksheet settings updated successfully.');
    }

    public function updateDesignersSetting(Request $request)
    {
        $validated = $request->validate([
            'designers_task_type_options' => 'nullable|string',
        ]);

        Setting::updateOrCreate(
            ['key' => 'designers_task_type_options'],
            ['value' => $validated['designers_task_type_options'] ?? 'Poster, Thumbnail, Story, Carousel, Grid, Other']
        );

        return back()->with('success', 'Designers worklist settings updated successfully.');
    }

    private function calculateWorkingDays(Carbon $date)
    {
        $daysInMonth = $date->daysInMonth;
        $workingDays = 0;

        for ($i = 1; $i <= $daysInMonth; $i++) {
            $currentDate = Carbon::create($date->year, $date->month, $i);
            if (!$currentDate->isWeekend()) {
                $workingDays++;
            }
        }

        return $workingDays;
    }
}