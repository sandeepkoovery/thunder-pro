<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $remember = $this->boolean('remember');
        $credentials = $this->only('email', 'password');

        // Prevent Admin users from logging in via standard /login route
        if (\App\Models\Admin::where('email', $credentials['email'])->exists()) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // Attempt login strictly as standard User (users table)
        if (Auth::guard('web')->attempt($credentials, $remember)) {
            Auth::shouldUse('web');
        } else {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // Additional safeguard: If a user record in `users` table has an admin role
        $user = Auth::guard('web')->user();
        if ($user && in_array($user->role, ['superadmin', 'admin'])) {
            Auth::guard('web')->logout();

            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // Check if account is active (or if parent tenant admin is disabled)
        $user = Auth::user();
        if ($user) {
            $isDisabled = false;
            if ($user instanceof \App\Models\Admin) {
                if ($user->role !== 'superadmin' && !$user->is_active) {
                    $isDisabled = true;
                }
            } elseif ($user instanceof \App\Models\User) {
                if (!$user->is_active) {
                    $isDisabled = true;
                } elseif ($user->admin_id) {
                    $parentAdmin = \App\Models\Admin::find($user->admin_id);
                    if ($parentAdmin && !$parentAdmin->is_active) {
                        $isDisabled = true;
                    }
                }
            }

            if ($isDisabled) {
                Auth::guard('admin')->logout();
                Auth::guard('web')->logout();

                throw ValidationException::withMessages([
                    'email' => 'Your account or company organization has been disabled by administrator.',
                ]);
            }

            // Check Desktop Only restriction
            $userAgent = $this->header('User-Agent') ?? '';
            $isMobileDevice = (bool) preg_match('/Mobile|Android|iP(hone|od|ad)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i', $userAgent);
            $isPwaRequest = $this->header('X-PWA-Mode') === 'true' 
                         || $this->boolean('is_pwa') 
                         || $this->input('is_pwa') === 'true' 
                         || $this->query('pwa') === '1' 
                         || $this->query('source') === 'pwa';

            if ($user instanceof \App\Models\User && !empty($user->desktop_only) && ($isMobileDevice || $isPwaRequest)) {
                Auth::guard('admin')->logout();
                Auth::guard('web')->logout();

                throw ValidationException::withMessages([
                    'email' => 'Your account is restricted to Desktop login only. Access via mobile device or PWA is not permitted.',
                ]);
            }

            // Check PWA access for Premium Plan only
            $isPwaRequest = $this->header('X-PWA-Mode') === 'true' 
                         || $this->boolean('is_pwa') 
                         || $this->input('is_pwa') === 'true' 
                         || $this->query('pwa') === '1' 
                         || $this->query('source') === 'pwa';

            if ($isPwaRequest) {
                $effectivePlan = 'basic';
                if ($user->role === 'superadmin') {
                    $effectivePlan = 'premium';
                } elseif ($user instanceof \App\Models\Admin) {
                    $effectivePlan = $user->plan ?? 'basic';
                } else {
                    $tenantAdmin = $user->admin_id ? \App\Models\Admin::find($user->admin_id) : null;
                    if (!$tenantAdmin && ($user->role === 'admin' || isset($user->id))) {
                        $tenantAdmin = \App\Models\Admin::find($user->id) ?? \App\Models\Admin::where('email', $user->email)->first();
                    }
                    if (!$tenantAdmin) {
                        $tenantAdmin = \App\Models\Admin::where('role', 'admin')->first();
                    }
                    $effectivePlan = $tenantAdmin ? ($tenantAdmin->plan ?? 'basic') : 'basic';
                }

                if ($effectivePlan !== 'premium') {
                    Auth::guard('admin')->logout();
                    Auth::guard('web')->logout();

                    throw ValidationException::withMessages([
                        'email' => 'PWA access is exclusive to Premium plan subscribers. Please upgrade your plan to access the PWA application.',
                    ]);
                }
            }
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')) . '|' . $this->ip());
    }
}
