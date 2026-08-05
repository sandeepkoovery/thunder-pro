<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
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
        } else if (!empty($user->admin_id)) {
            $admin = \App\Models\Admin::find($user->admin_id);
        }

        $settings['month_start_day'] = $admin ? ($admin->month_start_day ?? 25) : 25;
        $settings['month_end_day'] = $admin ? ($admin->month_end_day ?? 24) : 24;

        // Automatically calculate working days for current month if not set
        if (!isset($settings['monthly_working_days'])) {
            $settings['monthly_working_days'] = $this->calculateWorkingDays(Carbon::now());
        }

        $users = \App\Models\User::where('role', '!=', 'admin')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'users' => $users,
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

        return back()->with('success', 'Settings updated successfully.');
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