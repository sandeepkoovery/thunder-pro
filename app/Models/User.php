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

        static::saving(function ($user) {
            if (!empty($user->first_name) || !empty($user->last_name)) {
                $user->name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
            } else if (!empty($user->name)) {
                $parts = explode(' ', trim($user->name), 2);
                $user->first_name = $parts[0] ?? '';
                $user->last_name = $parts[1] ?? '';
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
        'admin_id',
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

    public function getFirstNameAttribute($value): string
    {
        if (!empty($value)) {
            return $value;
        }
        if (!empty($this->attributes['name'])) {
            $parts = explode(' ', trim($this->attributes['name']), 2);
            return $parts[0] ?? '';
        }
        return '';
    }

    public function getLastNameAttribute($value): string
    {
        if (!empty($value)) {
            return $value;
        }
        if (!empty($this->attributes['name'])) {
            $parts = explode(' ', trim($this->attributes['name']), 2);
            return $parts[1] ?? '';
        }
        return '';
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
    public function getImageUrlAttribute(): string
    {
        $defaultUrl = asset('images/default-avatar.jpg');
        $path = $this->thumb ?: $this->image;
        if (!$path) {
            return $defaultUrl;
        }

        // If it's already a full URL (e.g. from Google Drive), return it
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        // If it starts with 'uploads/' or 'images/', check file
        if (str_starts_with($path, 'uploads/') || str_starts_with($path, 'images/')) {
            if (file_exists(public_path($path))) {
                return asset($path);
            }
            return $defaultUrl;
        }

        // Check storage path
        if (file_exists(storage_path('app/public/' . $path)) || file_exists(public_path('storage/' . $path))) {
            return asset('storage/' . $path);
        }

        return $defaultUrl;
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

    public function tenantAdmin(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }

    public function tenantUsers(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class, 'admin_id');
    }

    public function getEffectiveAdminIdAttribute(): ?int
    {
        if ($this->role === 'admin') {
            return $this->id;
        }
        return $this->admin_id;
    }


}

