<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $setting = Setting::where('key', 'additional_modules')->first();
        if ($setting) {
            $modules = json_decode($setting->value, true) ?: [];
            $keys = array_column($modules, 'key');
            if (!in_array('salary_slips', $keys)) {
                $modules[] = [
                    'key' => 'salary_slips',
                    'label' => 'Salary Slips',
                    'name' => 'Salary Slips',
                    'price' => 499,
                    'description' => 'Upload employee Excel sheets to auto-generate and manage verified payslips',
                    'included' => true,
                ];
                $setting->value = json_encode($modules);
                $setting->save();
            }
        } else {
            Setting::create([
                'key' => 'additional_modules',
                'value' => json_encode([
                    [
                        'key' => 'salary_slips',
                        'label' => 'Salary Slips',
                        'name' => 'Salary Slips',
                        'price' => 499,
                        'description' => 'Upload employee Excel sheets to auto-generate and manage verified payslips',
                        'included' => true,
                    ]
                ]),
            ]);
        }

        Cache::forget('global_settings_map');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $setting = Setting::where('key', 'additional_modules')->first();
        if ($setting) {
            $modules = json_decode($setting->value, true) ?: [];
            $modules = array_values(array_filter($modules, function ($m) {
                return ($m['key'] ?? '') !== 'salary_slips';
            }));
            $setting->value = json_encode($modules);
            $setting->save();
        }

        Cache::forget('global_settings_map');
    }
};
