<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPasskey extends Model
{
    use HasFactory;

    protected $table = 'user_passkeys';

    protected $fillable = [
        'user_id',
        'credential_id',
        'public_key',
        'user_handle',
        'device_name',
        'transports',
        'counter',
        'last_used_at',
    ];

    protected $casts = [
        'transports' => 'array',
        'counter' => 'integer',
        'last_used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
