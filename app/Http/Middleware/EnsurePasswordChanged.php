<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ($user->must_change_password ?? false)) {
            $routeName = $request->route() ? $request->route()->getName() : null;

            // Allowed routes during mandatory password change
            $allowedRoutes = [
                'dashboard',
                'home',
                'password.first_change',
                'password.first_change.update',
                'logout',
            ];

            if (!$routeName || !in_array($routeName, $allowedRoutes)) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'error' => 'You must change your temporary password before continuing.',
                        'must_change_password' => true,
                        'redirect' => route('dashboard'),
                    ], 403);
                }

                return redirect()->route('dashboard');
            }
        }

        return $next($request);
    }
}
