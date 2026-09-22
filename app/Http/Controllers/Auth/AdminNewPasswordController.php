<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminNewPasswordController extends Controller
{
    /**
     * Display the admin password reset view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/AdminResetPassword', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Handle an incoming new admin password request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => [
                'required',
                'confirmed',
                Rules\Password::min(8)->letters()->mixedCase()->numbers()->symbols(),
            ],
        ], [
            'password.min' => 'Password must be at least 8 characters long.',
            'password.mixed' => 'Password must contain at least one uppercase letter.',
            'password.numbers' => 'Password must contain at least one number.',
            'password.symbols' => 'Password must contain at least one special character.',
        ]);

        $credentials = $request->only('email', 'password', 'password_confirmation', 'token');

        // First attempt using admins broker
        $status = Password::broker('admins')->reset(
            $credentials,
            function ($admin) use ($request) {
                $admin->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($admin));
            }
        );

        // If invalid user on admins broker, check users broker (for admins stored in users table)
        if ($status == Password::INVALID_USER) {
            $user = User::where('email', $request->email)
                ->whereIn('role', ['admin', 'superadmin'])
                ->first();

            if ($user) {
                $status = Password::broker('users')->reset(
                    $credentials,
                    function ($adminUser) use ($request) {
                        $updateData = [
                            'password' => Hash::make($request->password),
                            'remember_token' => Str::random(60),
                        ];
                        if (isset($adminUser->must_change_password)) {
                            $updateData['must_change_password'] = false;
                        }
                        $adminUser->forceFill($updateData)->save();

                        event(new PasswordReset($adminUser));
                    }
                );
            }
        }

        if ($status == Password::PASSWORD_RESET) {
            return redirect()->route('admin.login')->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
