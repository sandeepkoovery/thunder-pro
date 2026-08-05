<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Department extends \Illuminate\Database\Eloquent\Model
{
    use HasFactory;

    protected $fillable = ['admin_id', 'name', 'code', 'description', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }

    public function employees(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class);
    }
}
