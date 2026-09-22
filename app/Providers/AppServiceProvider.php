<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Sanitize consecutive dots in APP_URL if present
        if ($appUrl = config('app.url')) {
            if (str_contains($appUrl, '..')) {
                config(['app.url' => preg_replace('/\.{2,}/', '.', $appUrl)]);
            }
        }

        if (config('app.env') !== 'local') {
            URL::forceScheme('https');
        }

        \Illuminate\Auth\Notifications\ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            $isAdmin = ($notifiable instanceof \App\Models\Admin)
                || request()->is('admin/*')
                || request()->is('admin')
                || request()->routeIs('admin.*')
                || (isset($notifiable->role) && in_array($notifiable->role, ['admin', 'superadmin']) && request()->is('admin*'));

            $routeName = $isAdmin ? 'admin.password.reset' : 'password.reset';

            $url = url(route($routeName, [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            // Clean any consecutive dots (e.g., thunder.wishery..tech -> thunder.wishery.tech)
            $cleanedUrl = preg_replace('/\.{2,}/', '.', $url);

            if (config('app.env') !== 'local' && str_starts_with($cleanedUrl, 'http://')) {
                $cleanedUrl = 'https://' . substr($cleanedUrl, 7);
            }

            return $cleanedUrl;
        });
    }
}



