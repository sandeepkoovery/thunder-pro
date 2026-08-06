<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
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

        $remember = $request->boolean('remember');

        // Attempt login using admin guard (admins table), then web guard for users with admin role
        if (Auth::guard('admin')->attempt($credentials, $remember)) {
            Auth::shouldUse('admin');
        } elseif (Auth::guard('web')->attempt($credentials, $remember)) {
            $user = Auth::guard('web')->user();
            if ($user && in_array($user->role, ['superadmin', 'admin'])) {
                Auth::shouldUse('web');
            } else {
                Auth::guard('web')->logout();
                throw ValidationException::withMessages([
                    'email' => 'Only administrators can log in through the Admin Portal.',
                ]);
            }
        } else {
            throw ValidationException::withMessages([
                'email' => 'Invalid email or password for Admin Portal.',
            ]);
        }

        $admin = Auth::user();

        if ($admin) {
            $isDisabled = false;
            if ($admin instanceof \App\Models\Admin) {
                if ($admin->role !== 'superadmin' && !$admin->is_active) {
                    $isDisabled = true;
                }
            } elseif ($admin instanceof \App\Models\User) {
                if (!$admin->is_active) {
                    $isDisabled = true;
                }
            }

            if ($isDisabled) {
                Auth::guard('admin')->logout();
                Auth::guard('web')->logout();
                throw ValidationException::withMessages([
                    'email' => 'Your administrator account has been deactivated.',
                ]);
            }
        }

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }
}
