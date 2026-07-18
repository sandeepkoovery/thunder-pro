<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (auth()->check() && !in_array(auth()->user()->role, ['superadmin', 'admin'])) {
                abort(403, 'Unauthorized action.');
            }
            return $next($request);
        });
    }

    public function index()
    {
        $users = User::with(['department', 'reportingManager'])
            ->whereIn('role', ['user', 'manager', 'editor'])
            ->get();
        $departments = Department::orderBy('name')->get();

        return inertia('Admin/Users/Index', [
            'users' => $users,
            'departments' => $departments,
        ]);
    }

    public function show(User $user)
    {
        return inertia('Admin/Users/Show', [
            'user' => $user->load(['department', 'reportingManager']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:user,manager,editor,admin',
            'desktop_only' => 'boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'employee_id' => 'nullable|string|max:255|unique:users,employee_id',
            'department_id' => 'nullable|exists:departments,id',
            'designation' => 'nullable|string|max:255',
            'joining_date' => 'nullable|date',
            'employment_type' => 'nullable|in:permanent,contract,intern',
        ]);

        if ($request->hasFile('image')) {
            $path = public_path('uploads/users');
            if (!file_exists($path)) {
                mkdir($path, 0775, true);
            }
            $file = $request->file('image');
            $filename = uniqid('user_') . '.' . $file->getClientOriginalExtension();
            $file->move($path, $filename);
            $validated['thumb'] = 'uploads/users/' . $filename;
            unset($validated['image']);
        }

        $validated['password'] = Hash::make($validated['password']);
        // Role is now validated and included in $validated

        User::create($validated);

        return redirect()->route('admin.users.index')->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6|confirmed',
            'role' => 'required|in:user,manager,editor,admin',
            'desktop_only' => 'boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'employee_id' => 'nullable|string|max:255|unique:users,employee_id,' . $user->id,
            'department_id' => 'nullable|exists:departments,id',
            'designation' => 'nullable|string|max:255',
            'joining_date' => 'nullable|date',
            'employment_type' => 'nullable|in:permanent,contract,intern',
        ]);

        if ($request->hasFile('image')) {
            $path = public_path('uploads/users');
            if (!file_exists($path)) {
                mkdir($path, 0775, true);
            }

            if ($user->thumb && file_exists(public_path($user->thumb))) {
                unlink(public_path($user->thumb));
            }
            if ($user->image && file_exists(public_path($user->image))) {
                unlink(public_path($user->image));
            }

            $file = $request->file('image');
            $filename = uniqid('user_') . '.' . $file->getClientOriginalExtension();
            $file->move($path, $filename);
            $validated['thumb'] = 'uploads/users/' . $filename;
            $validated['image'] = null;
        } else {
            // If no new image, keep the old one
            unset($validated['image']);
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        if ($user->image && Storage::disk('public')->exists($user->image)) {
            Storage::disk('public')->delete($user->image);
        }
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully.');
    }

    public function toggleDesktop(User $user)
    {
        $user->desktop_only = !$user->desktop_only;
        $user->save();

        return response()->json([
            'message' => 'User desktop punch-in restriction updated.',
            'desktop_only' => $user->desktop_only
        ]);
    }

    public function toggle(User $user)
    {
        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json(['message' => 'User status updated.']);
    }
}
