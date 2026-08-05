<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'title',
        'category',
        'start_date',
        'end_date',
        'all_day',
        'description',
        'location',
        'event_url',
        'guest_ids',
        'user_id',
    ];

    protected $casts = [
        'all_day' => 'boolean',
        'guest_ids' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tenantAdmin()
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }
}
