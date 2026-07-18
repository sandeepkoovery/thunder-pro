<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use App\Models\Attendance;
use Carbon\Carbon;

Schedule::call(function () {
    Attendance::where('status', '!=', 'punched_out')
        ->whereDate('date', Carbon::yesterday())
        ->update([
            'status' => 'punched_out',
            'punch_out' => Carbon::yesterday()->endOfDay(),
        ]);
})->daily();

use App\Models\Domain;
use App\Models\Hosting;
use App\Models\User;
use App\Mail\WebsitesExpiringMail;
use Illuminate\Support\Facades\Mail;

Artisan::command('websites:check-expiry', function () {
    $thirtyDaysFromNow = Carbon::now()->addDays(30);

    $expiringDomains = Domain::where('expiration_date', '<=', $thirtyDaysFromNow)
        ->whereNotIn('status', ['Transferred', 'Inactive'])
        ->get();

    $expiringHostings = Hosting::where('expiration_date', '<=', $thirtyDaysFromNow)
        ->whereNotIn('status', ['Transferred', 'Inactive'])
        ->get();

    if ($expiringDomains->count() > 0 || $expiringHostings->count() > 0) {
        $admins = User::where('role', 'admin')
            ->where('is_active', true)
            ->get();

        if ($admins->count() > 0) {
            foreach ($admins as $admin) {
                Mail::to($admin->email)->send(new WebsitesExpiringMail($expiringDomains, $expiringHostings));
            }
            $this->info('Expiry alert emails sent to ' . $admins->count() . ' admin(s).');
        } else {
            $this->warn('No active admins found.');
        }
    } else {
        $this->info('No expiring websites found.');
    }
})->purpose('Check for expiring domains and hosting accounts and send email alerts');

Schedule::command('websites:check-expiry')->daily();
