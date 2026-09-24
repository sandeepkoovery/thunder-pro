<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Department;
use App\Services\EmployeeImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $user = auth()->user();
            if (!$user) abort(403);
            if (in_array($user->role, ['superadmin', 'admin'])) {
                return $next($request);
            }
            if ($user->role === 'manager') {
                $userMods = $user->module_permissions;
                if (is_array($userMods) && in_array('users', $userMods)) {
                    return $next($request);
                }
                $rolePermsJson = \App\Models\Setting::where('key', 'role_module_permissions')->value('value');
                $rolePerms = $rolePermsJson ? json_decode($rolePermsJson, true) : [];
                if (isset($rolePerms['manager']) && in_array('users', $rolePerms['manager'])) {
                    return $next($request);
                }
            }
            abort(403, 'Unauthorized action.');
        });
    }

    public function index()
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        $query = User::with(['department', 'reportingManager', 'passkeys'])
            ->withCount('passkeys')
            ->whereIn('role', ['user', 'manager', 'editor']);

        $departmentsQuery = Department::query();

        if (!$isSuperAdmin) {
            $query->where('admin_id', $tenantAdminId);
            $departmentsQuery->where('admin_id', $tenantAdminId);
        }

        $users = $query->get();
        $departments = $departmentsQuery->orderBy('name')->get();

        $admins = [];
        if ($isSuperAdmin) {
            $admins = \App\Models\Admin::where('role', 'admin')
                ->withCount('users')
                ->orderBy('name')
                ->get();
        }

        $allModules = [
            ['key' => 'dashboard', 'name' => 'Dashboard'],
            ['key' => 'projects', 'name' => 'Projects'],
            ['key' => 'users', 'name' => 'Employees & Users'],
            ['key' => 'departments', 'name' => 'Departments'],
            ['key' => 'attendance', 'name' => 'Attendance'],
            ['key' => 'leaves', 'name' => 'Leaves'],
            ['key' => 'calendar', 'name' => 'Calendar'],
            ['key' => 'content_calendar', 'name' => 'Content Calendar'],
            ['key' => 'daily_listings', 'name' => 'Daily Listings'],
            ['key' => 'designers_worklist', 'name' => 'Designers Worklist'],
            ['key' => 'drive', 'name' => 'Drive'],
            ['key' => 'chat', 'name' => 'Chat & Messaging'],
            ['key' => 'websites', 'name' => 'Websites & Domains'],
            ['key' => 'reports', 'name' => 'Reports'],
            ['key' => 'notifications', 'name' => 'Notifications'],
            ['key' => 'ai_assistant', 'name' => 'AI Voice Assistant'],
            ['key' => 'modules', 'name' => 'Modules List'],
            ['key' => 'pricing', 'name' => 'Pricing'],
            ['key' => 'settings', 'name' => 'Settings'],
        ];

        $managerTypesQuery = User::where('role', 'manager')
            ->whereNotNull('designation')
            ->where('designation', '!=', '');

        if (!$isSuperAdmin) {
            $managerTypesQuery->where('admin_id', $tenantAdminId);
        }

        $managerTypes = $managerTypesQuery->pluck('designation')->unique()->values()->all();

        return inertia('Admin/Users/Index', [
            'users' => $users,
            'departments' => $departments,
            'admins' => $admins,
            'isSuperAdmin' => $isSuperAdmin,
            'allModules' => $allModules,
            'managerTypes' => $managerTypes,
        ]);
    }

    public function show(User $user)
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        if (!$isSuperAdmin) {
            $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);
            if ($user->admin_id !== $tenantAdminId) {
                abort(403, 'Unauthorized.');
            }
        }

        return inertia('Admin/Users/Show', [
            'user' => $user->load(['department', 'reportingManager', 'passkeys'])->loadCount('passkeys'),
        ]);
    }

    public function store(Request $request)
    {
        $authUser = auth()->user();
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

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
            'module_permissions' => 'nullable|array',
            'module_permissions.*' => 'string',
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
        $validated['admin_id'] = $tenantAdminId;
        $validated['must_change_password'] = true;

        if (!empty($validated['department_id']) && $authUser->role !== 'superadmin') {
            $deptValid = Department::where('id', $validated['department_id'])
                ->where('admin_id', $tenantAdminId)
                ->exists();
            if (!$deptValid) {
                return back()->withErrors(['department_id' => 'The selected department is invalid for this company.'])->withInput();
            }
        }

        // Check user limits
        $role = $validated['role'];
        if (in_array($role, ['user', 'manager', 'editor']) && $authUser->role !== 'superadmin') {
            $adminModel = \App\Models\Admin::find($tenantAdminId);
            $plan = $adminModel ? ($adminModel->plan ?? 'basic') : ($authUser->plan ?? 'basic');
            $activeEmployees = User::where('admin_id', $tenantAdminId)
                ->whereIn('role', ['user', 'manager', 'editor'])
                ->where('is_active', true)
                ->count();

            if ($plan === 'basic') {
                if ($activeEmployees >= 10) {
                    return back()->withErrors([
                        'role' => 'You have reached the limit of 10 active employees for the Basic Plan. Upgrade to the Premium Plan to add more.'
                    ])->withInput();
                }
            } else {
                $hasUnlimited = $adminModel ? $adminModel->hasUnlimitedEmployees() : false;
                if (!$hasUnlimited) {
                    $maxTotal = (int) (\App\Models\Setting::where('key', 'csv_import_limit')->value('value') ?: 100);
                    if ($activeEmployees >= $maxTotal) {
                        return back()->withErrors([
                            'role' => "You have reached your total plan limit of {$maxTotal} employees ({$activeEmployees} currently active). Please request approval from the Super Administrator for unlimited employees."
                        ])->withInput();
                    }
                }
            }
        }

        if ($validated['role'] === 'manager') {
            if (empty($validated['module_permissions'])) {
                $targetDesig = $validated['designation'] ?? '';
                $existingMgr = User::where('admin_id', $tenantAdminId)
                    ->where('role', 'manager')
                    ->where('designation', $targetDesig)
                    ->whereNotNull('module_permissions')
                    ->first();
                $validated['module_permissions'] = ($existingMgr && is_array($existingMgr->module_permissions))
                    ? $existingMgr->module_permissions
                    : ['dashboard'];
            }
            if (!in_array('dashboard', $validated['module_permissions'])) {
                array_unshift($validated['module_permissions'], 'dashboard');
            }
            $validated['module_permissions'] = array_values(array_unique($validated['module_permissions']));
        }

        User::create($validated);

        return redirect()->back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user)
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        if (!$isSuperAdmin && $user->admin_id !== $tenantAdminId) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6|confirmed',
            'role' => 'sometimes|required|in:user,manager,editor,admin',
            'desktop_only' => 'nullable|boolean',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'employee_id' => 'nullable|string|max:255|unique:users,employee_id,' . $user->id,
            'department_id' => 'nullable|exists:departments,id',
            'designation' => 'nullable|string|max:255',
            'joining_date' => 'nullable|date',
            'employment_type' => 'nullable|in:permanent,contract,intern',
            'module_permissions' => 'nullable|array',
            'module_permissions.*' => 'string',
        ]);

        if (!empty($validated['department_id']) && !$isSuperAdmin) {
            $deptValid = Department::where('id', $validated['department_id'])
                ->where('admin_id', $tenantAdminId)
                ->exists();
            if (!$deptValid) {
                return back()->withErrors(['department_id' => 'The selected department is invalid for this company.'])->withInput();
            }
        }

        // Email cannot change after creation / import
        $validated['email'] = $user->email;

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
            unset($validated['image']);
        } else {
            // If no new image, keep the old one
            unset($validated['image']);
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
            $validated['must_change_password'] = true;
        } else {
            unset($validated['password']);
        }

        // Check user limit for Basic Plan on update
        $role = $validated['role'] ?? $user->role;
        if (in_array($role, ['user', 'manager', 'editor']) && $user->role === 'admin') {
            $tenantAdmin = $authUser->role === 'admin' ? $authUser : User::find($tenantAdminId);
            $plan = $tenantAdmin ? ($tenantAdmin->plan ?? 'basic') : 'basic';
            if ($plan === 'basic') {
                $activeEmployees = User::where('admin_id', $tenantAdminId)
                    ->whereIn('role', ['user', 'manager', 'editor'])
                    ->where('is_active', true)
                    ->where('id', '!=', $user->id)
                    ->count();
                if ($activeEmployees >= 10) {
                    return back()->withErrors([
                        'role' => 'You have reached the limit of 10 active employees for the Basic Plan. Upgrade to the Premium Plan to add more.'
                    ])->withInput();
                }
            }
        }

        $finalRole = $validated['role'] ?? $user->role;
        if ($finalRole === 'manager') {
            $userPerms = $validated['module_permissions'] ?? $user->module_permissions;
            if (empty($userPerms) || !is_array($userPerms)) {
                $targetDesig = $validated['designation'] ?? $user->designation;
                $existingMgr = User::where('admin_id', $tenantAdminId)
                    ->where('role', 'manager')
                    ->where('id', '!=', $user->id)
                    ->where('designation', $targetDesig)
                    ->whereNotNull('module_permissions')
                    ->first();
                $userPerms = ($existingMgr && is_array($existingMgr->module_permissions))
                    ? $existingMgr->module_permissions
                    : ['dashboard'];
            }
            if (!in_array('dashboard', $userPerms)) {
                array_unshift($userPerms, 'dashboard');
            }
            $validated['module_permissions'] = array_values(array_unique($userPerms));
        }

        $user->update($validated);

        return redirect()->back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        if (!$isSuperAdmin) {
            $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);
            if ($user->admin_id !== $tenantAdminId) {
                abort(403, 'Unauthorized.');
            }
        }

        if ($user->image && Storage::disk('public')->exists($user->image)) {
            Storage::disk('public')->delete($user->image);
        }
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully.');
    }

    public function toggleDesktop(User $user)
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        if (!$isSuperAdmin) {
            $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);
            if ($user->admin_id !== $tenantAdminId) {
                abort(403, 'Unauthorized.');
            }
        }

        $user->desktop_only = !$user->desktop_only;
        $user->save();

        return response()->json([
            'message' => 'User desktop punch-in restriction updated.',
            'desktop_only' => $user->desktop_only
        ]);
    }

    public function toggle(User $user)
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);
        if (!$isSuperAdmin && $user->admin_id !== $tenantAdminId) {
            abort(403, 'Unauthorized.');
        }

        if (!$user->is_active) {
            // Toggling active from false to true: check limit
            if (in_array($user->role, ['user', 'manager', 'editor'])) {
                $tenantAdmin = $authUser->role === 'admin' ? $authUser : User::find($tenantAdminId);
                $plan = $tenantAdmin ? ($tenantAdmin->plan ?? 'basic') : 'basic';
                if ($plan === 'basic') {
                    $activeEmployees = User::where('admin_id', $tenantAdminId)
                        ->whereIn('role', ['user', 'manager', 'editor'])
                        ->where('is_active', true)
                        ->count();
                    if ($activeEmployees >= 10) {
                        return response()->json([
                            'error' => 'You have reached the limit of 10 active employees for the Basic Plan. Upgrade to the Premium Plan to activate this user.'
                        ], 422);
                    }
                }
            }
        }

        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json(['message' => 'User status updated.']);
    }

    /**
     * Download sample CSV template.
     */
    public function downloadImportTemplate(EmployeeImportService $importService)
    {
        $csv = $importService->getSampleCsv();

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="employee_import_template.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ]);
    }

    /**
     * Import employees from CSV/Excel.
     */
    public function import(Request $request, EmployeeImportService $importService)
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        // Check plan: only Premium plan admins (and Super Admin) can import
        $plan = 'basic';
        if ($isSuperAdmin) {
            $plan = 'premium';
        } else {
            $admin = ($authUser instanceof \App\Models\Admin) ? $authUser : \App\Models\Admin::where('email', $authUser->email)->first();
            if (!$admin && !empty($authUser->admin_id)) {
                $admin = \App\Models\Admin::find($authUser->admin_id);
            }
            $plan = $admin ? ($admin->plan ?? 'basic') : ($authUser->plan ?? 'basic');
        }

        if (!$isSuperAdmin && $plan !== 'premium') {
            return response()->json([
                'success' => false,
                'errors' => ['Employee CSV/Excel Import is an exclusive feature for Premium Plan subscribers. Please upgrade your plan to access this feature.']
            ], 403);
        }

        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, ['csv', 'txt', 'xlsx', 'xls'])) {
            return response()->json([
                'success' => false,
                'errors' => ['Invalid file format. Please upload a valid .csv or .xlsx file.'],
            ], 422);
        }

        $result = $importService->import($file, $tenantAdminId);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'errors' => $result['errors'],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'count' => $result['count'],
        ]);
    }

    /**
     * Request Super Admin approval for Unlimited Employees.
     */
    public function requestUnlimited()
    {
        $authUser = auth()->user();
        $admin = null;
        if ($authUser instanceof \App\Models\Admin) {
            $admin = $authUser;
        } elseif ($authUser->role === 'admin') {
            $admin = \App\Models\Admin::where('email', $authUser->email)->first();
        } elseif (!empty($authUser->admin_id)) {
            $admin = \App\Models\Admin::find($authUser->admin_id);
        }

        if (!$admin) {
            return response()->json(['error' => 'Admin account not found.'], 404);
        }

        if ($admin->unlimited_employees_status === 'approved') {
            return response()->json([
                'success' => true,
                'message' => 'Your account already has Super Admin approval for unlimited employees.'
            ]);
        }

        $admin->update(['unlimited_employees_status' => 'pending']);

        return response()->json([
            'success' => true,
            'message' => 'Request for Unlimited Employees submitted successfully. The Super Administrator will review your request.'
        ]);
    }
}

