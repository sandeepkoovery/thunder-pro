<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$admin = \App\Models\Admin::find(8) ?? \App\Models\Admin::first();
if ($admin) {
    echo "Admin ID: " . $admin->id . "\n";
    echo "Month Start Day: " . ($admin->month_start_day ?? 25) . "\n";
    echo "Month End Day: " . ($admin->month_end_day ?? 24) . "\n";
    $range = $admin->getMonthDateRange('2026-07');
    echo "July 2026 Date Range: " . $range[0] . " to " . $range[1] . "\n";
} else {
    echo "No admin found\n";
}
