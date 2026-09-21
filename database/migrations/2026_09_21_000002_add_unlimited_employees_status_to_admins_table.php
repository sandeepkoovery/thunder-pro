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
        if (Schema::hasTable('admins') && !Schema::hasColumn('admins', 'unlimited_employees_status')) {
            Schema::table('admins', function (Blueprint $table) {
                $table->string('unlimited_employees_status')->default('none')->after('approval_status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('admins') && Schema::hasColumn('admins', 'unlimited_employees_status')) {
            Schema::table('admins', function (Blueprint $table) {
                $table->dropColumn('unlimited_employees_status');
            });
        }
    }
};
