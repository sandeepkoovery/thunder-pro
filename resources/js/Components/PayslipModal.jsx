import React from 'react';
import { X, Download, Printer, CheckCircle } from 'lucide-react';

export default function PayslipModal({ isOpen, onClose, slip, downloadUrl, previewUrl }) {
    if (!isOpen || !slip) return null;

    const formatCurrency = (val) => {
        const num = parseFloat(val) || 0;
        return num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const handlePrint = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        } else {
            window.print();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div 
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CheckCircle className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="font-semibold text-slate-800 text-base">
                                Salary Slip Preview
                            </h3>
                            <p className="text-xs text-slate-500">
                                {slip.employee_name} ({slip.employee_no}) &bull; {slip.month_year}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {downloadUrl && (
                            <a
                                href={downloadUrl}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                                download
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download PDF
                            </a>
                        )}
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Print / PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Payslip Document Preview (Exact matching PDF styling) */}
                <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100/50 flex justify-center">
                    <div className="bg-white border border-slate-300 shadow-lg rounded-sm w-full max-w-3xl p-8 sm:p-12 text-slate-800">
                        {/* Title Header */}
                        <div className="text-center mb-7">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {slip.company_name || 'Network18 Media & Inv. Ltd.'}
                            </h1>
                            <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase mt-1">
                                PAYSLIP FOR THE MONTH OF {slip.month_year}
                            </h2>
                        </div>

                        {/* Top Details Card */}
                        <div className="border border-slate-300 rounded mb-6 text-xs bg-white">
                            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                                <div className="p-3 space-y-2">
                                    <div className="flex">
                                        <span className="w-36 font-semibold text-slate-900">Employee No:</span>
                                        <span className="text-slate-700 font-medium">{slip.employee_no}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-36 font-semibold text-slate-900">Employee Name:</span>
                                        <span className="text-slate-700 font-medium uppercase">{slip.employee_name}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-36 font-semibold text-slate-900">Payslip No:</span>
                                        <span className="text-slate-700">{slip.payslip_no || '-'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-36 font-semibold text-slate-900">Location:</span>
                                        <span className="text-slate-700">{slip.location || '-'}</span>
                                    </div>
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className="flex">
                                        <span className="w-36 font-semibold text-slate-900">Bank Name:</span>
                                        <span className="text-slate-700 font-medium">{slip.bank_name || '-'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-36 font-semibold text-slate-900">Bank A/c No:</span>
                                        <span className="text-slate-700 font-mono">{slip.bank_account_no || '-'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-36 font-semibold text-slate-900">UAN:</span>
                                        <span className="text-slate-700 font-mono">{slip.uan || '-'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-36 font-semibold text-slate-900">LWP - C/M / P/M:</span>
                                        <span className="text-slate-700">{slip.lwp_cm || 0} / {slip.pm || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Salary Components Table */}
                        <div className="border border-slate-300 rounded overflow-hidden mb-5">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-[#1e40af] text-white">
                                        <th className="py-2.5 px-3 text-left font-bold tracking-wider uppercase w-[35%]">EARNINGS</th>
                                        <th className="py-2.5 px-3 text-right font-bold tracking-wider uppercase w-[15%]">AMOUNT (INR)</th>
                                        <th className="py-2.5 px-3 text-left font-bold tracking-wider uppercase w-[35%] border-l border-blue-800">DEDUCTIONS</th>
                                        <th className="py-2.5 px-3 text-right font-bold tracking-wider uppercase w-[15%]">AMOUNT (INR)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr>
                                        <td className="py-2 px-3 text-slate-800">Basic Salary</td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-700">{formatCurrency(slip.basic_salary)}</td>
                                        <td className="py-2 px-3 text-slate-800 border-l border-slate-200">Ee PF Contribution</td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-700">{formatCurrency(slip.ee_pf_contribution)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-3 text-slate-800">HRA</td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-700">{formatCurrency(slip.hra)}</td>
                                        <td className="py-2 px-3 text-slate-800 border-l border-slate-200">Ee LWF Contribution</td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-700">{formatCurrency(slip.ee_lwf_contribution)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-3 text-slate-800">Residuary Choice Pay</td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-700">{formatCurrency(slip.residuary_choice_pay)}</td>
                                        <td className="py-2 px-3 text-slate-800 border-l border-slate-200">Recovery of Round Off Amt</td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-700">{formatCurrency(slip.recovery_round_off)}</td>
                                    </tr>

                                    {/* Summary Row */}
                                    <tr className="bg-[#f0f7ff] font-bold text-[#1e3a8a] border-t-2 border-blue-200">
                                        <td className="py-2.5 px-3 uppercase tracking-wider">GROSS EARNINGS</td>
                                        <td className="py-2.5 px-3 text-right font-mono text-sm">{formatCurrency(slip.gross_earnings)}</td>
                                        <td className="py-2.5 px-3 uppercase tracking-wider border-l border-blue-200">TOTAL DEDUCTIONS</td>
                                        <td className="py-2.5 px-3 text-right font-mono text-sm">{formatCurrency(slip.total_deductions)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Net Pay Box */}
                        <div className="border border-blue-200 rounded overflow-hidden mb-12">
                            <div className="bg-white p-3 flex justify-between items-center">
                                <span className="font-bold text-blue-700 text-sm">
                                    NET PAY (Net Salary Received)
                                </span>
                                <span className="font-bold text-[#1e3a8a] text-base font-mono">
                                    INR {formatCurrency(slip.net_pay)}
                                </span>
                            </div>
                            <div className="bg-slate-50 border-t border-slate-200 p-3 text-xs flex flex-col sm:flex-row gap-2">
                                <span className="font-semibold text-slate-600 sm:w-32 shrink-0">Amount in words:</span>
                                <span className="text-slate-900 font-medium italic">
                                    {slip.net_pay_in_words}
                                </span>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="pt-10 flex justify-between items-end text-xs font-semibold text-slate-800">
                            <div>
                                <div className="w-48 border-t border-slate-400 mb-2"></div>
                                <span className="text-slate-700">Employer Signature</span>
                            </div>
                            <div className="text-right">
                                <div className="w-48 border-t border-slate-400 mb-2 ml-auto"></div>
                                <span className="text-slate-700">Employee Signature</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
