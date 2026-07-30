<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

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

        // Map route names/prefixes to module keys.
        // Check more specific routes first.
        $moduleMapping = [
            'admin.attendance.report' => 'reports',
            'admin.projects.' => 'projects',
            'projects.' => 'projects',
            'admin.users.' => 'users',
            'admin.leaves.' => 'leaves',
            'leave.' => 'leaves',
            'admin.attendance.' => 'attendance',
            'attendance.' => 'attendance',
            'calendar.' => 'calendar',
            'chat.' => 'chat',
            'google-drive.' => 'drive',
            'content-calendar.' => 'content_calendar',
            'daily-listings.' => 'daily_listings',
            'designers-worklist.' => 'designers_worklist',
            'admin.domains.' => 'domains',
            'admin.hostings.' => 'domains',
            'admin.websites.' => 'domains',
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
            if ($user->role === 'superadmin') {
                $plan = 'premium';
            } elseif ($user->role === 'admin' || $user instanceof \App\Models\Admin) {
                $admin = \App\Models\Admin::where('email', $user->email)->first();
                $plan = $admin ? ($admin->plan ?? 'basic') : ($user->plan ?? 'basic');
                $additional = $admin ? ($admin->additional_modules ?? []) : [];
            } else {
                // Employees inherit plan from their assigned Tenant Admin (admins table)
                $tenantAdminId = $user->admin_id ?? null;
                $admin = $tenantAdminId ? \App\Models\Admin::find($tenantAdminId) : \App\Models\Admin::first();
                $plan = $admin ? ($admin->plan ?? 'basic') : 'basic';
                $additional = $admin ? ($admin->additional_modules ?? []) : [];
            }

            // Get allowed modules from settings table
            $featuresJson = \App\Models\Setting::where('key', $plan . '_plan_features')->value('value');
            if ($featuresJson) {
                $features = json_decode($featuresJson, true);
                $allowed = [];
                foreach ($features as $feat) {
                    if (($feat['included'] ?? true) === true) {
                        $allowed[] = $feat['key'];
                    }
                }
            } else {
                $allowed = json_decode(\App\Models\Setting::where('key', $plan . '_plan_modules')->value('value') ?? '[]', true);
            }

            if (empty($allowed)) {
                $allowed = $plan === 'premium' 
                    ? ['projects', 'users', 'leaves', 'attendance', 'calendar', 'chat', 'reports', 'drive'] 
                    : ['projects', 'users', 'leaves', 'attendance', 'chat'];
            }

            if ($plan === 'premium' && !in_array('drive', $allowed)) {
                $allowed[] = 'drive';
            }

            if (!empty($additional) && is_array($additional)) {
                $allowed = array_unique(array_merge($allowed, $additional));
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
