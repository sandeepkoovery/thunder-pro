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
            if (auth()->check() && auth()->user()->role !== 'admin') {
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

        $query = Leave::with('user')->orderBy('from_date', 'desc');

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

        $leaves = $query->paginate(10)->withQueryString();

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

        $users = \App\Models\User::where('role', '!=', 'admin')->where('is_active', true)->orderBy('name')->get(['id', 'name']);

        // Calculate aggregate or user-specific stats
        $stats = [
            'SL' => [
                'taken' => Leave::query()
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
                'taken' => Leave::query()
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
            'pending' => Leave::query()
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

        return Inertia::render('Admin/Leaves/Index', [
            'leaves' => $leaves,
            'users' => $users,
            'stats' => $stats,
            'filters' => [
                'year' => $year,
                'month' => $month,
                'user_id' => $userId,
            ]
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
