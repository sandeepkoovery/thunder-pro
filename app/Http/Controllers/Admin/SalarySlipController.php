<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SalarySlip;
use App\Models\User;
use App\Services\SalarySlipService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalarySlipController extends Controller
{
    /**
     * Display a listing of generated salary slips.
     */
    public function index(Request $request)
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        $search = $request->query('search', '');
        $selectedMonth = $request->query('month', '');

        $query = SalarySlip::with('user:id,name,email,employee_id,image,thumb');

        if (!$isSuperAdmin) {
            $query->where('admin_id', $tenantAdminId);
        }

        if (!empty($selectedMonth)) {
            $query->where('month_year', $selectedMonth);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('employee_name', 'like', "%{$search}%")
                  ->orWhere('employee_no', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhere('bank_name', 'like', "%{$search}%");
            });
        }

        // Distinct months for filter dropdown
        $monthQuery = SalarySlip::query();
        if (!$isSuperAdmin) {
            $monthQuery->where('admin_id', $tenantAdminId);
        }
        $availableMonths = $monthQuery->select('month_year')
            ->distinct()
            ->orderBy('month_date', 'desc')
            ->orderBy('month_year', 'desc')
            ->pluck('month_year');

        // Stats calculation
        $statsQuery = clone $query;
        $totalSlips = $statsQuery->count();
        $totalNetPay = (float) $statsQuery->sum('net_pay');
        $totalGross = (float) $statsQuery->sum('gross_earnings');
        $totalDeductions = (float) $statsQuery->sum('total_deductions');

        $salarySlips = $query->orderBy('month_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        $tenantAdmin = $tenantAdminId ? \App\Models\Admin::find($tenantAdminId) : null;
        $tenantCompanyName = $tenantAdmin?->company_name ?: ($authUser->company_name ?? '');

        return Inertia::render('Admin/SalarySlips/Index', [
            'salarySlips'       => $salarySlips,
            'filters'           => [
                'search' => $search,
                'month'  => $selectedMonth,
            ],
            'availableMonths'   => $availableMonths,
            'tenantCompanyName' => $tenantCompanyName,
            'stats'             => [
                'total_slips'      => $totalSlips,
                'total_net_pay'    => $totalNetPay,
                'total_gross'      => $totalGross,
                'total_deductions' => $totalDeductions,
            ],
        ]);
    }

    /**
     * Upload Excel and generate salary slips.
     */
    public function upload(Request $request, SalarySlipService $service)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:20480'],
            'month_year' => ['nullable', 'string', 'max:100'],
            'company_name' => ['nullable', 'string', 'max:255'],
        ]);

        $authUser = auth()->user();
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);
        $tenantAdmin = $tenantAdminId ? \App\Models\Admin::find($tenantAdminId) : null;
        $defaultCompanyName = $request->input('company_name') ?: ($tenantAdmin?->company_name ?: ($authUser->company_name ?? null));

        $result = $service->import(
            $request->file('file'),
            $tenantAdminId,
            $request->input('month_year'),
            $defaultCompanyName
        );

        if (!$result['success']) {
            return back()->with('error', $result['message']);
        }

        return back()->with('success', $result['message']);
    }

    /**
     * Download sample Excel template with tenant company name.
     */
    public function downloadSample(SalarySlipService $service)
    {
        $authUser = auth()->user();
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);
        $tenantAdmin = $tenantAdminId ? \App\Models\Admin::find($tenantAdminId) : null;
        $companyName = $tenantAdmin?->company_name ?: ($authUser->company_name ?? 'Wishery');

        $excelContent = $service->generateSampleExcel($companyName, $tenantAdminId);

        return response($excelContent, 200, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="salary_slip_template.xlsx"',
            'Cache-Control'       => 'max-age=0',
        ]);
    }

    /**
     * Download single salary slip PDF.
     */
    public function downloadPdf(SalarySlip $salarySlip, SalarySlipService $service)
    {
        $this->authorizeAccess($salarySlip);

        $pdf = $service->generatePdf($salarySlip);
        $cleanMonth = preg_replace('/[^a-zA-Z0-9_-]/', '_', $salarySlip->month_year);
        $cleanEmp = preg_replace('/[^a-zA-Z0-9_-]/', '_', $salarySlip->employee_no);
        $filename = "Payslip_{$cleanEmp}_{$cleanMonth}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Stream single salary slip PDF in browser for instant preview.
     */
    public function streamPdf(SalarySlip $salarySlip, SalarySlipService $service)
    {
        $this->authorizeAccess($salarySlip);

        $pdf = $service->generatePdf($salarySlip);
        $cleanMonth = preg_replace('/[^a-zA-Z0-9_-]/', '_', $salarySlip->month_year);
        $cleanEmp = preg_replace('/[^a-zA-Z0-9_-]/', '_', $salarySlip->employee_no);
        $filename = "Payslip_{$cleanEmp}_{$cleanMonth}.pdf";

        return $pdf->stream($filename);
    }

    /**
     * Delete a single salary slip.
     */
    public function destroy(SalarySlip $salarySlip)
    {
        $this->authorizeAccess($salarySlip);

        $salarySlip->delete();

        return back()->with('success', 'Salary slip deleted successfully.');
    }

    /**
     * Delete multiple selected salary slips.
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:salary_slips,id'],
        ]);

        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        $query = SalarySlip::whereIn('id', $request->input('ids'));
        if (!$isSuperAdmin) {
            $query->where('admin_id', $tenantAdminId);
        }

        $count = $query->delete();

        return back()->with('success', "{$count} salary slip(s) deleted successfully.");
    }

    /**
     * Check authorization for this slip.
     */
    protected function authorizeAccess(SalarySlip $salarySlip): void
    {
        $authUser = auth()->user();
        $isSuperAdmin = $authUser->role === 'superadmin';
        $tenantAdminId = $authUser->role === 'admin' ? $authUser->id : ($authUser->admin_id ?? $authUser->id);

        if (!$isSuperAdmin && $salarySlip->admin_id && $salarySlip->admin_id !== $tenantAdminId) {
            abort(403, 'Unauthorized access to this salary slip.');
        }
    }
}
