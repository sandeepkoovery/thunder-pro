<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('leaves', function (Blueprint $table) {
            DB::statement("ALTER TABLE leaves MODIFY leave_type ENUM('paid','sick','casual') NOT NULL DEFAULT 'paid'");
        });
    }

    public function down()
    {
        Schema::table('leaves', function (Blueprint $table) {
            DB::statement("ALTER TABLE leaves MODIFY leave_type ENUM('paid','sick') NOT NULL DEFAULT 'paid'");
        });
    }
};
