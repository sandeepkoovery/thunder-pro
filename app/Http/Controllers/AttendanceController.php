<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Leave;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function status()
    {
        $today = Carbon::today();
        $user_id = Auth::id();

        $attendances = Attendance::where('user_id', $user_id)
            ->where('date', $today)
            ->with('breaks')
            ->get();

        $latestAttendance = $attendances->last();
        if ($latestAttendance && $latestAttendance->status === 'on_break') {
            $activeBreak = $latestAttendance->breaks->whereNull('end_time')->last();
            if ($activeBreak && !$latestAttendance->break_start) {
                $latestAttendance->break_start = $activeBreak->start_time;
            }
        }
        $totalMinutesToday = $attendances->sum('total_worked_minutes');

        return response()->json([
            'status' => $latestAttendance ? $latestAttendance->status : 'not_started',
            'attendance' => $latestAttendance,
            'total_worked_minutes_today' => $totalMinutesToday,
            'now' => Carbon::now(),
        ]);
    }

    public function punchIn(Request $request)
    {
        $today = Carbon::today();
        $userId = Auth::id();

        // Diagnostics Logging
        \Illuminate\Support\Facades\Log::info("Punch In Attempt", [
            'user_id' => $userId,
            'ip' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'lat' => $request->latitude,
            'lng' => $request->longitude,
            'accuracy' => $request->accuracy ?? 'not provided',
            'client_timestamp' => $request->timestamp ?? 'not provided'
        ]);

        // Enforce Location
        if (!$request->latitude || !$request->longitude) {
            \Illuminate\Support\Facades\Log::warning("Punch In Failed: Missing Location", ['user_id' => $userId]);
            return back()->with('error', 'Location is mandatory to punch in. Please allow location access.');
        }

        // Check if attendance already exists for today
        $attendance = Attendance::where('user_id', $userId)
            ->where('date', $today)
            ->first();

        if ($attendance) {
            if ($attendance->status === 'punched_out') {
                return back()->with('error', 'You have already completed your work for today.');
            }
            // If already punched in or on break, just return (idempotent)
            return back();
        }

        // Detect Device Type
        $userAgent = $request->header('User-Agent');
        $deviceType = 'Desktop';
        if (preg_match('/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/', $userAgent)) {
            $deviceType = 'Mobile';
        }

        // Restrict if user is set to Desktop Only
        if (Auth::user()->desktop_only && $deviceType === 'Mobile') {
            return back()->with('error', 'You are restricted to punch in from Desktop only.');
        }

        // Create new attendance
        Attendance::create([
            'user_id' => $userId,
            'date' => $today,
            'punch_in' => Carbon::now(),
            'punch_in_lat' => $request->latitude,
            'punch_in_lng' => $request->longitude,
            'status' => 'punched_in',
            'device_type' => $deviceType,
        ]);

        return back();
    }

    public function punchOut(Request $request)
    {
        $userId = Auth::id();

        // Diagnostics Logging
        \Illuminate\Support\Facades\Log::info("Punch Out Attempt", [
            'user_id' => $userId,
            'ip' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'lat' => $request->latitude,
            'lng' => $request->longitude,
            'accuracy' => $request->accuracy ?? 'not provided'
        ]);

        // Find the latest active session
        $attendance = Attendance::where('user_id', $userId)
            ->where('date', Carbon::today())
            ->where('status', '!=', 'punched_out')
            ->latest()
            ->first();

        if ($attendance && $attendance->punch_in) {
            $now = Carbon::now();
            $punchIn = Carbon::parse($attendance->punch_in);

            // Prevent punch out if punch_in was less than 5 minutes ago
            if (abs($now->diffInSeconds($punchIn)) < 295) {
                return back()->with('error', 'You must work at least 5 minutes before punching out.');
            }

            // Detect Device Type
            $userAgent = $request->header('User-Agent');
            $deviceType = 'Desktop';
            if (preg_match('/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/', $userAgent)) {
                $deviceType = 'Mobile';
            }

            // Restrict if user is set to Desktop Only
            if (Auth::user()->desktop_only && $deviceType === 'Mobile') {
                return back()->with('error', 'You are restricted to punch out from Desktop only.');
            }

            $now = Carbon::now();
            $punchIn = Carbon::parse($attendance->punch_in);

            // Auto-close any active break
            $activeBreak = \App\Models\AttendanceBreak::where('attendance_id', $attendance->id)
                ->whereNull('end_time')
                ->latest()
                ->first();

            if ($activeBreak) {
                $breakStart = Carbon::parse($activeBreak->start_time);
                $breakDuration = $breakStart->diffInMinutes($now);
                $activeBreak->update([
                    'end_time' => $now,
                    'total_minutes' => $breakDuration,
                ]);

                // Update total break minutes on parent
                $attendance->total_break_minutes = \App\Models\AttendanceBreak::where('attendance_id', $attendance->id)
                    ->sum('total_minutes');
            }

            // Subtract break time from this session's duration
            $totalBreakMinutes = $attendance->total_break_minutes ?? 0;
            $duration = $punchIn->diffInMinutes($now) - $totalBreakMinutes;

            $attendance->update([
                'punch_out' => $now,
                'punch_out_lat' => $request->latitude,
                'punch_out_lng' => $request->longitude,
                'total_worked_minutes' => max(0, $duration), // Ensure non-negative
                'status' => 'punched_out',
            ]);
        }

        return back();
    }

    public function startBreak()
    {
        $attendance = Attendance::where('user_id', Auth::id())
            ->where('date', Carbon::today())
            ->where('status', 'punched_in')
            ->latest()
            ->first();

        if ($attendance) {
            $punchIn = Carbon::parse($attendance->punch_in);
            if (abs(Carbon::now()->diffInSeconds($punchIn)) < 295) {
                return back()->with('error', 'You must work at least 5 minutes before taking a break.');
            }

            $now = Carbon::now();
            // Create a new break record
            \App\Models\AttendanceBreak::create([
                'attendance_id' => $attendance->id,
                'start_time' => $now,
            ]);

            $attendance->update([
                'status' => 'on_break',
                'break_start' => $now,
            ]);
        }

        return back();
    }

    public function endBreak()
    {
        $attendance = Attendance::where('user_id', Auth::id())
            ->where('date', Carbon::today())
            ->where('status', 'on_break')
            ->latest()
            ->first();

        if ($attendance) {
            // Find the active break
            $activeBreak = \App\Models\AttendanceBreak::where('attendance_id', $attendance->id)
                ->whereNull('end_time')
                ->latest()
                ->first();

            if ($activeBreak) {
                $now = Carbon::now();
                $breakStart = Carbon::parse($activeBreak->start_time);
                $duration = $breakStart->diffInMinutes($now);

                $activeBreak->update([
                    'end_time' => $now,
                    'total_minutes' => $duration,
                ]);

                // Update total break minutes on the parent attendance
                $totalBreak = \App\Models\AttendanceBreak::where('attendance_id', $attendance->id)
                    ->sum('total_minutes');

                $attendance->update([
                    'total_break_minutes' => $totalBreak,
                    'status' => 'punched_in',
                    // 'break_start' is no longer really needed on the parent, but we can keep it null for compatibility if needed
                    // or just ignore it. The original code set it to null.
                    'break_start' => null,
                ]);
            } else {
                // Fallback if no break record found but status is on_break (legacy/error state)
                $attendance->update(['status' => 'punched_in']);
            }
        }

        return back();
    }

    public function index(Request $request)
    {
        $users = \App\Models\User::whereNotIn('role', ['admin', 'manager'])->where('is_active', true)->orderBy('name')->get();
        $filters = $request->only(['date', 'month', 'user_id', 'display']);

        // Mode 1: Monthly View (Month selected OR Calendar Display forced)
        // Changed: Now daily view with today's date is the default
        if ($request->filled('month') || $request->input('display') === 'calendar') {
            $monthStr = $request->input('month', Carbon::now()->format('Y-m'));
            $month = Carbon::parse($monthStr);

            // Default to first user if not selected
            $userId = $request->user_id;
            if (!$userId && $users->isNotEmpty()) {
                $userId = $users->first()->id;
                // Update filters to reflect the auto-selected user
                $filters['user_id'] = $userId;
            }

            if (!isset($filters['month'])) {
                $filters['month'] = $monthStr;
            }

            if ($userId) {
                // Generate all dates for the month (25th of previous month to 24th of current month)
                $startDate = $month->copy()->subMonth()->day(25);
                $realEndDate = $month->copy()->day(24);

                // Get all attendance records for the month range
                $attendances = Attendance::where('user_id', $userId)
                    ->whereBetween('date', [$startDate->toDateString(), $realEndDate->toDateString()])
                    ->with('breaks')
                    ->get()
                    ->keyBy(function ($item) {
                        return $item->date instanceof \Carbon\Carbon ? $item->date->format('Y-m-d') : $item->date;
                    });

                // Get approved leaves for the month range
                $leaves = Leave::where('user_id', $userId)
                    ->where('status', 'approved')
                    ->where(function ($query) use ($startDate, $realEndDate) {
                        $startStr = $startDate->toDateString();
                        $endStr = $realEndDate->toDateString();

                        $query->whereBetween('from_date', [$startStr, $endStr])
                            ->orWhereBetween('to_date', [$startStr, $endStr])
                            ->orWhere(function ($q) use ($startStr, $endStr) {
                                $q->where('from_date', '<', $startStr)
                                    ->where('to_date', '>', $endStr);
                            });
                    })
                    ->get();

                $totalMonthlyMinutes = $attendances->sum('total_worked_minutes');

                $today = Carbon::today();

                // Don't show future days beyond today
                $endDate = $realEndDate->gt($today) ? $today : $realEndDate;

                $attendanceData = [];

                for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
                    $dateStr = $date->toDateString();
                    $attendance = $attendances->get($dateStr);

                    $status = '-';
                    $checkIn = '-';
                    $checkOut = '-';
                    $hours = '-';
                    $breakTime = '-';
                    $attendanceId = null;
                    $punchInRaw = null;
                    $punchOutRaw = null;
                    $punchInLat = null;
                    $punchInLng = null;
                    $punchOutLat = null;
                    $punchOutLng = null;
                    $deviceType = null;
                    $currentStatus = '-';
                    $dbStatus = null;
                    $breaks = [];

                    if ($attendance) {
                        $attendanceId = $attendance->id;
                        $punchInRaw = $attendance->punch_in;
                        $punchOutRaw = $attendance->punch_out;
                        $punchInLat = $attendance->punch_in_lat;
                        $punchInLng = $attendance->punch_in_lng;
                        $punchOutLat = $attendance->punch_out_lat;
                        $punchOutLng = $attendance->punch_out_lng;
                        $deviceType = $attendance->device_type;
                        $dbStatus = $attendance->status;
                        $breaks = $attendance->breaks;

                        // Calculate Current Status
                        $currentStatus = '-';
                        if ($attendance->date instanceof \Carbon\Carbon ? $attendance->date->isToday() : $attendance->date === Carbon::today()->toDateString()) {
                            if ($dbStatus === 'punched_in')
                                $currentStatus = 'Working';
                            elseif ($dbStatus === 'on_break')
                                $currentStatus = 'Break';
                            elseif ($dbStatus === 'punched_out')
                                $currentStatus = 'Punched Out';
                        } else {
                            $currentStatus = $attendance->punch_out ? 'Punched Out' : '-';
                        }

                        // Calculate real-time break minutes including ongoing breaks
                        $totalBreakMinutes = $attendance->total_break_minutes ?? 0;
                        $activeBreak = $breaks->whereNull('end_time')->first();
                        if ($activeBreak) {
                            $totalBreakMinutes += Carbon::parse($activeBreak->start_time)->diffInMinutes(Carbon::now());
                        }

                        $checkInTime = Carbon::parse($attendance->punch_in)->timezone('Asia/Kolkata');
                        $dateString = $attendance->date instanceof \Carbon\Carbon ? $attendance->date->format('Y-m-d') : $attendance->date;
                        $nineThirtyAM = Carbon::parse($dateString . ' 09:30:59', 'Asia/Kolkata');
                        $sixPM = Carbon::parse($dateString . ' 18:00:00', 'Asia/Kolkata');

                        $isLate = $checkInTime->gt($nineThirtyAM);
                        $isEarlyLeave = $attendance->punch_out && Carbon::parse($attendance->punch_out)->timezone('Asia/Kolkata')->lt($sixPM);

                        $status = 'Present';
                        if ($isLate && $isEarlyLeave) {
                            $status = 'Late & Early Leave';
                        } elseif ($isLate) {
                            $status = 'Late';
                        } elseif ($isEarlyLeave) {
                            $status = 'Early Leave';
                        }

                        $checkIn = $attendance->punch_in ? Carbon::parse($attendance->punch_in)->timezone('Asia/Kolkata')->format('h:i A') : '-';
                        $checkOut = $attendance->punch_out ? Carbon::parse($attendance->punch_out)->timezone('Asia/Kolkata')->format('h:i A') : '-';
                        $hours = floor($attendance->total_worked_minutes / 60) . 'h ' . ($attendance->total_worked_minutes % 60) . 'm';
                        $breakTime = floor($totalBreakMinutes / 60) . 'h ' . ($totalBreakMinutes % 60) . 'm';
                    } else {
                        // Check if it's a Saturday or Sunday
                        if ($date->isSaturday() || $date->isSunday()) {
                            $status = 'OFF';
                        } else {
                            // Check for Leaves
                            $isOnLeave = $leaves->filter(function ($leave) use ($dateStr) {
                                $from = $leave->from_date instanceof \Carbon\Carbon ? $leave->from_date->toDateString() : $leave->from_date;
                                $to = $leave->to_date instanceof \Carbon\Carbon ? $leave->to_date->toDateString() : $leave->to_date;
                                return $dateStr >= $from && $dateStr <= $to;
                            })->first();

                            if ($isOnLeave) {
                                $status = 'On Leave';
                            } elseif ($date->lt($today)) {
                                $status = 'Absent';
                            }
                        }
                    }

                    $attendanceData[] = [
                        'id' => $attendanceId ?? $dateStr,
                        'date' => $dateStr,
                        'check_in' => $checkIn,
                        'check_out' => $checkOut,
                        'status' => $status,
                        'hours' => $hours,
                        'break_time' => $breakTime,
                        'attendance_id' => $attendanceId,
                        'punch_in_raw' => $attendance && $attendance->punch_in ? Carbon::parse($attendance->punch_in, 'Asia/Kolkata')->toIso8601String() : null,
                        'punch_out_raw' => $attendance && $attendance->punch_out ? Carbon::parse($attendance->punch_out, 'Asia/Kolkata')->toIso8601String() : null,
                        'punch_in_lat' => $punchInLat,
                        'punch_in_lng' => $punchInLng,
                        'punch_out_lat' => $punchOutLat,
                        'punch_out_lng' => $punchOutLng,
                        'device_type' => $deviceType,
                        'db_status' => $dbStatus ?? null,
                        'current_status' => $currentStatus,
                        'breaks' => $breaks ?? [],
                        'total_worked_minutes' => $attendance ? $attendance->total_worked_minutes : 0,
                        'total_break_minutes' => isset($totalBreakMinutes) ? $totalBreakMinutes : 0,
                    ];
                }

                // Reverse to show most recent first (like it was before)
                $attendanceData = array_reverse($attendanceData);

                $settings = \App\Models\Setting::all()->pluck('value', 'key');

                return Inertia::render('Admin/Attendance/Index', [
                    'attendanceData' => $attendanceData,
                    'users' => $users,
                    'filters' => $filters,
                    'viewType' => 'monthly',
                    'totalMonthlyMinutes' => $totalMonthlyMinutes,
                    'selectedUser' => $users->find($userId),
                    'leaves' => $leaves,
                    'settings' => $settings,
                ]);
            }
        }

        // Mode 2: Daily View (All Users for Specific Date)
        $date = $request->input('date', Carbon::today()->toDateString());
        $userId = $request->user_id;

        $filteredUsers = $users;
        if ($userId) {
            $filteredUsers = $users->where('id', $userId);
        }

        // Fetch attendances for the selected date
        $attendances = Attendance::where('date', $date)->with('breaks')->get()->keyBy('user_id');

        // Map users to their attendance and calculate status
        $attendanceData = $filteredUsers->map(function ($user) use ($attendances, $date) {
            $attendance = $attendances->get($user->id);
            $status = 'Absent';
            $checkIn = '-';
            $checkOut = '-';
            $hours = '-';

            $dbStatus = $attendance ? $attendance->status : null;
            $breaks = $attendance ? $attendance->breaks : collect([]);

            // Calculate Current Status
            $currentStatus = '-';
            if ($attendance && $date === Carbon::today()->toDateString()) {
                if ($dbStatus === 'punched_in')
                    $currentStatus = 'Working';
                elseif ($dbStatus === 'on_break')
                    $currentStatus = 'Break';
                elseif ($dbStatus === 'punched_out')
                    $currentStatus = 'Punched Out';
            } elseif ($attendance) {
                $currentStatus = $attendance->punch_out ? 'Punched Out' : '-';
            }

            // Real-time break calculation
            $totalBreakMinutes = $attendance ? ($attendance->total_break_minutes ?? 0) : 0;
            $activeBreak = $breaks->whereNull('end_time')->first();
            if ($activeBreak) {
                $totalBreakMinutes += Carbon::parse($activeBreak->start_time)->diffInMinutes(Carbon::now());
            }

            if ($attendance) {
                $checkInTime = Carbon::parse($attendance->punch_in)->timezone('Asia/Kolkata');
                $checkIn = $checkInTime->format('h:i A');

                if ($attendance->punch_out) {
                    $checkOut = Carbon::parse($attendance->punch_out)->timezone('Asia/Kolkata')->format('h:i A');
                }

                // Calculate Status
                $dateString = $attendance->date instanceof \Carbon\Carbon ? $attendance->date->format('Y-m-d') : $attendance->date;
                $nineAM = Carbon::parse($dateString . ' 09:00:00', 'Asia/Kolkata');
                $nineThirtyAM = Carbon::parse($dateString . ' 09:30:59', 'Asia/Kolkata');
                $sixPM = Carbon::parse($dateString . ' 18:00:00', 'Asia/Kolkata');

                $isLate = $checkInTime->gt($nineThirtyAM);
                $isEarlyLeave = $attendance->punch_out && Carbon::parse($attendance->punch_out)->timezone('Asia/Kolkata')->lt($sixPM);

                $status = 'Present';
                if ($isLate && $isEarlyLeave) {
                    $status = 'Late & Early Leave';
                } elseif ($isLate) {
                    $status = 'Late';
                } elseif ($isEarlyLeave) {
                    $status = 'Early Leave';
                }

                // Calculate Hours
                $hours = floor($attendance->total_worked_minutes / 60) . 'h ' . ($attendance->total_worked_minutes % 60) . 'm';
            }

            return [
                'id' => $user->id,
                'name' => $user->name,
                'date' => $attendance ? Carbon::parse($attendance->date)->format('Y-m-d') : null,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'status' => $status,
                'hours' => $hours,
                'break_time' => floor($totalBreakMinutes / 60) . 'h ' . ($totalBreakMinutes % 60) . 'm',
                'attendance_id' => $attendance ? $attendance->id : null,
                'punch_in_raw' => $attendance && $attendance->punch_in ? Carbon::parse($attendance->punch_in, 'Asia/Kolkata')->toIso8601String() : null,
                'punch_out_raw' => $attendance && $attendance->punch_out ? Carbon::parse($attendance->punch_out, 'Asia/Kolkata')->toIso8601String() : null,
                'punch_in_lat' => $attendance ? $attendance->punch_in_lat : null,
                'punch_in_lng' => $attendance ? $attendance->punch_in_lng : null,
                'punch_out_lat' => $attendance ? $attendance->punch_out_lat : null,
                'punch_out_lng' => $attendance ? $attendance->punch_out_lng : null,
                'device_type' => $attendance ? $attendance->device_type : null,
                'db_status' => $dbStatus,
                'current_status' => $currentStatus,
                'breaks' => $breaks,
                'total_worked_minutes' => $attendance ? $attendance->total_worked_minutes : 0,
                'total_break_minutes' => $totalBreakMinutes,
            ];
        })->values();

        return Inertia::render('Admin/Attendance/Index', [
            'attendanceData' => $attendanceData,
            'users' => $users,
            'filters' => array_merge($filters, ['date' => $date]),
            'viewType' => 'daily',
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'punch_in' => 'required|date',
            'punch_out' => 'nullable|date|after_or_equal:punch_in',
        ]);

        $punchIn = Carbon::parse($request->punch_in);
        $punchOut = $request->punch_out ? Carbon::parse($request->punch_out) : null;

        // Find existing record for this user and date
        $attendance = Attendance::where('user_id', $request->user_id)
            ->where('date', $request->date)
            ->first();

        $totalBreakMinutes = $attendance ? ($attendance->total_break_minutes ?? 0) : 0;
        $totalWorkedMinutes = 0;

        if ($punchIn && $punchOut) {
            $totalWorkedMinutes = max(0, $punchIn->diffInMinutes($punchOut) - $totalBreakMinutes);
        }

        Attendance::updateOrCreate(
            ['user_id' => $request->user_id, 'date' => $request->date],
            [
                'punch_in' => $punchIn,
                'punch_out' => $punchOut,
                'total_worked_minutes' => $totalWorkedMinutes,
                'status' => $punchOut ? 'punched_out' : 'punched_in',
            ]
        );

        return back()->with('success', 'Attendance saved successfully.');
    }

    public function update(Request $request, Attendance $attendance)
    {
        $request->validate([
            'punch_in' => 'required|date',
            'punch_out' => 'nullable|date|after_or_equal:punch_in',
        ]);

        $punchIn = Carbon::parse($request->punch_in);
        $punchOut = $request->punch_out ? Carbon::parse($request->punch_out) : null;

        $totalBreakMinutes = $attendance->total_break_minutes ?? 0;
        $totalWorkedMinutes = 0;

        if ($punchIn && $punchOut) {
            $totalWorkedMinutes = max(0, $punchIn->diffInMinutes($punchOut) - $totalBreakMinutes);
        }

        $attendance->update([
            'punch_in' => $punchIn,
            'punch_out' => $punchOut,
            'total_worked_minutes' => $totalWorkedMinutes,
            'status' => $punchOut ? 'punched_out' : 'punched_in',
        ]);

        return back()->with('success', 'Attendance updated successfully.');
    }

    public function storeBreak(Request $request, Attendance $attendance)
    {
        $request->validate([
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
        ]);

        $startTime = Carbon::parse($request->start_time);
        $endTime = $request->end_time ? Carbon::parse($request->end_time) : null;

        // Validation against Punch In and Punch Out
        $punchIn = Carbon::parse($attendance->punch_in);
        $punchOut = $attendance->punch_out ? Carbon::parse($attendance->punch_out) : null;

        if ($startTime->copy()->setSeconds(0)->lt($punchIn->copy()->setSeconds(0))) {
            return back()->with('error', 'Break cannot start before punch in time (' . $punchIn->format('h:i A') . ').');
        }

        if ($endTime) {
            if ($endTime->lte($startTime)) {
                return back()->with('error', 'Break end time must be after start time.');
            }
            if ($punchOut && $endTime->gt($punchOut)) {
                return back()->with('error', 'Break cannot end after punch out time (' . $punchOut->format('h:i A') . ').');
            }
        }

        // Calculate duration
        $duration = 0;
        if ($endTime) {
            $duration = $startTime->diffInMinutes($endTime);
        }

        \App\Models\AttendanceBreak::create([
            'attendance_id' => $attendance->id,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'total_minutes' => $duration,
        ]);

        // Recalculate total break minutes
        $totalBreak = $attendance->breaks()->sum('total_minutes');

        $updateData = ['total_break_minutes' => $totalBreak];

        // Recalculate working minutes if already punched out
        if ($attendance->status === 'punched_out' && $attendance->punch_out && $attendance->punch_in) {
            $punchIn = Carbon::parse($attendance->punch_in);
            $punchOut = Carbon::parse($attendance->punch_out);
            $totalDuration = $punchIn->diffInMinutes($punchOut);
            $updateData['total_worked_minutes'] = max(0, $totalDuration - $totalBreak);
        }

        $attendance->update($updateData);

        return back()->with('success', 'Break added successfully.');
    }

    public function updateBreak(Request $request, \App\Models\AttendanceBreak $attendanceBreak)
    {
        $request->validate([
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
        ]);

        $startTime = Carbon::parse($request->start_time);
        $endTime = $request->end_time ? Carbon::parse($request->end_time) : null;

        $attendance = $attendanceBreak->attendance;
        $punchIn = Carbon::parse($attendance->punch_in);
        $punchOut = $attendance->punch_out ? Carbon::parse($attendance->punch_out) : null;

        // Validation against Punch In and Punch Out
        if ($startTime->copy()->setSeconds(0)->lt($punchIn->copy()->setSeconds(0))) {
            return back()->with('error', 'Break cannot start before punch in time (' . $punchIn->format('h:i A') . ').');
        }

        if ($endTime) {
            if ($endTime->lte($startTime)) {
                return back()->with('error', 'Break end time must be after start time.');
            }
            if ($punchOut && $endTime->gt($punchOut)) {
                return back()->with('error', 'Break cannot end after punch out time (' . $punchOut->format('h:i A') . ').');
            }
        }

        // Calculate duration
        $duration = 0;
        if ($endTime) {
            $duration = $startTime->diffInMinutes($endTime);
        }

        // Update the break record
        $attendanceBreak->update([
            'start_time' => $startTime,
            'end_time' => $endTime,
            'total_minutes' => $duration,
        ]);

        // Recalculate total break minutes for the parent attendance
        $attendance = $attendanceBreak->attendance;
        $totalBreak = $attendance->breaks()->sum('total_minutes');

        // Update the parent attendance record
        // Note: We might want to recalculate total_worked_minutes too if break times affect it,
        // but typically break times are just subtracted from total duration if the total duration is calculated from punch_in to punch_out.
        // In the existing logic (punchOut method), duration = (punchOut - punchIn) - totalBreakMinutes.
        // So updating total_break_minutes is crucial.

        $updateData = ['total_break_minutes' => $totalBreak];

        // If the attendance is already punched out, we should update the total_worked_minutes as well
        if ($attendance->status === 'punched_out' && $attendance->punch_out && $attendance->punch_in) {
            $punchIn = Carbon::parse($attendance->punch_in);
            $punchOut = Carbon::parse($attendance->punch_out);
            $totalDuration = $punchIn->diffInMinutes($punchOut);
            $workedMinutes = max(0, $totalDuration - $totalBreak);
            $updateData['total_worked_minutes'] = $workedMinutes;
        }

        $attendance->update($updateData);

        return back()->with('success', 'Break updated successfully.');
    }
    public function userIndex(Request $request)
    {
        $userId = auth()->id();
        $monthStr = $request->input('month', Carbon::now()->format('Y-m'));
        try {
            $month = Carbon::parse($monthStr);
        } catch (\Exception $e) {
            $month = Carbon::now();
        }

        // Generate all dates for the month (25th of previous month to 24th of current month)
        $startDate = $month->copy()->subMonth()->day(25);
        $realEndDate = $month->copy()->day(24);

        // Get all attendance records for the month range
        $attendances = Attendance::where('user_id', $userId)
            ->whereBetween('date', [$startDate->toDateString(), $realEndDate->toDateString()])
            ->get()
            ->keyBy(function ($item) {
                return $item->date instanceof \Carbon\Carbon ? $item->date->format('Y-m-d') : $item->date;
            });

        // Get approved leaves for the month range
        $leaves = \App\Models\Leave::where('user_id', $userId)
            ->where('status', 'approved')
            ->where(function ($query) use ($startDate, $realEndDate) {
                $startStr = $startDate->toDateString();
                $endStr = $realEndDate->toDateString();

                $query->whereBetween('from_date', [$startStr, $endStr])
                    ->orWhereBetween('to_date', [$startStr, $endStr])
                    ->orWhere(function ($q) use ($startStr, $endStr) {
                        $q->where('from_date', '<', $startStr)
                            ->where('to_date', '>', $endStr);
                    });
            })
            ->get();

        $totalMonthlyMinutes = $attendances->sum('total_worked_minutes');

        $today = Carbon::today();

        // Don't show future days beyond today
        $endDate = $realEndDate->gt($today) ? $today : $realEndDate;

        $attendanceData = [];

        for ($date = $startDate->copy(); $date <= $endDate; $date->addDay()) {
            $dateStr = $date->toDateString();
            $attendance = $attendances->get($dateStr);

            $status = '-';
            $checkIn = '-';
            $checkOut = '-';
            $hours = '-';
            $breakTime = '-';
            $attendanceId = null;

            if ($attendance) {
                $attendanceId = $attendance->id;
                $checkInTime = Carbon::parse($attendance->punch_in)->timezone('Asia/Kolkata');
                $dateString = $attendance->date instanceof \Carbon\Carbon ? $attendance->date->format('Y-m-d') : $attendance->date;
                $nineThirtyAM = Carbon::parse($dateString . ' 09:30:59', 'Asia/Kolkata');
                $sixPM = Carbon::parse($dateString . ' 18:00:00', 'Asia/Kolkata');

                $isLate = $checkInTime->gt($nineThirtyAM);
                $isEarlyLeave = $attendance->punch_out && Carbon::parse($attendance->punch_out)->timezone('Asia/Kolkata')->lt($sixPM);

                $status = 'Present';
                if ($isLate && $isEarlyLeave) {
                    $status = 'Late & Early Leave';
                } elseif ($isLate) {
                    $status = 'Late';
                } elseif ($isEarlyLeave) {
                    $status = 'Early Leave';
                }

                $checkIn = $attendance->punch_in ? Carbon::parse($attendance->punch_in)->timezone('Asia/Kolkata')->format('h:i A') : '-';
                $checkOut = $attendance->punch_out ? Carbon::parse($attendance->punch_out)->timezone('Asia/Kolkata')->format('h:i A') : '-';
                $hours = floor($attendance->total_worked_minutes / 60) . 'h ' . ($attendance->total_worked_minutes % 60) . 'm';
                $breakTime = floor(($attendance->total_break_minutes ?? 0) / 60) . 'h ' . (($attendance->total_break_minutes ?? 0) % 60) . 'm';
            } else {
                // Check if it's a Saturday or Sunday
                if ($date->isSaturday() || $date->isSunday()) {
                    $status = 'OFF';
                } else {
                    // Check for Leaves
                    $isOnLeave = $leaves->filter(function ($leave) use ($dateStr) {
                        $from = $leave->from_date instanceof \Carbon\Carbon ? $leave->from_date->toDateString() : $leave->from_date;
                        $to = $leave->to_date instanceof \Carbon\Carbon ? $leave->to_date->toDateString() : $leave->to_date;
                        return $dateStr >= $from && $dateStr <= $to;
                    })->first();

                    if ($isOnLeave) {
                        $status = 'On Leave';
                    } elseif ($date->lt($today)) {
                        $status = 'Absent';
                    }
                }
            }

            $attendanceData[] = [
                'id' => $attendanceId ?? $dateStr,
                'date' => $dateStr,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'status' => $status,
                'hours' => $hours,
                'break_time' => $breakTime,
                'attendance_id' => $attendanceId,
                'punch_in_raw' => $attendance && $attendance->punch_in ? Carbon::parse($attendance->punch_in, 'Asia/Kolkata')->toIso8601String() : null,
                'punch_out_raw' => $attendance && $attendance->punch_out ? Carbon::parse($attendance->punch_out, 'Asia/Kolkata')->toIso8601String() : null,
                'total_worked_minutes' => $attendance ? $attendance->total_worked_minutes : 0,
                'total_break_minutes' => $attendance ? ($attendance->total_break_minutes ?? 0) : 0,
            ];
        }

        return Inertia::render('User/Attendance/Index', [
            'attendanceData' => $attendanceData,
            'totalMonthlyMinutes' => $totalMonthlyMinutes,
            'filters' => [
                'month' => $monthStr,
            ],
        ]);
    }
    public function report(Request $request)
    {
        $userId = $request->input('user_id');
        $month = $request->input('month', Carbon::now()->format('Y-m'));

        $users = \App\Models\User::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        // Default to the first user if none selected
        if (!$userId && $users->isNotEmpty()) {
            $userId = $users->first()->id;
        }

        $attendances = [];
        $totalMonthlyMinutes = 0;
        $dailySummaries = [];

        if ($userId) {
            $date = Carbon::parse($month);
            $startDate = $date->copy()->subMonth()->day(25)->toDateString();
            $endDate = $date->copy()->day(24)->toDateString();

            $query = Attendance::where('user_id', $userId)
                ->whereBetween('date', [$startDate, $endDate])
                ->orderBy('date', 'desc')
                ->orderBy('punch_in', 'asc');

            $rawAttendances = $query->get();
            $totalMonthlyMinutes = $rawAttendances->sum('total_worked_minutes');

            // Group by date for the view
            foreach ($rawAttendances as $attendance) {
                // Ensure date is a string for array key
                $dateKey = $attendance->date instanceof \Carbon\Carbon ? $attendance->date->format('Y-m-d') : $attendance->date;

                if (!isset($dailySummaries[$dateKey])) {
                    $dailySummaries[$dateKey] = [
                        'date' => $dateKey,
                        'total_minutes' => 0,
                        'sessions' => []
                    ];
                }
                $dailySummaries[$dateKey]['total_minutes'] += $attendance->total_worked_minutes;
                $dailySummaries[$dateKey]['sessions'][] = $attendance;
            }

            // Convert to array and sort by date desc
            $attendances = array_values($dailySummaries);
        }

        return Inertia::render('Admin/Attendance/Report', [
            'users' => $users,
            'attendances' => $attendances,
            'totalMonthlyMinutes' => $totalMonthlyMinutes,
            'filters' => [
                'user_id' => $userId,
                'month' => $month,
            ],
        ]);
    }

    public function export(Request $request)
    {
        $monthStr = $request->input('month', Carbon::now()->format('Y-m'));
        $month = Carbon::parse($monthStr);
        $startDate = $month->copy()->subMonth()->day(25);
        $endDate = $month->copy()->day(24);
        $today = Carbon::today();

        // Don't count future days calculation
        $calculationEndDate = $endDate->gt($today) ? $today : $endDate;

        $users = \App\Models\User::whereNotIn('role', ['admin', 'manager'])->where('is_active', true)->orderBy('name')->get();

        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=attendance_export_{$monthStr}.csv",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $columns = [
            'User Name',
            'Total Present Days',
            'Total Absent Days',
            'Total Leaves',
            'Late Punchin Days',
            'Early Leave Days',
            'Total Work Hours',
            'Total Break Hours'
        ];

        $callback = function () use ($users, $startDate, $endDate, $calculationEndDate, $columns, $today) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($users as $user) {
                // Get all attendances for the month range
                $attendances = Attendance::where('user_id', $user->id)
                    ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
                    ->get()
                    ->keyBy(function ($item) {
                        return $item->date instanceof \Carbon\Carbon ? $item->date->format('Y-m-d') : $item->date;
                    });

                // Get all approved leaves for the month range
                $leaves = Leave::where('user_id', $user->id)
                    ->where('status', 'approved')
                    ->where(function ($query) use ($startDate, $endDate) {
                        $startStr = $startDate->toDateString();
                        $endStr = $endDate->toDateString();
                        $query->whereBetween('from_date', [$startStr, $endStr])
                            ->orWhereBetween('to_date', [$startStr, $endStr])
                            ->orWhere(function ($q) use ($startStr, $endStr) {
                                $q->where('from_date', '<', $startStr)
                                    ->where('to_date', '>', $endStr);
                            });
                    })
                    ->get();

                $totalPresent = 0;
                $absentDays = 0;
                $leaveDays = 0;
                $lateDays = 0;
                $earlyLeaveDays = 0;
                $totalWorkedMinutes = 0;
                $totalBreakMinutes = 0;

                // Loop through each day from start of month to calculation end date (typically today)
                for ($d = $startDate->copy(); $d <= $calculationEndDate; $d->addDay()) {
                    $dateStr = $d->toDateString();
                    $isWeekend = $d->isSaturday() || $d->isSunday();

                    $attendance = $attendances->get($dateStr);

                    if ($attendance) {
                        // Count towards totals regardless of weekend if they worked
                        $totalPresent++;
                        $totalWorkedMinutes += $attendance->total_worked_minutes;
                        $totalBreakMinutes += $attendance->total_break_minutes;

                        // Check if late
                        $punchIn = Carbon::parse($attendance->punch_in);
                        $nineThirtyAM = Carbon::parse($dateStr . ' 09:30:59');
                        if ($punchIn->gt($nineThirtyAM)) {
                            $lateDays++;
                        }

                        // Check if early leave
                        if ($attendance->punch_out) {
                            $punchOutLocal = Carbon::parse($attendance->punch_out)->timezone('Asia/Kolkata');
                            $sixPM = Carbon::parse($dateStr . ' 18:00:00', 'Asia/Kolkata');
                            if ($punchOutLocal->lt($sixPM)) {
                                $earlyLeaveDays++;
                            }
                        }
                    } elseif (!$isWeekend) {
                        // For weekdays, check if on leave or absent
                        $isOnLeave = false;
                        foreach ($leaves as $leave) {
                            $from = $leave->from_date instanceof \Carbon\Carbon ? $leave->from_date->toDateString() : $leave->from_date;
                            $to = $leave->to_date instanceof \Carbon\Carbon ? $leave->to_date->toDateString() : $leave->to_date;
                            if ($dateStr >= $from && $dateStr <= $to) {
                                $isOnLeave = true;
                                break;
                            }
                        }

                        if ($isOnLeave) {
                            $leaveDays++;
                        } else {
                            // Only count as absent if today is passed
                            if ($d->lt($today)) {
                                $absentDays++;
                            }
                        }
                    }
                }

                fputcsv($file, [
                    $user->name,
                    $totalPresent,
                    $absentDays,
                    $leaveDays,
                    $lateDays,
                    $earlyLeaveDays,
                    floor($totalWorkedMinutes / 60) . 'h ' . ($totalWorkedMinutes % 60) . 'm',
                    floor($totalBreakMinutes / 60) . 'h ' . ($totalBreakMinutes % 60) . 'm'
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
