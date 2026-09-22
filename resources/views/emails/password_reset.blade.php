<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 30px 15px; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                    {{ config('app.name', 'Thunder ERP') }}
                </h2>
            </td>
        </tr>

        <!-- Body Content -->
        <tr>
            <td style="padding: 32px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 18px; font-weight: 700; color: #1e293b;">
                    Hello!
                </h3>
                
                <p style="margin-top: 0; margin-bottom: 24px; font-size: 15px; color: #475569; line-height: 1.6;">
                    You are receiving this email because we received a password reset request for your account. Click the button below to choose your new password.
                </p>

                <!-- Bulletproof Action Button -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 32px auto;">
                    <tr>
                        <td align="center" bgcolor="#4f46e5" style="border-radius: 10px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);">
                            <a href="{{ $resetUrl }}"
                               target="_blank"
                               style="font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 700; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 36px; border-radius: 10px; border: 1px solid #4f46e5; background-color: #4f46e5; line-height: 1.2;">
                                Reset Password
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="margin-top: 28px; margin-bottom: 8px; font-size: 14px; color: #64748b; line-height: 1.5;">
                    This password reset link will expire in {{ $count ?? 60 }} minutes.
                </p>
                <p style="margin-top: 0; margin-bottom: 24px; font-size: 14px; color: #64748b; line-height: 1.5;">
                    If you did not request a password reset, no further action is required.
                </p>

                <p style="margin-top: 24px; margin-bottom: 0; font-size: 14px; color: #334155; font-weight: 600;">
                    Regards,<br>
                    {{ config('app.name', 'Thunder ERP') }}
                </p>
            </td>
        </tr>

        <!-- Subcopy Fallback Link -->
        <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; line-height: 1.6;">
                If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:
                <div style="margin-top: 8px; word-break: break-all;">
                    <a href="{{ $resetUrl }}" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">
                        {{ $resetUrl }}
                    </a>
                </div>
            </td>
        </tr>
    </table>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;">
        &copy; {{ date('Y') }} {{ config('app.name', 'Thunder ERP') }}. All rights reserved.
    </div>
</body>
</html>
