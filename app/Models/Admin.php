<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'admins';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'plan',
        'additional_modules',
        'company_name',
        'phone',
        'image',
        'thumb',
        'is_active',
        'month_start_day',
        'month_end_day',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'additional_modules' => 'array',
            'month_start_day' => 'integer',
            'month_end_day' => 'integer',
        ];
    }

    public function getMonthDateRange(string $monthStr): array
    {
        $startDay = (int) ($this->month_start_day ?? 25);
        $endDay = (int) ($this->month_end_day ?? 24);

        try {
            $baseDate = \Carbon\Carbon::parse($monthStr . '-01');
        } catch (\Exception $e) {
            $baseDate = \Carbon\Carbon::now();
        }

        if ($startDay === 1) {
            $startDate = $baseDate->copy()->startOfMonth()->format('Y-m-d');
            $endDate = $baseDate->copy()->endOfMonth()->format('Y-m-d');
        } else {
            $prevMonth = $baseDate->copy()->subMonth();
            $maxStartDay = min($startDay, $prevMonth->daysInMonth);
            $startDate = $prevMonth->day($maxStartDay)->format('Y-m-d');

            $maxEndDay = min($endDay, $baseDate->daysInMonth);
            $endDate = $baseDate->copy()->day($maxEndDay)->format('Y-m-d');
        }

        return [$startDate, $endDate];
    }

    public function users()
    {
        return $this->hasMany(User::class, 'admin_id');
    }

    public function tasks()
    {
        return $this->belongsToMany(Task::class, 'task_user', 'user_id', 'task_id')->withTimestamps();
    }

    public function comments()
    {
        return $this->hasMany(Comment::class, 'user_id');
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class, 'user_id');
    }

    public function googleDriveConnection()
    {
        return $this->hasOne(GoogleDriveConnection::class, 'admin_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'user_id');
    }
}
