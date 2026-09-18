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
        Schema::table('admins', function (Blueprint $table) {
            if (!Schema::hasColumn('admins', 'office_start_time')) {
                $table->string('office_start_time', 10)->default('09:00')->after('sick_leaves');
            }
            if (!Schema::hasColumn('admins', 'office_end_time')) {
                $table->string('office_end_time', 10)->default('18:00')->after('office_start_time');
            }
            if (!Schema::hasColumn('admins', 'login_buffer_minutes')) {
                $table->integer('login_buffer_minutes')->default(30)->after('office_end_time');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('admins', 'office_start_time')) {
                $columnsToDrop[] = 'office_start_time';
            }
            if (Schema::hasColumn('admins', 'office_end_time')) {
                $columnsToDrop[] = 'office_end_time';
            }
            if (Schema::hasColumn('admins', 'login_buffer_minutes')) {
                $columnsToDrop[] = 'login_buffer_minutes';
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
