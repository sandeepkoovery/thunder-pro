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
        if ($user) {
            if ($user->role === 'superadmin') {
                $plan = 'premium';
            } elseif ($user->role === 'admin') {
                $admin = \App\Models\Admin::where('email', $user->email)->first();
                $plan = $admin ? ($admin->plan ?? 'basic') : ($user->plan ?? 'basic');
                $userAdditionalModules = $admin ? ($admin->additional_modules ?? []) : [];
            } else {
                $tenantAdminId = $user->admin_id ?? null;
                $admin = $tenantAdminId ? \App\Models\Admin::find($tenantAdminId) : \App\Models\Admin::first();
                $plan = $admin ? ($admin->plan ?? 'basic') : 'basic';
                $userAdditionalModules = $admin ? ($admin->additional_modules ?? []) : [];
            }
        }

        // Basic Plan active modules
        $basicFeaturesJson = \App\Models\Setting::where('key', 'basic_plan_features')->value('value');
        if ($basicFeaturesJson) {
            $basicFeatures = json_decode($basicFeaturesJson, true);
            $basicModules = [];
            foreach ($basicFeatures as $feat) {
                if (($feat['included'] ?? true) === true) {
                    $basicModules[] = $feat['key'];
                }
            }
        } else {
            $basicModules = json_decode(\App\Models\Setting::where('key', 'basic_plan_modules')->value('value') ?? '[]', true);
        }

        // Premium Plan active modules
        $premiumFeaturesJson = \App\Models\Setting::where('key', 'premium_plan_features')->value('value');
        if ($premiumFeaturesJson) {
            $premiumFeatures = json_decode($premiumFeaturesJson, true);
            $premiumModules = [];
            foreach ($premiumFeatures as $feat) {
                if (($feat['included'] ?? true) === true) {
                    $premiumModules[] = $feat['key'];
                }
            }
        } else {
            $premiumModules = json_decode(\App\Models\Setting::where('key', 'premium_plan_modules')->value('value') ?? '[]', true);
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

        $additionalModulesSettingJson = \App\Models\Setting::where('key', 'additional_modules')->value('value');
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

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? array_merge($request->user()->toArray(), [
                    'has_passkey' => ($request->user() instanceof \App\Models\User) ? $request->user()->hasPasskeys() : false,
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
            'pricingSettings' => [
                'basic_plan_price' => \App\Models\Setting::where('key', 'basic_plan_price')->value('value') ?? '999',
                'premium_plan_price' => \App\Models\Setting::where('key', 'premium_plan_price')->value('value') ?? '2999',
                'basic_plan_modules' => $basicModules,
                'premium_plan_modules' => $premiumModules,
                'additional_modules' => $additionalModulesSetting,
            ],
            'sharedSettings' => [
                'beta_menu_items' => json_decode(\App\Models\Setting::where('key', 'beta_menu_items')->value('value') ?? '[]', true),
                'hidden_modules' => json_decode(\App\Models\Setting::where('key', 'hidden_modules')->value('value') ?? '[]', true),
            ],
            'expiringWebsitesCount' => $request->user() && in_array($request->user()->role, ['admin', 'superadmin']) ? (
                \App\Models\Domain::where('expiration_date', '<=', \Carbon\Carbon::now()->addDays(30))
                    ->whereNotIn('status', ['Transferred', 'Inactive'])
                    ->count() +
                \App\Models\Hosting::where('expiration_date', '<=', \Carbon\Carbon::now()->addDays(30))
                    ->whereNotIn('status', ['Transferred', 'Inactive'])
                    ->count()
            ) : 0,
        ];
    }
}
