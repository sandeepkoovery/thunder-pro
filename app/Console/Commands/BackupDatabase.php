<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DatabaseBackupService;
use App\Models\Setting;
use Carbon\Carbon;

class BackupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:database {--force : Force execution regardless of scheduled time or enabled state}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a MySQL database dump and upload to Google Drive according to configuration';

    /**
     * Execute the console command.
     */
    public function handle(DatabaseBackupService $backupService): int
    {
        $isForced = $this->option('force');
        $timezone = config('app.timezone', 'Asia/Kolkata');
        $now = now($timezone);

        if (!$isForced) {
            $isEnabled = Setting::where('key', 'backup_auto_enabled')->value('value');
            if ($isEnabled !== '1') {
                $this->info('Automatic backup is disabled in settings.');
                return Command::SUCCESS;
            }

            $configuredTime = Setting::where('key', 'backup_daily_time')->value('value') ?: '23:59';
            try {
                $configuredHourMinute = Carbon::parse($configuredTime, $timezone)->format('H:i');
            } catch (\Exception $e) {
                $configuredHourMinute = '23:59';
            }

            $currentHourMinute = $now->format('H:i');
            $todayDate = $now->format('Y-m-d');

            if ($currentHourMinute < $configuredHourMinute) {
                // Not backup time yet today
                return Command::SUCCESS;
            }

            // Check if automatic backup was already run for today's date
            $lastAutoRun = Setting::where('key', 'backup_last_auto_run')->value('value');

            if ($lastAutoRun === $todayDate) {
                $this->info("Automatic backup already ran for date {$todayDate}. Skipping.");
                return Command::SUCCESS;
            }

            // Save last auto run date
            Setting::updateOrCreate(['key' => 'backup_last_auto_run'], ['value' => $todayDate]);
        }

        $this->info('Starting database backup process...');

        try {
            $backup = $backupService->runBackup($isForced ? 'manual' : 'automatic');
            $this->info("Database backup created successfully: {$backup->file_name} (Size: {$backup->formatted_file_size})");
            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Database backup failed: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
