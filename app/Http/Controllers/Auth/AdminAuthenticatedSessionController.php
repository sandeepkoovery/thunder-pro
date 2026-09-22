<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuthenticatedSessionController extends Controller
{
    /**
     * Display the admin login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/AdminLogin', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming admin authentication request.
     */
    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $throttleKey = Str::transliterate('login:admin:' . Str::lower($credentials['email']) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            event(new Lockout($request));

            throw ValidationException::withMessages([
                'email' => 'Too many failed login attempts. Please contact administrator or please try after 24 hours.',
            ]);
        }

        $remember = $request->boolean('remember');

        // Attempt login using admin guard (admins table), then web guard for users with admin role
        $authenticated = false;
        if (Auth::guard('admin')->attempt($credentials, $remember)) {
            Auth::shouldUse('admin');
            $authenticated = true;
        } elseif (Auth::guard('web')->attempt($credentials, $remember)) {
            $user = Auth::guard('web')->user();
            if ($user && in_array($user->role, ['superadmin', 'admin'])) {
                Auth::shouldUse('web');
                $authenticated = true;
            } else {
                Auth::guard('web')->logout();
                RateLimiter::hit($throttleKey, 86400);
                $retriesLeft = RateLimiter::retriesLeft($throttleKey, 5);
                $message = $retriesLeft > 0 
                    ? "Only administrators can log in through the Admin Portal. You have {$retriesLeft} attempt" . ($retriesLeft === 1 ? '' : 's') . " remaining out of 5."
                    : 'Too many failed login attempts. Please contact administrator or please try after 24 hours.';

                throw ValidationException::withMessages([
                    'email' => $message,
                ]);
            }
        }

        if (!$authenticated) {
            RateLimiter::hit($throttleKey, 86400);
            $retriesLeft = RateLimiter::retriesLeft($throttleKey, 5);

            $message = $retriesLeft > 0 
                ? "Invalid credentials for Admin Portal. You have {$retriesLeft} attempt" . ($retriesLeft === 1 ? '' : 's') . " remaining out of 5."
                : 'Too many failed login attempts. Please contact administrator or please try after 24 hours.';

            throw ValidationException::withMessages([
                'email' => $message,
            ]);
        }

        RateLimiter::clear($throttleKey);

        $admin = Auth::user();

        if ($admin) {
            if ($admin instanceof \App\Models\Admin) {
                if ($admin->role !== 'superadmin') {
                    if (($admin->approval_status ?? 'approved') === 'rejected') {
                        Auth::guard('admin')->logout();
                        Auth::guard('web')->logout();
                        throw ValidationException::withMessages([
                            'email' => 'Your administrator account has been rejected or disabled.',
                        ]);
                    }
                }
            } elseif ($admin instanceof \App\Models\User) {
                if (!$admin->is_active) {
                    Auth::guard('admin')->logout();
                    Auth::guard('web')->logout();
                    throw ValidationException::withMessages([
                        'email' => 'Your account has been deactivated.',
                    ]);
                }
            }
        }

        $request->session()->regenerate();

        if ($admin && ($admin->must_change_password ?? false)) {
            return redirect()->route('password.first_change');
        }

        return redirect()->intended(route('dashboard'));
    }
}
