<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DesignersWorklist extends Model
{
    use HasFactory;

    protected $table = 'designers_worklists';

    protected $fillable = [
        'admin_id',
        'client_name',
        'task_date',
        'creator_id',
        'task_type',
        'description',
        'status',
    ];

    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'designers_worklist_user', 'designers_worklist_id', 'user_id')->withTimestamps();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}
