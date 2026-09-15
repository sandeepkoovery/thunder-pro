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
            'drive.' => 'drive',
            'admin.drive.' => 'drive',
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
                $basicModules = ['projects', 'users', 'leaves', 'attendance', 'departments'];
            }
            if (empty($premiumModules)) {
                $premiumModules = ['projects', 'users', 'leaves', 'attendance', 'departments', 'calendar', 'chat', 'reports', 'drive'];
            }

            if (!in_array('departments', $basicModules)) {
                $basicModules[] = 'departments';
            }
            if (!in_array('departments', $premiumModules)) {
                $premiumModules[] = 'departments';
            }

            $userRoleKey = $user->role ?? 'user';
            $rolePermissionsJson = $settingsMap['role_module_permissions'] ?? null;
            $rolePermissions = $rolePermissionsJson ? json_decode($rolePermissionsJson, true) : null;

            if (is_array($rolePermissions) && isset($rolePermissions[$userRoleKey]) && is_array($rolePermissions[$userRoleKey])) {
                $roleAllowed = $rolePermissions[$userRoleKey];
                if ($userRoleKey === 'admin') {
                    $coreAlwaysAllowed = ['dashboard', 'pricing', 'settings', 'modules', 'notifications', 'departments'];
                    $roleAllowed = array_unique(array_merge($roleAllowed, $coreAlwaysAllowed));
                }
            } else {
                $roleAllowed = $plan === 'premium' ? $premiumModules : $basicModules;
            }

            $additionalMapped = !empty($additional) && is_array($additional) 
                ? array_map(function($m) { return $m === 'domains' ? 'websites' : $m; }, $additional)
                : [];

            $coreAlwaysAllowed = ['dashboard', 'pricing', 'settings', 'modules', 'notifications', 'departments'];

            $tenantMaxModules = array_unique(array_merge(
                $plan === 'premium' ? $premiumModules : $basicModules,
                $additionalMapped,
                $coreAlwaysAllowed
            ));

            $allowed = array_values(array_intersect($roleAllowed, $tenantMaxModules));

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
