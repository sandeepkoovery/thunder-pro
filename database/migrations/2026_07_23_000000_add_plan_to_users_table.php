<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'plan')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('plan')->default('basic')->after('role');
            });
        }

        // Initialize default settings if they don't exist
        $defaults = [
            'basic_plan_price' => '999',
            'premium_plan_price' => '2999',
            'basic_plan_modules' => json_encode(["projects", "leaves", "attendance", "calendar", "chat"]),
            'premium_plan_modules' => json_encode(["projects", "users", "leaves", "attendance", "calendar", "drive", "chat", "websites", "reports"])
        ];

        foreach ($defaults as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'plan')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('plan');
            });
        }

        DB::table('settings')->whereIn('key', [
            'basic_plan_price',
            'premium_plan_price',
            'basic_plan_modules',
            'premium_plan_modules'
        ])->delete();
    }
};
