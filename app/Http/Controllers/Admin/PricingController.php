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
            $basicFeatures = json_decode($basicFeaturesJson, true) ?: [];
            $basicFeatures = array_map(function ($feat) {
                if (!isset($feat['included'])) {
                    $feat['included'] = true;
                }
                return $feat;
            }, $basicFeatures);
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
            $premiumFeatures = json_decode($premiumFeaturesJson, true) ?: [];
            $premiumFeatures = array_map(function ($feat) {
                if (!isset($feat['included'])) {
                    $feat['included'] = true;
                }
                return $feat;
            }, $premiumFeatures);
        } else {
            $premiumModulesLegacy = json_decode(Setting::where('key', 'premium_plan_modules')->value('value') ?? '[]', true);
            if (!empty($premiumModulesLegacy)) {
                $premiumFeatures = [];
                $labels = [
                    'projects' => 'Advanced Multi-Project Management',
                    'users' => 'Unlimited Employee Management',
                    'leaves' => 'Automated Leave & Approval Workflows',
                    'attendance' => 'Real-Time Geo Attendance',
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
                    ['key' => 'attendance', 'label' => 'Real-Time Geo Attendance', 'is_core' => true, 'included' => true],
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
            $additionalModules = json_decode($additionalModulesJson, true) ?: [];
            $additionalModules = array_map(function ($mod) {
                if (!isset($mod['included']) || $mod['included'] === false) {
                    $mod['included'] = true;
                }
                if (!isset($mod['price'])) {
                    $mod['price'] = 499;
                } else {
                    $mod['price'] = (int) $mod['price'];
                }
                return $mod;
            }, $additionalModules);

            // Deduplicate by key — keep first occurrence of each key
            $seen = [];
            $additionalModules = array_values(array_filter($additionalModules, function ($mod) use (&$seen) {
                $key = $mod['key'] ?? null;
                if (!$key || isset($seen[$key])) return false;
                $seen[$key] = true;
                return true;
            }));
        } else {
            $additionalModules = [
                ['key' => 'ai_assistant', 'label' => 'AI Voice Assistant', 'price' => 499, 'description' => 'Malayalam & English Voice AI Assistant for database queries', 'included' => true],
                ['key' => 'catering', 'label' => 'Catering Management', 'price' => 499, 'description' => 'Catering management, menu planning & order processing', 'included' => true],
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
                ->get(['id', 'name', 'email', 'plan', 'subscription_status', 'trial_ends_at', 'subscribed_at', 'additional_modules', 'company_name', 'phone', 'is_active']);
            
            $admins->transform(function ($adm) {
                $adm->is_trial = $adm->isInTrial();
                $adm->is_trial_expired = $adm->isTrialExpired();
                $adm->days_left_in_trial = $adm->daysLeftInTrial();
                return $adm;
            });
        }

        $isPremium = ($admin?->plan === 'premium');

        return Inertia::render('Admin/Pricing/Index', [
            'settings' => $settings,
            'admins' => $admins,
            'currentPlan' => strtolower($admin?->plan ?? $user?->plan ?? 'basic'),
            'currentAdditionalModules' => $isPremium ? ($admin?->additional_modules ?? []) : [],
            'subscriptionInfo' => [
                'status' => $admin?->subscription_status ?? 'active',
                'trial_ends_at' => $admin?->trial_ends_at?->toIso8601String(),
                'subscribed_at' => $admin?->subscribed_at?->toIso8601String(),
                'is_trial' => $admin ? $admin->isInTrial() : false,
                'is_trial_expired' => $admin ? $admin->isTrialExpired() : false,
                'days_left_in_trial' => $admin ? $admin->daysLeftInTrial() : 0,
            ],
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
            if ($request->plan === 'premium') {
                $isInTrial = $admin->isInTrial();
                if ($isInTrial) {
                    // Admin is in active trial mode — mark subscription as pending approval while keeping access active during trial
                    $admin->update([
                        'plan' => 'premium',
                        'additional_modules' => $additionalModules,
                        'approval_status' => 'pending',
                        'is_active' => true,
                    ]);
                    \App\Models\User::where('admin_id', $admin->id)->update(['is_active' => true]);

                    if ($user instanceof \App\Models\User || isset($user->plan)) {
                        $user->update(['plan' => $request->plan]);
                    }

                    return back()->with('success', 'Subscription request submitted! Your account remains active during the trial. Access will continue after Super Admin approves your subscription.');
                } else {
                    // Trial has ended or account is not in trial: set pending approval & deactivate until Super Admin approves
                    $admin->update([
                        'plan' => 'premium',
                        'approval_status' => 'pending',
                        'is_active' => false,
                        'additional_modules' => $additionalModules,
                    ]);

                    \App\Models\User::where('admin_id', $admin->id)->update(['is_active' => false]);

                    if ($user instanceof \App\Models\User || isset($user->plan)) {
                        $user->update(['plan' => $request->plan]);
                    }

                    return back()->with('success', 'Premium Plan request submitted! Your account will be activated after Super Administrator approval.');
                }
            } else {
                $admin->update([
                    'plan' => 'basic',
                    'subscription_status' => 'active',
                    'approval_status' => 'approved',
                    'is_active' => true,
                    'additional_modules' => [],
                ]);
                \App\Models\User::where('admin_id', $admin->id)->update(['is_active' => true]);
            }
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

        // Normalise price fields to integers before saving
        $additionalModules = array_map(function ($mod) {
            if (isset($mod['price'])) {
                $mod['price'] = (int) $mod['price'];
            }
            return $mod;
        }, $validated['additional_modules']);

        Setting::updateOrCreate(['key' => 'basic_plan_price'], ['value' => $validated['basic_plan_price']]);
        Setting::updateOrCreate(['key' => 'premium_plan_price'], ['value' => $validated['premium_plan_price']]);
        Setting::updateOrCreate(['key' => 'basic_plan_features'], ['value' => json_encode($validated['basic_plan_features'])]);
        Setting::updateOrCreate(['key' => 'premium_plan_features'], ['value' => json_encode($validated['premium_plan_features'])]);
        // Delete + recreate to avoid stale duplicate rows causing updateOrCreate to update
        // the wrong row, which would make the next read return the old value.
        \Illuminate\Support\Facades\DB::table('settings')->where('key', 'additional_modules')->delete();
        \App\Models\Setting::create(['key' => 'additional_modules', 'value' => json_encode($additionalModules)]);
        Setting::updateOrCreate(['key' => 'allow_admin_registration'], ['value' => ($request->boolean('allow_admin_registration') || $request->input('allow_admin_registration') === '1' || $request->input('allow_admin_registration') === 1) ? '1' : '0']);

        // Sync legacy keys for route and side navigation checks compatibility
        Setting::updateOrCreate(['key' => 'basic_plan_modules'], ['value' => json_encode($basicKeys)]);
        Setting::updateOrCreate(['key' => 'premium_plan_modules'], ['value' => json_encode($premiumKeys)]);

        // Clear the settings cache so the public pricing page reflects the new prices immediately
        \Illuminate\Support\Facades\Cache::forget('global_settings_map');

        return back()->with('success', 'Pricing settings updated successfully.');
    }

    public function updateAdminPlan(Request $request, $id)
    {
        if (auth()->user()->role !== 'superadmin') {
            abort(403, 'Unauthorized.');
        }

        $request->validate([
            'plan' => 'required|in:basic,premium',
            'subscription_status' => 'nullable|in:trial,active,expired',
            'additional_modules' => 'nullable|array',
            'extend_trial_days' => 'nullable|integer|min:1',
        ]);

        $admin = \App\Models\Admin::findOrFail($id);
        $updateData = [
            'plan' => $request->plan,
            'approval_status' => 'approved',
            'is_active' => true,
            'additional_modules' => $request->input('additional_modules', []),
        ];

        if ($request->filled('subscription_status')) {
            $updateData['subscription_status'] = $request->input('subscription_status');
            if ($request->input('subscription_status') === 'active') {
                $updateData['subscribed_at'] = \Carbon\Carbon::now();
            }
        } else {
            $updateData['subscription_status'] = 'active';
            $updateData['subscribed_at'] = \Carbon\Carbon::now();
        }

        if ($request->filled('extend_trial_days') && $request->input('extend_trial_days') > 0) {
            $baseDate = ($admin->trial_ends_at && $admin->trial_ends_at->isFuture()) ? $admin->trial_ends_at : \Carbon\Carbon::now();
            $updateData['trial_ends_at'] = $baseDate->copy()->addDays((int) $request->input('extend_trial_days'));
            $updateData['subscription_status'] = 'trial';
        }

        $admin->update($updateData);

        // Sync employee status
        \App\Models\User::where('admin_id', $admin->id)->update(['is_active' => true]);

        return back()->with('success', 'Plan & subscription status approved and activated successfully for ' . $admin->name . '.');
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
