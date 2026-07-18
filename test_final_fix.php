<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Attendance;
use Carbon\Carbon;

$attendance = Attendance::whereNotNull('punch_in')->orderBy('punch_in', 'desc')->first();

if ($attendance) {
    echo "Raw DB Value: " . $attendance->getRawOriginal('punch_in') . "\n";
    echo "Eloquent Value: " . $attendance->punch_in . "\n";

    $raw = $attendance->getRawOriginal('punch_in');

    // Correct way to interpret UTC DB values in an IST app
    $correct = Carbon::parse($raw, 'UTC')->timezone('Asia/Kolkata');
    echo "Corrected IST: " . $correct->toDateTimeString() . " (" . $correct->format('h:i A') . ")\n";

    $now = Carbon::now();
    echo "Now (IST): " . $now->toDateTimeString() . "\n";

    $diff = $now->diffInSeconds($correct);
    echo "Calculated Diff: " . $diff . " seconds (" . round($diff / 60, 2) . " mins)\n";
}
