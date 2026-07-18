<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'IT', 'code' => 'IT', 'description' => 'Information Technology'],
            ['name' => 'HR', 'code' => 'HR', 'description' => 'Human Resources'],
            ['name' => 'Accounts', 'code' => 'ACCT', 'description' => 'Accounts and Finance'],
            ['name' => 'Sales', 'code' => 'SALES', 'description' => 'Sales and Business Development'],
            ['name' => 'Marketing', 'code' => 'MKTG', 'description' => 'Marketing and Advertising'],
        ];

        foreach ($departments as $dept) {
            Department::updateOrCreate(['name' => $dept['name']], $dept);
        }
    }
}
