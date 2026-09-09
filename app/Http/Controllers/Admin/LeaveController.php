<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Leave;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeaveController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (auth()->check() && !in_array(auth()->user()->role, ['superadmin', 'admin', 'manager', 'editor'])) {
                abort(403, 'Unauthorized action.');
            }
            return $next($request);
        });
    }

    // Get all leave requests
    public function index(Request $request)
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month');
        $userId = $request->input('user_id');
        $statusFilter = $request->input('status', ''); // '', 'pending', 'approved', 'rejected'

        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        // Get all user IDs belonging to this tenant (used as a fallback for leaves with NULL admin_id)
        $tenantUserIds = \App\Models\User::where('admin_id', $tenantAdminId)->pluck('id')->toArray();

        // Auto-heal: backfill admin_id for any leaves from tenant users that are missing it
        if (!$isSuperAdmin && !empty($tenantUserIds)) {
            Leave::whereIn('user_id', $tenantUserIds)
                ->whereNull('admin_id')
                ->update(['admin_id' => $tenantAdminId]);
        }

        $query = Leave::with('user')->orderBy('from_date', 'desc');

        // Scope by tenant: match admin_id OR (admin_id is null AND user_id is in tenant)
        // This ensures leaves with a missing admin_id are still visible after the heal above
        if (!$isSuperAdmin) {
            $query->where(function ($q) use ($tenantAdminId, $tenantUserIds) {
                $q->where('admin_id', $tenantAdminId)
                  ->orWhere(function ($sub) use ($tenantAdminId, $tenantUserIds) {
                      $sub->whereNull('admin_id')
                          ->whereIn('user_id', $tenantUserIds);
                  });
            });
        }

        if ($year && !$month) {
            $query->whereYear('from_date', $year);
        }

        if ($month) {
            $filterYear = $year ?: now()->year;
            $startDate = \Carbon\Carbon::create($filterYear, $month, 1)->subMonth()->day(25)->toDateString();
            $endDate = \Carbon\Carbon::create($filterYear, $month, 1)->day(24)->toDateString();

            $query->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('from_date', [$startDate, $endDate])
                  ->orWhereBetween('to_date', [$startDate, $endDate])
                  ->orWhere(function ($sub) use ($startDate, $endDate) {
                      $sub->where('from_date', '<', $startDate)
                          ->where('to_date', '>', $endDate);
                  });
            });
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }

        $leaves = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        // Stats should be calculated for the selected year (or current year if not selected)
        $statsYear = $year ?: now()->year;

        $leaves->getCollection()->transform(function ($leave) use ($statsYear) {
            if ($leave->user) {
                $uid = $leave->user_id;
                $leave->user->leave_stats = [
                    'SL_taken' => Leave::where('user_id', $uid)
                        ->where('leave_type', 'SL')
                        ->where('status', 'approved')
                        ->whereYear('from_date', $statsYear)
                        ->sum('no_of_days'),
                    'CL_taken' => Leave::where('user_id', $uid)
                        ->where('leave_type', 'CL')
                        ->where('status', 'approved')
                        ->whereYear('from_date', $statsYear)
                        ->sum('no_of_days'),
                ];
            }
            return $leave;
        });

        $usersQuery = \App\Models\User::whereIn('role', ['user', 'manager', 'editor'])->where('is_active', true);
        if (!$isSuperAdmin) {
            $usersQuery->where('admin_id', $tenantAdminId);
        }
        $users = $usersQuery->orderBy('name')->get(['id', 'name']);

        // Helper closure: tenant scope for stats (admin_id match OR user_id membership fallback)
        $applyTenantScope = function ($q) use ($isSuperAdmin, $tenantAdminId, $tenantUserIds) {
            if (!$isSuperAdmin) {
                $q->where(function ($inner) use ($tenantAdminId, $tenantUserIds) {
                    $inner->where('admin_id', $tenantAdminId)
                          ->orWhere(function ($sub) use ($tenantAdminId, $tenantUserIds) {
                              $sub->whereNull('admin_id')
                                  ->whereIn('user_id', $tenantUserIds);
                          });
                });
            }
            return $q;
        };

        // Calculate aggregate or user-specific stats (using dual-scope closure)
        $stats = [
            'SL' => [
                'taken' => $applyTenantScope(Leave::query())
                    ->when($year && !$month, fn($q) => $q->whereYear('from_date', $year))
                    ->when($month, function($q) use ($year, $month) {
                        $filterYear = $year ?: now()->year;
                        $startDate = \Carbon\Carbon::create($filterYear, $month, 1)->subMonth()->day(25)->toDateString();
                        $endDate = \Carbon\Carbon::create($filterYear, $month, 1)->day(24)->toDateString();
                        $q->where(function ($sub) use ($startDate, $endDate) {
                            $sub->whereBetween('from_date', [$startDate, $endDate])
                                ->orWhereBetween('to_date', [$startDate, $endDate])
                                ->orWhere(function ($inner) use ($startDate, $endDate) {
                                    $inner->where('from_date', '<', $startDate)
                                          ->where('to_date', '>', $endDate);
                                });
                        });
                    })
                    ->when($userId, fn($q) => $q->where('user_id', $userId))
                    ->where('leave_type', 'SL')
                    ->where('status', 'approved')
                    ->sum('no_of_days'),
                'total' => $userId ? 12 : null,
            ],
            'CL' => [
                'taken' => $applyTenantScope(Leave::query())
                    ->when($year && !$month, fn($q) => $q->whereYear('from_date', $year))
                    ->when($month, function($q) use ($year, $month) {
                        $filterYear = $year ?: now()->year;
                        $startDate = \Carbon\Carbon::create($filterYear, $month, 1)->subMonth()->day(25)->toDateString();
                        $endDate = \Carbon\Carbon::create($filterYear, $month, 1)->day(24)->toDateString();
                        $q->where(function ($sub) use ($startDate, $endDate) {
                            $sub->whereBetween('from_date', [$startDate, $endDate])
                                ->orWhereBetween('to_date', [$startDate, $endDate])
                                ->orWhere(function ($inner) use ($startDate, $endDate) {
                                    $inner->where('from_date', '<', $startDate)
                                          ->where('to_date', '>', $endDate);
                                });
                        });
                    })
                    ->when($userId, fn($q) => $q->where('user_id', $userId))
                    ->where('leave_type', 'CL')
                    ->where('status', 'approved')
                    ->sum('no_of_days'),
                'total' => $userId ? 12 : null,
            ],
            'pending' => $applyTenantScope(Leave::query())
                ->when($year && !$month, fn($q) => $q->whereYear('from_date', $year))
                ->when($month, function($q) use ($year, $month) {
                    $filterYear = $year ?: now()->year;
                    $startDate = \Carbon\Carbon::create($filterYear, $month, 1)->subMonth()->day(25)->toDateString();
                    $endDate = \Carbon\Carbon::create($filterYear, $month, 1)->day(24)->toDateString();
                    $q->where(function ($sub) use ($startDate, $endDate) {
                        $sub->whereBetween('from_date', [$startDate, $endDate])
                            ->orWhereBetween('to_date', [$startDate, $endDate])
                            ->orWhere(function ($inner) use ($startDate, $endDate) {
                                $inner->where('from_date', '<', $startDate)
                                      ->where('to_date', '>', $endDate);
                            });
                    });
                })
                ->when($userId, fn($q) => $q->where('user_id', $userId))
                ->where('status', 'pending')
                ->count(),
        ];

        // Tab counts — scoped to tenant + date + user filters (no status filter)
        $baseCount = function (string $s = '') use ($applyTenantScope, $year, $month, $userId) {
            $q = $applyTenantScope(Leave::query())
                ->when($year && !$month, fn($q) => $q->whereYear('from_date', $year))
                ->when($month, function ($q) use ($year, $month) {
                    $filterYear = $year ?: now()->year;
                    $startDate = \Carbon\Carbon::create($filterYear, $month, 1)->subMonth()->day(25)->toDateString();
                    $endDate   = \Carbon\Carbon::create($filterYear, $month, 1)->day(24)->toDateString();
                    $q->where(function ($sub) use ($startDate, $endDate) {
                        $sub->whereBetween('from_date', [$startDate, $endDate])
                            ->orWhereBetween('to_date', [$startDate, $endDate])
                            ->orWhere(function ($inner) use ($startDate, $endDate) {
                                $inner->where('from_date', '<', $startDate)->where('to_date', '>', $endDate);
                            });
                    });
                })
                ->when($userId, fn($q) => $q->where('user_id', $userId));
            if ($s) $q->where('status', $s);
            return $q->count();
        };

        $tabCounts = [
            'all'      => $baseCount(),
            'pending'  => $baseCount('pending'),
            'approved' => $baseCount('approved'),
            'rejected' => $baseCount('rejected'),
        ];

        return Inertia::render('Admin/Leaves/Index', [
            'leaves'     => $leaves,
            'users'      => $users,
            'stats'      => $stats,
            'tab_counts' => $tabCounts,
            'filters'    => [
                'year'    => $year,
                'month'   => $month,
                'user_id' => $userId,
                'status'  => $statusFilter,
            ],
        ]);
    }

    // Approve leave
    public function approve($id)
    {
        $leave = Leave::findOrFail($id);
        $leave->status = 'approved';
        $leave->save();

        return back()->with('success', 'Leave approved successfully');
    }

    public function reject($id)
    {
        $leave = Leave::findOrFail($id);
        $leave->status = 'rejected';
        $leave->save();

        return back()->with('success', 'Leave rejected successfully');
    }

    public function destroy($id)
    {
        $leave = Leave::findOrFail($id);
        $leave->delete();

        return back()->with('success', 'Leave record deleted successfully');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'leave_type' => 'required|in:SL,CL',
            'day_type' => 'required|in:full,first_half,second_half',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'reason' => 'required|string',
            'status' => 'required|in:pending,approved,rejected',
        ]);

        $leave = Leave::findOrFail($id);

        $from = \Carbon\Carbon::parse($request->from_date);
        $to = \Carbon\Carbon::parse($request->to_date);

        // calculate days
        if ($request->day_type === 'full') {
            $days = $from->diffInDays($to) + 1;
        } else {
            // Half day is always 0.5 days and must be same day
            $days = 0.5;
            $to = $from;
        }

        $leave->update([
            'leave_type' => $request->leave_type,
            'day_type' => $request->day_type,
            'from_date' => $from,
            'to_date' => $to,
            'no_of_days' => $days,
            'reason' => $request->reason,
            'status' => $request->status,
        ]);

        return back()->with('success', 'Leave record updated successfully');
    }
}
