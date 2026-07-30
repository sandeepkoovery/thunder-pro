<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('designers_worklist_user', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('designers_worklist_id')->unsigned();
            $table->bigInteger('user_id')->unsigned();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('designers_worklist_user');
    }
};
