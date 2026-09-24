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
        'trial_ends_at',
        'subscription_status',
        'subscribed_at',
        'additional_modules',
        'company_name',
        'address',
        'gst_no',
        'phone',
        'image',
        'thumb',
        'is_active',
        'approval_status',
        'unlimited_employees_status',
        'month_start_day',
        'month_end_day',
        'casual_leaves',
        'sick_leaves',
        'office_start_time',
        'office_end_time',
        'login_buffer_minutes',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): string
    {
        $defaultUrl = asset('images/default-avatar.jpg');
        $path = $this->image ?: $this->thumb;
        if (!$path) {
            return $defaultUrl;
        }

        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        if (str_starts_with($path, 'uploads/') || str_starts_with($path, 'images/')) {
            if (file_exists(public_path($path))) {
                return asset($path);
            }
            if (file_exists(public_path('storage/' . $path)) || file_exists(storage_path('app/public/' . $path))) {
                return asset('storage/' . $path);
            }
            return asset($path);
        }

        return asset('storage/' . $path);
    }

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'additional_modules' => 'array',
            'month_start_day' => 'integer',
            'month_end_day' => 'integer',
            'casual_leaves' => 'integer',
            'sick_leaves' => 'integer',
            'login_buffer_minutes' => 'integer',
            'trial_ends_at' => 'datetime',
            'subscribed_at' => 'datetime',
        ];
    }

    public function isInTrial(): bool
    {
        if ($this->plan !== 'premium') {
            return false;
        }
        if ($this->subscription_status === 'active') {
            return false;
        }
        if ($this->subscription_status === 'trial' && !$this->trial_ends_at) {
            return true;
        }
        if (!$this->trial_ends_at) {
            return false;
        }
        return \Carbon\Carbon::now()->lt($this->trial_ends_at);
    }

    public function isTrialExpired(): bool
    {
        if ($this->plan !== 'premium') {
            return false;
        }
        if ($this->subscription_status === 'active') {
            return false;
        }
        if (!$this->trial_ends_at) {
            return false;
        }
        return \Carbon\Carbon::now()->gte($this->trial_ends_at);
    }

    public function daysLeftInTrial(): int
    {
        if (!$this->isInTrial()) {
            return 0;
        }
        if (!$this->trial_ends_at) {
            return 30;
        }
        return (int) max(0, ceil(\Carbon\Carbon::now()->diffInSeconds($this->trial_ends_at, false) / 86400));
    }

    public function isSubscriptionActive(): bool
    {
        if ($this->role === 'superadmin') {
            return true;
        }
        if ($this->plan === 'basic') {
            return true;
        }
        if ($this->subscription_status === 'active') {
            return true;
        }
        return $this->isInTrial();
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

    public function hasUnlimitedEmployees(): bool
    {
        return $this->role === 'superadmin' || $this->unlimited_employees_status === 'approved';
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\ResetPasswordNotification($token));
    }
}
