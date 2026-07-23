<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PricingController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (auth()->check() && !in_array(auth()->user()->role, ['superadmin', 'admin'])) {
                abort(403, 'Unauthorized action.');
            }
            return $next($request);
        });
    }

    public function index()
    {
        $user = auth()->user();
        $isSuperAdmin = $user->role === 'superadmin';

        $basicFeaturesJson = Setting::where('key', 'basic_plan_features')->value('value');
        if ($basicFeaturesJson) {
            $basicFeatures = json_decode($basicFeaturesJson, true);
            foreach ($basicFeatures as &$feat) {
                if (!isset($feat['included'])) {
                    $feat['included'] = true;
                }
            }
        } else {
            $basicModulesLegacy = json_decode(Setting::where('key', 'basic_plan_modules')->value('value') ?? '[]', true);
            if (!empty($basicModulesLegacy)) {
                $basicFeatures = [];
                $labels = [
                    'projects' => 'Projects',
                    'users' => 'Employees',
                    'leaves' => 'Leaves',
                    'attendance' => 'Attendance',
                    'calendar' => 'Calendar',
                    'chat' => 'Chat',
                    'reports' => 'Reports',
                    'user_limit_basic' => 'Max 10 Active Users',
                ];
                foreach ($basicModulesLegacy as $key) {
                    $basicFeatures[] = [
                        'key' => $key,
                        'label' => $labels[$key] ?? ucfirst($key),
                        'is_core' => true,
                        'included' => true
                    ];
                }
            } else {
                $basicFeatures = [
                    ['key' => 'projects', 'label' => 'Projects', 'is_core' => true, 'included' => true],
                    ['key' => 'users', 'label' => 'Employees', 'is_core' => true, 'included' => true],
                    ['key' => 'leaves', 'label' => 'Leaves', 'is_core' => true, 'included' => true],
                    ['key' => 'attendance', 'label' => 'Attendance', 'is_core' => true, 'included' => true],
                    ['key' => 'user_limit_basic', 'label' => 'Max 10 Active Users', 'is_core' => true, 'included' => true],
                ];
            }
        }

        $premiumFeaturesJson = Setting::where('key', 'premium_plan_features')->value('value');
        if ($premiumFeaturesJson) {
            $premiumFeatures = json_decode($premiumFeaturesJson, true);
            foreach ($premiumFeatures as &$feat) {
                if (!isset($feat['included'])) {
                    $feat['included'] = true;
                }
            }
        } else {
            $premiumModulesLegacy = json_decode(Setting::where('key', 'premium_plan_modules')->value('value') ?? '[]', true);
            if (!empty($premiumModulesLegacy)) {
                $premiumFeatures = [];
                $labels = [
                    'projects' => 'Projects',
                    'users' => 'Employees',
                    'leaves' => 'Leaves',
                    'attendance' => 'Attendance',
                    'calendar' => 'Calendar',
                    'chat' => 'Chat',
                    'reports' => 'Reports',
                    'user_limit_premium' => 'Unlimited Users',
                ];
                foreach ($premiumModulesLegacy as $key) {
                    $premiumFeatures[] = [
                        'key' => $key,
                        'label' => $labels[$key] ?? ucfirst($key),
                        'is_core' => true,
                        'included' => true
                    ];
                }
            } else {
                $premiumFeatures = [
                    ['key' => 'projects', 'label' => 'Projects', 'is_core' => true, 'included' => true],
                    ['key' => 'users', 'label' => 'Employees', 'is_core' => true, 'included' => true],
                    ['key' => 'leaves', 'label' => 'Leaves', 'is_core' => true, 'included' => true],
                    ['key' => 'attendance', 'label' => 'Attendance', 'is_core' => true, 'included' => true],
                    ['key' => 'calendar', 'label' => 'Calendar', 'is_core' => true, 'included' => true],
                    ['key' => 'chat', 'label' => 'Chat', 'is_core' => true, 'included' => true],
                    ['key' => 'reports', 'label' => 'Reports', 'is_core' => true, 'included' => true],
                    ['key' => 'user_limit_premium', 'label' => 'Unlimited Users', 'is_core' => true, 'included' => true],
                ];
            }
        }

        $settings = [
            'basic_plan_price' => Setting::where('key', 'basic_plan_price')->value('value') ?? '999',
            'premium_plan_price' => Setting::where('key', 'premium_plan_price')->value('value') ?? '2999',
            'basic_plan_features' => $basicFeatures,
            'premium_plan_features' => $premiumFeatures,
        ];

        $admins = [];
        if ($isSuperAdmin) {
            $admins = User::where('role', 'admin')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'plan', 'is_active']);
        }

        return Inertia::render('Admin/Pricing/Index', [
            'settings' => $settings,
            'admins' => $admins,
            'currentPlan' => $user->plan ?? 'basic',
        ]);
    }

    public function subscribe(Request $request)
    {
        $request->validate([
            'plan' => 'required|in:basic,premium',
        ]);

        $user = auth()->user();
        if ($user->role !== 'admin') {
            return back()->with('error', 'Only standard admins can subscribe to plans.');
        }

        $user->update(['plan' => $request->plan]);

        return back()->with('success', 'Plan updated successfully to ' . ucfirst($request->plan) . ' plan.');
    }

    public function updateSettings(Request $request)
    {
        if (auth()->user()->role !== 'superadmin') {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'basic_plan_price' => 'required|numeric|min:0',
            'premium_plan_price' => 'required|numeric|min:0',
            'basic_plan_features' => 'required|array',
            'premium_plan_features' => 'required|array',
        ]);

        $basicKeys = [];
        foreach ($validated['basic_plan_features'] as $feat) {
            if (($feat['included'] ?? true) === true || $feat['included'] === 'true' || $feat['included'] === 1) {
                $basicKeys[] = $feat['key'];
            }
        }

        $premiumKeys = [];
        foreach ($validated['premium_plan_features'] as $feat) {
            if (($feat['included'] ?? true) === true || $feat['included'] === 'true' || $feat['included'] === 1) {
                $premiumKeys[] = $feat['key'];
            }
        }

        Setting::updateOrCreate(['key' => 'basic_plan_price'], ['value' => $validated['basic_plan_price']]);
        Setting::updateOrCreate(['key' => 'premium_plan_price'], ['value' => $validated['premium_plan_price']]);
        Setting::updateOrCreate(['key' => 'basic_plan_features'], ['value' => json_encode($validated['basic_plan_features'])]);
        Setting::updateOrCreate(['key' => 'premium_plan_features'], ['value' => json_encode($validated['premium_plan_features'])]);
        
        // Sync legacy keys for route and side navigation checks compatibility
        Setting::updateOrCreate(['key' => 'basic_plan_modules'], ['value' => json_encode($basicKeys)]);
        Setting::updateOrCreate(['key' => 'premium_plan_modules'], ['value' => json_encode($premiumKeys)]);

        return back()->with('success', 'Pricing settings updated successfully.');
    }

    public function updateAdminPlan(Request $request, User $user)
    {
        if (auth()->user()->role !== 'superadmin') {
            abort(403, 'Unauthorized.');
        }

        $request->validate([
            'plan' => 'required|in:basic,premium',
        ]);

        if ($user->role !== 'admin') {
            return back()->with('error', 'Plan can only be updated for admin users.');
        }

        $user->update(['plan' => $request->plan]);

        return back()->with('success', 'Plan updated successfully for ' . $user->name . '.');
    }
}
