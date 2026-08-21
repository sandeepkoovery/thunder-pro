<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Backup Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header Banner -->
        @php
            $isSuccess = ($backupDetails['status'] ?? '') === 'completed';
            $bannerBg = $isSuccess ? '#10b981' : '#ef4444';
            $statusText = $isSuccess ? 'DATABASE BACKUP COMPLETED' : 'DATABASE BACKUP FAILED';
            $iconSymbol = $isSuccess ? '✓' : '✕';
        @endphp
        <tr>
            <td style="background-color: {{ $bannerBg }}; padding: 24px 32px; text-align: center; color: #ffffff;">
                <div style="font-size: 32px; font-weight: bold; line-height: 1; margin-bottom: 8px;">{{ $iconSymbol }}</div>
                <h1 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">{{ $statusText }}</h1>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">
                    Mode: {{ ucfirst($backupDetails['trigger_type'] ?? 'database') }} Backup
                </p>
            </td>
        </tr>

        <!-- Content Body -->
        <tr>
            <td style="padding: 32px;">
                <p style="margin-top: 0; font-size: 14px; color: #475569; font-weight: 500;">
                    Hello Super Admin,
                </p>
                <p style="font-size: 14px; color: #334155; line-height: 1.5; margin-bottom: 24px;">
                    @if($isSuccess)
                        A new MySQL database backup was generated and safely uploaded to your Google Drive account. Below are full details of the completed operation:
                    @else
                        An issue occurred while executing the database backup. Please review the error details below:
                    @endif
                </p>

                <!-- Details Table -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; padding: 16px; margin-bottom: 24px;">
                    <tr>
                        <td style="padding: 8px 12px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; width: 35%;">Backup Status</td>
                        <td style="padding: 8px 12px; font-size: 13px; font-weight: 800; color: {{ $isSuccess ? '#059669' : '#dc2626' }}; uppercase;">
                            {{ $isSuccess ? 'SUCCESS (COMPLETED)' : 'FAILED' }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Execution Type</td>
                        <td style="padding: 8px 12px; font-size: 13px; font-weight: 700; color: #1e293b;">
                            {{ ucfirst($backupDetails['trigger_type'] ?? 'manual') }} Backup
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">File Name</td>
                        <td style="padding: 8px 12px; font-size: 13px; font-family: monospace; font-weight: 700; color: #0f172a; word-break: break-all;">
                            {{ $backupDetails['file_name'] ?? 'N/A' }}
                        </td>
                    </tr>
                    @if($isSuccess && !empty($backupDetails['formatted_file_size']))
                    <tr>
                        <td style="padding: 8px 12px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">File Size</td>
                        <td style="padding: 8px 12px; font-size: 13px; font-weight: 700; color: #1e293b;">
                            {{ $backupDetails['formatted_file_size'] }}
                        </td>
                    </tr>
                    @endif
                    <tr>
                        <td style="padding: 8px 12px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Google Drive Folder</td>
                        <td style="padding: 8px 12px; font-size: 13px; font-weight: 700; color: #4338ca;">
                            {{ $backupDetails['gdrive_folder'] ?? 'WorkNest Backups/YYYY/MM/DD' }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Timestamp</td>
                        <td style="padding: 8px 12px; font-size: 13px; font-weight: 600; color: #334155;">
                            {{ $backupDetails['timestamp'] ?? now()->toDateTimeString() }} ({{ config('app.timezone', 'Asia/Kolkata') }})
                        </td>
                    </tr>
                </table>

                <!-- Error Box if Failed -->
                @if(!$isSuccess && !empty($backupDetails['error_message']))
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <div style="font-size: 12px; font-weight: 800; color: #991b1b; text-transform: uppercase; margin-bottom: 6px;">Error Message Details</div>
                    <div style="font-size: 13px; font-family: monospace; color: #b91c1c; word-break: break-all; white-space: pre-wrap;">{{ $backupDetails['error_message'] }}</div>
                </div>
                @endif

                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 0;">
                    You are receiving this automated email notification because your email address is configured as the <strong>Backup Notification Email</strong> under System Settings.
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; font-weight: 600;">
                WorkNest ERP &bull; Automated Database Backup System &bull; {{ date('Y') }}
            </td>
        </tr>
    </table>
</body>
</html>
