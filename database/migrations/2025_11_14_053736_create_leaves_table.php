<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // requester
            $table->string('employee_name'); // copy of user name for quick lookup
            $table->enum('leave_type', ['paid', 'sick'])->default('paid');
            $table->enum('day_type', ['full', 'half'])->default('full'); // full day or half day
            $table->date('from_date');
            $table->date('to_date');
            $table->decimal('no_of_days', 4, 2)->default(1); // e.g. 0.50, 1.00, 2.00
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('admin_comment')->nullable(); // optional admin note when approve/reject
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('leaves');
    }
};
