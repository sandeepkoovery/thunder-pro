<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_worksheet_settings', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('admin_id')->unsigned()->nullable();
            $table->bigInteger('user_id')->unsigned();
            $table->boolean('client_name_enabled')->default(true);
            $table->boolean('task_type_enabled')->default(true);
            $table->boolean('status_enabled')->default(true);
            $table->boolean('file_name_enabled')->default(true);
            $table->boolean('drive_link_enabled')->default(true);
            $table->boolean('project_enabled')->default(true);
            $table->text('task_type_options')->nullable();
            $table->boolean('task_type_freetext')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_worksheet_settings');
    }
};
