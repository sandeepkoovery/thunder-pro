<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Create or update a normal user account
        User::updateOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Normal User',
                'role' => 'user',
                'password' => Hash::make('password'), // change if needed
                'email_verified_at' => now(),
            ]
        );
    }
}
