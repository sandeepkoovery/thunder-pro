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
                     || $request->query('source') === 'pwa';

        $user = $request->user();
        if ($user) {
            $userAgent = $request->header('User-Agent') ?? '';
            $isMobileDevice = (bool) preg_match('/Mobile|Android|iP(hone|od|ad)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i', $userAgent);
            $isPwaRequest = $request->header('X-PWA-Mode') === 'true'
                         || $request->boolean('is_pwa')
                         || $request->input('is_pwa') === 'true'
                         || $request->query('pwa') === '1'
                         || $request->query('source') === 'pwa';

            // Restrict Desktop Only users from mobile devices & PWA
            if ($user instanceof \App\Models\User && !empty($user->desktop_only) && ($isMobileDevice || $isPwaRequest)) {
                Auth::guard('admin')->logout();
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->with('error', 'Your account is restricted to Desktop login only. Access via mobile device or PWA is not permitted.');
            }

            if ($isPwaRequest) {
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
