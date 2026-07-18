<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('superadmin', 'admin', 'user', 'manager', 'editor') NOT NULL DEFAULT 'user'");
        
        // Optionally promote the first admin to superadmin
        \Illuminate\Support\Facades\DB::table('users')->where('role', 'admin')->orderBy('id')->limit(1)->update(['role' => 'superadmin']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \Illuminate\Support\Facades\DB::table('users')->where('role', 'superadmin')->update(['role' => 'admin']);
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'manager', 'editor') NOT NULL DEFAULT 'user'");
    }
};
