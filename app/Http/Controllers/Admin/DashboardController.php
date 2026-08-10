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

        $tenantAdminId = $user->role === 'admin' ? $user->id : ($user->admin_id ?? $user->id);
        $tenantUserIds = User::where('admin_id', $tenantAdminId)->pluck('id')->toArray();
        $tenantUserIds[] = $tenantAdminId;

        $taskQuery = Task::whereHas('project', function($q) use ($isSuperAdmin, $tenantAdminId) {
            if (!$isSuperAdmin) {
                $q->where('admin_id', $tenantAdminId);
            }
        });

        if ($userId) {
            $taskQuery->whereHas('users', fn($q) => $q->where('users.id', $userId));
        }

        $stats = [
            'total_users' => !$isSuperAdmin && $isAdminOrSuperAdmin 
                ? User::where('admin_id', $tenantAdminId)->whereIn('role', ['user', 'manager', 'editor'])->where('is_active', true)->count() 
                : 0,
            'pending_leaves' => !$isSuperAdmin && $isAdminOrSuperAdmin 
                ? Leave::whereIn('user_id', $tenantUserIds)->where('status', 'pending')->count() 
                : 0,
            'total_projects' => !$isSuperAdmin ? Project::where('admin_id', $tenantAdminId)->count() : 0,
            'total_tasks' => (clone $taskQuery)->count(),
            'pending_tasks' => (clone $taskQuery)->where('status', 'pending')->count(),
            'in_progress_tasks' => (clone $taskQuery)->where('status', 'in progress')->count(),
            'completed_tasks' => (clone $taskQuery)->where('status', 'completed')->count(),
            'total_admins' => $isSuperAdmin ? \App\Models\Admin::where('role', 'admin')->count() : 0,
        ];

        $startDate = Carbon::create($year, $month, 1)->subMonth()->day(25)->toDateString();
        $endDate = Carbon::create($year, $month, 1)->day(24)->toDateString();

        // Fetch users for filtering and widgets (scoped to tenant)
        $usersQuery = User::whereIn('role', ['user', 'manager', 'editor'])->where('is_active', true);
        if (!$isSuperAdmin) {
            $usersQuery->where('admin_id', $tenantAdminId);
        }
        $users = $usersQuery->orderBy('name')->get(['id', 'name', 'role', 'designation', 'image', 'thumb']);

        $todayAttendance = Attendance::where('user_id', auth()->id())
            ->whereDate('date', Carbon::today()->toDateString())
            ->first();

        // personal tasks/stats for admins/editors/managers (since they are also users)
        $personalStats = [
            'total_tasks' => (clone $taskQuery)->count(),
            'pending_tasks' => (clone $taskQuery)->where('status', 'pending')->count(),
            'in_progress_tasks' => (clone $taskQuery)->where('status', 'in progress')->count(),
            'completed_tasks' => (clone $taskQuery)->where('status', 'completed')->count(),
        ];

        $recentTasks = (clone $taskQuery)
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
