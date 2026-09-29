<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Payslip - {{ $slip->employee_name }} - {{ $slip->month_year }}</title>
    <style>
        @page {
            margin: 28px 32px;
            size: A4 portrait;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 11px;
            line-height: 1.45;
            margin: 0;
            padding: 10px;
        }

        .header {
            text-align: center;
            margin-bottom: 22px;
        }
        .company-name {
            font-size: 19px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 5px 0;
            letter-spacing: -0.2px;
        }
        .payslip-title {
            font-size: 12.5px;
            font-weight: 700;
            color: #334155;
            margin: 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        /* Top Details Card */
        .info-card {
            width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            margin-bottom: 20px;
            background-color: #ffffff;
            border-collapse: collapse;
        }
        .info-card td {
            padding: 6.5px 12px;
            vertical-align: middle;
            border: none;
            font-size: 11px;
        }
        .info-label {
            color: #1e293b;
            font-weight: 600;
            width: 20%;
        }
        .info-value {
            color: #334155;
            font-weight: 400;
            width: 30%;
        }

        /* Main Table */
        .salary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        .salary-table th {
            background-color: #1e40af;
            color: #ffffff;
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            padding: 7px 10px;
            border: 1px solid #1e40af;
        }
        .salary-table th.col-left {
            text-align: left;
            width: 35%;
        }
        .salary-table th.col-amt {
            text-align: right;
            width: 15%;
        }
        .salary-table td {
            padding: 6.5px 10px;
            font-size: 11px;
            border-bottom: 1px solid #e2e8f0;
            border-left: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
        }
        .salary-table td.amt {
            text-align: right;
            font-variant-numeric: tabular-nums;
        }
        .salary-table tr.total-row td {
            background-color: #f0f7ff;
            font-weight: 700;
            color: #1e3a8a;
            border-top: 1px solid #bfdbfe;
            border-bottom: 1px solid #bfdbfe;
            padding: 7.5px 10px;
        }

        /* Net Pay Box */
        .net-pay-box {
            width: 100%;
            border: 1px solid #bfdbfe;
            border-radius: 4px;
            background-color: #ffffff;
            margin-top: 14px;
            border-collapse: collapse;
        }
        .net-pay-box td {
            padding: 8px 12px;
            vertical-align: middle;
        }
        .net-pay-title {
            font-weight: 700;
            color: #1d4ed8;
            font-size: 12px;
            text-align: left;
        }
        .net-pay-amount {
            font-weight: 700;
            color: #1e3a8a;
            font-size: 12.5px;
            text-align: right;
        }
        .in-words-row td {
            border-top: 1px solid #f1f5f9;
            padding: 8px 12px;
            background-color: #f8fafc;
        }
        .in-words-label {
            font-weight: 600;
            color: #475569;
            font-size: 10.5px;
            width: 25%;
            vertical-align: top;
        }
        .in-words-val {
            font-size: 10.5px;
            color: #1e293b;
            font-weight: 500;
            width: 75%;
        }

        /* Signatures */
        .signatures {
            width: 100%;
            margin-top: 85px;
            border-collapse: collapse;
        }
        .signatures td {
            width: 50%;
            vertical-align: bottom;
            font-size: 11px;
            font-weight: 600;
            color: #1e293b;
            padding: 0 10px;
        }
        .signatures .sign-left {
            text-align: left;
        }
        .signatures .sign-right {
            text-align: center;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1 class="company-name">{{ $slip->company_name }}</h1>
        <h2 class="payslip-title">PAYSLIP FOR THE MONTH OF {{ $slip->month_year }}</h2>
    </div>

    <!-- Employee & Bank Info Card -->
    <table class="info-card">
        <tr>
            <td class="info-label">Employee No:</td>
            <td class="info-value">{{ $slip->employee_no }}</td>
            <td class="info-label">Bank Name:</td>
            <td class="info-value">{{ $slip->bank_name ?: '-' }}</td>
        </tr>
        <tr>
            <td class="info-label">Employee Name:</td>
            <td class="info-value">{{ $slip->employee_name }}</td>
            <td class="info-label">Bank A/c No:</td>
            <td class="info-value">{{ $slip->bank_account_no ?: '-' }}</td>
        </tr>
        <tr>
            <td class="info-label">Payslip No:</td>
            <td class="info-value">{{ $slip->payslip_no ?: '-' }}</td>
            <td class="info-label">UAN:</td>
            <td class="info-value">{{ $slip->uan ?: '-' }}</td>
        </tr>
        <tr>
            <td class="info-label">Location:</td>
            <td class="info-value">{{ $slip->location ?: '-' }}</td>
            <td class="info-label">LWP - C/M / P/M:</td>
            <td class="info-value">{{ $slip->lwp_cm }} / {{ $slip->pm }}</td>
        </tr>
    </table>

    <!-- Main Earnings & Deductions Table -->
    <table class="salary-table">
        <thead>
            <tr>
                <th class="col-left">EARNINGS</th>
                <th class="col-amt">AMOUNT (INR)</th>
                <th class="col-left">DEDUCTIONS</th>
                <th class="col-amt">AMOUNT (INR)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Basic Salary</td>
                <td class="amt">{{ number_format($slip->basic_salary, 2) }}</td>
                <td>Ee PF Contribution</td>
                <td class="amt">{{ number_format($slip->ee_pf_contribution, 2) }}</td>
            </tr>
            <tr>
                <td>HRA</td>
                <td class="amt">{{ number_format($slip->hra, 2) }}</td>
                <td>Ee LWF Contribution</td>
                <td class="amt">{{ number_format($slip->ee_lwf_contribution, 2) }}</td>
            </tr>
            <tr>
                <td>Residuary Choice Pay</td>
                <td class="amt">{{ number_format($slip->residuary_choice_pay, 2) }}</td>
                <td>Recovery of Round Off Amt</td>
                <td class="amt">{{ number_format($slip->recovery_round_off, 2) }}</td>
            </tr>

            {{-- Optional dynamic extra rows if any --}}
            @php
                $extraEarnings = is_array($slip->extra_earnings) ? $slip->extra_earnings : [];
                $extraDeductions = is_array($slip->extra_deductions) ? $slip->extra_deductions : [];
                $maxExtra = max(count($extraEarnings), count($extraDeductions));
            @endphp
            @for ($i = 0; $i < $maxExtra; $i++)
                @php
                    $earn = $extraEarnings[$i] ?? null;
                    $ded = $extraDeductions[$i] ?? null;
                @endphp
                <tr>
                    <td>{{ $earn['label'] ?? '' }}</td>
                    <td class="amt">{{ isset($earn['amount']) ? number_format((float)$earn['amount'], 2) : '' }}</td>
                    <td>{{ $ded['label'] ?? '' }}</td>
                    <td class="amt">{{ isset($ded['amount']) ? number_format((float)$ded['amount'], 2) : '' }}</td>
                </tr>
            @endfor

            <!-- Total Summary Row -->
            <tr class="total-row">
                <td>GROSS EARNINGS</td>
                <td class="amt">{{ number_format($slip->gross_earnings, 2) }}</td>
                <td>TOTAL DEDUCTIONS</td>
                <td class="amt">{{ number_format($slip->total_deductions, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Net Pay & Amount in words Box -->
    <table class="net-pay-box">
        <tr>
            <td class="net-pay-title">NET PAY (Net Salary Received)</td>
            <td class="net-pay-amount">INR {{ number_format($slip->net_pay, 2) }}</td>
        </tr>
        <tr class="in-words-row">
            <td class="in-words-label">Amount in words:</td>
            <td class="in-words-val">{{ $slip->net_pay_in_words }}</td>
        </tr>
    </table>

    <!-- Signatures Section -->
    <table class="signatures">
        <tr>
            <td class="sign-left">Employer Signature</td>
            <td class="sign-right">Employee Signature</td>
        </tr>
    </table>

</body>
</html>
