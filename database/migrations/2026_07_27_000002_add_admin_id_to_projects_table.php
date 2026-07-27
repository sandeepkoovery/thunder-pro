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
        if (!Schema::hasColumn('projects', 'admin_id')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->unsignedBigInteger('admin_id')->nullable()->after('id');
            });

            // Assign existing seed projects to SuperAdmin (Admin ID 1 if exists)
            $firstAdminId = DB::table('admins')->where('role', 'superadmin')->value('id') ?? DB::table('admins')->value('id');
            if ($firstAdminId) {
                DB::table('projects')->whereNull('admin_id')->update(['admin_id' => $firstAdminId]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('projects', 'admin_id')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropColumn('admin_id');
            });
        }
    }
};
