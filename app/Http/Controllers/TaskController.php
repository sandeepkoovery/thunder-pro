<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskController extends Controller
{
    /**
     * Display logged-in user’s tasks.
     */
    public function index(Request $request)
    {
        if (auth()->user()->role === 'manager') {
            return redirect()->route('admin.tasks.index');
        }

        $q = $request->input('q');
        $projectId = $request->input('project_id'); // 💡 GET THE PROJECT ID
        $userId = auth()->id();

        $tasks = Task::with(['project', 'assignees'])
            ->withCount('comments')
            // 1. Filter by Assignee (using the correct pivot table logic)
            ->whereHas('assignees', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })

            // 💡 2. FIX: Filter by Project ID if provided
            ->when(
                $projectId,
                fn($query) =>
                $query->where('project_id', $projectId)
            )

            // 3. Filter by Search Query
            ->when(
                $q,
                fn($query) =>
                $query->where('name', 'like', "%{$q}%")
            )
            ->orderBy($request->input('sort', 'created_at'), $request->input('direction', 'desc'))
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('User/Tasks/Index', [
            'tasks' => $tasks,
            'filters' => $request->only(['q', 'sort', 'direction', 'project_id']), // Include project_id in filters
        ]);
    }

    /**
     * Update only the status of a task (start / progress).
     */
    public function updateStatus(Request $request, Task $task)
    {
        $userId = auth()->id();

        // 💡 FIX 2: Check if the current user is an assignee of this task
        $isAssignee = $task->assignees()
            ->where('user_id', $userId)
            ->exists();

        if (!$isAssignee) {
            // Log this for debugging
            \Log::warning("Unauthorized task update attempt for task {$task->id} by user " . $userId);
            abort(403, 'Unauthorized. You are not assigned to this task.');
        }

        $request->validate([
            'status' => 'required|in:not started,in progress,completed,on hold',
        ]);

        $task->update(['status' => $request->status]);

        return back()->with('message', 'Task status updated');
    }

    public function show($id)
    {
        $task = Task::with(['project', 'assignees', 'comments.user'])
            ->findOrFail($id);

        // Check if user is authorized (assignee or admin/manager)
        $user = auth()->user();
        $isAssignee = $task->assignees()->where('user_id', $user->id)->exists();

        if (!$isAssignee && !in_array($user->role, ['admin', 'manager'])) {
            abort(403, 'Unauthorized access to this task.');
        }

        return Inertia::render('User/Tasks/Show', [
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

        // Check authorization
        $user = auth()->user();
        $isAssignee = $task->assignees()->where('user_id', $user->id)->exists();

        if (!$isAssignee && !in_array($user->role, ['admin', 'manager'])) {
            abort(403, 'Unauthorized.');
        }

        $task->comments()->create([
            'user_id' => $user->id,
            'content' => $request->input('content'),
            'parent_id' => $request->input('parent_id'),
        ]);

        return back()->with('success', 'Comment added successfully');
    }
}
