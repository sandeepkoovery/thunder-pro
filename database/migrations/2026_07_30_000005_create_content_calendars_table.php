<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_calendars', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('admin_id')->unsigned()->nullable();
            $table->bigInteger('project_id')->unsigned()->nullable();
            $table->string('creative_uid');
            $table->date('date');
            $table->string('creative_type')->nullable();
            $table->string('updation')->nullable();
            $table->string('drive_link')->nullable();
            $table->string('thumbnail_link')->nullable();
            $table->text('creative_caption')->nullable();
            $table->boolean('is_additional')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_calendars');
    }
};
