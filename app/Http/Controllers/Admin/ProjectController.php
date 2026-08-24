<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        $query = Project::query();

        if (!$isSuperAdmin) {
            $query->where('admin_id', $tenantAdminId);
        }

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // whitelist columns to avoid SQL injection
        $allowed = ['id', 'name', 'status', 'start_date', 'end_date'];
        if (!in_array($sort, $allowed)) {
            $sort = 'name';
        }

        // We also need project status counts for the tabs
        $statusCounts = [
            'All' => (clone $query)->count(),
            'Ongoing' => (clone $query)->where('status', 'in progress')->count(),
            'Completed' => (clone $query)->where('status', 'completed')->count(),
            'Inactive' => (clone $query)->where('status', 'on hold')->count(),
            'Cancelled' => (clone $query)->where('status', 'cancelled')->count(),
            'Critical' => (clone $query)->where('status', 'critical')->count(),
        ];

        // Fetch projects with their relation aggregates (12 per page for 4-column grid alignment)
        $perPage = (int) $request->input('perPage', 12);

        $projects = $query->with(['tasks', 'tasks.assignees']) // Eager load to process progress and unique user avatars
            ->withCount('tasks')
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        // Calculate progress and gather unique assignees for each project before sending to the frontend
        $projects->getCollection()->transform(function ($project) {
            $totalTasks = $project->tasks->count();
            $completedTasks = $project->tasks->where('status', 'completed')->count();

            $project->progress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;

            // Collect unique assignees across all tasks in this project
            $assignees = $project->tasks->pluck('assignees')->flatten()->unique('id')->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'image' => $user->image ? asset('storage/' . $user->image) : null,
                ];
            })->values();

            $project->team = $assignees;

            // We can hide the raw tasks relationship to save payload size
            $project->makeHidden('tasks');
            return $project;
        });

        return Inertia::render('Admin/Projects/Index', [
            'projects' => $projects,
            'statusCounts' => $statusCounts,
            'filters' => $request->only(['search', 'perPage', 'sort', 'direction']),
            'success' => session('success'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Projects/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'client_name' => 'nullable|string|max:255',
            'budget' => 'nullable|numeric',
            'description' => 'nullable',
            'status' => 'required',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $authUser = auth()->user();
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        Project::create([
            ...$request->all(),
            'admin_id' => $tenantAdminId,
        ]);

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project created successfully!');
    }

    public function edit(Project $project)
    {
        return Inertia::render('Admin/Projects/Edit', [
            'project' => $project,
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $request->validate([
            'name' => 'required',
            'client_name' => 'nullable|string|max:255',
            'budget' => 'nullable|numeric',
            'description' => 'nullable',
            'status' => 'required',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        $project->update($request->only([
            'name',
            'client_name',
            'budget',
            'description',
            'status',
            'start_date',
            'end_date',
        ]));

        if ($request->inertia()) {
            return back()->with('success', 'Project updated successfully!');
        }

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project updated successfully!');
    }

    public function destroy(Project $project)
    {
        \Illuminate\Support\Facades\Log::info('AdminProjectController::destroy called', ['project_id' => $project->id]);
        $project->delete();

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project deleted successfully!');
    }

    public function show(Project $project)
    {
        // ✅ Updated: use 'assignees' instead of old 'assignee'
        $tasks = Task::with(['assignees'])
            ->withCount('comments')
            ->where('project_id', $project->id)
            ->get();

        $users = User::where('role', 'user')->where('is_active', true)->get()->map(function ($user) {
            $user->image_url = $user->image
                ? asset('storage/' . $user->image)
                : null;
            return $user;
        });

        return Inertia::render('Admin/Projects/Show', [
            'project' => $project,
            'tasks' => $tasks,
            'users' => $users,
        ]);
    }

    public function reorder(Request $request, Project $project)
    {
        foreach ($request->all() as $status => $taskIds) {
            foreach ($taskIds as $index => $taskId) {
                Task::where('id', $taskId)
                    ->where('project_id', $project->id)
                    ->update([
                        'status' => $status,
                    ]);
            }
        }

        return back()->with('success', 'Tasks reordered successfully!');
    }
}
