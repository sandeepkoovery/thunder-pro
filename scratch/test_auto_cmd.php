<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Setting;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;

$now = Carbon::now(config('app.timezone'));
$currentTime = $now->format('H:i');

Setting::updateOrCreate(['key' => 'backup_daily_time'], ['value' => $currentTime]);
Setting::where('key', 'backup_last_auto_run')->delete();

echo "Set backup_daily_time to: {$currentTime}. Cleared backup_last_auto_run.\n";

$exitCode = Artisan::call('backup:database');
echo "Exit code: {$exitCode}\n";
echo "Output:\n" . Artisan::output();
