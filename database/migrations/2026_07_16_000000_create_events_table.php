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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category')->default('personal'); // personal, business, family, holiday, etc
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->boolean('all_day')->default(false);
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->string('event_url')->nullable();
            $table->json('guest_ids')->nullable(); // JSON array of user IDs
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // creator user
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
