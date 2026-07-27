<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['admin_id']);
            });
        } catch (\Exception $e) {
            // Foreign key might not exist or already dropped
        }

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('admin_id')->references('id')->on('admins')->nullOnDelete();
        });

        // Update all existing employee users to belong to client Admin #8
        DB::table('users')->update(['admin_id' => 8]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['admin_id']);
                $table->foreign('admin_id')->references('id')->on('users')->nullOnDelete();
            });
        } catch (\Exception $e) {
            // Revert fallback
        }
    }
};
