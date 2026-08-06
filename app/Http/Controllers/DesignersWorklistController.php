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

    private function isDesignerUser($user)
    {
        if (!$user) return false;
        if ($user instanceof \App\Models\Admin) return true;
        if (in_array(strtolower($user->role ?? ''), ['admin', 'superadmin', 'designer', 'editor', 'manager'])) return true;
        if (!empty($user->designation) && (stripos($user->designation, 'design') !== false || stripos($user->designation, 'edit') !== false)) return true;
        if ($user->department_id) {
            $dept = \App\Models\Department::find($user->department_id);
            if ($dept && (stripos($dept->name, 'design') !== false || stripos($dept->name, 'edit') !== false)) return true;
        }
        return false;
    }

    private function authorizeDesigner()
    {
        if (!$this->isDesignerUser(auth()->user())) {
            abort(403, 'Access denied. Designers Worklist is restricted to designers, editors, and administrators only.');
        }
    }

    public function index()
    {
        $this->authorizeDesigner();

        $user = auth()->user();
        $adminId = $this->getTenantAdminId();

        $query = DesignersWorklist::with(['assignedUsers', 'creator']);
        if ($adminId) {
            $query->where('admin_id', $adminId);
        }

        $isManager = ($user instanceof \App\Models\Admin) || in_array(strtolower($user->role ?? ''), ['admin', 'superadmin', 'editor']);

        if (!$isManager) {
            $query->whereHas('assignedUsers', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }

        $worklists = $query->orderBy('task_date', 'desc')->orderBy('id', 'desc')->get();

        $userQuery = User::where('is_active', true);
        if ($adminId) {
            $userQuery->where('admin_id', $adminId);
        }

        $userQuery->where(function ($q) {
            $q->where('role', 'designer')
              ->orWhere('designation', 'LIKE', '%design%')
              ->orWhereHas('department', function ($dq) {
                  $dq->where('name', 'LIKE', '%design%');
              });
        });

        $users = $userQuery->orderBy('name')->get(['id', 'name', 'email']);

        // Fallback if no users explicitly match designer keywords
        if ($users->isEmpty()) {
            $fallbackQuery = User::where('is_active', true);
            if ($adminId) {
                $fallbackQuery->where('admin_id', $adminId);
            }
            $users = $fallbackQuery->whereIn('role', ['designer', 'editor'])->orderBy('name')->get(['id', 'name', 'email']);
        }

        $taskTypeOptionsSetting = \App\Models\Setting::where('key', 'designers_task_type_options')->value('value')
            ?? 'Poster, Thumbnail, Story, Carousel, Grid, Other';

        return Inertia::render('DesignersWorklist/Index', [
            'worklists' => $worklists,
            'users' => $users,
            'taskTypeOptionsSetting' => $taskTypeOptionsSetting,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeDesigner();

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
        $this->authorizeDesigner();

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
        $this->authorizeDesigner();

        $validated = $request->validate([
            'status' => 'required|string|max:255',
        ]);

        $worklist = DesignersWorklist::findOrFail($id);
        $worklist->update(['status' => $validated['status']]);

        return back()->with('success', 'Worklist status updated.');
    }

    public function destroy($id)
    {
        $this->authorizeDesigner();

        $worklist = DesignersWorklist::findOrFail($id);
        $worklist->delete();

        return back()->with('success', 'Designers worklist item deleted successfully.');
    }
}
