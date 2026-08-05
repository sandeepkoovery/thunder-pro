<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$admin = App\Models\Admin::find(8);
auth()->login($admin);

$controller = new App\Http\Controllers\DailyListingsController();
$response = $controller->index();

echo "SUCCESS! Settings created or fetched successfully.\n";
$setting = App\Models\DailyWorksheetSetting::where('admin_id', 8)->whereNull('user_id')->first();
print_r($setting->toArray());
