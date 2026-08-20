<?php

use App\Models\DatabaseBackup;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$latest = DatabaseBackup::latest()->first();
print_r($latest ? $latest->toArray() : 'No backups found');
