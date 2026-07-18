<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hostings', function (Blueprint $table) {
            $table->id();
            $table->string('site_name');
            $table->string('provider');
            $table->string('plan')->nullable();
            $table->string('server_ip')->nullable();
            $table->string('status')->default('Active');
            $table->date('expiration_date');
            $table->boolean('auto_renewal')->default(true);
            $table->decimal('price', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hostings');
    }
};
