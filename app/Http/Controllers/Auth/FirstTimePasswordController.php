<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class FirstTimePasswordController extends Controller
{
    /**
     * Display the first-time change password screen / popup.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (!$user || !($user->must_change_password ?? false)) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/FirstTimeChangePassword', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Update the user's password for the first time.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        $request->validate([
            'password' => [
                'required',
                'string',
                'min:8',
                function ($attribute, $value, $fail) {
                    if (!preg_match('/[A-Z]/', $value)) {
                        $fail('The password must contain at least 1 uppercase letter.');
                    }
                    if (!preg_match('/[0-9]/', $value)) {
                        $fail('The password must contain at least 1 digit.');
                    }
                    if (!preg_match('/[^a-zA-Z0-9]/', $value)) {
                        $fail('The password must contain at least 1 special character (e.g. !@#$%^&*).');
                    }
                },
                'confirmed',
            ],
        ], [
            'password.required' => 'Please create a new password.',
            'password.min' => 'The password must be at least 8 characters.',
            'password.confirmed' => 'The password confirmation does not match.',
        ]);

        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        return redirect()->route('dashboard')->with('success', 'Your password has been changed successfully. Welcome to your dashboard!');
    }
}
