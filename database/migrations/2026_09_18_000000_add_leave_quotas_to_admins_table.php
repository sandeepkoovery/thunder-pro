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
            if (!Schema::hasColumn('admins', 'casual_leaves')) {
                $table->integer('casual_leaves')->default(12)->after('month_end_day');
            }
            if (!Schema::hasColumn('admins', 'sick_leaves')) {
                $table->integer('sick_leaves')->default(12)->after('casual_leaves');
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
            if (Schema::hasColumn('admins', 'casual_leaves')) {
                $columnsToDrop[] = 'casual_leaves';
            }
            if (Schema::hasColumn('admins', 'sick_leaves')) {
                $columnsToDrop[] = 'sick_leaves';
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
