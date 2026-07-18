<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_id')->nullable()->unique()->after('id');
            $table->string('first_name')->nullable()->after('name');
            $table->string('last_name')->nullable()->after('first_name');
            $table->enum('gender', ['male', 'female', 'other'])->nullable()->after('last_name');
            $table->date('date_of_birth')->nullable()->after('gender');
            $table->string('blood_group')->nullable()->after('date_of_birth');
            $table->enum('marital_status', ['single', 'married', 'divorced'])->nullable()->after('blood_group');
            $table->string('mobile')->nullable()->after('marital_status');
            $table->text('address')->nullable()->after('mobile');
            $table->string('emergency_contact_name')->nullable()->after('address');
            $table->string('emergency_contact_number')->nullable()->after('emergency_contact_name');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete()->after('emergency_contact_number');
            $table->foreignId('reporting_manager_id')->nullable()->constrained('users')->nullOnDelete()->after('department_id');
            $table->date('joining_date')->nullable()->after('reporting_manager_id');
            $table->enum('employment_type', ['permanent', 'contract', 'intern'])->nullable()->after('joining_date');
            $table->string('branch')->nullable()->after('employment_type');
            $table->string('shift')->nullable()->after('branch');
        });

        // Auto-assign employee_ids to existing users with role 'user'
        $users = DB::table('users')->whereNull('employee_id')->orderBy('id')->get();
        $counter = 1;
        foreach ($users as $user) {
            $empId = 'EMP' . str_pad($counter, 3, '0', STR_PAD_LEFT);
            // Ensure uniqueness
            while (DB::table('users')->where('employee_id', $empId)->exists()) {
                $counter++;
                $empId = 'EMP' . str_pad($counter, 3, '0', STR_PAD_LEFT);
            }
            DB::table('users')->where('id', $user->id)->update(['employee_id' => $empId]);
            $counter++;
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropForeign(['reporting_manager_id']);
            $table->dropColumn([
                'employee_id', 'first_name', 'last_name', 'gender', 'date_of_birth',
                'blood_group', 'marital_status', 'mobile', 'address',
                'emergency_contact_name', 'emergency_contact_number',
                'department_id', 'reporting_manager_id', 'joining_date',
                'employment_type', 'branch', 'shift',
            ]);
        });
    }
};
