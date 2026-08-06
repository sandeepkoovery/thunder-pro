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

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'users' => $users,
            'worksheetSettings' => $worksheetSettings,
        ]);
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
        if ($user instanceof \App\Models\Admin) {
            $user->update([
                'month_start_day' => $data['month_start_day'] ?? 25,
                'month_end_day' => $data['month_end_day'] ?? 24,
            ]);
        } else if (!empty($user->admin_id)) {
            \App\Models\Admin::where('id', $user->admin_id)->update([
                'month_start_day' => $data['month_start_day'] ?? 25,
                'month_end_day' => $data['month_end_day'] ?? 24,
            ]);
        }

        foreach ($data as $key => $value) {
            if (in_array($key, ['month_start_day', 'month_end_day'])) continue;
            $val = is_array($value) ? json_encode($value) : $value;
            Setting::updateOrCreate(['key' => $key], ['value' => $val]);
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