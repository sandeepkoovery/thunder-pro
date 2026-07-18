<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Leave;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class LeaveController extends Controller
{
	// Inertia page for listing leaves
	// Inertia page for listing leaves
	public function index(Request $request)
	{
		$userId = Auth::id();
		$year = $request->input('year', Carbon::now()->year);
		$month = $request->input('month');

		$query = Leave::where('user_id', $userId)
			->orderBy('from_date', 'desc');

		if ($year && !$month) {
			$query->whereYear('from_date', $year);
		}

		if ($month) {
			$filterYear = $year ?: Carbon::now()->year;
			$startDate = Carbon::create($filterYear, $month, 1)->subMonth()->day(25)->toDateString();
			$endDate = Carbon::create($filterYear, $month, 1)->day(24)->toDateString();

			$query->where(function ($q) use ($startDate, $endDate) {
				$q->whereBetween('from_date', [$startDate, $endDate])
				  ->orWhereBetween('to_date', [$startDate, $endDate])
				  ->orWhere(function ($sub) use ($startDate, $endDate) {
					  $sub->where('from_date', '<', $startDate)
						  ->where('to_date', '>', $endDate);
				  });
			});
		}

		$leaves = $query->get();

		// Stats should always be calculated for the selected year (or current year if not selected)
		// If month is selected, stats could arguably be for that month, but usually annual quotas are yearly.
		// Let's keep stats yearly for now as quotas are annual.
		$statsYear = $year ?: Carbon::now()->year;

		$stats = [
			'SL' => [
				'total' => 12,
				'taken' => Leave::where('user_id', $userId)
					->where('leave_type', 'SL')
					->where('status', 'approved')
					->whereYear('from_date', $statsYear)
					->sum('no_of_days'),
			],
			'CL' => [
				'total' => 12,
				'taken' => Leave::where('user_id', $userId)
					->where('leave_type', 'CL')
					->where('status', 'approved')
					->whereYear('from_date', $statsYear)
					->sum('no_of_days'),
			],
		];

		return inertia("User/Leaves/Index", [
			"leaves" => $leaves,
			"stats" => $stats,
			"filters" => [
				'year' => $year,
				'month' => $month
			]
		]);
	}

	// Show apply leave page (UI form)
	public function create()
	{
		return inertia("User/Leaves/Create");
	}

	// Apply for leave (form POST)
	public function store(Request $request)
	{
		$request->validate([
			'leave_type' => 'required|in:SL,CL',
			'day_type' => 'required|in:full,first_half,second_half',
			'from_date' => 'required|date',
			'to_date' => 'required|date|after_or_equal:from_date',
			'reason' => 'required|string',
		]);

		$from = Carbon::parse($request->from_date);
		$to = Carbon::parse($request->to_date);

		// calculate days
		if ($request->day_type === 'full') {
			$days = $from->diffInDays($to) + 1;
		} else {
			// Half day is always 0.5 days and must be same day
			$days = 0.5;
			$to = $from; // Force same day for half-day
		}

		Leave::create([
			'user_id' => auth()->id(),
			'leave_type' => $request->leave_type,
			'day_type' => $request->day_type,
			'from_date' => $from,
			'to_date' => $to,
			'no_of_days' => $days,
			'reason' => $request->reason,
			'status' => 'pending',
		]);

		return redirect()->back()
			->with('success', 'Leave applied successfully!');
	}

	public function destroy(Leave $leave)
	{
		// Ensure the leave belongs to the authenticated user and is pending
		if ($leave->user_id !== Auth::id()) {
			return back()->with('error', 'Unauthorized action.');
		}

		if ($leave->status !== 'pending') {
			return back()->with('error', 'Only pending leaves can be cancelled.');
		}

		$leave->delete();

		return redirect()->back()
			->with('success', 'Leave application cancelled successfully!');
	}
}
