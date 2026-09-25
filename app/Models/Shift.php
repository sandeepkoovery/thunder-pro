<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'name',
        'start_time',
        'end_time',
        'buffer_minutes',
        'is_night_shift',
        'is_default',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_night_shift' => 'boolean',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'buffer_minutes' => 'integer',
    ];

    protected $appends = [
        'formatted_start_time',
        'formatted_end_time',
        'formatted_time_range',
    ];

    protected static function booted()
    {
        static::saving(function ($shift) {
            // Standardize format to HH:mm
            if (!empty($shift->start_time)) {
                $shift->start_time = substr($shift->start_time, 0, 5);
            }
            if (!empty($shift->end_time)) {
                $shift->end_time = substr($shift->end_time, 0, 5);
            }

            // Auto-detect overnight shift if end_time <= start_time
            if (!empty($shift->start_time) && !empty($shift->end_time)) {
                if ($shift->end_time <= $shift->start_time) {
                    $shift->is_night_shift = true;
                }
            }
        });
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'shift_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'shift_id');
    }

    public function getFormattedStartTimeAttribute(): string
    {
        if (empty($this->start_time)) return '';
        try {
            return Carbon::createFromFormat('H:i', substr($this->start_time, 0, 5))->format('h:i A');
        } catch (\Throwable $e) {
            return $this->start_time;
        }
    }

    public function getFormattedEndTimeAttribute(): string
    {
        if (empty($this->end_time)) return '';
        try {
            return Carbon::createFromFormat('H:i', substr($this->end_time, 0, 5))->format('h:i A');
        } catch (\Throwable $e) {
            return $this->end_time;
        }
    }

    public function getFormattedTimeRangeAttribute(): string
    {
        $start = $this->formatted_start_time;
        $end = $this->formatted_end_time;
        $suffix = $this->is_night_shift ? ' (Next Day)' : '';
        return "{$start} - {$end}{$suffix}";
    }
}
