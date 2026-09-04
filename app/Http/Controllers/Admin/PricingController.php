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
            if ($request->routeIs('pricing.public')) {
                return $next($request);
            }
            if (auth()->check() && !in_array(auth()->user()->role, ['superadmin', 'admin'])) {
                abort(403, 'Unauthorized action.');
            }
            return $next($request);
        });
    }

    public function getPricingSettings()
    {
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
                    ['key' => 'projects', 'label' => 'Core Project & Task Tracking', 'is_core' => true, 'included' => true],
                    ['key' => 'users', 'label' => 'Employee Directory & Profiles', 'is_core' => true, 'included' => true],
                    ['key' => 'leaves', 'label' => 'Automated Leave Requests', 'is_core' => true, 'included' => true],
                    ['key' => 'attendance', 'label' => 'Real-Time Attendance Logging', 'is_core' => true, 'included' => true],
                    ['key' => 'user_limit_basic', 'label' => 'Up to 10 Active Team Members', 'is_core' => true, 'included' => true],
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
                    'projects' => 'Advanced Multi-Project Management',
                    'users' => 'Unlimited Employee Management',
                    'leaves' => 'Automated Leave & Approval Workflows',
                    'attendance' => 'Real-Time Biometric & Geo Attendance',
                    'calendar' => 'Interactive Shared Team Calendar',
                    'chat' => 'Instant Workspace Team Messaging',
                    'reports' => 'Executive Analytics & Custom Reports',
                    'user_limit_premium' => 'Unlimited Active Users & Scale',
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
                    ['key' => 'projects', 'label' => 'Advanced Multi-Project Management', 'is_core' => true, 'included' => true],
                    ['key' => 'users', 'label' => 'Unlimited Employee Management', 'is_core' => true, 'included' => true],
                    ['key' => 'leaves', 'label' => 'Automated Leave & Approval Workflows', 'is_core' => true, 'included' => true],
                    ['key' => 'attendance', 'label' => 'Real-Time Biometric & Geo Attendance', 'is_core' => true, 'included' => true],
                    ['key' => 'calendar', 'label' => 'Interactive Shared Team Calendar', 'is_core' => true, 'included' => true],
                    ['key' => 'chat', 'label' => 'Instant Workspace Team Messaging', 'is_core' => true, 'included' => true],
                    ['key' => 'reports', 'label' => 'Executive Analytics & Custom Reports', 'is_core' => true, 'included' => true],
                    ['key' => 'drive', 'label' => 'Cloud Storage & Drive Integration', 'is_core' => true, 'included' => true],
                    ['key' => 'user_limit_premium', 'label' => 'Unlimited Active Users & Scale', 'is_core' => true, 'included' => true],
                ];
            }
        }

        $additionalModulesJson = Setting::where('key', 'additional_modules')->value('value');
        if ($additionalModulesJson) {
            $additionalModules = json_decode($additionalModulesJson, true);
            foreach ($additionalModules as &$mod) {
                if (!isset($mod['included']) || $mod['included'] === false) {
                    $mod['included'] = true;
                }
                if (!isset($mod['price'])) {
                    $mod['price'] = 499;
                }
            }
            $hasAi = false;
            $hasCatering = false;
            foreach ($additionalModules as $mod) {
                if (($mod['key'] ?? '') === 'ai_assistant') {
                    $hasAi = true;
                }
                if (($mod['key'] ?? '') === 'catering') {
                    $hasCatering = true;
                }
            }
            if (!$hasAi) {
                $additionalModules[] = [
                    'key' => 'ai_assistant',
                    'label' => 'AI Voice Assistant',
                    'price' => 499,
                    'description' => 'Malayalam & English Voice AI Assistant for database queries',
                    'included' => true
                ];
            }
            if (!$hasCatering) {
                $additionalModules[] = [
                    'key' => 'catering',
                    'label' => 'Catering Module',
                    'price' => 499,
                    'description' => 'Catering management, menu planning & order processing',
                    'included' => true
                ];
            }
        } else {
            $additionalModules = [
                ['key' => 'ai_assistant', 'label' => 'AI Voice Assistant', 'price' => 499, 'description' => 'Malayalam & English Voice AI Assistant for database queries', 'included' => true],
                ['key' => 'catering', 'label' => 'Catering Module', 'price' => 499, 'description' => 'Catering management, menu planning & order processing', 'included' => true],
                ['key' => 'content_calendar', 'label' => 'Content Calendar', 'price' => 499, 'description' => 'Plan & schedule social content campaigns', 'included' => true],
                ['key' => 'daily_listings', 'label' => 'Daily Listings', 'price' => 499, 'description' => 'Track & manage daily property/item listings', 'included' => true],
                ['key' => 'designers_worklist', 'label' => 'Designers Worklist', 'price' => 499, 'description' => 'Manage creative tasks & designer workflows', 'included' => true],
                ['key' => 'domains', 'label' => 'Domains & Hosting', 'price' => 499, 'description' => 'Track domain names and website hosting', 'included' => true],
            ];
        }

        return [
            'basic_plan_price' => Setting::where('key', 'basic_plan_price')->value('value') ?? '999',
            'premium_plan_price' => Setting::where('key', 'premium_plan_price')->value('value') ?? '2999',
            'basic_plan_features' => $basicFeatures,
            'premium_plan_features' => $premiumFeatures,
            'additional_modules' => $additionalModules,
            'allow_admin_registration' => Setting::where('key', 'allow_admin_registration')->value('value') ?? '1',
        ];
    }

    public function showPricing()
    {
        $settings = $this->getPricingSettings();
        $user = auth()->user();

        $admin = null;
        if ($user) {
            if (!empty($user->admin_id)) {
                $admin = \App\Models\Admin::find($user->admin_id);
            }
            if (!$admin) {
                $admin = \App\Models\Admin::where('email', $user->email)->first();
            }
        }

        $currentPlan = null;
        if ($user) {
            $rawPlan = $admin?->plan ?? $user?->plan ?? 'basic';
            $currentPlan = strtolower($rawPlan);
        }

        $isPremium = ($admin?->plan === 'premium');

        return Inertia::render('Pricing', [
            'settings' => $settings,
            'currentPlan' => $currentPlan,
            'currentAdditionalModules' => $isPremium ? ($admin?->additional_modules ?? []) : [],
            'razorpayKey' => config('services.razorpay.key_id', env('RAZORPAY_KEY_ID', 'rzp_test_worknest_key')),
        ]);
    }

    public function index()
    {
        $user = auth()->user();
        $isSuperAdmin = $user->role === 'superadmin';
        $settings = $this->getPricingSettings();

        $admin = null;
        if ($user) {
            if (!empty($user->admin_id)) {
                $admin = \App\Models\Admin::find($user->admin_id);
            }
            if (!$admin) {
                $admin = \App\Models\Admin::where('email', $user->email)->first();
            }
        }

        $admins = [];
        if ($isSuperAdmin) {
            $admins = \App\Models\Admin::where('role', 'admin')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'plan', 'additional_modules', 'company_name', 'phone', 'is_active']);
        }

        $isPremium = ($admin?->plan === 'premium');

        return Inertia::render('Admin/Pricing/Index', [
            'settings' => $settings,
            'admins' => $admins,
            'currentPlan' => strtolower($admin?->plan ?? $user?->plan ?? 'basic'),
            'currentAdditionalModules' => $isPremium ? ($admin?->additional_modules ?? []) : [],
        ]);
    }

    public function subscribe(Request $request)
    {
        $request->validate([
            'plan' => 'required|in:basic,premium',
            'additional_modules' => 'nullable|array',
        ]);

        $user = auth()->user();
        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return back()->with('error', 'Only standard admins can subscribe to plans.');
        }

        $additionalModules = $request->plan === 'premium' ? $request->input('additional_modules', []) : [];

        $admin = \App\Models\Admin::where('email', $user->email)->first();
        if ($admin) {
            $admin->update([
                'plan' => $request->plan,
                'additional_modules' => $additionalModules,
            ]);
        }

        if ($user instanceof \App\Models\User || isset($user->plan)) {
            $user->update(['plan' => $request->plan]);
        }

        return back()->with('success', 'Subscription updated successfully to ' . ucfirst($request->plan) . ' plan.');
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
            'additional_modules' => 'required|array',
            'allow_admin_registration' => 'nullable',
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
        Setting::updateOrCreate(['key' => 'additional_modules'], ['value' => json_encode($validated['additional_modules'])]);
        Setting::updateOrCreate(['key' => 'allow_admin_registration'], ['value' => ($request->boolean('allow_admin_registration') || $request->input('allow_admin_registration') === '1' || $request->input('allow_admin_registration') === 1) ? '1' : '0']);

        // Sync legacy keys for route and side navigation checks compatibility
        Setting::updateOrCreate(['key' => 'basic_plan_modules'], ['value' => json_encode($basicKeys)]);
        Setting::updateOrCreate(['key' => 'premium_plan_modules'], ['value' => json_encode($premiumKeys)]);

        return back()->with('success', 'Pricing settings updated successfully.');
    }

    public function updateAdminPlan(Request $request, $id)
    {
        if (auth()->user()->role !== 'superadmin') {
            abort(403, 'Unauthorized.');
        }

        $request->validate([
            'plan' => 'required|in:basic,premium',
            'additional_modules' => 'nullable|array',
        ]);

        $admin = \App\Models\Admin::findOrFail($id);
        $admin->update([
            'plan' => $request->plan,
            'additional_modules' => $request->input('additional_modules', []),
        ]);

        return back()->with('success', 'Plan & modules updated successfully for ' . $admin->name . '.');
    }

    public function toggleAdminStatus(Request $request, $id)
    {
        if (auth()->user()->role !== 'superadmin') {
            abort(403, 'Unauthorized.');
        }

        $admin = \App\Models\Admin::findOrFail($id);
        $newStatus = !$admin->is_active;
        $admin->update(['is_active' => $newStatus]);

        // Cascading disable: update all employee users belonging to this admin
        \App\Models\User::where('admin_id', $admin->id)->update(['is_active' => $newStatus]);

        $statusLabel = $newStatus ? 'enabled' : 'disabled';
        return back()->with('success', "Admin {$admin->name} and all associated employee users have been {$statusLabel}.");
    }
}
