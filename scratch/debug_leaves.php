<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== All users (including email) ===\n";
$users = DB::table('users')->get(['id','name','email','role','admin_id','deleted_at']);
foreach ($users as $u) {
    echo "ID:{$u->id} name:{$u->name} email:{$u->email} role:{$u->role} admin_id:" . ($u->admin_id ?? 'NULL') . " deleted:" . ($u->deleted_at ?? 'no') . "\n";
}

echo "\n=== Check if there's a separate 'admins' table user who is 'Tomson Roji' or similar ===\n";
$admins = DB::table('admins')->get(['id','name','email','role','company_name']);
foreach ($admins as $a) {
    echo "Admin ID:{$a->id} name:{$a->name} email:{$a->email} company:{$a->company_name}\n";
}

echo "\n=== Count leaves per user_id ===\n";
$counts = DB::table('leaves')->select('user_id', DB::raw('count(*) as cnt'))->groupBy('user_id')->get();
foreach ($counts as $c) {
    echo "user_id:{$c->user_id} leaves:{$c->cnt}\n";
}
