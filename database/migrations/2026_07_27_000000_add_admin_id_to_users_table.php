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
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete()->after('role');
        });

        // Find primary admin user to link existing employees to
        $defaultAdmin = DB::table('users')->where('role', 'admin')->orderBy('id')->first();
        if ($defaultAdmin) {
            DB::table('users')
                ->whereIn('role', ['user', 'manager', 'editor'])
                ->whereNull('admin_id')
                ->update(['admin_id' => $defaultAdmin->id]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['admin_id']);
            $table->dropColumn('admin_id');
        });
    }
};
