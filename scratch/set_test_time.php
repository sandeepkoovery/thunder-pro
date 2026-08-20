<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Setting;
use Carbon\Carbon;

$now = Carbon::now(config('app.timezone'));
$targetTime = $now->addMinute()->format('H:i');

Setting::updateOrCreate(['key' => 'backup_daily_time'], ['value' => $targetTime]);
echo "Updated backup_daily_time to: {$targetTime}\n";
