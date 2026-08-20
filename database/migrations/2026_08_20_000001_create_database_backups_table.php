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
        Schema::create('database_backups', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            $table->string('google_drive_file_id')->nullable();
            $table->string('google_drive_folder_id')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->enum('trigger_type', ['manual', 'automatic'])->default('manual');
            $table->timestamp('backup_started_at')->nullable();
            $table->timestamp('backup_completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('database_backups');
    }
};
