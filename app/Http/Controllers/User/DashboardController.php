<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Leave;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $today = Carbon::today();

        // Tasks query excluding those attached to soft-deleted projects
        $tasksQuery = $user->tasks()->whereHas('project');

        $stats = [
            'total_tasks' => (clone $tasksQuery)->count(),
            'pending_tasks' => (clone $tasksQuery)->where('status', 'pending')->count(),
            'in_progress_tasks' => (clone $tasksQuery)->where('status', 'in progress')->count(),
            'completed_tasks' => (clone $tasksQuery)->where('status', 'completed')->count(),
            'approved_leaves' => $user->leaves()->where('status', 'approved')->count(),
            'pending_leaves' => $user->leaves()->where('status', 'pending')->count(),
        ];

        $todayAttendance = Attendance::where('user_id', $user->id)
            ->whereDate('date', $today->toDateString())
            ->first();

        $recentTasks = (clone $tasksQuery)
            ->with('project')
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'todayAttendance' => $todayAttendance,
            'recentTasks' => $recentTasks,
        ]);
    }
}
