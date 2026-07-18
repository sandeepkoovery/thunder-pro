<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Websites Expiry Alert</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; color: #333333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        h1 { font-size: 22px; color: #1e293b; margin-top: 0; }
        p { font-size: 15px; color: #64748b; line-height: 1.5; }
        .section-title { font-size: 16px; font-weight: bold; color: #3b82f6; border-bottom: 2px solid #eff6ff; padding-bottom: 6px; margin-top: 24px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { text-align: left; padding: 10px; background-color: #f8fafc; font-size: 13px; color: #475569; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
        td { padding: 10px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; }
        .badge { display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 600; border-radius: 9999px; }
        .badge-danger { background-color: #fee2e2; color: #ef4444; }
        .badge-warning { background-color: #ffedd5; color: #f97316; }
        .badge-success { background-color: #dcfce7; color: #15803d; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; margin-top: 15px; font-size: 14px; }
        .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Websites Expiry Alert</h1>
        <p>Hello Admin,</p>
        <p>This is an automated notification regarding domains and hosting accounts that are expiring within the next 30 days.</p>

        @if($expiringDomains->count() > 0)
            <div class="section-title">Expiring Domains</div>
            <table>
                <thead>
                    <tr>
                        <th>Domain Name</th>
                        <th>Provider</th>
                        <th>Expiration Date</th>
                        <th>Auto Renew</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($expiringDomains as $domain)
                        @php
                            $daysLeft = \Carbon\Carbon::now()->diffInDays(\Carbon\Carbon::parse($domain->expiration_date), false);
                            $badgeClass = $daysLeft < 0 ? 'badge-danger' : ($daysLeft <= 7 ? 'badge-danger' : 'badge-warning');
                            $statusLabel = $daysLeft < 0 ? 'Expired' : ($daysLeft . ' days left');
                        @endphp
                        <tr>
                            <td><strong>{{ $domain->domain_name }}</strong></td>
                            <td>{{ $domain->provider ?? '—' }}</td>
                            <td>
                                {{ \Carbon\Carbon::parse($domain->expiration_date)->format('d M Y') }}
                                <br>
                                <span class="badge {{ $badgeClass }}">{{ $statusLabel }}</span>
                            </td>
                            <td>
                                <span class="badge {{ $domain->auto_renewal ? 'badge-success' : 'badge-warning' }}">
                                    {{ $domain->auto_renewal ? 'Auto' : 'Manual' }}
                                </span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif

        @if($expiringHostings->count() > 0)
            <div class="section-title">Expiring Hosting Accounts</div>
            <table>
                <thead>
                    <tr>
                        <th>Site Name</th>
                        <th>Provider / Plan</th>
                        <th>Expiration Date</th>
                        <th>Auto Renew</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($expiringHostings as $hosting)
                        @php
                            $daysLeft = \Carbon\Carbon::now()->diffInDays(\Carbon\Carbon::parse($hosting->expiration_date), false);
                            $badgeClass = $daysLeft < 0 ? 'badge-danger' : ($daysLeft <= 7 ? 'badge-danger' : 'badge-warning');
                            $statusLabel = $daysLeft < 0 ? 'Expired' : ($daysLeft . ' days left');
                        @endphp
                        <tr>
                            <td><strong>{{ $hosting->site_name }}</strong></td>
                            <td>{{ $hosting->provider }} ({{ $hosting->plan ?? 'Basic' }})</td>
                            <td>
                                {{ \Carbon\Carbon::parse($hosting->expiration_date)->format('d M Y') }}
                                <br>
                                <span class="badge {{ $badgeClass }}">{{ $statusLabel }}</span>
                            </td>
                            <td>
                                <span class="badge {{ $hosting->auto_renewal ? 'badge-success' : 'badge-warning' }}">
                                    {{ $hosting->auto_renewal ? 'Auto' : 'Manual' }}
                                </span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif

        <div style="text-align: center;">
            <a href="{{ route('admin.websites.index') }}" class="btn" style="color: #ffffff;">Manage Websites</a>
        </div>

        <div class="footer">
            Sent automatically by {{ config('app.name') }} CRM.
        </div>
    </div>
</body>
</html>
