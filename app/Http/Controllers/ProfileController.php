<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        if ($user instanceof \App\Models\User && $user->department_id && !$user->relationLoaded('department')) {
            $user->load('department');
        }

        $isCompanyAdmin = $user instanceof \App\Models\Admin || in_array($user->role ?? '', ['admin', 'superadmin']);

        $tenantAdminId = $user instanceof \App\Models\Admin
            ? ($user->role === 'superadmin' ? null : $user->id)
            : ($user->admin_id ?? null);

        $departmentsQuery = \App\Models\Department::query();
        if ($tenantAdminId !== null) {
            $departmentsQuery->where('admin_id', $tenantAdminId);
        }

        $admin = null;
        if ($isCompanyAdmin) {
            $admin = ($user instanceof \App\Models\Admin) ? $user : \App\Models\Admin::where('email', $user->email)->first();
        }

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'departments' => $departmentsQuery->orderBy('name')->get(),
            'isCompanyAdmin' => $isCompanyAdmin,
            'companyDetails' => $isCompanyAdmin ? [
                'company_name' => $user->company_name ?: ($admin?->company_name ?? ''),
                'gst_no' => $user->gst_no ?: ($admin?->gst_no ?? ''),
                'address' => $user->address ?: ($admin?->address ?? ''),
                'phone' => ($user instanceof \App\Models\Admin ? $user->phone : ($user->mobile ?: ($user->phone ?: ($admin?->phone ?? '')))),
                'email' => $user->email,
                'name' => $user->name,
                'plan' => $admin?->plan ?: ($user->plan ?? 'basic'),
            ] : null,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $isCompanyAdmin = $user instanceof \App\Models\Admin || in_array($user->role ?? '', ['admin', 'superadmin']);

        $matchingUser = null;
        $matchingAdmin = null;

        if ($isCompanyAdmin) {
            $companyName = $request->input('company_name', $user->company_name);
            $user->company_name = $companyName;
            $user->name = $request->input('name') ?: ($companyName ?: $user->name);
            $user->email = $request->input('email', $user->email);
            $user->address = $request->input('address', $user->address);
            $user->gst_no = $request->input('gst_no', $user->gst_no);

            $phone = $request->input('mobile') ?: $request->input('phone');
            if ($user instanceof \App\Models\Admin) {
                $user->phone = $phone;
                $matchingUser = \App\Models\User::where('email', $user->getOriginal('email'))->orWhere('email', $user->email)->first();
                if ($matchingUser) {
                    $matchingUser->company_name = $user->company_name;
                    $matchingUser->name = $user->name;
                    $matchingUser->email = $user->email;
                    $matchingUser->address = $user->address;
                    $matchingUser->gst_no = $user->gst_no;
                    $matchingUser->mobile = $phone;
                    $matchingUser->phone = $phone;
                }
            } else {
                $user->mobile = $phone;
                $user->phone = $phone;
                $matchingAdmin = \App\Models\Admin::where('email', $user->getOriginal('email'))->orWhere('email', $user->email)->first();
                if ($matchingAdmin) {
                    $matchingAdmin->company_name = $user->company_name;
                    $matchingAdmin->name = $user->name;
                    $matchingAdmin->email = $user->email;
                    $matchingAdmin->address = $user->address;
                    $matchingAdmin->gst_no = $user->gst_no;
                    $matchingAdmin->phone = $phone;
                }
            }
        } else {
            $user->first_name = $request->first_name;
            $user->last_name = $request->last_name;
            $user->name = trim($request->first_name . ' ' . $request->last_name);
            $user->email = $request->email;
            $user->gender = $request->gender;
            $user->date_of_birth = $request->date_of_birth;
            $user->blood_group = $request->blood_group;
            $user->mobile = $request->mobile;
            $user->address = $request->address;
            $user->emergency_contact_name = $request->emergency_contact_name;
            $user->emergency_contact_number = $request->emergency_contact_number;
            if ($request->has('department_id')) {
                $tenantAdminId = $user instanceof \App\Models\Admin
                    ? ($user->role === 'superadmin' ? null : $user->id)
                    : ($user->admin_id ?? null);

                if ($request->department_id && $tenantAdminId !== null) {
                    $isValidDept = \App\Models\Department::where('id', $request->department_id)
                        ->where('admin_id', $tenantAdminId)
                        ->exists();
                    if ($isValidDept) {
                        $user->department_id = $request->department_id;
                    }
                } else {
                    $user->department_id = $request->department_id;
                }
            }
        }

        if ($request->hasFile('thumb')) {
            $path = public_path('uploads/profile');
            if (!file_exists($path)) {
                mkdir($path, 0775, true);
            }

            // Delete old thumb if exists
            if ($user->thumb && file_exists(public_path($user->thumb))) {
                @unlink(public_path($user->thumb));
            }
            // Delete old image if exists
            if ($user->image && file_exists(public_path($user->image))) {
                @unlink(public_path($user->image));
            }

            $file = $request->file('thumb');
            $filename = uniqid('profile_') . '.' . $file->getClientOriginalExtension();
            $file->move($path, $filename);

            $user->thumb = 'uploads/profile/' . $filename;
            $user->image = null; // Clear old image column to avoid conflicts

            if ($matchingUser) {
                $matchingUser->thumb = $user->thumb;
                $matchingUser->image = null;
            }
            if ($matchingAdmin) {
                $matchingAdmin->thumb = $user->thumb;
                $matchingAdmin->image = null;
            }
        }

        $user->save();

        if ($matchingUser) {
            $matchingUser->save();
        }
        if ($matchingAdmin) {
            $matchingAdmin->save();
        }

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
