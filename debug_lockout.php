<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Attendance;
use Carbon\Carbon;

$attendance = Attendance::whereNotNull('punch_in')->orderBy('punch_in', 'desc')->first();

if ($attendance) {
    echo "Attendance ID: " . $attendance->id . "\n";
    echo "Current App Timezone: " . config('app.timezone') . "\n";

    $now = Carbon::now();
    $punchIn = Carbon::parse($attendance->punch_in);

    echo "Carbon::now(): " . $now->toDateTimeString() . " (" . $now->timezoneName . ")\n";
    echo "Attendance->punch_in (parsed): " . $punchIn->toDateTimeString() . " (" . $punchIn->timezoneName . ")\n";

    $diffSecs = $now->diffInSeconds($punchIn);
    $diffMins = $now->diffInMinutes($punchIn);

    echo "Diff in Seconds: " . $diffSecs . "\n";
    echo "Diff in Minutes: " . $diffMins . "\n";

    if ($diffSecs < 295) {
        echo "RESULT: WILL TRIGGER LOCKOUT ERROR\n";
    } else {
        echo "RESULT: WILL ALLOW ACTION\n";
    }

} else {
    echo "No attendance found.";
}
