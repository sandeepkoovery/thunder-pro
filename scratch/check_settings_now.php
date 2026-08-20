<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Setting;

print_r(Setting::whereIn('key', ['backup_auto_enabled', 'backup_daily_time', 'backup_google_drive_folder', 'backup_last_auto_run'])->pluck('value', 'key')->toArray());
