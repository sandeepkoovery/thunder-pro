<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * Handle the incoming request.
     */
    public function handle(Request $request, \Closure $next)
    {
        if (!\Illuminate\Support\Facades\Auth::guard('web')->check() && \Illuminate\Support\Facades\Auth::guard('admin')->check()) {
            \Illuminate\Support\Facades\Auth::shouldUse('admin');
        }

        $response = parent::handle($request, $next);

        if ($request->header('X-Inertia')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Vary', 'X-Inertia');
        }

        return $response;
    }

    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $plan = 'basic';
        $userAdditionalModules = [];
        $admin = null;

        if ($user) {
            if ($user->role === 'superadmin') {
                $plan = 'premium';
            } elseif ($user->role === 'admin' || $user instanceof \App\Models\Admin) {
                $admin = ($user instanceof \App\Models\Admin) ? $user : \App\Models\Admin::where('email', $user->email)->first();
                $plan = $admin ? ($admin->plan ?? 'basic') : ($user->plan ?? 'basic');
                $userAdditionalModules = $admin ? ($admin->additional_modules ?? []) : [];
            } else {
                $tenantAdminId = $user->admin_id ?? null;
                $admin = $tenantAdminId ? \App\Models\Admin::find($tenantAdminId) : null;
                $plan = $admin ? ($admin->plan ?? 'basic') : 'basic';
                $userAdditionalModules = $admin ? ($admin->additional_modules ?? []) : [];
            }
        }

        // Fetch all global settings in a SINGLE cached query instead of 9 separate queries
        $settingsMap = \Illuminate\Support\Facades\Cache::remember('global_settings_map', 60, function () {
            return \App\Models\Setting::pluck('value', 'key')->all();
        });

        // Basic Plan active modules
        $basicFeaturesJson = $settingsMap['basic_plan_features'] ?? null;
        if ($basicFeaturesJson) {
            $basicFeatures = json_decode($basicFeaturesJson, true) ?: [];
            $basicModules = [];
            foreach ($basicFeatures as $feat) {
                if (($feat['included'] ?? true) === true) {
                    $basicModules[] = $feat['key'];
                }
            }
        } else {
            $basicModules = json_decode($settingsMap['basic_plan_modules'] ?? '[]', true) ?: [];
        }

        // Premium Plan active modules
        $premiumFeaturesJson = $settingsMap['premium_plan_features'] ?? null;
        if ($premiumFeaturesJson) {
            $premiumFeatures = json_decode($premiumFeaturesJson, true) ?: [];
            $premiumModules = [];
            foreach ($premiumFeatures as $feat) {
                if (($feat['included'] ?? true) === true) {
                    $premiumModules[] = $feat['key'];
                }
            }
        } else {
            $premiumModules = json_decode($settingsMap['premium_plan_modules'] ?? '[]', true) ?: [];
        }

        if (empty($basicModules)) {
            $basicModules = ['projects', 'users', 'leaves', 'attendance', 'chat'];
        }
        if (empty($premiumModules)) {
            $premiumModules = ['projects', 'users', 'leaves', 'attendance', 'calendar', 'chat', 'reports', 'drive'];
        }

        if (!in_array('drive', $premiumModules)) {
            $premiumModules[] = 'drive';
        }
        if (!in_array('departments', $basicModules)) {
            $basicModules[] = 'departments';
        }
        if (!in_array('departments', $premiumModules)) {
            $premiumModules[] = 'departments';
        }

        $additionalModulesSettingJson = $settingsMap['additional_modules'] ?? null;
        $additionalModulesSetting = $additionalModulesSettingJson ? json_decode($additionalModulesSettingJson, true) : [
            ['key' => 'content_calendar', 'label' => 'Content Calendar', 'price' => 499, 'included' => true],
            ['key' => 'daily_listings', 'label' => 'Daily Listings', 'price' => 499, 'included' => true],
            ['key' => 'designers_worklist', 'label' => 'Designers Worklist', 'price' => 499, 'included' => true],
            ['key' => 'domains', 'label' => 'Domains & Hosting', 'price' => 499, 'included' => true],
        ];

        $allowedModules = ($plan === 'premium' || ($user && $user->role === 'superadmin')) ? $premiumModules : $basicModules;

        if (!empty($userAdditionalModules) && is_array($userAdditionalModules)) {
            $allowedModules = array_values(array_unique(array_merge($allowedModules, $userAdditionalModules)));
        }

        $rolePermissionsJson = $settingsMap['role_module_permissions'] ?? null;
        $rolePermissions = $rolePermissionsJson ? json_decode($rolePermissionsJson, true) : [];

        if ($user && !in_array($user->role, ['superadmin', 'admin'])) {
            $userRoleKey = $user->role ?? 'user';
            if (isset($rolePermissions[$userRoleKey]) && is_array($rolePermissions[$userRoleKey])) {
                $allowedModules = array_values(array_intersect($allowedModules, $rolePermissions[$userRoleKey]));
            }
        }

        // Cache expiring website count for admins for 60 seconds
        $expiringCount = 0;
        if ($user && in_array($user->role, ['admin', 'superadmin'])) {
            $adminKey = $admin ? $admin->id : 'sa';
            $expiringCount = \Illuminate\Support\Facades\Cache::remember("expiring_websites_count_{$adminKey}", 60, function () {
                return \App\Models\Domain::where('expiration_date', '<=', \Carbon\Carbon::now()->addDays(30))
                    ->whereNotIn('status', ['Transferred', 'Inactive'])
                    ->count() +
                \App\Models\Hosting::where('expiration_date', '<=', \Carbon\Carbon::now()->addDays(30))
                    ->whereNotIn('status', ['Transferred', 'Inactive'])
                    ->count();
            });
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'has_passkey' => ($user instanceof \App\Models\User) ? $user->hasPasskeys() : false,
                ]) : null,
            ],
            'appUrl' => config('app.url'),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'timestamp' => ($request->session()->has('success') || $request->session()->has('error')) ? microtime(true) : null,
            ],
            'userPlan' => $plan,
            'allowedModules' => $allowedModules,
            'userAdditionalModules' => $userAdditionalModules,
            'moduleOrder' => json_decode($settingsMap['module_order'] ?? '[]', true) ?: [],
            'pricingSettings' => [
                'basic_plan_price' => $settingsMap['basic_plan_price'] ?? '999',
                'premium_plan_price' => $settingsMap['premium_plan_price'] ?? '2999',
                'basic_plan_modules' => $basicModules,
                'premium_plan_modules' => $premiumModules,
                'additional_modules' => $additionalModulesSetting,
            ],
            'sharedSettings' => [
                'beta_menu_items' => json_decode($settingsMap['beta_menu_items'] ?? '[]', true) ?: [],
                'hidden_modules' => json_decode($settingsMap['hidden_modules'] ?? '[]', true) ?: [],
            ],
            'expiringWebsitesCount' => $expiringCount,
        ];
    }
}
