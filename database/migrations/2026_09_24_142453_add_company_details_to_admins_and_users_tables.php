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
        if (Schema::hasTable('admins')) {
            Schema::table('admins', function (Blueprint $table) {
                if (!Schema::hasColumn('admins', 'address')) {
                    $table->text('address')->nullable()->after('phone');
                }
                if (!Schema::hasColumn('admins', 'gst_no')) {
                    $table->string('gst_no', 50)->nullable()->after('phone');
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'company_name')) {
                    $table->string('company_name')->nullable()->after('name');
                }
                if (!Schema::hasColumn('users', 'gst_no')) {
                    $table->string('gst_no', 50)->nullable()->after('address');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('admins')) {
            Schema::table('admins', function (Blueprint $table) {
                if (Schema::hasColumn('admins', 'gst_no')) {
                    $table->dropColumn('gst_no');
                }
                if (Schema::hasColumn('admins', 'address')) {
                    $table->dropColumn('address');
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'gst_no')) {
                    $table->dropColumn('gst_no');
                }
                if (Schema::hasColumn('users', 'company_name')) {
                    $table->dropColumn('company_name');
                }
            });
        }
    }
};
