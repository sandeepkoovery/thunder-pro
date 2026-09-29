<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\SalarySlip;
use App\Services\SalarySlipService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalarySlipController extends Controller
{
    /**
     * Display a listing of the user's salary slips.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $selectedMonth = $request->query('month', '');

        $query = SalarySlip::where(function ($q) use ($user) {
            $q->where('user_id', $user->id);
            if (!empty($user->employee_id)) {
                $q->orWhere('employee_no', $user->employee_id);
            }
        });

        if (!empty($selectedMonth)) {
            $query->where('month_year', $selectedMonth);
        }

        // Available months for this user
        $availableMonths = (clone $query)->select('month_year')
            ->distinct()
            ->orderBy('month_date', 'desc')
            ->orderBy('month_year', 'desc')
            ->pluck('month_year');

        $salarySlips = $query->orderBy('month_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('SalarySlips/Index', [
            'salarySlips'     => $salarySlips,
            'filters'         => [
                'month' => $selectedMonth,
            ],
            'availableMonths' => $availableMonths,
            'userEmployeeId'  => $user->employee_id,
        ]);
    }

    /**
     * Download the salary slip PDF for employee.
     */
    public function downloadPdf(SalarySlip $salarySlip, SalarySlipService $service)
    {
        $this->authorizeEmployee($salarySlip);

        $pdf = $service->generatePdf($salarySlip);
        $cleanMonth = preg_replace('/[^a-zA-Z0-9_-]/', '_', $salarySlip->month_year);
        $cleanEmp = preg_replace('/[^a-zA-Z0-9_-]/', '_', $salarySlip->employee_no);
        $filename = "Payslip_{$cleanEmp}_{$cleanMonth}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Stream the salary slip PDF in browser for employee.
     */
    public function streamPdf(SalarySlip $salarySlip, SalarySlipService $service)
    {
        $this->authorizeEmployee($salarySlip);

        $pdf = $service->generatePdf($salarySlip);
        $cleanMonth = preg_replace('/[^a-zA-Z0-9_-]/', '_', $salarySlip->month_year);
        $cleanEmp = preg_replace('/[^a-zA-Z0-9_-]/', '_', $salarySlip->employee_no);
        $filename = "Payslip_{$cleanEmp}_{$cleanMonth}.pdf";

        return $pdf->stream($filename);
    }

    /**
     * Ensure the logged in employee owns this salary slip.
     */
    protected function authorizeEmployee(SalarySlip $salarySlip): void
    {
        $user = auth()->user();
        $isOwner = ($salarySlip->user_id === $user->id) ||
                   (!empty($user->employee_id) && strtolower($salarySlip->employee_no) === strtolower($user->employee_id));

        if (!$isOwner) {
            abort(403, 'Unauthorized access to this salary slip.');
        }
    }
}
