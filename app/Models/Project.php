<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
  use SoftDeletes;

  protected $fillable = ['name', 'client_name', 'budget', 'description', 'status', 'start_date', 'end_date'];
  public function tasks()
  {
    return $this->hasMany(Task::class);
  }
}
