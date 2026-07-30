<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyWorksheetSetting extends Model
{
    use HasFactory;

    protected $table = 'daily_worksheet_settings';

    protected $fillable = [
        'admin_id',
        'user_id',
        'client_name_enabled',
        'task_type_enabled',
        'status_enabled',
        'file_name_enabled',
        'drive_link_enabled',
        'project_enabled',
        'task_type_options',
        'task_type_freetext',
    ];

    protected function casts(): array
    {
        return [
            'client_name_enabled' => 'boolean',
            'task_type_enabled' => 'boolean',
            'status_enabled' => 'boolean',
            'file_name_enabled' => 'boolean',
            'drive_link_enabled' => 'boolean',
            'project_enabled' => 'boolean',
            'task_type_freetext' => 'boolean',
        ];
    }
}
