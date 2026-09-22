<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Lang;

class ResetPasswordNotification extends BaseResetPassword
{
    /**
     * Get the reset URL for the given notifiable.
     *
     * @param  mixed  $notifiable
     * @return string
     */
    protected function resetUrl($notifiable)
    {
        if (static::$createUrlCallback) {
            $url = call_user_func(static::$createUrlCallback, $notifiable, $this->token);
        } else {
            $isAdmin = ($notifiable instanceof \App\Models\Admin)
                || (isset($notifiable->role) && in_array($notifiable->role, ['admin', 'superadmin']) && request()->is('admin*'));

            $routeName = $isAdmin ? 'admin.password.reset' : 'password.reset';

            $url = url(route($routeName, [
                'token' => $this->token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));
        }

        // 1. Remove all consecutive dots (e.g., thunder.wishery..tech -> thunder.wishery.tech)
        $cleanedUrl = preg_replace('/\.{2,}/', '.', $url);

        // 2. Direct hard-coded safety replacement for this specific domain typo
        $cleanedUrl = str_replace('wishery..tech', 'wishery.tech', $cleanedUrl);

        // 3. Force https on production/live servers
        if (!app()->isLocal() && str_starts_with($cleanedUrl, 'http://')) {
            $cleanedUrl = 'https://' . substr($cleanedUrl, 7);
        }

        return $cleanedUrl;
    }

    /**
     * Build the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $url = $this->resetUrl($notifiable);

        return (new MailMessage)
            ->subject(Lang::get('Reset Password Notification'))
            ->view('emails.password_reset', [
                'resetUrl' => $url,
                'notifiable' => $notifiable,
                'count' => config('auth.passwords.' . config('auth.defaults.passwords') . '.expire', 60),
            ]);
    }
}
