<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hosting extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_name',
        'provider',
        'plan',
        'server_ip',
        'status',
        'expiration_date',
        'auto_renewal',
        'price',
        'notes',
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'auto_renewal'    => 'boolean',
        'price'           => 'decimal:2',
    ];
}
