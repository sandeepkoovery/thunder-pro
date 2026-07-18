<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

\App\Models\User::updateOrCreate(
    ['email' => 'admin@erp.com'],
    [
        'name' => 'Sub Admin',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'is_active' => 1
    ]
);

echo "Admin user created successfully with email: admin@erp.com / password: password\n";
