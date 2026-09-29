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
        Schema::create('salary_slips', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admin_id')->nullable()->index();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('batch_id')->nullable()->index();

            // Metadata & Company
            $table->string('company_name')->default('Network18 Media & Inv. Ltd.');
            $table->string('month_year')->index(); // e.g. "AUGUST 2026"
            $table->date('month_date')->nullable()->index(); // e.g. 2026-08-01 for sorting

            // Employee & Bank Info
            $table->string('employee_no')->index();
            $table->string('employee_name');
            $table->string('payslip_no')->nullable();
            $table->string('location')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account_no')->nullable();
            $table->string('uan')->nullable();

            // Attendance / Basic rate
            $table->decimal('basic_stipend', 12, 2)->default(0);
            $table->string('lwp_cm')->default('0'); // Leave without pay current month
            $table->string('pm')->default('0');     // Previous month / Paid days

            // Earnings
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->decimal('hra', 12, 2)->default(0);
            $table->decimal('residuary_choice_pay', 12, 2)->default(0);
            $table->json('extra_earnings')->nullable(); // flexible for extra components
            $table->decimal('gross_earnings', 12, 2)->default(0);

            // Deductions
            $table->decimal('ee_pf_contribution', 12, 2)->default(0);
            $table->decimal('ee_lwf_contribution', 12, 2)->default(0);
            $table->decimal('recovery_round_off', 12, 2)->default(0);
            $table->json('extra_deductions')->nullable(); // flexible for extra components
            $table->decimal('total_deductions', 12, 2)->default(0);

            // Net Pay
            $table->decimal('net_pay', 12, 2)->default(0);
            $table->text('net_pay_in_words')->nullable();

            $table->string('pdf_path')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            // Foreign key to users
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_slips');
    }
};
