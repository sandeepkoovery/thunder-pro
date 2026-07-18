<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->decimal('punch_in_lat', 10, 8)->nullable();
            $table->decimal('punch_in_lng', 11, 8)->nullable();
            $table->decimal('punch_out_lat', 10, 8)->nullable();
            $table->decimal('punch_out_lng', 11, 8)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['punch_in_lat', 'punch_in_lng', 'punch_out_lat', 'punch_out_lng']);
        });
    }
};
