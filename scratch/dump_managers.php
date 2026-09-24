<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "ADMINS:\n";
foreach (App\Models\Admin::all() as $a) {
    echo "ID: {$a->id}, Name: {$a->name}, Email: {$a->email}, Role: {$a->role}\n";
}

echo "\nUSERS with role manager or designation like manager:\n";
foreach (App\Models\User::where('role', 'manager')->orWhere('designation', 'LIKE', '%manager%')->get() as $u) {
    echo "ID: {$u->id}, AdminID: {$u->admin_id}, Name: {$u->name}, Role: {$u->role}, Designation: {$u->designation}, Perms: " . json_encode($u->module_permissions) . "\n";
}
