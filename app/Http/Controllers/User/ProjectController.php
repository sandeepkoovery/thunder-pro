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

        // 💡 FIX 1: Use whereHas to filter projects based on tasks assigned to the user
        $projects = Project::whereHas('tasks', function ($query) use ($user) {
            // Check if the task has an assignee entry in the pivot table for the current user
            $query->whereHas('assignees', function ($q) use ($user) {
                // The assignees relationship filters the related 'users' (assignees)
                $q->where('user_id', $user->id);
            });
        })
            // 💡 FIX 2: Eager load only the tasks assigned to the current user (optional, but good practice)
            ->with([
                'tasks' => function ($query) use ($user) {
                    // Use whereHas again to only load tasks that are assigned to this user
                    $query->whereHas('assignees', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });
                    // You may also want to load the task's assignees here if needed for the view
                    $query->with('assignees');
                }
            ])
            ->latest()
            ->get();

        return Inertia::render('User/Projects/Index', [
            'projects' => $projects,
        ]);
    }
}