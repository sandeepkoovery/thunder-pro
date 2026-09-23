<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Project;
use App\Models\User;
use App\Models\Comment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Response;


class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        $tasksQuery = Task::whereHas('project', function($q) use ($isSuperAdmin, $tenantAdminId) {
            if (!$isSuperAdmin) {
                $q->where('admin_id', $tenantAdminId);
            }
        });

        $tasks = $tasksQuery->with(['project', 'assignees'])
            ->orderByRaw("FIELD(priority, 'high', 'medium', 'low')")
            ->latest()
            ->paginate(10);

        $projectsQuery = Project::query();
        $usersQuery = User::where('is_active', true);

        if (!$isSuperAdmin) {
            $projectsQuery->where('admin_id', $tenantAdminId);
            $usersQuery->where('admin_id', $tenantAdminId);
        }

        $projects = $projectsQuery->get();
        $users = $usersQuery->get();

        return Inertia::render('Admin/Tasks/Index', [
            'tasks' => $tasks,
            'projects' => $projects,
            'users' => $users,
        ]);
    }

    /**
     * Show the form for creating a new task.
     */
    public function create()
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        $projectsQuery = Project::query();
        $usersQuery = User::where('is_active', true);

        if (!$isSuperAdmin) {
            $projectsQuery->where('admin_id', $tenantAdminId);
            $usersQuery->where('admin_id', $tenantAdminId);
        }

        $projects = $projectsQuery->get();
        $users = $usersQuery->get();

        return Inertia::render('Admin/Tasks/Create', [
            'projects' => $projects,
            'users' => $users,
        ]);
    }

    private function getTenantAdminId(): ?int
    {
        $authUser = auth()->user();
        if (!$authUser || $authUser->role === 'superadmin') {
            return null;
        }
        $id = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);
        return $id ? (int) $id : null;
    }

    private function authorizeTask(Task $task): void
    {
        $tenantAdminId = $this->getTenantAdminId();
        if ($tenantAdminId !== null && $task->project && (int)$task->project->admin_id !== (int)$tenantAdminId) {
            abort(403, 'Unauthorized access to this task.');
        }
    }

    /**
     * Store a newly created task in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'caption' => 'nullable|string|max:255',
            'thumb_text' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'required|exists:projects,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'required|string|in:not started,in progress,on hold,completed',
            'priority' => 'required|string|in:low,medium,high',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
        ]);

        $authUser = auth()->user();
        $isSuperAdmin = $authUser && $authUser->role === 'superadmin';
        $tenantAdminId = $this->getTenantAdminId();

        $project = Project::findOrFail($validated['project_id']);
        if (!$isSuperAdmin && $tenantAdminId !== null && (int)$project->admin_id !== (int)$tenantAdminId) {
            abort(403, 'Unauthorized access to this project.');
        }

        // Create the task (tasks table does not have user_id; assignees are tracked via task_user pivot)
        $taskData = $request->only([
            'name',
            'caption',
            'thumb_text',
            'description',
            'project_id',
            'start_date',
            'end_date',
            'status',
            'priority',
        ]);
        $taskData['start_date'] = $taskData['start_date'] ?? now()->toDateString();
        $taskData['end_date'] = $taskData['end_date'] ?? $taskData['start_date'];

        $task = Task::create($taskData);

        // Detach and sync assignees (scoped to the project's tenant)
        if (!empty($validated['assignee_ids'])) {
            $targetAdminId = $project->admin_id ?: $tenantAdminId;
            $assigneesQuery = User::whereIn('id', $validated['assignee_ids']);
            if ($targetAdminId && !$isSuperAdmin) {
                $assigneesQuery->where('admin_id', $targetAdminId);
            }
            $task->assignees()->sync($assigneesQuery->pluck('id')->all());
        }

        if ($request->header('referer') && str_contains($request->header('referer'), '/calendar')) {
            return redirect()->route('calendar.index')->with('success', 'Task created successfully.');
        }

        return redirect()->route('admin.projects.show', $validated['project_id'])
            ->with('success', 'Task created successfully.');
    }

    /**
     * Update the specified task in storage.
     */
    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'caption' => 'nullable|string|max:255',
            'thumb_text' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'required|exists:projects,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'required|string|in:not started,in progress,on hold,completed',
            'priority' => 'required|string|in:low,medium,high',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
        ]);

        $authUser = auth()->user();
        $isSuperAdmin = $authUser && $authUser->role === 'superadmin';
        $tenantAdminId = $this->getTenantAdminId();

        $this->authorizeTask($task);

        $project = Project::findOrFail($validated['project_id']);
        if (!$isSuperAdmin && $tenantAdminId !== null && (int)$project->admin_id !== (int)$tenantAdminId) {
            abort(403, 'Unauthorized access to this project.');
        }

        // Update base task details
        $task->update($request->only([
            'name',
            'caption',
            'thumb_text',
            'description',
            'project_id',
            'start_date',
            'end_date',
            'status',
            'priority',
        ]));

        // Update pivot assignees (scoped to the project's tenant)
        if (isset($validated['assignee_ids'])) {
            $targetAdminId = $project->admin_id ?: $tenantAdminId;
            $assigneesQuery = User::whereIn('id', $validated['assignee_ids']);
            if ($targetAdminId && !$isSuperAdmin) {
                $assigneesQuery->where('admin_id', $targetAdminId);
            }
            $task->assignees()->sync($assigneesQuery->pluck('id')->all());
        }

        if ($request->header('referer') && str_contains($request->header('referer'), '/calendar')) {
            return redirect()->route('calendar.index')->with('success', 'Task updated successfully.');
        }

        return redirect()->route('admin.projects.show', $validated['project_id'])
            ->with('success', 'Task updated successfully.');
    }

    /**
     * Show the form for editing a task.
     */
    public function edit(Task $task)
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $this->getTenantAdminId();

        $this->authorizeTask($task);
        $task->load(['project', 'assignees']);

        $projectsQuery = Project::query();
        $usersQuery = User::where('is_active', true);

        if (!$isSuperAdmin) {
            $projectsQuery->where('admin_id', $tenantAdminId);
            $usersQuery->where('admin_id', $tenantAdminId);
        } elseif ($task->project && $task->project->admin_id) {
            $usersQuery->where('admin_id', $task->project->admin_id);
        }

        $projects = $projectsQuery->get();
        $users = $usersQuery->get();

        return Inertia::render('Admin/Tasks/Edit', [
            'task' => $task,
            'projects' => $projects,
            'users' => $users,
        ]);
    }

    /**
     * Remove the specified task from storage.
     */
    public function destroy(Task $task)
    {
        $this->authorizeTask($task);

        \Illuminate\Support\Facades\Log::info('AdminTaskController::destroy called', ['task_id' => $task->id, 'project_id' => $task->project_id]);
        $projectId = $task->project_id;

        // Detach all users from pivot before deleting task
        $task->assignees()->detach();
        $task->delete();

        if (request()->header('referer') && str_contains(request()->header('referer'), '/calendar')) {
            return redirect()->route('calendar.index')->with('success', 'Task deleted successfully.');
        }

        // Use Inertia::location() to force a client-side redirect with GET method
        // This prevents Inertia from making a DELETE request to the redirect URL
        return \Inertia\Inertia::location(route('admin.projects.show', $projectId));
    }

    public function status(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:not started,in progress,on hold,completed',
        ]);

        $task = Task::findOrFail($id);
        $this->authorizeTask($task);

        $task->status = $request->status;
        $task->save();

        return Response::json([
            'message' => 'Task status updated successfully.'
        ], 200);
    }

    public function show($id)
    {
        $task = Task::with(['project', 'assignees', 'comments.user'])
            ->findOrFail($id);

        $this->authorizeTask($task);

        return Inertia::render('Admin/Tasks/Show', [
            'task' => $task
        ]);
    }

    public function storeComment(Request $request, $taskId)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $task = Task::findOrFail($taskId);
        $this->authorizeTask($task);

        $task->comments()->create([
            'user_id' => auth()->id(),
            'content' => $request->input('content'),
            'parent_id' => $request->input('parent_id'),
        ]);

        return back()->with('success', 'Comment added successfully');
    }

    public function destroyComment($id)
    {
        $comment = Comment::findOrFail($id);
        if ($comment->task) {
            $this->authorizeTask($comment->task);
        }

        // Authorization check (already inside admin middleware group, but good to be explicit)
        if (!in_array(auth()->user()->role, ['admin', 'manager', 'editor', 'superadmin'])) {
            abort(403, 'Unauthorized.');
        }

        $comment->delete();

        return back()->with('success', 'Comment deleted successfully');
    }
}
