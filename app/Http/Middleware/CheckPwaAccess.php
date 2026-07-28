<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckPwaAccess
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $isPwaRequest = $request->header('X-PWA-Mode') === 'true'
                     || $request->boolean('is_pwa')
                     || $request->input('is_pwa') === 'true'
                     || $request->query('pwa') === '1'
                     || $request->query('source') === 'pwa'
                     || str_contains($request->header('Referer', ''), 'source=pwa');

        if ($isPwaRequest) {
            $user = $request->user();
            if ($user) {
                $effectivePlan = 'basic';
                if ($user->role === 'superadmin') {
                    $effectivePlan = 'premium';
                } elseif ($user instanceof \App\Models\Admin) {
                    $effectivePlan = $user->plan ?? 'basic';
                } else {
                    $tenantAdminId = $user->admin_id ?? null;
                    $admin = $tenantAdminId ? \App\Models\Admin::find($tenantAdminId) : null;
                    if (!$admin && ($user->role === 'admin' || isset($user->id))) {
                        $admin = \App\Models\Admin::find($user->id) ?? \App\Models\Admin::where('email', $user->email)->first();
                    }
                    if (!$admin) {
                        $admin = \App\Models\Admin::where('role', 'admin')->first();
                    }
                    $effectivePlan = $admin ? ($admin->plan ?? 'basic') : 'basic';
                }

                if ($effectivePlan !== 'premium') {
                    Auth::guard('admin')->logout();
                    Auth::guard('web')->logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();

                    return redirect()->route('login')->with('error', 'PWA access is exclusive to Premium plan subscribers. Please upgrade your subscription to access via PWA.');
                }
            }
        }

        return $next($request);
    }
}
