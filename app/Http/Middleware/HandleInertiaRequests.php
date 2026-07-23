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
        if ($user) {
            if ($user->role === 'superadmin') {
                $plan = 'premium';
            } elseif ($user->role === 'admin') {
                $plan = $user->plan ?? 'basic';
            } else {
                $admin = \App\Models\User::where('role', 'admin')->first();
                $plan = $admin ? ($admin->plan ?? 'basic') : 'basic';
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

        $allowedModules = ($plan === 'premium' || ($user && $user->role === 'superadmin')) ? $premiumModules : $basicModules;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? $request->user()->toArray() : null,
            ],
            'appUrl' => config('app.url'),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'timestamp' => ($request->session()->has('success') || $request->session()->has('error')) ? microtime(true) : null,
            ],
            'userPlan' => $plan,
            'allowedModules' => $allowedModules,
            'pricingSettings' => [
                'basic_plan_price' => \App\Models\Setting::where('key', 'basic_plan_price')->value('value') ?? '999',
                'premium_plan_price' => \App\Models\Setting::where('key', 'premium_plan_price')->value('value') ?? '2999',
                'basic_plan_modules' => $basicModules,
                'premium_plan_modules' => $premiumModules,
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
