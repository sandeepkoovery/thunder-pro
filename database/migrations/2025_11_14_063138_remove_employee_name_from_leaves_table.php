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
            if (Schema::hasColumn('leaves', 'employee_name')) {
                $table->dropColumn('employee_name');
            }
        });
    }

    public function down()
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->string('employee_name')->nullable();
        });
    }
};
