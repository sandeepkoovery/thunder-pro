<?php

namespace App\Http\Controllers;

use App\Models\DesignersWorklist;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DesignersWorklistController extends Controller
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

        $query = DesignersWorklist::with(['assignedUsers', 'creator']);
        if ($adminId) {
            $query->where('admin_id', $adminId);
        }

        if ($user->role === 'user') {
            $query->whereHas('assignedUsers', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }

        $worklists = $query->orderBy('task_date', 'desc')->orderBy('id', 'desc')->get();

        $userQuery = User::where('is_active', true);
        if ($adminId) {
            $userQuery->where('admin_id', $adminId);
        }
        $users = $userQuery->orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('DesignersWorklist/Index', [
            'worklists' => $worklists,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_name' => 'required|string|max:255',
            'task_date' => 'nullable|date',
            'task_type' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'nullable|string|max:255',
            'assigned_user_ids' => 'nullable|array',
        ]);

        $adminId = $this->getTenantAdminId();

        $worklist = DesignersWorklist::create([
            'admin_id' => $adminId,
            'creator_id' => auth()->id(),
            'client_name' => $validated['client_name'],
            'task_date' => $validated['task_date'] ?? null,
            'task_type' => $validated['task_type'],
            'description' => $validated['description'],
            'status' => $validated['status'] ?? 'Not Done',
        ]);

        if (!empty($validated['assigned_user_ids'])) {
            $worklist->assignedUsers()->sync($validated['assigned_user_ids']);
        }

        return back()->with('success', 'Designers worklist item created successfully.');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'client_name' => 'required|string|max:255',
            'task_date' => 'nullable|date',
            'task_type' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'nullable|string|max:255',
            'assigned_user_ids' => 'nullable|array',
        ]);

        $worklist = DesignersWorklist::findOrFail($id);
        $worklist->update([
            'client_name' => $validated['client_name'],
            'task_date' => $validated['task_date'] ?? null,
            'task_type' => $validated['task_type'],
            'description' => $validated['description'],
            'status' => $validated['status'] ?? 'Not Done',
        ]);

        if (isset($validated['assigned_user_ids'])) {
            $worklist->assignedUsers()->sync($validated['assigned_user_ids']);
        }

        return back()->with('success', 'Designers worklist item updated successfully.');
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|max:255',
        ]);

        $worklist = DesignersWorklist::findOrFail($id);
        $worklist->update(['status' => $validated['status']]);

        return back()->with('success', 'Worklist status updated.');
    }

    public function destroy($id)
    {
        $worklist = DesignersWorklist::findOrFail($id);
        $worklist->delete();

        return back()->with('success', 'Designers worklist item deleted successfully.');
    }
}
