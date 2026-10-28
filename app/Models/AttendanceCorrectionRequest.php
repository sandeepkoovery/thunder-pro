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
     * Number of correction requests the user has submitted in the current calendar month.
     */
    public static function countThisMonth($userId): int
    {
        return static::where('user_id', $userId)
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();
    }

    /**
     * Quota summary for the given user for the current month.
     */
    public static function monthlyQuota($userId): array
    {
        $used = static::countThisMonth($userId);

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
