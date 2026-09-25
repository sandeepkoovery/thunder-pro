<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            if (!Schema::hasColumn('admins', 'workshift_enabled')) {
                $table->boolean('workshift_enabled')->default(false)->after('shifts_enabled');
            }
        });

        // Initialize workshift_enabled = true for admins that already have shifts_enabled = true
        \Illuminate\Support\Facades\DB::table('admins')
            ->where('shifts_enabled', true)
            ->update(['workshift_enabled' => true]);
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            if (Schema::hasColumn('admins', 'workshift_enabled')) {
                $table->dropColumn('workshift_enabled');
            }
        });
    }
};
