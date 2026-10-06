<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'manager') {
            return redirect()->route('admin.projects.index');
        }

        // Get the tenant's admin_id — show all projects belonging to the same company
        $tenantAdminId = $user->admin_id;

        $query = Project::with([
            'tasks' => function ($query) use ($user) {
                // Eager-load only tasks assigned to this user for task count display
                $query->whereHas('assignees', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })->with('assignees');
            }
        ])->latest();

        if ($tenantAdminId) {
            // Show all projects from the user's company
            $query->where('admin_id', $tenantAdminId);
        } else {
            // Fallback: only show projects where the user has assigned tasks
            $query->whereHas('tasks', function ($q) use ($user) {
                $q->whereHas('assignees', function ($q2) use ($user) {
                    $q2->where('user_id', $user->id);
                });
            });
        }

        $projects = $query->get()->map(function ($project) {
            $totalTasks = $project->tasks->count();
            $completedTasks = $project->tasks->where('status', 'completed')->count();
            $totalComments = $project->tasks->sum(function ($t) { return $t->comments ? $t->comments->count() : 0; });

            $project->tasks_count = $totalTasks;
            $project->comments_count = $totalComments;
            $project->progress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;
            $project->image_url = $project->image ? asset('storage/' . $project->image) : null;

            $assignees = $project->tasks->pluck('assignees')->flatten()->unique('id')->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'image' => $user->image_url,
                ];
            })->values();
            $project->team = $assignees;

            return $project;
        });

        return Inertia::render('User/Projects/Index', [
            'projects' => $projects,
        ]);
    }
}