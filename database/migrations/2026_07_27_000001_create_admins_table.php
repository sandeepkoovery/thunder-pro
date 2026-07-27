<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['superadmin', 'admin'])->default('admin');
            $table->enum('plan', ['basic', 'premium'])->default('basic');
            $table->string('company_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('image')->nullable();
            $table->string('thumb')->nullable();
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });

        // Migrate existing superadmin & admin accounts from users table to admins table
        $existingAdmins = DB::table('users')->whereIn('role', ['superadmin', 'admin'])->get();
        foreach ($existingAdmins as $adm) {
            DB::table('admins')->insertOrIgnore([
                'id' => $adm->id,
                'name' => $adm->name,
                'email' => $adm->email,
                'password' => $adm->password,
                'role' => $adm->role,
                'plan' => $adm->plan ?? 'basic',
                'company_name' => $adm->address ?? null,
                'phone' => $adm->phone ?? null,
                'image' => $adm->image ?? null,
                'thumb' => $adm->thumb ?? null,
                'is_active' => $adm->is_active ?? true,
                'created_at' => $adm->created_at ?? now(),
                'updated_at' => $adm->updated_at ?? now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('admins');
    }
};
