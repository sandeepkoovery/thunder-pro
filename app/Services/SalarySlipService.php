<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\SalarySlip;
use App\Models\Setting;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class SalarySlipService
{
    /**
     * Import salary slips from an uploaded Excel or CSV file.
     */
    public function import(
        UploadedFile $file,
        ?int $tenantAdminId = null,
        ?string $manualMonth = null,
        ?string $manualCompanyName = null
    ): array {
        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray(null, true, true, false);
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Unable to read the uploaded spreadsheet: ' . $e->getMessage(),
                'imported_count' => 0,
            ];
        }

        if (empty($rows)) {
            return [
                'success' => false,
                'message' => 'The uploaded file is empty.',
                'imported_count' => 0,
            ];
        }

        // 1. Detect Company Name & Month from top rows if present
        $detectedCompany = null;
        $detectedMonth = null;
        $headerRowIndex = null;

        foreach ($rows as $idx => $row) {
            $rowText = implode(' ', array_filter(array_map('strval', $row)));

            // Check for Month/Year header: e.g. "PAYSLIP FOR THE MONTH OF AUGUST 2026"
            if (preg_match('/PAYSLIP\s+FOR\s+THE\s+MONTH\s+OF\s+([A-Z0-9\s,-]+)/i', $rowText, $m)) {
                $detectedMonth = trim($m[1]);
                if ($idx > 0 && !$detectedCompany) {
                    // Check previous row for company name
                    $prevRowText = trim(implode(' ', array_filter(array_map('strval', $rows[$idx - 1]))));
                    if (!empty($prevRowText) && strlen($prevRowText) < 150) {
                        $detectedCompany = $prevRowText;
                    }
                }
            }

            // Check if this row is the column headers row
            $normalizedRow = array_map(function ($val) {
                return strtolower(preg_replace('/[^a-zA-Z0-9]/', '', (string)$val));
            }, $row);

            $hasEmp = in_array('employeeno', $normalizedRow) || in_array('empno', $normalizedRow) || in_array('empid', $normalizedRow) || in_array('employeeid', $normalizedRow);
            $hasName = in_array('name', $normalizedRow) || in_array('employeename', $normalizedRow);
            $hasNet = in_array('netpay', $normalizedRow) || in_array('netsalary', $normalizedRow) || in_array('gross', $normalizedRow) || in_array('grossearnings', $normalizedRow);

            if (($hasEmp && $hasName) || ($hasName && $hasNet)) {
                $headerRowIndex = $idx;
                break;
            }
        }

        if ($headerRowIndex === null) {
            return [
                'success' => false,
                'message' => 'Could not detect column headers. Please ensure the Excel contains columns like EMPLOYEE NO., NAME, GROSS EARNINGS, NET PAY.',
                'imported_count' => 0,
            ];
        }

        // Tenant Admin Company Name resolution
        $tenantCompanyName = null;
        if ($tenantAdminId) {
            $tenantAdmin = Admin::find($tenantAdminId);
            $tenantCompanyName = $tenantAdmin ? ($tenantAdmin->company_name ?: $tenantAdmin->name) : null;
        }

        // Final company & month determination
        // Priority: 1. Manual Form Input -> 2. Tenant Admin's registered company (e.g. Wishery) -> 3. Detected from Excel -> 4. Fallback
        $companyName = !empty($manualCompanyName)
            ? $manualCompanyName
            : (!empty($tenantCompanyName)
                ? $tenantCompanyName
                : ($detectedCompany ?: 'Network18 Media & Inv. Ltd.'));

        $monthYear = $manualMonth ?: ($detectedMonth ?: strtoupper(date('F Y')));

        // Parse month date for sorting (e.g. "AUGUST 2026" -> "2026-08-01")
        $monthDate = null;
        try {
            $monthDate = date('Y-m-01', strtotime('1 ' . $monthYear));
        } catch (\Throwable $t) {
            $monthDate = date('Y-m-01');
        }

        // Map Header Columns
        $headers = $rows[$headerRowIndex];
        $colMap = $this->mapColumnIndices($headers);

        if (!isset($colMap['name']) && !isset($colMap['employee_no'])) {
            return [
                'success' => false,
                'message' => 'Columns EMPLOYEE NO. and NAME must be present.',
                'imported_count' => 0,
            ];
        }

        // Preload users for quick linking
        $userQuery = User::query();
        if ($tenantAdminId) {
            $userQuery->where('admin_id', $tenantAdminId);
        }
        $existingUsers = $userQuery->get();

        $usersByEmpId = [];
        $usersByName = [];
        foreach ($existingUsers as $u) {
            if (!empty($u->employee_id)) {
                $usersByEmpId[strtolower(trim($u->employee_id))] = $u;
            }
            if (!empty($u->name)) {
                $usersByName[strtolower(trim($u->name))] = $u;
            }
        }

        $batchId = (string) Str::uuid();
        $importedCount = 0;
        $updatedCount = 0;
        $createdSlips = [];

        DB::beginTransaction();
        try {
            for ($i = $headerRowIndex + 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                if (empty(array_filter($row, function ($v) { return $v !== null && trim((string)$v) !== ''; }))) {
                    continue; // Skip blank rows
                }

                $empNo = trim((string)($this->getVal($row, $colMap, 'employee_no') ?? ''));
                $empName = trim((string)($this->getVal($row, $colMap, 'name') ?? ''));

                if (empty($empNo) && empty($empName)) {
                    continue;
                }

                // Match user
                $matchedUser = null;
                if (!empty($empNo) && isset($usersByEmpId[strtolower($empNo)])) {
                    $matchedUser = $usersByEmpId[strtolower($empNo)];
                } elseif (!empty($empName) && isset($usersByName[strtolower($empName)])) {
                    $matchedUser = $usersByName[strtolower($empName)];
                }

                $payslipNo = (string)($this->getVal($row, $colMap, 'payslip_no') ?? ($i - $headerRowIndex));
                $location = (string)($this->getVal($row, $colMap, 'location') ?? '');
                $bankName = (string)($this->getVal($row, $colMap, 'bank_name') ?? '');
                $bankAccountNo = (string)($this->getVal($row, $colMap, 'bank_account_no') ?? '');
                $uan = (string)($this->getVal($row, $colMap, 'uan') ?? '');

                $basicStipend = $this->parseNumeric($this->getVal($row, $colMap, 'basic_stipend'));
                $lwpCm = (string)($this->getVal($row, $colMap, 'lwp_cm') ?? '0');
                $pm = (string)($this->getVal($row, $colMap, 'pm') ?? '0');

                // Earnings
                $basicSalary = $this->parseNumeric($this->getVal($row, $colMap, 'basic_salary'));
                $hra = $this->parseNumeric($this->getVal($row, $colMap, 'hra'));
                $residuary = $this->parseNumeric($this->getVal($row, $colMap, 'residuary_choice_pay'));
                $gross = $this->parseNumeric($this->getVal($row, $colMap, 'gross_earnings'));

                if ($gross <= 0 && ($basicSalary > 0 || $hra > 0 || $residuary > 0)) {
                    $gross = $basicSalary + $hra + $residuary;
                }

                // Deductions
                $pf = $this->parseNumeric($this->getVal($row, $colMap, 'ee_pf_contribution'));
                $lwf = $this->parseNumeric($this->getVal($row, $colMap, 'ee_lwf_contribution'));
                $roundOff = $this->parseNumeric($this->getVal($row, $colMap, 'recovery_round_off'));
                $totalDeductions = $this->parseNumeric($this->getVal($row, $colMap, 'total_deductions'));

                if ($totalDeductions <= 0 && ($pf > 0 || $lwf > 0 || $roundOff > 0)) {
                    $totalDeductions = $pf + $lwf + $roundOff;
                }

                // Net Pay
                $netPay = $this->parseNumeric($this->getVal($row, $colMap, 'net_pay'));
                if ($netPay <= 0 && $gross > 0) {
                    $netPay = round($gross - $totalDeductions, 2);
                }

                $netPayInWords = SalarySlip::numberToWords($netPay);

                // Check if existing slip for this employee & month
                $existingSlip = SalarySlip::where('month_year', $monthYear)
                    ->where(function ($q) use ($empNo, $empName, $tenantAdminId) {
                        if ($tenantAdminId) {
                            $q->where('admin_id', $tenantAdminId);
                        }
                        if (!empty($empNo)) {
                            $q->where('employee_no', $empNo);
                        } else {
                            $q->where('employee_name', $empName);
                        }
                    })->first();

                $slipData = [
                    'admin_id'              => $tenantAdminId,
                    'user_id'               => $matchedUser ? $matchedUser->id : null,
                    'batch_id'              => $batchId,
                    'company_name'          => $companyName,
                    'month_year'            => $monthYear,
                    'month_date'            => $monthDate,
                    'employee_no'           => $empNo ?: ($matchedUser?->employee_id ?? 'EMP' . ($i)),
                    'employee_name'         => $empName ?: ($matchedUser?->name ?? 'Employee'),
                    'payslip_no'            => $payslipNo,
                    'location'              => $location,
                    'bank_name'             => $bankName,
                    'bank_account_no'       => $bankAccountNo,
                    'uan'                   => $uan,
                    'basic_stipend'         => $basicStipend,
                    'lwp_cm'                => $lwpCm,
                    'pm'                    => $pm,
                    'basic_salary'          => $basicSalary,
                    'hra'                   => $hra,
                    'residuary_choice_pay'  => $residuary,
                    'gross_earnings'        => $gross,
                    'ee_pf_contribution'    => $pf,
                    'ee_lwf_contribution'   => $lwf,
                    'recovery_round_off'    => $roundOff,
                    'total_deductions'      => $totalDeductions,
                    'net_pay'               => $netPay,
                    'net_pay_in_words'      => $netPayInWords,
                ];

                if ($existingSlip) {
                    $existingSlip->update($slipData);
                    $updatedCount++;
                    $createdSlips[] = $existingSlip;
                } else {
                    $newSlip = SalarySlip::create($slipData);
                    $importedCount++;
                    $createdSlips[] = $newSlip;
                }
            }

            DB::commit();

            return [
                'success'        => true,
                'message'        => "Successfully processed " . ($importedCount + $updatedCount) . " salary slip(s). ({$importedCount} new, {$updatedCount} updated) for {$monthYear}.",
                'imported_count' => $importedCount,
                'updated_count'  => $updatedCount,
                'batch_id'       => $batchId,
                'month_year'     => $monthYear,
                'company_name'   => $companyName,
            ];
        } catch (\Throwable $ex) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Error importing salary slips: ' . $ex->getMessage(),
                'imported_count' => 0,
            ];
        }
    }

    /**
     * Map headers to normalized data fields.
     */
    protected function mapColumnIndices(array $headers): array
    {
        $map = [];

        foreach ($headers as $idx => $raw) {
            $clean = strtolower(trim((string)$raw));
            $norm = preg_replace('/[^a-z0-9]/', '', $clean);

            if (in_array($norm, ['employeeno', 'employeenumber', 'empno', 'empid', 'employeeid', 'empcode'])) {
                $map['employee_no'] = $idx;
            } elseif (in_array($norm, ['name', 'employeename', 'empname', 'fullname'])) {
                $map['name'] = $idx;
            } elseif (in_array($norm, ['payslipno', 'payslipnumber', 'slipno', 'slipnumber'])) {
                $map['payslip_no'] = $idx;
            } elseif (in_array($norm, ['location', 'branch', 'city', 'worklocation'])) {
                $map['location'] = $idx;
            } elseif (in_array($norm, ['bank', 'bankname', 'bankdetails'])) {
                $map['bank_name'] = $idx;
            } elseif (in_array($norm, ['bankacno', 'bankaccountno', 'bankacnumber', 'accountno', 'bankaccount', 'acno'])) {
                $map['bank_account_no'] = $idx;
            } elseif (in_array($norm, ['uan', 'uanno', 'uannumber'])) {
                $map['uan'] = $idx;
            } elseif (in_array($norm, ['basicstipend', 'stipend', 'basicsalarystipend'])) {
                $map['basic_stipend'] = $idx;
            } elseif (in_array($norm, ['lwpcm', 'lwp', 'leavewithoutpay', 'lwpcurrentmonth'])) {
                $map['lwp_cm'] = $idx;
            } elseif (in_array($norm, ['pm', 'paidmonth', 'paiddays', 'previousmonth'])) {
                $map['pm'] = $idx;
            } elseif (in_array($norm, ['basicsalary', 'basic', 'basicsal'])) {
                $map['basic_salary'] = $idx;
            } elseif (in_array($norm, ['hra', 'houserentallowance'])) {
                $map['hra'] = $idx;
            } elseif (in_array($norm, ['residuarychoicepay', 'choicepay', 'residuarypay', 'specialallowance', 'allowance', 'otherallowance'])) {
                $map['residuary_choice_pay'] = $idx;
            } elseif (in_array($norm, ['grossearnings', 'grosssalary', 'gross', 'totalearnings'])) {
                $map['gross_earnings'] = $idx;
            } elseif (in_array($norm, ['eepfcontribution', 'pfcontribution', 'pf', 'providentfund', 'eepf'])) {
                $map['ee_pf_contribution'] = $idx;
            } elseif (in_array($norm, ['eelwfcontribution', 'lwfcontribution', 'lwf', 'labourwelfarefund', 'eelwf'])) {
                $map['ee_lwf_contribution'] = $idx;
            } elseif (in_array($norm, ['recoveryofroundoffamt', 'recoveryofroundoff', 'roundoffamt', 'roundoff', 'recoveryroundoff'])) {
                $map['recovery_round_off'] = $idx;
            } elseif (in_array($norm, ['totaldeductions', 'deductions', 'totaldeduction'])) {
                $map['total_deductions'] = $idx;
            } elseif (in_array($norm, ['netpay', 'netsalary', 'takehome', 'salaryreceived', 'netpayreceived'])) {
                $map['net_pay'] = $idx;
            }
        }

        return $map;
    }

    private function getVal(array $row, array $colMap, string $key)
    {
        if (isset($colMap[$key]) && isset($row[$colMap[$key]])) {
            return $row[$colMap[$key]];
        }
        return null;
    }

    private function parseNumeric($val): float
    {
        if ($val === null || $val === '') {
            return 0.0;
        }
        $cleaned = preg_replace('/[^0-9.-]/', '', (string)$val);
        return (float)$cleaned;
    }

    /**
     * Generate sample Excel spreadsheet matching exact user specification.
     */
    public function generateSampleExcel(?string $companyName = null, ?int $tenantAdminId = null): string
    {
        $company = !empty($companyName) ? $companyName : 'Wishery';
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Payslip Template');

        // Row 1: Company Header
        $sheet->setCellValue('A1', $company);
        $sheet->mergeCells('A1:S1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Row 2: Month Header
        $sheet->setCellValue('A2', 'PAYSLIP FOR THE MONTH OF ' . strtoupper(date('F Y')));
        $sheet->mergeCells('A2:S2');
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Row 3: Super Group Headers (Earnings & Deductions spans)
        $sheet->setCellValue('K3', 'EARNINGS');
        $sheet->mergeCells('K3:N3');
        $sheet->setCellValue('O3', 'DEDUCTIONS');
        $sheet->mergeCells('O3:R3');
        $sheet->getStyle('K3:R3')->getFont()->setBold(true);
        $sheet->getStyle('K3:R3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Row 4: Column Headers
        $headers = [
            'EMPLOYEE NO.',
            'NAME:',
            'PAYSLIP NO.:',
            'LOCATION:',
            'BANK:',
            'BANK A/C NO.:',
            'UAN:',
            'BASIC/STIPEND:',
            'LWP - C/M:',
            'P/M:',
            'Basic salary',
            'HRA',
            'Residuary Choice Pay',
            'GROSS EARNINGS',
            'Ee PF contribution',
            'Ee LWF contribution',
            'Recovery of round off amt',
            'TOTAL DEDUCTIONS',
            'NET PAY',
        ];

        foreach ($headers as $colIdx => $title) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->setCellValue($colLetter . '4', $title);
        }

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => '000000']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F1F5F9'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']],
            ],
        ];
        $sheet->getStyle('A3:S4')->applyFromArray($headerStyle);

        // Fetch real employees for the tenant admin if available
        $employees = collect();
        if ($tenantAdminId) {
            $employees = User::where('admin_id', $tenantAdminId)
                ->where('is_admin', 0)
                ->orderBy('employee_id')
                ->get();
        }

        $rowNum = 5;
        if ($employees->isNotEmpty()) {
            $slipNum = 1;
            foreach ($employees as $emp) {
                $empNo = $emp->employee_id ?: ('EMP' . str_pad((string)$emp->id, 3, '0', STR_PAD_LEFT));
                $empName = strtoupper($emp->name ?: 'Employee');
                $location = $emp->address ?: 'Mumbai';
                $bankName = 'HDFC BANK LTD';
                $bankAccount = 'XXXXXX' . rand(1000, 9999);
                $uan = '101' . rand(100000000, 999999999);

                // Standard realistic payroll calculations
                $basicStipend = 25000.00;
                $basicSalary = 25000.00;
                $hra = 30000.00;
                $residuary = 10000.00;
                $gross = $basicSalary + $hra + $residuary; // 65000.00
                $pf = 3000.00;
                $lwf = 50.00;
                $roundOff = 0.00;
                $deductions = $pf + $lwf + $roundOff; // 3050.00
                $netPay = $gross - $deductions; // 61950.00

                $empRow = [
                    $empNo,
                    $empName,
                    (string)$slipNum,
                    $location,
                    $bankName,
                    $bankAccount,
                    $uan,
                    $basicStipend,
                    0,
                    0,
                    $basicSalary,
                    $hra,
                    $residuary,
                    $gross,
                    $pf,
                    $lwf,
                    $roundOff,
                    $deductions,
                    $netPay,
                ];

                foreach ($empRow as $colIdx => $val) {
                    $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
                    $sheet->setCellValue($colLetter . $rowNum, $val);
                }
                $rowNum++;
                $slipNum++;
            }
        } else {
            // Default sample rows
            $sampleRow = [
                'EMP101',
                'ABHIJITH PK',
                '1',
                'Mumbai',
                'HDFC BANK LTD',
                'XXXXXX',
                'XXXXXXX',
                25000.00,
                0,
                0,
                25000.00,
                30000.00,
                10000.00,
                65000.00,
                3000.00,
                50.00,
                0.00,
                3050.00,
                61950.00,
            ];
            $sampleRow2 = [
                'EMP102',
                'AMAL SHAJU',
                '2',
                'Mumbai',
                'ICICI BANK LTD',
                'XXXXXX',
                'XXXXXXX',
                30000.00,
                0,
                0,
                30000.00,
                25000.00,
                15000.00,
                70000.00,
                3600.00,
                50.00,
                0.00,
                3650.00,
                66350.00,
            ];

            foreach ($sampleRow as $colIdx => $val) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
                $sheet->setCellValue($colLetter . '5', $val);
            }
            foreach ($sampleRow2 as $colIdx => $val) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
                $sheet->setCellValue($colLetter . '6', $val);
            }
            $rowNum = 7;
        }

        $dataStyle = [
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E2E8F0']],
            ],
        ];
        $sheet->getStyle('A5:S6')->applyFromArray($dataStyle);

        // Auto width
        foreach (range('A', 'S') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $tempPath = tempnam(sys_get_temp_dir(), 'payslip_sample_');
        $writer->save($tempPath);
        $content = file_get_contents($tempPath);
        @unlink($tempPath);

        return $content;
    }

    /**
     * Generate exact matching PDF for a salary slip.
     */
    public function generatePdf(SalarySlip $slip)
    {
        $data = [
            'slip' => $slip,
        ];

        $pdf = Pdf::loadView('payslips.pdf', $data);
        $pdf->setPaper('a4', 'portrait');
        $pdf->setOption('isHtml5ParserEnabled', true);
        $pdf->setOption('isRemoteEnabled', true);

        return $pdf;
    }
}
