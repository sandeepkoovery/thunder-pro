<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminPasswordResetLinkController extends Controller
{
    /**
     * Display the admin password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/AdminForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming admin password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $admin = Admin::where('email', $request->email)->first();

        if ($admin) {
            $status = Password::broker('admins')->sendResetLink(
                $request->only('email')
            );
        } else {
            $user = User::where('email', $request->email)
                ->whereIn('role', ['admin', 'superadmin'])
                ->first();

            if ($user) {
                $status = Password::broker('users')->sendResetLink(
                    $request->only('email')
                );
            } else {
                $status = Password::INVALID_USER;
            }
        }

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
