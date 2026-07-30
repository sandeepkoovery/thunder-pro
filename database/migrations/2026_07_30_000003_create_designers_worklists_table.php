<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('designers_worklists', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('admin_id')->unsigned()->nullable();
            $table->string('client_name');
            $table->date('task_date')->nullable();
            $table->bigInteger('creator_id')->unsigned();
            $table->string('task_type');
            $table->text('description');
            $table->string('status')->default('Not Done');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('designers_worklists');
    }
};
