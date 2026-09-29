<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class AuthenticateMultiGuard extends Middleware
{
    /**
     * Determine if the user is logged in to any of the given guards.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  array  $guards
     * @return void
     *
     * @throws \Illuminate\Auth\AuthenticationException
     */
    protected function authenticate($request, array $guards)
    {
        if (empty($guards)) {
            $guards = ['web', 'admin'];
        }

        foreach ($guards as $guard) {
            if ($this->auth->guard($guard)->check()) {
                $user = $this->auth->guard($guard)->user();
                if ($user instanceof \App\Models\User) {
                    if (!$user->is_active) {
                        $this->auth->guard($guard)->logout();
                        continue;
                    }
                    if ($user->admin_id) {
                        $parentAdmin = \App\Models\Admin::find($user->admin_id);
                        if ($parentAdmin && (!$parentAdmin->is_active || ($parentAdmin->approval_status ?? 'approved') === 'rejected')) {
                            $this->auth->guard($guard)->logout();
                            continue;
                        }
                    }
                } elseif ($user instanceof \App\Models\Admin) {
                    if (!$user->is_active || ($user->role !== 'superadmin' && ($user->approval_status ?? 'approved') === 'rejected')) {
                        $this->auth->guard($guard)->logout();
                        continue;
                    }
                }

                return $this->auth->shouldUse($guard);
            }
        }

        $this->unauthenticated($request, $guards);
    }

    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        return $request->expectsJson() ? null : route('login');
    }
}
