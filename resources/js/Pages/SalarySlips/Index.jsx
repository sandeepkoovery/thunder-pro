import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import PayslipModal from '@/Components/PayslipModal';
import Pagination from '@/Components/Pagination';
import {
    Receipt,
    Download,
    Eye,
    Calendar,
    DollarSign,
    CheckCircle2,
    FileText,
    ExternalLink,
    Building2,
    ArrowDownToLine,
    CreditCard,
    ShieldCheck,
} from 'lucide-react';

export default function Index({ salarySlips, filters = {}, availableMonths = [], userEmployeeId }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [selectedMonth, setSelectedMonth] = useState(filters.month || '');
    const [previewSlip, setPreviewSlip] = useState(null);

    const handleMonthChange = (e) => {
        const val = e.target.value;
        setSelectedMonth(val);
        router.get(
            route('salary-slips.index'),
            { month: val },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const formatCurrency = (val) => {
        const num = parseFloat(val) || 0;
        return num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    return (
        <UserLayout title="My Salary Slips">
            <Head title="My Salary Slips" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Hero Banner */}
                <div className="salary-slip-banner bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm border border-blue-400/20">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Employee Self-Service
                            </div>
                            <h1
                                className="salary-banner-title text-2xl sm:text-3xl font-extrabold tracking-tight text-white !text-white"
                                style={{ color: '#ffffff' }}
                            >
                                My Salary Slips
                            </h1>
                            <p
                                className="salary-banner-subtitle text-slate-100/90 text-sm max-w-xl"
                                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                            >
                                Welcome, <span className="font-semibold text-white">{user?.name}</span>. Access, view, and securely download your official monthly payslips with detailed breakdown of earnings and deductions.
                            </p>
                        </div>

                        {/* Quick Stats Pill */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-5">
                            <div>
                                <p className="text-xs text-blue-200">Employee ID</p>
                                <p className="text-sm font-bold font-mono text-white">
                                    {user?.employee_id || userEmployeeId || 'N/A'}
                                </p>
                            </div>
                            <div className="h-8 w-px bg-white/20" />
                            <div>
                                <p className="text-xs text-blue-200">Available Slips</p>
                                <p className="text-sm font-bold text-white">
                                    {salarySlips.total || salarySlips.data.length || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {availableMonths.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Filter By Month:
                            </span>
                            <select
                                value={selectedMonth}
                                onChange={handleMonthChange}
                                className="text-sm py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            >
                                <option value="">All Months ({salarySlips.total || salarySlips.data.length})</option>
                                {availableMonths.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Payslips Cards & Table */}
                {salarySlips.data.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="max-w-md mx-auto space-y-3">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                                <Receipt className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No Salary Slips Available Yet</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {selectedMonth
                                    ? `No payslip found for ${selectedMonth}.`
                                    : 'Your monthly salary slips will appear here as soon as HR or Administrator processes payroll.'}
                            </p>
                            {selectedMonth && (
                                <button
                                    onClick={() => { setSelectedMonth(''); router.get(route('salary-slips.index')); }}
                                    className="px-4 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 rounded-xl transition"
                                >
                                    View All Months
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {salarySlips.data.map((slip) => (
                            <div
                                key={slip.id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                            >
                                {/* Card Header */}
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {slip.month_year}
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-500 font-mono">
                                            Slip #{slip.payslip_no || slip.id}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-base">
                                        {slip.company_name || 'Network18 Media & Inv. Ltd.'}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                                        {slip.bank_name ? `${slip.bank_name} &bull; ` : ''}A/C: {slip.bank_account_no || 'N/A'}
                                    </p>
                                </div>

                                {/* Card Body: Salary Summary */}
                                <div className="p-5 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">Gross Earnings</span>
                                        <span className="font-semibold text-slate-800 font-mono">
                                            ₹{formatCurrency(slip.gross_earnings)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">Total Deductions</span>
                                        <span className="font-semibold text-rose-600 font-mono">
                                            - ₹{formatCurrency(slip.total_deductions)}
                                        </span>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100">
                                        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                                    Net Take-Home
                                                </p>
                                                <p className="text-lg font-extrabold text-[#1e3a8a] font-mono">
                                                    ₹{formatCurrency(slip.net_pay)}
                                                </p>
                                            </div>
                                            <span className="p-2 bg-white rounded-lg text-blue-600 shadow-xs">
                                                <CreditCard className="w-4 h-4" />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer Actions */}
                                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => setPreviewSlip(slip)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition shadow-xs"
                                    >
                                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                                        View Slip
                                    </button>

                                    <a
                                        href={route('salary-slips.download', slip.id)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
                                        download
                                    >
                                        <ArrowDownToLine className="w-3.5 h-3.5" />
                                        Download PDF
                                    </a>

                                    <a
                                        href={route('salary-slips.preview', slip.id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Open PDF in new tab"
                                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-200"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {salarySlips.links && (
                    <div className="pt-2">
                        <Pagination links={salarySlips.links} />
                    </div>
                )}
            </div>

            {/* Payslip Modal Preview */}
            <PayslipModal
                isOpen={!!previewSlip}
                onClose={() => setPreviewSlip(null)}
                slip={previewSlip}
                downloadUrl={previewSlip ? route('salary-slips.download', previewSlip.id) : null}
                previewUrl={previewSlip ? route('salary-slips.preview', previewSlip.id) : null}
            />
        </UserLayout>
    );
}
