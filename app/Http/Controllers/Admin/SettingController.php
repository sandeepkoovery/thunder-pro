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
            'beta_menu_items' => 'nullable|array',
            'hidden_modules' => 'nullable|array',
        ]);

        foreach ($data as $key => $value) {
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