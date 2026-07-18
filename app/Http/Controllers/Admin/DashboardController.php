<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Leave;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $month = request('month', now()->month);
        $year = request('year', now()->year);
        $isAdminOrSuperAdmin = in_array(auth()->user()->role, ['admin', 'superadmin']);
        $userId = $isAdminOrSuperAdmin ? request('user_id') : auth()->id();

        $stats = [
            'total_users' => $isAdminOrSuperAdmin ? User::where('role', 'user')->where('is_active', true)->count() : 0,
            'pending_leaves' => $isAdminOrSuperAdmin ? Leave::where('status', 'pending')->count() : 0,
            'total_projects' => Project::count(),
            'total_tasks' => Task::count(),
            'pending_tasks' => Task::where('status', 'pending')->count(),
            'in_progress_tasks' => Task::where('status', 'in progress')->count(),
            'completed_tasks' => Task::where('status', 'completed')->count(),
        ];

        $startDate = Carbon::create($year, $month, 1)->subMonth()->day(25)->toDateString();
        $endDate = Carbon::create($year, $month, 1)->day(24)->toDateString();

        // Fetch users for filtering and widgets
        $users = User::where('role', 'user')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'role', 'designation', 'image', 'thumb']);

        $todayAttendance = Attendance::where('user_id', auth()->id())
            ->whereDate('date', Carbon::today()->toDateString())
            ->first();

        // personal tasks/stats for admins/editors/managers (since they are also users)
        $user = auth()->user();
        $personalStats = [
            'total_tasks' => $user->tasks()->count(),
            'pending_tasks' => $user->tasks()->where('status', 'pending')->count(),
            'in_progress_tasks' => $user->tasks()->where('status', 'in progress')->count(),
            'completed_tasks' => $user->tasks()->where('status', 'completed')->count(),
        ];

        $recentTasks = $user->tasks()
            ->with('project')
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'users' => $users,
            'todayAttendance' => $todayAttendance,
            'personalStats' => $personalStats,
            'recentTasks' => $recentTasks,
            'filters' => [
                'month' => (int) $month,
                'year' => (int) $year,
                'user_id' => $userId ? (int) $userId : null,
            ],
        ]);
    }
}
