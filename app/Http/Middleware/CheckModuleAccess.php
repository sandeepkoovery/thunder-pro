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
        ];

        $module = null;
        foreach ($moduleMapping as $prefix => $mod) {
            if ($route === $prefix || str_starts_with($route, $prefix)) {
                $module = $mod;
                break;
            }
        }

        if ($module) {
            // Determine active plan
            $plan = 'basic';
            if ($user->role === 'admin') {
                $plan = $user->plan ?? 'basic';
            } else {
                // Employees fallback to the first admin's plan
                $admin = \App\Models\User::where('role', 'admin')->first();
                $plan = $admin ? ($admin->plan ?? 'basic') : 'basic';
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
