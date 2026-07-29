<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoogleDriveConnection extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'client_id',
        'client_secret',
        'refresh_token',
        'token_expires_at',
        'root_folder_id',
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
    ];

    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }
}
