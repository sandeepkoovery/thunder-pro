<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;   // ✅ REQUIRED
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class Leave extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'leave_type',
        'day_type',
        'from_date',
        'to_date',
        'no_of_days',
        'reason',
        'status',
        'admin_comment',
    ];

    protected $casts = [
        'from_date' => 'date:Y-m-d',
        'to_date'   => 'date:Y-m-d',
    ];

    // For formatted dates in frontend
    public function getFormattedFromDateAttribute()
    {
        return Carbon::parse($this->from_date)->format('d M Y');
    }

    public function getFormattedToDateAttribute()
    {
        return Carbon::parse($this->to_date)->format('d M Y');
    }

    // Relation to User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
