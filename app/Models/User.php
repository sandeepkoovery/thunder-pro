<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    protected $appends = ['image_url', 'full_name'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($user) {
            if (empty($user->employee_id)) {
                $lastUser = static::whereNotNull('employee_id')
                    ->where('employee_id', 'LIKE', 'EMP%')
                    ->orderBy('employee_id', 'desc')
                    ->first();

                $nextNumber = 1;
                if ($lastUser) {
                    $lastNum = (int) substr($lastUser->employee_id, 3);
                    $nextNumber = $lastNum + 1;
                }
                $user->employee_id = 'EMP' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'designation',
        'phone',
        'is_active',
        'image',
        'thumb',
        'desktop_only',
        // Employee fields
        'employee_id',
        'first_name',
        'last_name',
        'gender',
        'date_of_birth',
        'blood_group',
        'marital_status',
        'mobile',
        'address',
        'emergency_contact_name',
        'emergency_contact_number',
        'department_id',
        'reporting_manager_id',
        'joining_date',
        'employment_type',
        'branch',
        'shift',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'desktop_only' => 'boolean',
            'date_of_birth' => 'date',
            'joining_date' => 'date',
        ];
    }

    /**
     * Get the user's full name (first_name + last_name or fallback to name).
     */
    public function getFullNameAttribute(): string
    {
        if ($this->first_name || $this->last_name) {
            return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
        }
        return $this->name ?? '';
    }

    /**
     * Get the user's image path, preferring 'image' over 'thumb'.
     */
    public function getImagePathAttribute(): ?string
    {
        return $this->image ?: $this->thumb;
    }

    /**
     * Get the user's full image URL.
     */
    public function getImageUrlAttribute(): ?string
    {
        $path = $this->thumb ?: $this->image;
        if (!$path) {
            return null;
        }

        // If it's already a full URL (e.g. from Google Drive), return it
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        // If it starts with 'uploads/', it's a public upload
        if (str_starts_with($path, 'uploads/')) {
            return asset($path);
        }

        // Fallback for old storage paths (though we are moving away from them)
        return asset('storage/' . $this->image);
    }

    public function department(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function reportingManager(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'reporting_manager_id');
    }

    public function subordinates(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class, 'reporting_manager_id');
    }

    public function tasks()
    {
        return $this->belongsToMany(Task::class, 'task_user')->withTimestamps();
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

}

