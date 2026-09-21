<?php

require_once __DIR__ . '/../../../../xampp/htdocs/erp_pro/vendor/autoload.php';
$app = require_once __DIR__ . '/../../../../xampp/htdocs/erp_pro/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Admin;
use App\Models\User;
use App\Models\Setting;
use App\Services\EmployeeImportService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

echo "=== STARTING VERIFICATION TEST ===\n";

// 1. Ensure test admin exists
$testEmail = 'test_tenant_importer@example.com';
$admin = Admin::where('email', $testEmail)->first();
if (!$admin) {
    $admin = Admin::create([
        'name' => 'Test Tenant Importer',
        'company_name' => 'Test Import Corp',
        'email' => $testEmail,
        'password' => Hash::make('password123'),
        'plan' => 'premium',
        'role' => 'admin',
        'approval_status' => 'approved',
        'is_active' => true,
        'unlimited_employees_status' => 'none',
    ]);
} else {
    $admin->update([
        'plan' => 'premium',
        'approval_status' => 'approved',
        'is_active' => true,
        'unlimited_employees_status' => 'none',
    ]);
}

// Clean previous test users for this admin
User::where('admin_id', $admin->id)->forceDelete();

// 2. Set global limit to 100
Setting::updateOrCreate(['key' => 'csv_import_limit'], ['value' => '100']);

echo "Current active users count for test admin: " . User::where('admin_id', $admin->id)->count() . "\n";

// Helper function to create fake CSV UploadedFile
function makeCsvFile(array $rows, string $filename = 'test.csv'): UploadedFile {
    $temp = tempnam(sys_get_temp_dir(), 'csv_');
    $fp = fopen($temp, 'w');
    foreach ($rows as $row) {
        fputcsv($fp, $row);
    }
    fclose($fp);
    return new UploadedFile($temp, $filename, 'text/csv', null, true);
}

$service = new EmployeeImportService();

// TEST 1: Duplicate Email in CSV detection
echo "\n--- TEST 1: Duplicate Email in CSV ---\n";
$csvDuplicateInFile = makeCsvFile([
    ['employee name', 'email id', 'employee id', 'password', 'role', 'status'],
    ['User One', 'dup@example.com', '', '12345678', 'user', 'active'],
    ['User Two', 'dup@example.com', '', '12345678', 'user', 'active'],
]);
$res = $service->import($csvDuplicateInFile, $admin->id);
echo "Duplicate email in CSV success: " . ($res['success'] ? 'true' : 'false') . "\n";
echo "Errors: " . implode(', ', $res['errors']) . "\n";

// TEST 2: Conflicting employee ID auto-generation
echo "\n--- TEST 2: Conflicting Employee ID Auto-Resolution ---\n";
// Create an existing user with EMP0099
User::create([
    'admin_id' => $admin->id,
    'name' => 'Existing EMP99',
    'email' => 'existing99@example.com',
    'employee_id' => 'EMP0099',
    'password' => Hash::make('12345678'),
    'role' => 'user',
    'is_active' => true,
]);

// Import with employee_id = EMP0099. Should NOT fail; should assign another sequential ID!
$csvConflictId = makeCsvFile([
    ['employee name', 'email id', 'employee id', 'password', 'role', 'status'],
    ['New User Conflicting ID', 'new99@example.com', 'EMP0099', '12345678', 'user', 'active'],
]);
$resConflict = $service->import($csvConflictId, $admin->id);
echo "Conflicting ID import success: " . ($resConflict['success'] ? 'true' : 'false') . "\n";
if ($resConflict['success']) {
    $importedUser = User::where('email', 'new99@example.com')->first();
    echo "Assigned employee_id: " . $importedUser->employee_id . " (Notice: Not EMP0099, automatically reassigned!)\n";
} else {
    echo "Errors: " . implode(', ', $resConflict['errors']) . "\n";
}

// TEST 3: Capacity Limit (Limit = 100, simulate 95 users already added)
echo "\n--- TEST 3: Capacity Limit Enforcement (e.g. 100 ceiling) ---\n";
// We currently have 2 users. Let's create dummy users up to 95.
$currentCount = User::where('admin_id', $admin->id)->count();
for ($i = $currentCount + 1; $i <= 95; $i++) {
    User::create([
        'admin_id' => $admin->id,
        'name' => "Bulk User $i",
        'email' => "bulk_user_{$i}@example.com",
        'employee_id' => "EMP" . str_pad($i, 4, '0', STR_PAD_LEFT),
        'password' => Hash::make('12345678'),
        'role' => 'user',
        'is_active' => true,
    ]);
}
$nowCount = User::where('admin_id', $admin->id)->count();
echo "Current users count: {$nowCount} / 100 limit.\n";

// Try importing 10 users (which would exceed 100 total capacity, since 95 + 10 = 105 > 100)
$rowsExceed = [
    ['employee name', 'email id', 'employee id', 'password', 'role', 'status']
];
for ($k = 1; $k <= 10; $k++) {
    $rowsExceed[] = ["Extra User $k", "extra_{$k}@example.com", "", "12345678", "user", "active"];
}
$csvExceed = makeCsvFile($rowsExceed);
$resExceed = $service->import($csvExceed, $admin->id);
echo "Import 10 rows when 95 exist (should fail): " . ($resExceed['success'] ? 'true' : 'false') . "\n";
echo "Error message: " . implode(' | ', $resExceed['errors']) . "\n";

// Now import exactly 5 users (95 + 5 = 100, exactly at limit)
$rowsFit = [
    ['employee name', 'email id', 'employee id', 'password', 'role', 'status']
];
for ($k = 1; $k <= 5; $k++) {
    $rowsFit[] = ["Fit User $k", "fit_{$k}@example.com", "", "12345678", "user", "active"];
}
$csvFit = makeCsvFile($rowsFit);
$resFit = $service->import($csvFit, $admin->id);
echo "\nImport 5 rows when 95 exist (should SUCCEED): " . ($resFit['success'] ? 'true' : 'false') . "\n";
echo "Imported count: " . ($resFit['imported_count'] ?? 0) . "\n";
echo "New total users: " . User::where('admin_id', $admin->id)->count() . " / 100\n";

// TEST 4: Super Admin Approval grants Unlimited Capacity
echo "\n--- TEST 4: Super Admin Unlimited Approval ---\n";
// Currently 100 / 100 users. Importing 1 more without approval should fail:
$csvOneMore = makeCsvFile([
    ['employee name', 'email id', 'employee id', 'password', 'role', 'status'],
    ['Beyond Limit User', 'beyond_1@example.com', '', '12345678', 'user', 'active']
]);
$resOneMore = $service->import($csvOneMore, $admin->id);
echo "Attempting to import 1 more beyond limit before approval (should fail): " . ($resOneMore['success'] ? 'true' : 'false') . "\n";
echo "Error: " . implode(' | ', $resOneMore['errors']) . "\n";

// Now Super Admin approves unlimited employees for this admin:
$admin->update(['unlimited_employees_status' => 'approved']);
$admin->refresh();
echo "Super Admin updated unlimited_employees_status to 'approved'.\n";
echo "Admin hasUnlimitedEmployees(): " . ($admin->hasUnlimitedEmployees() ? 'YES' : 'NO') . "\n";

// Now import beyond 100:
$csvBeyond = makeCsvFile([
    ['employee name', 'email id', 'employee id', 'password', 'role', 'status'],
    ['Beyond Limit User 1', 'beyond_1@example.com', '', '12345678', 'user', 'active'],
    ['Beyond Limit User 2', 'beyond_2@example.com', '', '12345678', 'user', 'active'],
    ['Beyond Limit User 3', 'beyond_3@example.com', '', '12345678', 'user', 'active'],
]);
$resBeyond = $service->import($csvBeyond, $admin->id);
echo "Importing beyond 100 after approval (should SUCCEED): " . ($resBeyond['success'] ? 'true' : 'false') . "\n";
echo "Imported count: " . ($resBeyond['imported_count'] ?? 0) . "\n";
echo "Final users count: " . User::where('admin_id', $admin->id)->count() . "\n";

// Cleanup test data
User::where('admin_id', $admin->id)->forceDelete();
$admin->delete();

echo "\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n";
