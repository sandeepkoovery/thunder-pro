<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceBreak;
use App\Models\AttendanceCorrectionRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceCorrectionController extends Controller
{
    private function getTenantAdminId()
    {
        $user = auth()->user();
        if (!$user) return 0;

        if ($user instanceof \App\Models\Admin) {
            if ($user->role === 'superadmin') {
                return 0;
            }
            return $user->id;
        }

        if (isset($user->role) && $user->role === 'admin') {
            $admin = \App\Models\Admin::where('email', $user->email)->first();
            return $admin ? $admin->id : 0;
        }

        return $user->admin_id ?? 0;
    }

    public function store(Request $request)
    {
        $request->validate([
            'request_type' => 'required|in:punch_time,break_time',
            'break_action' => 'nullable|in:add,edit',
            'date' => 'required|date',
            'attendance_id' => 'nullable|exists:attendances,id',
            'attendance_break_id' => 'nullable|exists:attendance_breaks,id',
            'requested_punch_in' => 'nullable|date',
            'requested_punch_out' => 'nullable|date|after_or_equal:requested_punch_in',
            'requested_break_start' => 'nullable|date',
            'requested_break_end' => 'nullable|date|after_or_equal:requested_break_start',
            'reason' => 'required|string|max:1000',
        ]);

        $user = Auth::user();
        $adminId = $this->getTenantAdminId();
        $date = $request->date;

        $attendance = Attendance::where('user_id', $user->id)->where('date', $date)->first();

        // Rule 1: Break time request requires an existing check-in (punch_in) for that date
        if ($request->request_type === 'break_time') {
            if (!$attendance || !$attendance->punch_in) {
                return back()->with('error', 'Break time cannot be requested because check-in time (punch-in) is not recorded for this date.');
            }

            $bStart = $request->requested_break_start ? Carbon::parse($request->requested_break_start) : null;
            $bEnd = $request->requested_break_end ? Carbon::parse($request->requested_break_end) : null;
            $now = Carbon::now();

            if ($bStart && $bStart->gt($now)) {
                return back()->with('error', 'Break start time cannot be in the future.');
            }
            if ($bEnd && $bEnd->gt($now)) {
                return back()->with('error', 'Break end time cannot be in the future.');
            }

            // Determine effective shift bounds for range validation
            $shiftStart = $attendance->punch_in ? Carbon::parse($attendance->punch_in) : null;
            $shiftEnd = $attendance->punch_out ? Carbon::parse($attendance->punch_out) : null;

            // Check if a pending/approved punch_time request provides updated shift bounds
            $punchReq = AttendanceCorrectionRequest::where('user_id', $user->id)
                ->where('date', $date)
                ->where('request_type', 'punch_time')
                ->whereIn('status', ['pending', 'approved'])
                ->latest()
                ->first();

            if ($punchReq) {
                if ($punchReq->requested_punch_in) {
                    $shiftStart = Carbon::parse($punchReq->requested_punch_in);
                }
                if ($punchReq->requested_punch_out) {
                    $shiftEnd = Carbon::parse($punchReq->requested_punch_out);
                }
            }

            if ($bStart && $shiftStart && $bStart->lt($shiftStart)) {
                return back()->with('error', 'Break start time (' . $bStart->format('h:i A') . ') cannot be before check-in time (' . $shiftStart->format('h:i A') . ').');
            }

            if ($bEnd && $shiftEnd && $bEnd->gt($shiftEnd)) {
                return back()->with('error', 'Break end time (' . $bEnd->format('h:i A') . ') cannot be after check-out time (' . $shiftEnd->format('h:i A') . ').');
            }

            // Overlap check against existing breaks & pending/approved break requests
            if ($bStart && $bEnd) {
                $existingBreaks = [];

                // 1. From AttendanceBreak table
                if ($attendance && $attendance->breaks) {
                    foreach ($attendance->breaks as $b) {
                        if ($request->break_action === 'edit' && $request->attendance_break_id == $b->id) {
                            continue;
                        }
                        if ($b->start_time && $b->end_time) {
                            $existingBreaks[] = [
                                'start' => Carbon::parse($b->start_time),
                                'end' => Carbon::parse($b->end_time),
                                'label' => Carbon::parse($b->start_time)->format('h:i A') . ' - ' . Carbon::parse($b->end_time)->format('h:i A')
                            ];
                        }
                    }
                }

                // 2. From pending/approved AttendanceCorrectionRequest records
                $pendingBreakReqs = AttendanceCorrectionRequest::where('user_id', $user->id)
                    ->where('date', $date)
                    ->where('request_type', 'break_time')
                    ->whereIn('status', ['pending', 'approved'])
                    ->get();

                foreach ($pendingBreakReqs as $pbr) {
                    if ($request->attendance_break_id && $pbr->attendance_break_id == $request->attendance_break_id) {
                        continue;
                    }
                    if ($pbr->requested_break_start && $pbr->requested_break_end) {
                        $existingBreaks[] = [
                            'start' => Carbon::parse($pbr->requested_break_start),
                            'end' => Carbon::parse($pbr->requested_break_end),
                            'label' => Carbon::parse($pbr->requested_break_start)->format('h:i A') . ' - ' . Carbon::parse($pbr->requested_break_end)->format('h:i A')
                        ];
                    }
                }

                foreach ($existingBreaks as $eb) {
                    if ($bStart->lt($eb['end']) && $bEnd->gt($eb['start'])) {
                        return back()->with('error', 'Break time (' . $bStart->format('h:i A') . ' - ' . $bEnd->format('h:i A') . ') overlaps with another break (' . $eb['label'] . ').');
                    }
                }
            }
        }

        // Rule 2: Checkout time (punch_out) cannot be requested without an existing or requested check-in time
        if ($request->request_type === 'punch_time') {
            $pIn = $request->requested_punch_in ? Carbon::parse($request->requested_punch_in) : null;
            $pOut = $request->requested_punch_out ? Carbon::parse($request->requested_punch_out) : null;
            $now = Carbon::now();

            if ($pIn && $pIn->gt($now)) {
                return back()->with('error', 'Punch in time cannot be in the future.');
            }
            if ($pOut && $pOut->gt($now)) {
                return back()->with('error', 'Punch out time cannot be in the future.');
            }

            if ($request->filled('requested_punch_out')) {
                $hasExistingPunchIn = $attendance && $attendance->punch_in;
                $hasRequestedPunchIn = $request->filled('requested_punch_in');

                if (!$hasExistingPunchIn && !$hasRequestedPunchIn) {
                    return back()->with('error', 'Checkout time cannot be requested without providing a check-in time.');
                }
            }
        }

        AttendanceCorrectionRequest::create([
            'user_id' => $user->id,
            'admin_id' => $adminId,
            'attendance_id' => $attendance ? $attendance->id : $request->attendance_id,
            'attendance_break_id' => $request->attendance_break_id,
            'request_type' => $request->request_type,
            'break_action' => $request->break_action,
            'date' => $request->date,
            'requested_punch_in' => $request->requested_punch_in ? Carbon::parse($request->requested_punch_in) : null,
            'requested_punch_out' => $request->requested_punch_out ? Carbon::parse($request->requested_punch_out) : null,
            'requested_break_start' => $request->requested_break_start ? Carbon::parse($request->requested_break_start) : null,
            'requested_break_end' => $request->requested_break_end ? Carbon::parse($request->requested_break_end) : null,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Time correction request submitted successfully for admin review.');
    }

    public function approve(Request $request, $id)
    {
        $correctionReq = AttendanceCorrectionRequest::findOrFail($id);

        if ($correctionReq->status !== 'pending') {
            return back()->with('error', 'This request has already been actioned.');
        }

        $userId = $correctionReq->user_id;
        $date = $correctionReq->date;

        if ($correctionReq->request_type === 'punch_time') {
            $attendance = Attendance::where('user_id', $userId)->where('date', $date)->first();
            $hasPunchIn = ($attendance && $attendance->punch_in) || $correctionReq->requested_punch_in;

            if ($correctionReq->requested_punch_out && !$hasPunchIn) {
                return back()->with('error', 'Cannot approve checkout time correction: Employee has no check-in time for this date.');
            }

            if (!$attendance) {
                $attendance = Attendance::create([
                    'user_id' => $userId,
                    'date' => $date,
                    'status' => 'punched_in',
                    'admin_id' => $correctionReq->admin_id,
                ]);
            }

            $punchIn = $correctionReq->requested_punch_in ? Carbon::parse($correctionReq->requested_punch_in) : $attendance->punch_in;
            $punchOut = $correctionReq->requested_punch_out ? Carbon::parse($correctionReq->requested_punch_out) : $attendance->punch_out;

            $totalBreakMinutes = $attendance->breaks()->sum('total_minutes') ?? $attendance->total_break_minutes ?? 0;
            $totalWorkedMinutes = 0;

            if ($punchIn && $punchOut) {
                $totalWorkedMinutes = max(0, $punchIn->diffInMinutes($punchOut) - $totalBreakMinutes);
            }

            $attendance->update([
                'punch_in' => $punchIn,
                'punch_out' => $punchOut,
                'total_break_minutes' => $totalBreakMinutes,
                'total_worked_minutes' => $totalWorkedMinutes,
                'status' => $punchOut ? 'punched_out' : ($punchIn ? 'punched_in' : $attendance->status),
            ]);

            $correctionReq->attendance_id = $attendance->id;
        } elseif ($correctionReq->request_type === 'break_time') {
            $attendance = Attendance::where('user_id', $userId)->where('date', $date)->first();

            if (!$attendance || !$attendance->punch_in) {
                return back()->with('error', 'Cannot approve break request: Employee has no check-in time recorded for this date.');
            }

            $bStart = $correctionReq->requested_break_start ? Carbon::parse($correctionReq->requested_break_start) : null;
            $bEnd = $correctionReq->requested_break_end ? Carbon::parse($correctionReq->requested_break_end) : null;
            $duration = ($bStart && $bEnd) ? max(0, $bStart->diffInMinutes($bEnd)) : 0;

            if ($correctionReq->break_action === 'edit' && $correctionReq->attendance_break_id) {
                $break = AttendanceBreak::find($correctionReq->attendance_break_id);
                if ($break) {
                    $break->update([
                        'start_time' => $bStart,
                        'end_time' => $bEnd,
                        'total_minutes' => $duration,
                    ]);
                }
            } else {
                // Add new break
                $break = AttendanceBreak::create([
                    'attendance_id' => $attendance->id,
                    'start_time' => $bStart,
                    'end_time' => $bEnd,
                    'total_minutes' => $duration,
                    'reason' => $correctionReq->reason,
                ]);
                $correctionReq->attendance_break_id = $break->id;
            }

            // Recalculate parent attendance totals
            $totalBreak = $attendance->breaks()->sum('total_minutes');
            $updateData = ['total_break_minutes' => $totalBreak];

            if ($attendance->punch_in && $attendance->punch_out) {
                $pIn = Carbon::parse($attendance->punch_in);
                $pOut = Carbon::parse($attendance->punch_out);
                $updateData['total_worked_minutes'] = max(0, $pIn->diffInMinutes($pOut) - $totalBreak);
            }

            $attendance->update($updateData);
            $correctionReq->attendance_id = $attendance->id;
        }

        $correctionReq->update([
            'status' => 'approved',
            'admin_note' => $request->input('admin_note'),
            'actioned_by' => Auth::id(),
            'actioned_at' => Carbon::now(),
        ]);

        return back()->with('success', 'Correction request approved and attendance records updated.');
    }

    public function reject(Request $request, $id)
    {
        $correctionReq = AttendanceCorrectionRequest::findOrFail($id);

        if ($correctionReq->status !== 'pending') {
            return back()->with('error', 'This request has already been actioned.');
        }

        $correctionReq->update([
            'status' => 'rejected',
            'admin_note' => $request->input('admin_note'),
            'actioned_by' => Auth::id(),
            'actioned_at' => Carbon::now(),
        ]);

        return back()->with('success', 'Correction request rejected.');
    }

    public function destroy($id)
    {
        $correctionReq = AttendanceCorrectionRequest::findOrFail($id);
        $user = Auth::user();

        $isAdmin = ($user instanceof \App\Models\Admin) || (isset($user->role) && in_array($user->role, ['admin', 'superadmin']));

        if (!$isAdmin) {
            if ($correctionReq->user_id !== $user->id) {
                return back()->with('error', 'Unauthorized action.');
            }
            if ($correctionReq->status !== 'pending') {
                return back()->with('error', 'Only pending requests can be deleted.');
            }
        }

        $correctionReq->delete();

        return back()->with('success', 'Correction request deleted successfully.');
    }
}
