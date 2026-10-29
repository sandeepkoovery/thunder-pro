<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OdRequest extends Model
{
    protected $fillable = [
        'user_id',
        'admin_id',
        'date',
        'reason',
        'status',
        'admin_note',
        'actioned_by',
        'actioned_at',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'actioned_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function actionedBy()
    {
        return $this->belongsTo(User::class, 'actioned_by');
    }

    /**
     * Map of approved OD dates (Y-m-d => true) for a user within a date range.
     */
    public static function approvedDatesFor($userId, $startStr, $endStr)
    {
        return static::where('user_id', $userId)
            ->where('status', 'approved')
            ->whereBetween('date', [$startStr, $endStr])
            ->get()
            ->mapWithKeys(fn ($r) => [$r->date->format('Y-m-d') => true]);
    }
}
