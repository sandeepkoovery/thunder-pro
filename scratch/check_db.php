<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DatabaseBackup;

$latest = DatabaseBackup::latest()->first();
print_r($latest ? $latest->toArray() : 'No backups found');
