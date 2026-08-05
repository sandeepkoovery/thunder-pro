<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_worksheet_settings', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });

        Schema::table('daily_worksheets', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('daily_worksheet_settings', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });

        Schema::table('daily_worksheets', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};
