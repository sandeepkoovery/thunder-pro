<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Setting;
use App\Models\Admin;

class CheckModuleAccess
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        // Super admin always has access to everything
        if ($user->role === 'superadmin') {
            return $next($request);
        }

        $route = $request->route()->getName();
        if (!$route) {
            return $next($request);
        }

        // Unrestricted system routes that any logged in user can access
        $unrestrictedRoutes = [
            'dashboard', 'admin.settings.', 'admin.modules.', 'admin.pricing.', 
            'admin.users.', 'profile.', 'notifications.'
        ];
        foreach ($unrestrictedRoutes as $unrestricted) {
            if ($route === $unrestricted || str_starts_with($route, $unrestricted)) {
                return $next($request);
            }
        }

        // Map route names/prefixes to module keys.
        $moduleMapping = [
            'admin.attendance.report' => 'reports',
            'reports.' => 'reports',
            'admin.projects.' => 'projects',
            'projects.' => 'projects',
            'admin.users.' => 'users',
            'admin.leaves.' => 'leaves',
            'leave.' => 'leaves',
            'admin.attendance.' => 'attendance',
            'attendance.' => 'attendance',
            'calendar.' => 'calendar',
            'chat.' => 'chat',
            'ai.' => 'ai_assistant',
            'google-drive.' => 'drive',
            'content-calendar.' => 'content_calendar',
            'daily-listings.' => 'daily_listings',
            'designers-worklist.' => 'designers_worklist',
            'admin.domains.' => 'websites',
            'admin.hostings.' => 'websites',
            'admin.websites.' => 'websites',
            'websites.' => 'websites',
            'domains.' => 'websites',
        ];

        $module = null;
        foreach ($moduleMapping as $prefix => $mod) {
            if ($route === $prefix || str_starts_with($route, $prefix)) {
                $module = $mod;
                break;
            }
        }

        if ($module) {
            // Determine active plan & tenant admin record
            $plan = 'basic';
            $additional = [];
            if ($user->role === 'admin' || $user instanceof Admin) {
                $admin = ($user instanceof Admin) ? $user : Admin::where('email', $user->email)->first();
                $plan = $admin ? ($admin->plan ?? 'basic') : ($user->plan ?? 'basic');
                $additional = $admin ? ($admin->additional_modules ?? []) : [];
            } else {
                $tenantAdminId = $user->admin_id ?? null;
                $admin = $tenantAdminId ? Admin::find($tenantAdminId) : null;
                $plan = $admin ? ($admin->plan ?? 'basic') : 'basic';
                $additional = $admin ? ($admin->additional_modules ?? []) : [];
            }

            // Get allowed modules from global settings map
            $settingsMap = \Illuminate\Support\Facades\Cache::remember('global_settings_map', 60, function () {
                return Setting::pluck('value', 'key')->all();
            });

            $featuresJson = $settingsMap[$plan . '_plan_features'] ?? null;
            if ($featuresJson) {
                $features = json_decode($featuresJson, true);
                $allowed = [];
                foreach ($features as $feat) {
                    if (($feat['included'] ?? true) === true) {
                        $allowed[] = $feat['key'];
                    }
                }
            } else {
                $allowed = json_decode($settingsMap[$plan . '_plan_modules'] ?? '[]', true);
            }

            if (empty($allowed)) {
                $allowed = $plan === 'premium' 
                    ? ['projects', 'users', 'leaves', 'attendance', 'calendar', 'chat', 'reports', 'drive', 'departments'] 
                    : ['projects', 'users', 'leaves', 'attendance', 'chat', 'departments'];
            }

            if ($plan === 'premium' && !in_array('drive', $allowed)) {
                $allowed[] = 'drive';
            }

            // Core admin modules always allowed for tenant admins
            $coreAlwaysAllowed = ['dashboard', 'pricing', 'settings', 'modules', 'notifications', 'reports'];
            $allowed = array_unique(array_merge($allowed, $coreAlwaysAllowed));

            if (!empty($additional) && is_array($additional)) {
                // Map legacy 'domains' key to 'websites'
                $additionalMapped = array_map(function($m) { return $m === 'domains' ? 'websites' : $m; }, $additional);
                $allowed = array_unique(array_merge($allowed, $additionalMapped));
            }

            if (!in_array($module, $allowed)) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'error' => 'This module is not included in your subscription plan.'
                    ], 403);
                }

                return redirect()->route('dashboard')->with('error', 'This module is not included in your subscription plan. Upgrade to access it.');
            }
        }

        return $next($request);
    }
}
