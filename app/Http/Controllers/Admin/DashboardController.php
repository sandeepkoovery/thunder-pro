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
        $user = auth()->user();
        $isSuperAdmin = $user->role === 'superadmin';
        $isAdminOrSuperAdmin = in_array($user->role, ['admin', 'superadmin']);
        $userId = $isAdminOrSuperAdmin ? request('user_id') : auth()->id();

        $stats = [
            'total_users' => !$isSuperAdmin && $isAdminOrSuperAdmin ? User::where('role', 'user')->where('is_active', true)->count() : 0,
            'pending_leaves' => !$isSuperAdmin && $isAdminOrSuperAdmin ? Leave::where('status', 'pending')->count() : 0,
            'total_projects' => !$isSuperAdmin ? Project::count() : 0,
            'total_tasks' => !$isSuperAdmin ? Task::count() : 0,
            'pending_tasks' => !$isSuperAdmin ? Task::where('status', 'pending')->count() : 0,
            'in_progress_tasks' => !$isSuperAdmin ? Task::where('status', 'in progress')->count() : 0,
            'completed_tasks' => !$isSuperAdmin ? Task::where('status', 'completed')->count() : 0,
            'total_admins' => $isSuperAdmin ? User::where('role', 'admin')->count() : 0,
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
