<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyWorksheet extends Model
{
    use HasFactory;

    protected $table = 'daily_worksheets';

    protected $fillable = [
        'admin_id',
        'user_id',
        'date',
        'client_name',
        'task_type',
        'status',
        'file_name',
        'drive_link',
        'project',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }
}
