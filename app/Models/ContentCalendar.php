<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContentCalendar extends Model
{
    use HasFactory;

    protected $table = 'content_calendars';

    protected $fillable = [
        'admin_id',
        'project_id',
        'creative_uid',
        'date',
        'creative_type',
        'updation',
        'drive_link',
        'thumbnail_link',
        'creative_caption',
        'is_additional',
    ];

    protected function casts(): array
    {
        return [
            'is_additional' => 'boolean',
        ];
    }

    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'content_calendar_user', 'content_calendar_id', 'user_id')->withTimestamps();
    }

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }
}
