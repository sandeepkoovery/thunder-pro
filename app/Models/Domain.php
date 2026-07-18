<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Domain extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_name',
        'status',
        'expiration_date',
        'auto_renewal',
        'provider',
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'auto_renewal' => 'boolean',
    ];
}
