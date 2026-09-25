<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        // Auto-close any ancient unclosed attendances from previous dates
        DB::table('attendances')
            ->where('status', '!=', 'punched_out')
            ->where('date', '<', Carbon::today()->toDateString())
            ->update([
                'status' => 'punched_out',
                'punch_out' => DB::raw("CONCAT(DATE(punch_in), ' 23:59:59')"),
                'total_worked_minutes' => DB::raw("COALESCE(total_worked_minutes, 0)"),
            ]);
    }

    public function down(): void
    {
    }
};
