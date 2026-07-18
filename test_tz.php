<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

$attendance = Attendance::whereNotNull('punch_in')->orderBy('date', 'desc')->first();
if ($attendance) {
    $raw = DB::table('attendances')->where('id', $attendance->id)->value('punch_in');
    echo "Raw DB value (bypassing Eloquent): " . $raw . "\n";
    echo "Eloquent punch_in: " . $attendance->punch_in . "\n";
    echo "Formatted h:i A: " . Carbon::parse($attendance->punch_in)->timezone('Asia/Kolkata')->format('h:i A') . "\n";
    echo "Config App Timezone: " . config('app.timezone') . "\n";
    echo "Config DB Timezone: " . config('database.connections.mysql.timezone') . "\n";

    // Let's also get March 13th specifically
    $mar13 = Attendance::where('date', '2026-03-13')->first();
    if ($mar13) {
        echo "\nMarch 13 Raw: " . DB::table('attendances')->where('id', $mar13->id)->value('punch_in') . "\n";
    }
} else {
    echo "No attendance found.";
}
