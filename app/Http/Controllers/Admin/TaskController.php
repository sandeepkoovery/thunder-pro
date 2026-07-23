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
        $tasks = Task::with(['project', 'assignees'])
            ->orderByRaw("FIELD(priority, 'high', 'medium', 'low')")
            ->latest()
            ->paginate(10);
        $projects = Project::all();
        $users = User::where('is_active', true)->get();

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
        $projects = Project::all();
        $users = User::where('is_active', true)->get();

        return Inertia::render('Admin/Tasks/Create', [
            'projects' => $projects,
            'users' => $users,
        ]);
    }

    // In TaskController.php

    // ... (Other methods)

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
            'status' => 'required|string|in:not started,in progress,on hold,completed', // Use the values from your JS: not started, in progress, on hold, completed
            'priority' => 'required|string|in:low,medium,high',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
        ]);

        // Create the task with current authenticated user as owner
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
        $taskData['user_id'] = auth()->id();

        $task = Task::create($taskData);

        // Detach and sync assignees
        if (!empty($validated['assignee_ids'])) {
            $task->assignees()->sync($validated['assignee_ids']);
        }

        if ($request->header('referer') && str_contains($request->header('referer'), '/calendar')) {
            return redirect()->route('calendar.index')->with('success', 'Task created successfully.');
        }

        return redirect()->route('admin.projects.show', $validated['project_id'])
            ->with('success', 'Task created successfully.');

        // Alternatively, use Inertia::render if the original page is the Project Show page:
        // return Inertia::render('Admin/Projects/Show', [ 
        //     'tasks' => $updatedTasks,
        // ])->with('success', 'Task created successfully.');
    }

    // ... (Other methods)

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
            'status' => 'required|string|in:not started,in progress,on hold,completed', // Use the values from your JS
            'priority' => 'required|string|in:low,medium,high',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'exists:users,id',
        ]);

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

        // Update pivot assignees
        // sync() handles adding/removing/updating the user IDs in the pivot table
        $task->assignees()->sync($validated['assignee_ids'] ?? []);

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
        $task->load(['project', 'assignees']);
        $projects = Project::all();
        $users = User::where('is_active', true)->get();

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

        // Authorization check (already inside admin middleware group, but good to be explicit)
        if (!in_array(auth()->user()->role, ['admin', 'manager', 'editor'])) {
            abort(403, 'Unauthorized.');
        }

        $comment->delete();

        return back()->with('success', 'Comment deleted successfully');
    }
}
