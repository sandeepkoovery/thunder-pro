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
            'Planning' => (clone $query)->whereIn('status', ['planning', 'not started'])->count(),
            'In Progress' => (clone $query)->whereIn('status', ['in progress', 'ongoing'])->count(),
            'Completed' => (clone $query)->where('status', 'completed')->count(),
            'On Hold' => (clone $query)->whereIn('status', ['on hold', 'inactive'])->count(),
        ];

        // Fetch projects with their relation aggregates (12 per page for 4-column grid alignment)
        $perPage = (int) $request->input('perPage', 12);

        $projects = $query->with(['tasks' => function ($q) {
            $q->withCount('comments');
        }, 'tasks.assignees'])
            ->withCount('tasks')
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        // Calculate progress and gather unique assignees for each project before sending to the frontend
        $projects->getCollection()->transform(function ($project) {
            $totalTasks = $project->tasks->count();
            $completedTasks = $project->tasks->where('status', 'completed')->count();
            $totalComments = $project->tasks->sum('comments_count');

            $project->progress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;
            $project->comments_count = $totalComments;
            $project->image_url = $project->image ? asset('storage/' . $project->image) : null;

            // Collect unique assignees across all tasks in this project
            $assignees = $project->tasks->pluck('assignees')->flatten()->unique('id')->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'image' => $user->image_url,
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
        $validated = $request->validate([
            'name' => 'required',
            'client_name' => 'nullable|string|max:255',
            'budget' => 'nullable|numeric',
            'description' => 'nullable',
            'status' => 'required',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'image' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ], [
            'image.mimes' => 'The project logo must be a file of type: jpeg, png, jpg, gif, svg, webp.',
            'image.max' => 'The project logo size must not exceed 5MB.',
        ]);

        $authUser = auth()->user();
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        if ($request->hasFile('image')) {
            $directory = storage_path('app/public/projects');
            if (!file_exists($directory)) {
                @mkdir($directory, 0775, true);
            }
            $validated['image'] = $request->file('image')->store('projects', 'public');
        } else {
            unset($validated['image']);
        }

        Project::create([
            ...$validated,
            'admin_id' => $tenantAdminId,
        ]);

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project created successfully!');
    }

    private function authorizeProject(Project $project): void
    {
        $authUser = auth()->user();
        if (!$authUser || $authUser->role === 'superadmin') {
            return;
        }

        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);
        if ($tenantAdminId !== null && (int)$project->admin_id !== (int)$tenantAdminId) {
            abort(403, 'Unauthorized access to this project.');
        }
    }

    public function edit(Project $project)
    {
        $this->authorizeProject($project);

        return Inertia::render('Admin/Projects/Edit', [
            'project' => $project,
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $this->authorizeProject($project);

        $validated = $request->validate([
            'name' => 'required',
            'client_name' => 'nullable|string|max:255',
            'budget' => 'nullable|numeric',
            'description' => 'nullable',
            'status' => 'required',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'image' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ], [
            'image.mimes' => 'The project logo must be a file of type: jpeg, png, jpg, gif, svg, webp.',
            'image.max' => 'The project logo size must not exceed 5MB.',
        ]);

        if ($request->hasFile('image')) {
            $directory = storage_path('app/public/projects');
            if (!file_exists($directory)) {
                @mkdir($directory, 0775, true);
            }
            $oldImage = $project->image;
            $validated['image'] = $request->file('image')->store('projects', 'public');
            if ($oldImage && file_exists(storage_path('app/public/' . $oldImage))) {
                @unlink(storage_path('app/public/' . $oldImage));
            }
        } else {
            unset($validated['image']);
        }

        $project->update($validated);

        return back()->with('success', 'Project updated successfully!');
    }

    public function destroy(Project $project)
    {
        $this->authorizeProject($project);

        \Illuminate\Support\Facades\Log::info('AdminProjectController::destroy called', ['project_id' => $project->id]);
        $project->delete();

        return redirect()->route('admin.projects.index')
            ->with('success', 'Project deleted successfully!');
    }

    public function show(Project $project)
    {
        $this->authorizeProject($project);

        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        // ✅ Updated: use 'assignees' instead of old 'assignee'
        $tasks = Task::with(['assignees'])
            ->withCount('comments')
            ->where('project_id', $project->id)
            ->get();

        $targetAdminId = $project->admin_id ?: (!$isSuperAdmin ? $tenantAdminId : null);
        $usersQuery = User::where('is_active', true);

        if ($targetAdminId) {
            $usersQuery->where('admin_id', $targetAdminId);
        }

        $users = $usersQuery->orderBy('name')->get()->map(function ($user) {
            $user->image_url = $user->image
                ? asset('storage/' . $user->image)
                : null;
            return $user;
        });

        $project->image_url = $project->image ? asset('storage/' . $project->image) : null;

        return Inertia::render('Admin/Projects/Show', [
            'project' => $project,
            'tasks' => $tasks,
            'users' => $users,
        ]);
    }

    public function reorder(Request $request, Project $project)
    {
        $this->authorizeProject($project);

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
