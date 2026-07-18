<?php

require __DIR__ . '/c:/xampp/htdocs/wishery-crm/vendor/autoload.php';
$app = require_once __DIR__ . '/c:/xampp/htdocs/wishery-crm/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Attendance;
use Carbon\Carbon;

$attendance = Attendance::whereNotNull('punch_in')->first();
if ($attendance) {
    echo "Raw DB value: " . $attendance->getRawOriginal('punch_in') . "\n";
    echo "Carbon object: " . $attendance->punch_in . "\n";
    echo "Format h:i A: " . Carbon::parse($attendance->punch_in)->format('h:i A') . "\n";
    echo "Config App Timezone: " . config('app.timezone') . "\n";
    echo "Config DB Timezone: " . config('database.connections.mysql.timezone') . "\n";
} else {
    echo "No attendance found.";
}
