<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if (!Schema::hasColumn('database_backups', 'trigger_type')) {
    Schema::table('database_backups', function (Blueprint $table) {
        $table->enum('trigger_type', ['manual', 'automatic'])->default('manual')->after('status');
    });
    echo "Added trigger_type column to database_backups table.\n";
} else {
    echo "trigger_type column already exists.\n";
}

print_r(Schema::getColumnListing('database_backups'));
