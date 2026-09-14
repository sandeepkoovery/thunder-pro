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
        Schema::table('admins', function (Blueprint $table) {
            if (!Schema::hasColumn('admins', 'trial_ends_at')) {
                $table->timestamp('trial_ends_at')->nullable()->after('plan');
            }
            if (!Schema::hasColumn('admins', 'subscription_status')) {
                $table->string('subscription_status')->default('active')->after('trial_ends_at');
            }
            if (!Schema::hasColumn('admins', 'subscribed_at')) {
                $table->timestamp('subscribed_at')->nullable()->after('subscription_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn(['trial_ends_at', 'subscription_status', 'subscribed_at']);
        });
    }
};
