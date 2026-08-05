<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    private function getTenantAdminId()
    {
        $user = auth()->user();
        if (!$user) return null;
        if ($user instanceof \App\Models\Admin) {
            return $user->id;
        }
        return $user->admin_id ?? $user->id;
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = $user && isset($user->role) && $user->role === 'superadmin';
        $adminId = $this->getTenantAdminId();

        $query = Department::withCount('employees');

        if (!$isSuperAdmin && $adminId) {
            $query->where(function ($q) use ($adminId) {
                $q->where('admin_id', $adminId)
                  ->orWhereNull('admin_id');
            });
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $departments = $query->orderBy('id', 'asc')
            ->paginate($request->input('perPage', 15))
            ->withQueryString();

        return Inertia::render('Admin/Departments/Index', [
            'departments' => $departments,
            'filters' => $request->only(['search', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $adminId = $this->getTenantAdminId();
        $validated['admin_id'] = $adminId;
        $validated['is_active'] = $request->boolean('is_active', true);

        Department::create($validated);

        return back()->with('success', 'Department created successfully.');
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);

        $department->update($validated);

        return back()->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department)
    {
        // Unassign employees from this department before deleting
        $department->employees()->update(['department_id' => null]);
        $department->delete();

        return back()->with('success', 'Department deleted successfully.');
    }
}
