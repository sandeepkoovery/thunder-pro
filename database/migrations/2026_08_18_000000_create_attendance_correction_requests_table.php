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
        Schema::create('attendance_correction_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('admin_id')->default(0)->index();
            $table->foreignId('attendance_id')->nullable()->constrained('attendances')->onDelete('set null');
            $table->foreignId('attendance_break_id')->nullable()->constrained('attendance_breaks')->onDelete('set null');
            $table->string('request_type'); // 'punch_time' or 'break_time'
            $table->string('break_action')->nullable(); // 'add' or 'edit'
            $table->date('date');
            $table->dateTime('requested_punch_in')->nullable();
            $table->dateTime('requested_punch_out')->nullable();
            $table->dateTime('requested_break_start')->nullable();
            $table->dateTime('requested_break_end')->nullable();
            $table->text('reason')->nullable();
            $table->string('status')->default('pending'); // 'pending', 'approved', 'rejected'
            $table->text('admin_note')->nullable();
            $table->unsignedBigInteger('actioned_by')->nullable();
            $table->timestamp('actioned_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_correction_requests');
    }
};
