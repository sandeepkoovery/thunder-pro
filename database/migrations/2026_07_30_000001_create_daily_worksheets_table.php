<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_worksheets', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('admin_id')->unsigned()->nullable();
            $table->bigInteger('user_id')->unsigned();
            $table->date('date');
            $table->string('client_name')->nullable();
            $table->string('task_type')->nullable();
            $table->string('status')->nullable();
            $table->string('file_name')->nullable();
            $table->string('drive_link')->nullable();
            $table->string('project')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_worksheets');
    }
};
