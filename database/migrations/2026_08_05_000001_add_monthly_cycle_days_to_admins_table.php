<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->integer('month_start_day')->default(25)->after('is_active');
            $table->integer('month_end_day')->default(24)->after('month_start_day');
        });
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn(['month_start_day', 'month_end_day']);
        });
    }
};
