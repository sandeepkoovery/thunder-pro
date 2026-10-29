<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceCorrectionRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'admin_id',
        'attendance_id',
        'attendance_break_id',
        'request_type',
        'break_action',
        'date',
        'requested_punch_in',
        'requested_punch_out',
        'requested_break_start',
        'requested_break_end',
        'reason',
        'status',
        'admin_note',
        'actioned_by',
        'actioned_at',
    ];

    protected $casts = [
        'date' => 'date',
        'requested_punch_in' => 'datetime',
        'requested_punch_out' => 'datetime',
        'requested_break_start' => 'datetime',
        'requested_break_end' => 'datetime',
        'actioned_at' => 'datetime',
    ];

    /**
     * Maximum number of correction requests a user can submit per calendar month.
     */
    public const MONTHLY_LIMIT = 3;

    /**
     * Resolve the [startDate, endDate] (Y-m-d) payroll cycle / month range that a given date belongs to.
     */
    public static function getCycleRangeForDate($userId, $date = null): array
    {
        $targetDate = $date ? \Carbon\Carbon::parse($date) : now();
        $user = User::find($userId);
        $admin = ($user && $user->admin_id) ? Admin::find($user->admin_id) : null;

        $startDay = $admin ? (int) ($admin->month_start_day ?? 25) : 25;
        $endDay = $admin ? (int) ($admin->month_end_day ?? 24) : 24;

        if ($startDay > 1 && $targetDate->day >= $startDay) {
            $monthStr = $targetDate->copy()->addMonth()->format('Y-m');
        } else {
            $monthStr = $targetDate->format('Y-m');
        }

        if ($admin && method_exists($admin, 'getMonthDateRange')) {
            return $admin->getMonthDateRange($monthStr);
        }

        $baseDate = \Carbon\Carbon::parse($monthStr . '-01');
        if ($startDay === 1) {
            return [
                $baseDate->copy()->startOfMonth()->format('Y-m-d'),
                $baseDate->copy()->endOfMonth()->format('Y-m-d'),
            ];
        }

        $prevMonth = $baseDate->copy()->subMonth();
        $maxStartDay = min($startDay, $prevMonth->daysInMonth);
        $startStr = $prevMonth->day($maxStartDay)->format('Y-m-d');

        $maxEndDay = min($endDay, $baseDate->daysInMonth);
        $endStr = $baseDate->copy()->day($maxEndDay)->format('Y-m-d');

        return [$startStr, $endStr];
    }

    /**
     * Number of correction requests the user has submitted for the month/cycle of the given date (or explicit date range).
     */
    public static function countThisMonth($userId, $dateOrStart = null, $endStr = null): int
    {
        if ($dateOrStart && $endStr) {
            $start = $dateOrStart;
            $end = $endStr;
        } else {
            [$start, $end] = static::getCycleRangeForDate($userId, $dateOrStart);
        }

        return static::where('user_id', $userId)
            ->whereBetween('date', [$start, $end])
            ->count();
    }

    /**
     * Quota summary for the given user for a specific month/cycle (by date or explicit start/end range).
     */
    public static function monthlyQuota($userId, $dateOrStart = null, $endStr = null): array
    {
        $used = static::countThisMonth($userId, $dateOrStart, $endStr);

        return [
            'limit' => self::MONTHLY_LIMIT,
            'used' => $used,
            'remaining' => max(0, self::MONTHLY_LIMIT - $used),
            'reached' => $used >= self::MONTHLY_LIMIT,
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function attendance()
    {
        return $this->belongsTo(Attendance::class);
    }

    public function attendanceBreak()
    {
        return $this->belongsTo(AttendanceBreak::class);
    }

    public function actionedBy()
    {
        return $this->belongsTo(User::class, 'actioned_by');
    }
}
