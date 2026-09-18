<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminUsersController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!auth()->check() || auth()->user()->role !== 'superadmin') {
                abort(403, 'Unauthorized. Super Admin access required.');
            }
            return $next($request);
        });
    }

    /**
     * Display listing of Admin Users & Subscriptions for Super Admin.
     */
    public function index(Request $request)
    {
        $admins = Admin::where('role', 'admin')
            ->latest()
            ->get(['id', 'name', 'email', 'company_name', 'phone', 'plan', 'subscription_status', 'trial_ends_at', 'subscribed_at', 'additional_modules', 'casual_leaves', 'sick_leaves', 'office_start_time', 'office_end_time', 'login_buffer_minutes', 'is_active', 'approval_status', 'created_at']);

        // Attach active employee count and trial info for each admin tenant
        $admins->transform(function ($admin) {
            $admin->users_count = User::where('admin_id', $admin->id)->count();
            $admin->is_trial = $admin->isInTrial();
            $admin->is_trial_expired = $admin->isTrialExpired();
            $admin->days_left_in_trial = $admin->daysLeftInTrial();
            $admin->casual_leaves = $admin->casual_leaves ?? 12;
            $admin->sick_leaves = $admin->sick_leaves ?? 12;
            $admin->office_start_time = $admin->office_start_time ?: '09:00';
            $admin->office_end_time = $admin->office_end_time ?: '18:00';
            $admin->login_buffer_minutes = (int)($admin->login_buffer_minutes ?? 30);
            return $admin;
        });

        // Get additional modules list settings
        $additionalModulesJson = Setting::where('key', 'additional_modules')->value('value');
        $availableAdditionalModules = $additionalModulesJson ? json_decode($additionalModulesJson, true) : [
            ['key' => 'calendar', 'name' => 'Calendar & Events', 'price' => 299],
            ['key' => 'content_calendar', 'name' => 'Content Calendar', 'price' => 499],
            ['key' => 'daily_listings', 'name' => 'Daily Listings & Worksheets', 'price' => 399],
            ['key' => 'designers_worklist', 'name' => 'Designers Worklist', 'price' => 499],
            ['key' => 'drive', 'name' => 'Google Drive Integration', 'price' => 299],
            ['key' => 'chat', 'name' => 'Team Real-time Chat', 'price' => 199],
        ];

        return Inertia::render('Admin/AdminUsers/Index', [
            'admins' => $admins,
            'availableAdditionalModules' => $availableAdditionalModules,
        ]);
    }

    /**
     * Store a newly created Admin User account.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'name' => 'nullable|string|max:255',
            'email' => 'required|email|max:255|unique:admins,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:50',
            'plan' => 'required|in:basic,premium',
            'subscription_status' => 'nullable|in:trial,active,expired',
            'trial_days' => 'nullable|integer|min:1|max:365',
            'additional_modules' => 'nullable|array',
            'approval_status' => 'required|in:pending,approved,rejected',
            'casual_leaves' => 'nullable|integer|min:0|max:365',
            'sick_leaves' => 'nullable|integer|min:0|max:365',
            'office_start_time' => 'nullable|string|max:10',
            'office_end_time' => 'nullable|string|max:10',
            'login_buffer_minutes' => 'nullable|integer|min:0|max:180',
        ]);

        $companyName = $validated['company_name'];
        $name = !empty($validated['name']) ? $validated['name'] : $companyName;
        $isApproved = $validated['approval_status'] === 'approved';

        $subStatus = 'active';
        $trialEndsAt = null;
        if ($validated['plan'] === 'premium') {
            $subStatus = $validated['subscription_status'] ?? 'trial';
            $trialDays = isset($validated['trial_days']) ? (int) $validated['trial_days'] : 30;
            if ($subStatus === 'trial') {
                $trialEndsAt = \Carbon\Carbon::now()->addDays($trialDays);
            }
        }

        $admin = Admin::create([
            'name' => $name,
            'company_name' => $companyName,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'plan' => $validated['plan'],
            'subscription_status' => $subStatus,
            'trial_ends_at' => $trialEndsAt,
            'subscribed_at' => ($subStatus === 'active') ? \Carbon\Carbon::now() : null,
            'additional_modules' => $validated['plan'] === 'premium' ? ($validated['additional_modules'] ?? []) : [],
            'phone' => $validated['phone'] ?? null,
            'casual_leaves' => isset($validated['casual_leaves']) ? (int) $validated['casual_leaves'] : 12,
            'sick_leaves' => isset($validated['sick_leaves']) ? (int) $validated['sick_leaves'] : 12,
            'office_start_time' => $validated['office_start_time'] ?? '09:00',
            'office_end_time' => $validated['office_end_time'] ?? '18:00',
            'login_buffer_minutes' => isset($validated['login_buffer_minutes']) ? (int) $validated['login_buffer_minutes'] : 30,
            'is_active' => $isApproved,
            'approval_status' => $validated['approval_status'],
        ]);

        return back()->with('success', "Admin account for '{$admin->company_name}' created successfully.");
    }

    /**
     * Update an existing Admin User account.
     */
    public function update(Request $request, $id)
    {
        $admin = Admin::findOrFail($id);

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'name' => 'nullable|string|max:255',
            'email' => 'required|email|max:255|unique:admins,email,' . $admin->id,
            'password' => 'nullable|string|min:6',
            'phone' => 'nullable|string|max:50',
            'plan' => 'required|in:basic,premium',
            'subscription_status' => 'nullable|in:trial,active,expired',
            'trial_days' => 'nullable|integer|min:1|max:365',
            'additional_modules' => 'nullable|array',
            'approval_status' => 'required|in:pending,approved,rejected',
            'casual_leaves' => 'nullable|integer|min:0|max:365',
            'sick_leaves' => 'nullable|integer|min:0|max:365',
            'office_start_time' => 'nullable|string|max:10',
            'office_end_time' => 'nullable|string|max:10',
            'login_buffer_minutes' => 'nullable|integer|min:0|max:180',
        ]);

        $companyName = $validated['company_name'];
        $name = !empty($validated['name']) ? $validated['name'] : $companyName;
        $isApproved = $validated['approval_status'] === 'approved';

        $updateData = [
            'name' => $name,
            'company_name' => $companyName,
            'email' => $validated['email'],
            'plan' => $validated['plan'],
            'additional_modules' => $validated['plan'] === 'premium' ? ($validated['additional_modules'] ?? []) : [],
            'phone' => $validated['phone'] ?? null,
            'casual_leaves' => isset($validated['casual_leaves']) ? (int) $validated['casual_leaves'] : ($admin->casual_leaves ?? 12),
            'sick_leaves' => isset($validated['sick_leaves']) ? (int) $validated['sick_leaves'] : ($admin->sick_leaves ?? 12),
            'office_start_time' => $validated['office_start_time'] ?? ($admin->office_start_time ?: '09:00'),
            'office_end_time' => $validated['office_end_time'] ?? ($admin->office_end_time ?: '18:00'),
            'login_buffer_minutes' => isset($validated['login_buffer_minutes']) ? (int) $validated['login_buffer_minutes'] : ($admin->login_buffer_minutes ?? 30),
            'approval_status' => $validated['approval_status'],
            'is_active' => $isApproved,
        ];

        if ($validated['plan'] === 'premium') {
            if (!empty($validated['subscription_status'])) {
                $updateData['subscription_status'] = $validated['subscription_status'];
                if ($validated['subscription_status'] === 'trial') {
                    if (isset($validated['trial_days'])) {
                        $updateData['trial_ends_at'] = \Carbon\Carbon::now()->addDays((int) $validated['trial_days']);
                    } elseif (!$admin->trial_ends_at || \Carbon\Carbon::now()->gte($admin->trial_ends_at)) {
                        $updateData['trial_ends_at'] = \Carbon\Carbon::now()->addDays(30);
                    }
                } elseif ($validated['subscription_status'] === 'active') {
                    $updateData['subscribed_at'] = $admin->subscribed_at ?? \Carbon\Carbon::now();
                }
            }
        }

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $admin->update($updateData);

        // Sync employee status based on admin active status
        User::where('admin_id', $admin->id)->update(['is_active' => $isApproved]);

        return back()->with('success', "Admin account for '{$admin->name}' updated successfully.");
    }

    /**
     * Change approval status (Approved, Pending, Rejected).
     */
    public function updateApproval(Request $request, $id)
    {
        $validated = $request->validate([
            'approval_status' => 'required|in:pending,approved,rejected',
        ]);

        $admin = Admin::findOrFail($id);
        $status = $validated['approval_status'];
        $isApproved = ($status === 'approved');

        $updateData = [
            'approval_status' => $status,
            'is_active' => $isApproved,
        ];

        if ($isApproved) {
            // If admin is on premium plan, preserve or activate their 30-day trial unless they already have a paid subscription
            if ($admin->plan === 'premium') {
                if ($admin->subscription_status === 'trial' || ($admin->trial_ends_at && \Carbon\Carbon::now()->lt($admin->trial_ends_at)) || empty($admin->subscribed_at)) {
                    $updateData['subscription_status'] = 'trial';
                    if (!$admin->trial_ends_at || \Carbon\Carbon::now()->gte($admin->trial_ends_at)) {
                        $updateData['trial_ends_at'] = \Carbon\Carbon::now()->addDays(30);
                    }
                } else {
                    $updateData['subscription_status'] = 'active';
                    $updateData['subscribed_at'] = $admin->subscribed_at ?? \Carbon\Carbon::now();
                }
            } else {
                $updateData['subscription_status'] = 'active';
            }
        }

        $admin->update($updateData);

        // Sync employee status
        User::where('admin_id', $admin->id)->update(['is_active' => $isApproved]);

        $label = ucfirst($status);
        return back()->with('success', "Admin account status updated to {$label}.");
    }

    /**
     * Toggle active/disabled status.
     */
    public function toggleStatus($id)
    {
        $admin = Admin::findOrFail($id);
        $newActive = !$admin->is_active;
        $newApproval = $newActive ? 'approved' : 'rejected';

        $admin->update([
            'is_active' => $newActive,
            'approval_status' => $newApproval,
        ]);

        User::where('admin_id', $admin->id)->update(['is_active' => $newActive]);

        $statusText = $newActive ? 'Active & Approved' : 'Disabled';
        return back()->with('success', "Admin account '{$admin->name}' status changed to {$statusText}.");
    }

    /**
     * Remove the specified admin account.
     */
    public function destroy($id)
    {
        $admin = Admin::findOrFail($id);
        $adminName = $admin->name;

        // Cascade delete or soft cleanup
        User::where('admin_id', $admin->id)->delete();
        $admin->delete();

        return back()->with('success', "Admin account '{$adminName}' and associated records removed successfully.");
    }
}
