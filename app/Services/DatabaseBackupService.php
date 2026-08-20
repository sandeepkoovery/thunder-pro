<?php

namespace App\Services;

use App\Models\DatabaseBackup;
use App\Services\GoogleDriveBackupService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DatabaseBackupService
{
    protected GoogleDriveBackupService $googleDriveBackupService;

    public function __construct(GoogleDriveBackupService $googleDriveBackupService)
    {
        $this->googleDriveBackupService = $googleDriveBackupService;
    }

    /**
     * Run full database backup process.
     */
    public function runBackup(string $triggerType = 'manual'): DatabaseBackup
    {
        $lock = Cache::lock('database_backup_execution_lock', 600);

        if (!$lock->get()) {
            throw new \Exception('A database backup is already currently in progress. Please wait.');
        }

        $backup = null;
        $tempFilePath = null;
        $now = now();
        $fileName = 'worknest_backup_' . $now->format('Y-m-d_H-i-s') . '.sql';

        try {
            // 1. Create DB record in processing status
            $backup = DatabaseBackup::create([
                'file_name' => $fileName,
                'status' => 'processing',
                'trigger_type' => $triggerType,
                'backup_started_at' => $now,
                'file_size' => 0,
            ]);

            // 2. Prepare temporary file path
            $tempDir = storage_path('app/backups/temp');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }
            $tempFilePath = $tempDir . DIRECTORY_SEPARATOR . $fileName;

            // 3. Generate MySQL Dump (with automatic PHP fallback)
            try {
                $this->generateMysqlDump($tempFilePath);
            } catch (\Throwable $dumpEx) {
                Log::warning("mysqldump failed: " . $dumpEx->getMessage() . ". Falling back to PHP PDO database dumper.");
                $this->generatePhpPdoDump($tempFilePath);
            }

            if (!file_exists($tempFilePath) || filesize($tempFilePath) === 0) {
                throw new \Exception('Generated database backup file is missing or empty.');
            }

            $fileSize = filesize($tempFilePath);
            $backup->update(['file_size' => $fileSize]);

            // 4. Verify Google Drive connection
            if (!$this->googleDriveBackupService->isConnected()) {
                throw new \Exception('Google Drive account is not connected. Please connect Google Drive in Database Backup Settings.');
            }

            // 5. Upload file to Google Drive (with YYYY/MM/DD structure)
            $uploadResult = $this->googleDriveBackupService->uploadBackup($tempFilePath, $fileName, $now);

            // 6. Update backup history record to completed
            $backup->update([
                'google_drive_file_id' => $uploadResult['file_id'],
                'google_drive_folder_id' => $uploadResult['folder_id'],
                'file_size' => $uploadResult['file_size'] ?: $fileSize,
                'status' => 'completed',
                'backup_completed_at' => now(),
                'error_message' => null,
            ]);

            Log::info("Database backup completed successfully: {$fileName}", [
                'backup_id' => $backup->id,
                'file_size' => $fileSize,
                'trigger' => $triggerType
            ]);

            return $backup;

        } catch (\Throwable $e) {
            $errorMessage = $e->getMessage();
            Log::error("Database backup failed: {$errorMessage}", [
                'trigger' => $triggerType,
                'file_name' => $fileName,
            ]);

            if ($backup) {
                $backup->update([
                    'status' => 'failed',
                    'error_message' => $errorMessage,
                    'backup_completed_at' => now(),
                ]);
            }

            throw $e;

        } finally {
            // 7. Always clean up local temporary backup file
            if ($tempFilePath && file_exists($tempFilePath)) {
                @unlink($tempFilePath);
            }

            $lock->release();
        }
    }

    /**
     * Generate MySQL dump using mysqldump binary.
     */
    protected function generateMysqlDump(string $tempFilePath): void
    {
        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        if (!$dbConfig || ($dbConfig['driver'] ?? '') !== 'mysql') {
            throw new \Exception("Database driver '{$connection}' is not supported. MySQL is required.");
        }

        $host = $dbConfig['host'] ?? '127.0.0.1';
        if ($host === 'localhost') {
            $host = '127.0.0.1';
        }
        $port = $dbConfig['port'] ?? '3306';
        $username = $dbConfig['username'] ?? 'root';
        $password = $dbConfig['password'] ?? '';
        $database = $dbConfig['database'] ?? '';

        if (empty($database)) {
            throw new \Exception('Database name is not configured in environment.');
        }

        $mysqldumpBin = $this->getMysqldumpBinary();

        $passArg = !empty($password) ? ('--password=' . escapeshellarg($password)) : '';

        $command = sprintf(
            '%s --host=%s --port=%s --protocol=tcp --user=%s %s %s',
            $mysqldumpBin,
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            $passArg,
            escapeshellarg($database)
        );

        $descriptorspec = [
            0 => ["pipe", "r"], // stdin
            1 => ["file", $tempFilePath, "w"], // stdout -> write directly to dump file
            2 => ["pipe", "w"]  // stderr
        ];

        $process = proc_open($command, $descriptorspec, $pipes);

        if (!is_resource($process)) {
            throw new \Exception('Failed to execute mysqldump process.');
        }

        fclose($pipes[0]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);

        $returnVal = proc_close($process);

        if ($returnVal !== 0) {
            // Filter stderr to prevent password leakage in error logs if any
            $cleanStderr = preg_replace('/--password=\S+/', '--password=***', $stderr);
            throw new \Exception("mysqldump failed (Exit Code {$returnVal}): " . trim($cleanStderr));
        }
    }

    /**
     * Fallback database dump generator using PHP PDO.
     */
    protected function generatePhpPdoDump(string $tempFilePath): void
    {
        $handle = fopen($tempFilePath, 'w');
        if (!$handle) {
            throw new \Exception('Could not create temporary dump file for PDO backup.');
        }

        try {
            $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
            $dbName = \Illuminate\Support\Facades\DB::connection()->getDatabaseName();

            fwrite($handle, "-- WorkNest Database Backup (PHP Fallback)\n");
            fwrite($handle, "-- Generated: " . date('Y-m-d H:i:s') . "\n");
            fwrite($handle, "-- Database: {$dbName}\n\n");
            fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n");
            fwrite($handle, "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n");
            fwrite($handle, "SET time_zone = \"+00:00\";\n\n");

            $tables = \Illuminate\Support\Facades\DB::select('SHOW TABLES');
            $tableKey = 'Tables_in_' . $dbName;

            foreach ($tables as $tableObj) {
                $tableName = $tableObj->$tableKey ?? reset($tableObj);
                if (!$tableName) continue;

                fwrite($handle, "-- --------------------------------------------------------\n");
                fwrite($handle, "-- Table structure for table `{$tableName}`\n");
                fwrite($handle, "-- --------------------------------------------------------\n\n");
                fwrite($handle, "DROP TABLE IF EXISTS `{$tableName}`;\n");

                $createTableStmt = \Illuminate\Support\Facades\DB::select("SHOW CREATE TABLE `{$tableName}`");
                if (!empty($createTableStmt)) {
                    $createRow = (array)$createTableStmt[0];
                    $createSql = $createRow['Create Table'] ?? array_values($createRow)[1] ?? null;
                    if ($createSql) {
                        fwrite($handle, $createSql . ";\n\n");
                    }
                }

                // Dump table data
                $rows = \Illuminate\Support\Facades\DB::table($tableName)->get();
                if ($rows->count() > 0) {
                    fwrite($handle, "-- Dumping data for table `{$tableName}`\n\n");
                    foreach ($rows->chunk(100) as $chunk) {
                        foreach ($chunk as $row) {
                            $rowArray = (array)$row;
                            $columns = array_map(fn($col) => "`" . str_replace("`", "``", $col) . "`", array_keys($rowArray));
                            $values = array_map(function ($val) use ($pdo) {
                                if (is_null($val)) return 'NULL';
                                return $pdo->quote($val);
                            }, array_values($rowArray));

                            $insertSql = sprintf(
                                "INSERT INTO `%s` (%s) VALUES (%s);\n",
                                $tableName,
                                implode(', ', $columns),
                                implode(', ', $values)
                            );
                            fwrite($handle, $insertSql);
                        }
                    }
                    fwrite($handle, "\n");
                }
            }

            fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");

        } finally {
            fclose($handle);
        }
    }

    /**
     * Get binary path for mysqldump.
     */
    protected function getMysqldumpBinary(): string
    {
        $customPath = env('MYSQLDUMP_PATH');
        if ($customPath && file_exists($customPath)) {
            return escapeshellarg($customPath);
        }

        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $xamppPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
            if (file_exists($xamppPath)) {
                return '"' . $xamppPath . '"';
            }
        }

        return 'mysqldump';
    }
}
