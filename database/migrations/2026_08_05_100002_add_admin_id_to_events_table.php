<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->unsignedBigInteger('admin_id')->nullable()->after('id');
            $table->foreign('admin_id')->references('id')->on('admins')->nullOnDelete();
        });

        // Backfill: set admin_id from the creator user's admin_id
        DB::statement("
            UPDATE events e
            INNER JOIN users u ON e.user_id = u.id
            SET e.admin_id = u.admin_id
            WHERE u.admin_id IS NOT NULL
        ");
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['admin_id']);
            $table->dropColumn('admin_id');
        });
    }
};
