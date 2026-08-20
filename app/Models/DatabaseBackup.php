<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DatabaseBackup extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_name',
        'google_drive_file_id',
        'google_drive_folder_id',
        'file_size',
        'status',
        'trigger_type',
        'backup_started_at',
        'backup_completed_at',
        'error_message',
    ];

    protected $casts = [
        'backup_started_at' => 'datetime',
        'backup_completed_at' => 'datetime',
        'file_size' => 'integer',
    ];

    protected $appends = [
        'formatted_file_size',
        'google_drive_link',
    ];

    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = (int) $this->file_size;
        if ($bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = (int) floor(log($bytes, 1024));

        return round($bytes / pow(1024, $i), 2) . ' ' . ($units[$i] ?? 'B');
    }

    public function getGoogleDriveLinkAttribute(): ?string
    {
        if ($this->google_drive_file_id) {
            return "https://drive.google.com/file/d/{$this->google_drive_file_id}/view";
        }

        if ($this->google_drive_folder_id) {
            return "https://drive.google.com/drive/folders/{$this->google_drive_folder_id}";
        }

        return null;
    }
}
