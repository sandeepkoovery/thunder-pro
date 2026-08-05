<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\User;

return new class extends Migration
{
    public function up(): void
    {
        User::withTrashed()->get()->each(function ($user) {
            if (!empty($user->name) && (empty($user->first_name) || empty($user->last_name))) {
                $parts = explode(' ', trim($user->name), 2);
                $user->first_name = $user->first_name ?: ($parts[0] ?? '');
                $user->last_name = $user->last_name ?: ($parts[1] ?? '');
                $user->save();
            }
        });
    }

    public function down(): void
    {
    }
};
