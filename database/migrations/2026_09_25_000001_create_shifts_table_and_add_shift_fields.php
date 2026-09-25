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
        if (!Schema::hasTable('shifts')) {
            Schema::create('shifts', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('admin_id')->nullable()->index();
                $table->string('name', 100);
                $table->string('start_time', 10)->default('09:00');
                $table->string('end_time', 10)->default('18:00');
                $table->integer('buffer_minutes')->default(30);
                $table->boolean('is_night_shift')->default(false);
                $table->boolean('is_default')->default(false);
                $table->boolean('is_active')->default(true);
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        Schema::table('admins', function (Blueprint $table) {
            if (!Schema::hasColumn('admins', 'shifts_enabled')) {
                $table->boolean('shifts_enabled')->default(false)->after('login_buffer_minutes');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'shift_id')) {
                $table->unsignedBigInteger('shift_id')->nullable()->after('branch')->index();
            }
        });

        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'shift_id')) {
                $table->unsignedBigInteger('shift_id')->nullable()->after('user_id')->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'shift_id')) {
                $table->dropColumn('shift_id');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'shift_id')) {
                $table->dropColumn('shift_id');
            }
        });

        Schema::table('admins', function (Blueprint $table) {
            if (Schema::hasColumn('admins', 'shifts_enabled')) {
                $table->dropColumn('shifts_enabled');
            }
        });

        Schema::dropIfExists('shifts');
    }
};
