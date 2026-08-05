<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Carbon\Carbon;
use App\Models\ContentCalendar;
use App\Models\Admin;

$admin = Admin::find(8) ?? Admin::first();
$adminId = $admin->id;
$monthStr = '2026-07';

list($startDate, $endDate) = $admin->getMonthDateRange($monthStr);

echo "Admin ID: {$adminId}\n";
echo "Date Range: {$startDate} to {$endDate}\n";

$start = Carbon::parse($startDate);
$end = Carbon::parse($endDate);
$createdCount = 0;

while ($start->lte($end)) {
    $currentDate = $start->format('Y-m-d');
    
    $query = ContentCalendar::where('date', $currentDate);
    if ($adminId) {
        $query->where('admin_id', $adminId);
    }

    if (!$query->exists()) {
        ContentCalendar::create([
            'admin_id' => $adminId,
            'project_id' => null,
            'creative_uid' => 'CR_' . strtoupper(substr(md5($currentDate . rand(100, 999)), 0, 6)),
            'date' => $currentDate,
            'creative_type' => '',
            'updation' => 'STATUS',
            'creative_caption' => null,
            'is_additional' => false,
        ]);
        $createdCount++;
    }
    $start->addDay();
}

echo "Successfully generated {$createdCount} entries for range {$startDate} to {$endDate}.\n";
