<?php

use Illuminate\Support\Facades\Route;
use App\Models\Project;
use App\Models\Task;

Route::get('/debug-delete', function () {
    // 1. Create Project
    $project = Project::create([
        'name' => 'Debug Project ' . time(),
        'status' => 'not started',
        'start_date' => now(),
        'end_date' => now()->addDays(7),
    ]);

    $projectId = $project->id;
    echo "Created Project ID: $projectId<br>";

    // 2. Create Task
    $task = Task::create([
        'name' => 'Debug Task',
        'project_id' => $projectId,
        'status' => 'not started',
        'priority' => 'medium',
    ]);

    $taskId = $task->id;
    echo "Created Task ID: $taskId<br>";

    // 3. Delete Task (Simulate Controller logic)
    $task = Task::find($taskId);
    if ($task) {
        $task->assignees()->detach();
        $task->delete();
        echo "Deleted Task ID: $taskId<br>";
    } else {
        echo "Task not found!<br>";
    }

    // 4. Check Project
    $projectCheck = Project::find($projectId);
    if ($projectCheck) {
        echo "SUCCESS: Project ID $projectId still exists.<br>";
    } else {
        echo "FAILURE: Project ID $projectId was DELETED.<br>";

        // Check if soft deleted
        $projectSoft = Project::withTrashed()->find($projectId);
        if ($projectSoft) {
            echo "Project was SOFT DELETED.<br>";
        }
    }
});
