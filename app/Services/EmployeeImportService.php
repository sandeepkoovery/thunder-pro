<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use ZipArchive;

class EmployeeImportService
{
    /**
     * Download sample CSV template.
     */
    public function getSampleCsv(): string
    {
        $headers = ['employee name', 'email id', 'employee id', 'password', 'role', 'status'];
        $rows = [
            ['John Doe', 'john.doe@example.com', '', '12345678', 'user', 'active'],
            ['Sarah Connor', 'sarah.c@example.com', '', '12345678', 'manager', 'active'],
            ['Alex Morgan', 'alex.m@example.com', '', '12345678', 'user', 'active'],
        ];

        $output = fopen('php://temp', 'r+');
        // Add UTF-8 BOM for Excel compatibility
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));
        fputcsv($output, $headers);

        foreach ($rows as $row) {
            fputcsv($output, $row);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }

    /**
     * Import employees from file.
     *
     * @param UploadedFile $file
     * @param int $tenantAdminId
     * @return array
     * @throws \Exception
     */
    public function import(UploadedFile $file, int $tenantAdminId): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if (in_array($extension, ['xlsx', 'xls'])) {
            $rawRows = $this->parseXlsx($file->getRealPath());
        } else {
            $rawRows = $this->parseCsv($file->getRealPath());
        }

        if (empty($rawRows)) {
            return [
                'success' => false,
                'errors' => ['The uploaded file is empty or has no readable rows.'],
            ];
        }

        // Extract header and map column indices
        $headerRow = array_shift($rawRows);
        $columnMap = $this->mapHeaders($headerRow);

        if (!isset($columnMap['name'])) {
            return [
                'success' => false,
                'errors' => ["The file must contain an 'employee name' (or 'name') column header."],
            ];
        }

        if (!isset($columnMap['email'])) {
            return [
                'success' => false,
                'errors' => ["The file must contain an 'email id' (or 'email') column header."],
            ];
        }

        $rowCount = count($rawRows);

        if ($rowCount === 0) {
            return [
                'success' => false,
                'errors' => ['No employee data rows found in the uploaded file.'],
            ];
        }

        // Check Super Admin Total Employee Limit & Unlimited Approval
        $tenantAdmin = Admin::find($tenantAdminId);
        $hasUnlimitedEmployees = $tenantAdmin ? $tenantAdmin->hasUnlimitedEmployees() : false;

        if (!$hasUnlimitedEmployees) {
            $limitSetting = Setting::where('key', 'csv_import_limit')->value('value');
            $maxLimit = $limitSetting ? (int) $limitSetting : 100;

            $currentEmployeesCount = User::where('admin_id', $tenantAdminId)
                ->whereIn('role', ['user', 'manager', 'editor'])
                ->where('is_active', true)
                ->count();

            $remaining = max(0, $maxLimit - $currentEmployeesCount);

            if ($currentEmployeesCount >= $maxLimit) {
                return [
                    'success' => false,
                    'errors' => [
                        "You have reached your total plan limit of {$maxLimit} active employees ({$currentEmployeesCount} currently active). Please request approval from the Super Administrator to unlock unlimited employee capacity."
                    ],
                ];
            }

            if (($currentEmployeesCount + $rowCount) > $maxLimit) {
                return [
                    'success' => false,
                    'errors' => [
                        "This spreadsheet contains {$rowCount} employees, but you can only add {$remaining} more to reach your total plan limit of {$maxLimit} employees ({$currentEmployeesCount} currently active). Please reduce your file rows or request Super Admin approval for unlimited employees."
                    ],
                ];
            }
        }

        // Validate rows and check duplicate emails
        $errors = [];
        $validatedData = [];
        $seenEmails = [];
        $seenEmpIds = [];

        // Preload existing emails from DB for fast lookup (including any soft-deleted)
        $existingEmails = array_change_key_case(
            array_flip(
                array_merge(
                    DB::table('users')->pluck('email')->toArray(),
                    DB::table('admins')->pluck('email')->toArray()
                )
            ),
            CASE_LOWER
        );

        // Preload existing Employee IDs from DB (including any soft-deleted)
        $existingEmpIds = array_change_key_case(
            array_flip(
                DB::table('users')->whereNotNull('employee_id')->pluck('employee_id')->toArray()
            ),
            CASE_LOWER
        );

        // Calculate starting sequence for auto-generating employee IDs
        $nextEmpNumber = $this->getNextEmployeeNumber();

        foreach ($rawRows as $index => $row) {
            $rowNum = $index + 2; // +2 accounting for 1-based index and header row

            // Ignore empty rows
            if (empty(array_filter($row, fn($val) => trim((string)$val) !== ''))) {
                continue;
            }

            $name = trim((string)($row[$columnMap['name']] ?? ''));
            $email = strtolower(trim((string)($row[$columnMap['email']] ?? '')));
            $empId = isset($columnMap['employee_id']) ? trim((string)($row[$columnMap['employee_id']] ?? '')) : '';
            $password = isset($columnMap['password']) ? trim((string)($row[$columnMap['password']] ?? '')) : '';
            $role = isset($columnMap['role']) ? strtolower(trim((string)($row[$columnMap['role']] ?? ''))) : '';
            $status = isset($columnMap['status']) ? strtolower(trim((string)($row[$columnMap['status']] ?? ''))) : '';

            // 1. Validate Name
            if (empty($name)) {
                $errors[] = "Row {$rowNum}: Employee name is required.";
            }

            // 2. Validate Email
            if (empty($email)) {
                $errors[] = "Row {$rowNum}: Email address is required.";
            } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Row {$rowNum}: Invalid email format '{$email}'.";
            } else {
                // Check duplicate within this CSV
                if (isset($seenEmails[$email])) {
                    $errors[] = "Row {$rowNum}: Duplicate email '{$email}' already used in Row {$seenEmails[$email]} of this file.";
                } else {
                    $seenEmails[$email] = $rowNum;
                }

                // Check duplicate in Database
                if (isset($existingEmails[$email])) {
                    $errors[] = "Row {$rowNum}: Email '{$email}' is already registered in the system.";
                }
            }

            // 3. Handle Employee ID
            // If employee ID is provided, check if it's already used in DB or earlier in this file.
            // If already taken, auto-generate another unique employee ID (since employee ID can be edited in future).
            $assignedEmpId = $empId;
            if (!empty($empId)) {
                $empIdLower = strtolower($empId);
                if (isset($seenEmpIds[$empIdLower]) || isset($existingEmpIds[$empIdLower])) {
                    // ID already taken -> set blank so a new unique auto-generated ID is assigned
                    $assignedEmpId = '';
                } else {
                    $seenEmpIds[$empIdLower] = $rowNum;
                }
            }

            // 4. Validate Role (default 'user')
            $validRoles = ['user', 'manager', 'editor', 'admin'];
            if (empty($role)) {
                $role = 'user';
            } elseif (!in_array($role, $validRoles)) {
                $errors[] = "Row {$rowNum}: Invalid role '{$role}'. Allowed roles are: " . implode(', ', $validRoles) . '.';
            }

            // 5. Default Password
            if (empty($password)) {
                $password = '12345678';
            }

            // 6. Default Status (active)
            $isActive = true;
            if ($status !== '') {
                if (in_array($status, ['inactive', '0', 'false', 'disabled', 'no'])) {
                    $isActive = false;
                }
            }

            $validatedData[] = [
                'rowNum' => $rowNum,
                'name' => $name,
                'email' => $email,
                'employee_id' => $assignedEmpId,
                'password' => $password,
                'role' => $role,
                'is_active' => $isActive,
            ];
        }

        // If any error occurred, fail early and return all error messages
        if (!empty($errors)) {
            return [
                'success' => false,
                'errors' => $errors,
            ];
        }

        if (empty($validatedData)) {
            return [
                'success' => false,
                'errors' => ['No valid employee data found to import.'],
            ];
        }

        // Insert all employees inside a database transaction
        DB::beginTransaction();
        try {
            $createdCount = 0;

            foreach ($validatedData as $item) {
                // Auto generate employee ID if blank or if duplicate was cleared
                $empIdToUse = $item['employee_id'];
                if (empty($empIdToUse)) {
                    do {
                        $empIdToUse = 'EMP' . str_pad($nextEmpNumber, 3, '0', STR_PAD_LEFT);
                        $nextEmpNumber++;
                    } while (DB::table('users')->where('employee_id', $empIdToUse)->exists() || isset($seenEmpIds[strtolower($empIdToUse)]));
                    $seenEmpIds[strtolower($empIdToUse)] = true;
                }

                User::create([
                    'name' => $item['name'],
                    'email' => $item['email'],
                    'password' => Hash::make($item['password']),
                    'role' => $item['role'],
                    'employee_id' => $empIdToUse,
                    'is_active' => $item['is_active'],
                    'is_imported' => true,
                    'admin_id' => $tenantAdminId,
                    'must_change_password' => true,
                ]);

                $createdCount++;
            }

            DB::commit();

            return [
                'success' => true,
                'message' => "Successfully imported {$createdCount} employees.",
                'count' => $createdCount,
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            return [
                'success' => false,
                'errors' => ['Failed to save employees: ' . $e->getMessage()],
            ];
        }
    }

    /**
     * Parse CSV file into rows.
     */
    protected function parseCsv(string $path): array
    {
        $rows = [];
        $content = file_get_contents($path);

        if (!$content) {
            return [];
        }

        // Strip UTF-8 BOM if present
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);

        // Detect delimiter: comma, semicolon, or tab
        $firstLine = strtok($content, "\r\n");
        $commaCount = substr_count($firstLine, ',');
        $semiCount = substr_count($firstLine, ';');
        $tabCount = substr_count($firstLine, "\t");

        $delimiter = ',';
        if ($semiCount > $commaCount && $semiCount > $tabCount) {
            $delimiter = ';';
        } elseif ($tabCount > $commaCount && $tabCount > $semiCount) {
            $delimiter = "\t";
        }

        $stream = fopen('php://memory', 'r+');
        fwrite($stream, $content);
        rewind($stream);

        while (($data = fgetcsv($stream, 0, $delimiter)) !== false) {
            $rows[] = $data;
        }

        fclose($stream);
        return $rows;
    }

    /**
     * Parse XLSX file using native ZipArchive + SimpleXML.
     */
    protected function parseXlsx(string $path): array
    {
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            return $this->parseCsv($path);
        }

        // Load shared strings
        $sharedStrings = [];
        $sharedXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedXml) {
            $xml = simplexml_load_string($sharedXml);
            if ($xml && isset($xml->si)) {
                foreach ($xml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                    } elseif (isset($si->r)) {
                        $text = '';
                        foreach ($si->r as $r) {
                            $text .= (string) $r->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // Read first worksheet
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $rows = [];

        if ($sheetXml) {
            $xml = simplexml_load_string($sheetXml);
            if ($xml && isset($xml->sheetData->row)) {
                foreach ($xml->sheetData->row as $row) {
                    $rowValues = [];
                    $lastColIndex = 0;

                    foreach ($row->c as $cell) {
                        $cellRef = (string) $cell['r'];
                        // Extract column letters (e.g. A, B, AA)
                        preg_match('/([A-Z]+)/', $cellRef, $matches);
                        $colLetters = $matches[1] ?? 'A';
                        $colIndex = $this->columnLettersToIndex($colLetters);

                        // Pad empty cells if any were skipped in sparse XML
                        while ($lastColIndex < $colIndex) {
                            $rowValues[] = '';
                            $lastColIndex++;
                        }

                        $type = (string) $cell['t'];
                        $val = (string) $cell->v;

                        if ($type === 's' && isset($sharedStrings[(int) $val])) {
                            $rowValues[] = $sharedStrings[(int) $val];
                        } elseif ($type === 'inlineStr' && isset($cell->is->t)) {
                            $rowValues[] = (string) $cell->is->t;
                        } else {
                            $rowValues[] = $val;
                        }

                        $lastColIndex++;
                    }

                    $rows[] = $rowValues;
                }
            }
        }

        $zip->close();
        return $rows;
    }

    /**
     * Helper to convert Excel column letter(s) to 0-based index.
     */
    protected function columnLettersToIndex(string $letters): int
    {
        $index = 0;
        $len = strlen($letters);
        for ($i = 0; $i < $len; $i++) {
            $index = $index * 26 + (ord($letters[$i]) - ord('A') + 1);
        }
        return $index - 1;
    }

    /**
     * Map header column names to standard keys.
     */
    protected function mapHeaders(array $headers): array
    {
        $map = [];

        foreach ($headers as $index => $rawHeader) {
            $cleaned = strtolower(trim((string) $rawHeader));
            $normalized = preg_replace('/[^a-z0-9]/', '', $cleaned);

            if (in_array($normalized, ['employeename', 'name', 'fullname', 'empname'])) {
                $map['name'] = $index;
            } elseif (in_array($normalized, ['emailid', 'email', 'emailaddress', 'empemail'])) {
                $map['email'] = $index;
            } elseif (in_array($normalized, ['employeeid', 'empid', 'id', 'employeeidentification', 'empcode'])) {
                $map['employee_id'] = $index;
            } elseif (in_array($normalized, ['password', 'pass', 'defaultpassword'])) {
                $map['password'] = $index;
            } elseif (in_array($normalized, ['role', 'userrole', 'designationrole'])) {
                $map['role'] = $index;
            } elseif (in_array($normalized, ['status', 'isactive', 'active', 'userstatus'])) {
                $map['status'] = $index;
            }
        }

        return $map;
    }

    /**
     * Get the next numeric sequence for EMP IDs.
     */
    protected function getNextEmployeeNumber(): int
    {
        $ids = DB::table('users')
            ->whereNotNull('employee_id')
            ->where('employee_id', 'LIKE', 'EMP%')
            ->pluck('employee_id');

        $max = 0;
        foreach ($ids as $id) {
            // Extract numeric part
            if (preg_match('/^EMP0*(\d+)$/i', $id, $matches)) {
                $val = (int) $matches[1];
                if ($val > $max) {
                    $max = $val;
                }
            }
        }

        return $max + 1;
    }
}
