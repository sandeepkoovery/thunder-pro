<?php

namespace App\Http\Controllers;

use App\Models\DailyWorksheet;
use App\Models\DailyWorksheetSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DailyListingsController extends Controller
{
    private function getTenantAdminId()
    {
        $user = auth()->user();
        if ($user->role === 'superadmin') {
            return null;
        }
        if ($user->role === 'admin' || $user instanceof \App\Models\Admin) {
            $admin = \App\Models\Admin::where('email', $user->email)->first();
            return $admin ? $admin->id : null;
        }
        return $user->admin_id ?? null;
    }

    public function index()
    {
        $user = auth()->user();
        $adminId = $this->getTenantAdminId();
        $isAdmin = ($user instanceof \App\Models\Admin) || in_array($user->role, ['admin', 'superadmin']);

        $query = DailyWorksheet::with('user');
        if ($adminId) {
            $query->where('admin_id', $adminId);
        }

        // Regular users only see their own works
        if (!$isAdmin) {
            $query->where('user_id', $user->id);
        }

        $worksheets = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->get();

        $isAdmin = ($user instanceof \App\Models\Admin) || in_array($user->role, ['admin', 'superadmin']);

        $settings = DailyWorksheetSetting::where('user_id', $user->id)->first();

        if (!$settings && $adminId) {
            $settings = DailyWorksheetSetting::where('admin_id', $adminId)
                ->where(function ($q) {
                    $q->whereNull('user_id')->orWhere('user_id', 0);
                })
                ->first();
        }

        if (!$settings) {
            try {
                $settings = DailyWorksheetSetting::create([
                    'admin_id' => $adminId,
                    'user_id' => $user->id,
                    'client_name_enabled' => true,
                    'task_type_enabled' => true,
                    'status_enabled' => true,
                    'file_name_enabled' => true,
                    'drive_link_enabled' => true,
                    'project_enabled' => true,
                    'task_type_options' => 'Listing, Design, Content, Maintenance, Review',
                    'task_type_freetext' => false,
                ]);
            } catch (\Throwable $e) {
                $settings = DailyWorksheetSetting::create([
                    'admin_id' => $adminId,
                    'user_id' => $user->id ?? 0,
                    'client_name_enabled' => true,
                    'task_type_enabled' => true,
                    'status_enabled' => true,
                    'file_name_enabled' => true,
                    'drive_link_enabled' => true,
                    'project_enabled' => true,
                    'task_type_options' => 'Listing, Design, Content, Maintenance, Review',
                    'task_type_freetext' => false,
                ]);
            }
        }

        $userQuery = User::where('is_active', true);
        if ($adminId) {
            $userQuery->where('admin_id', $adminId);
        }
        $users = $userQuery->orderBy('name')->get(['id', 'name', 'email']);

        $userSettingsList = DailyWorksheetSetting::where('admin_id', $adminId)->get();
        $userSettingsMap = [];
        foreach ($userSettingsList as $st) {
            if ($st->user_id) {
                $userSettingsMap[$st->user_id] = $st;
            }
        }

        return Inertia::render('DailyListings/Index', [
            'worksheets' => $worksheets,
            'settings' => $settings,
            'userSettingsMap' => $userSettingsMap,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'client_name' => 'nullable|string|max:255',
            'task_type' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'file_name' => 'nullable|string|max:255',
            'drive_link' => 'nullable|string|max:255',
            'project' => 'nullable|string|max:255',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $user = auth()->user();
        $adminId = $this->getTenantAdminId();
        $userId = !empty($validated['user_id']) 
            ? $validated['user_id'] 
            : ($user instanceof \App\Models\User ? $user->id : null);

        DailyWorksheet::create([
            'admin_id' => $adminId,
            'user_id' => $userId,
            'date' => $validated['date'],
            'client_name' => $validated['client_name'] ?? null,
            'task_type' => $validated['task_type'] ?? null,
            'status' => $validated['status'] ?? null,
            'file_name' => $validated['file_name'] ?? null,
            'drive_link' => $validated['drive_link'] ?? null,
            'project' => $validated['project'] ?? null,
        ]);

        return back()->with('success', 'Worksheet listing entry created successfully.');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'client_name' => 'nullable|string|max:255',
            'task_type' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'file_name' => 'nullable|string|max:255',
            'drive_link' => 'nullable|string|max:255',
            'project' => 'nullable|string|max:255',
        ]);

        $item = DailyWorksheet::findOrFail($id);
        $user = auth()->user();
        $isAdmin = ($user instanceof \App\Models\Admin) || in_array($user->role, ['admin', 'superadmin']);
        if (!$isAdmin && $item->user_id != $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $item->update($validated);

        return back()->with('success', 'Worksheet entry updated successfully.');
    }

    public function destroy($id)
    {
        $item = DailyWorksheet::findOrFail($id);
        $user = auth()->user();
        $isAdmin = ($user instanceof \App\Models\Admin) || in_array($user->role, ['admin', 'superadmin']);
        if (!$isAdmin && $item->user_id != $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $item->delete();

        return back()->with('success', 'Worksheet entry deleted successfully.');
    }

    public function updateSettings(Request $request)
    {
        $user = auth()->user();
        $adminId = $this->getTenantAdminId();

        $validated = $request->validate([
            'client_name_enabled' => 'boolean',
            'task_type_enabled' => 'boolean',
            'status_enabled' => 'boolean',
            'file_name_enabled' => 'boolean',
            'drive_link_enabled' => 'boolean',
            'project_enabled' => 'boolean',
            'task_type_options' => 'nullable|string',
            'task_type_freetext' => 'boolean',
        ]);

        $isAdmin = ($user instanceof \App\Models\Admin) || in_array($user->role, ['admin', 'superadmin']);

        if ($isAdmin) {
            DailyWorksheetSetting::updateOrCreate(
                ['admin_id' => $adminId, 'user_id' => null],
                $validated
            );
        } else {
            DailyWorksheetSetting::updateOrCreate(
                ['user_id' => $user->id],
                array_merge($validated, ['admin_id' => $adminId])
            );
        }

        return back()->with('success', 'Worksheet column settings updated successfully.');
    }
}
