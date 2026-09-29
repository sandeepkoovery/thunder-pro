import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PayslipModal from '@/Components/PayslipModal';
import Pagination from '@/Components/Pagination';
import {
    Receipt,
    Upload,
    FileSpreadsheet,
    Download,
    Eye,
    Trash2,
    Search,
    Filter,
    Calendar,
    DollarSign,
    Users,
    TrendingDown,
    Building2,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    X,
    FileText,
} from 'lucide-react';

export default function Index({ salarySlips, filters = {}, availableMonths = [], stats = {}, tenantCompanyName = '' }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedMonth, setSelectedMonth] = useState(filters.month || '');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [previewSlip, setPreviewSlip] = useState(null);

    // Upload Form
    const { data, setData, post, processing, errors, reset, progress } = useForm({
        file: null,
        company_name: tenantCompanyName || '',
        month_year: '',
    });

    // Filtering handler
    const handleFilter = (newMonth = selectedMonth, newSearch = search) => {
        router.get(
            route('admin.salary-slips.index'),
            {
                month: newMonth,
                search: newSearch,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleFilter(selectedMonth, search);
    };

    const handleMonthChange = (e) => {
        const val = e.target.value;
        setSelectedMonth(val);
        handleFilter(val, search);
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedMonth('');
        router.get(route('admin.salary-slips.index'));
    };

    // Selection handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(salarySlips.data.map((s) => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((item) => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Bulk Delete
    const handleBulkDelete = () => {
        if (!selectedIds.length) return;
        if (confirm(`Are you sure you want to delete ${selectedIds.length} selected salary slip(s)?`)) {
            router.post(
                route('admin.salary-slips.bulk-destroy'),
                { ids: selectedIds },
                {
                    onSuccess: () => setSelectedIds([]),
                }
            );
        }
    };

    // Single Delete
    const handleDeleteSlip = (slip) => {
        if (confirm(`Delete salary slip for ${slip.employee_name} (${slip.month_year})?`)) {
            router.delete(route('admin.salary-slips.destroy', slip.id));
        }
    };

    // Handle Upload Submit
    const handleUploadSubmit = (e) => {
        e.preventDefault();
        if (!data.file) {
            alert('Please select an Excel or CSV file to upload.');
            return;
        }

        post(route('admin.salary-slips.upload'), {
            onSuccess: () => {
                setIsUploadOpen(false);
                reset();
            },
        });
    };

    const formatCurrency = (val) => {
        const num = parseFloat(val) || 0;
        return num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    return (
        <AdminLayout title="Salary Slips">
            <Head title="Salary Slip Management" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="salary-slip-banner bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm border border-blue-400/20">
                                <Receipt className="w-3.5 h-3.5" />
                                Payroll & Compensation
                            </div>
                            <h1
                                className="salary-banner-title text-2xl sm:text-3xl font-extrabold tracking-tight text-white !text-white"
                                style={{ color: '#ffffff' }}
                            >
                                Salary Slip Management
                            </h1>
                            <p
                                className="salary-banner-subtitle text-slate-100/90 text-sm max-w-xl"
                                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                            >
                                Upload employee payroll Excel sheets to automatically generate verified PDF payslips. Employees can view and download their salary slips anytime.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <a
                                href={route('admin.salary-slips.sample-template')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition backdrop-blur-sm border border-white/15 shadow-sm"
                                download
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                Download Template
                            </a>
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Excel Sheet
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Payslips</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.total_slips || 0}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Net Pay</p>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                ₹{formatCurrency(stats.total_net_pay || 0)}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Gross Earnings</p>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                ₹{formatCurrency(stats.total_gross || 0)}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Deductions</p>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                ₹{formatCurrency(stats.total_deductions || 0)}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search employee name, ID, bank, location..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => { setSearch(''); handleFilter(selectedMonth, ''); }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </form>

                        {/* Month Filter */}
                        <div className="relative min-w-[190px]">
                            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select
                                value={selectedMonth}
                                onChange={handleMonthChange}
                                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                            >
                                <option value="">All Months</option>
                                {availableMonths.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {(search || selectedMonth) && (
                            <button
                                onClick={handleResetFilters}
                                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Bulk Action */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                            <span className="text-xs font-semibold text-rose-700">
                                {selectedIds.length} slip(s) selected
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Selected
                            </button>
                        </div>
                    )}
                </div>

                {/* Salary Slips Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={
                                                salarySlips.data.length > 0 &&
                                                selectedIds.length === salarySlips.data.length
                                            }
                                            onChange={handleSelectAll}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        />
                                    </th>
                                    <th className="py-3.5 px-4 text-left">Emp ID</th>
                                    <th className="py-3.5 px-4 text-left">Employee Name</th>
                                    <th className="py-3.5 px-4">Month</th>
                                    <th className="py-3.5 px-4">Bank Details</th>
                                    <th className="py-3.5 px-4 text-right">Gross Pay</th>
                                    <th className="py-3.5 px-4 text-right">Deductions</th>
                                    <th className="py-3.5 px-4 text-right">Net Pay</th>
                                    <th className="py-3.5 px-4 text-center w-36">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {salarySlips.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-14 text-center">
                                            <div className="max-w-xs mx-auto space-y-3">
                                                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                                                    <Receipt className="w-6 h-6" />
                                                </div>
                                                <h4 className="font-semibold text-slate-800 text-base">No Salary Slips Found</h4>
                                                <p className="text-xs text-slate-500">
                                                    {search || selectedMonth
                                                        ? 'No results match your active filter criteria.'
                                                        : 'Upload an employee Excel sheet to generate payslips instantly.'}
                                                </p>
                                                {!search && !selectedMonth && (
                                                    <button
                                                        onClick={() => setIsUploadOpen(true)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
                                                    >
                                                        <Upload className="w-3.5 h-3.5" />
                                                        Upload First Sheet
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    salarySlips.data.map((slip) => {
                                        const isSelected = selectedIds.includes(slip.id);
                                        return (
                                            <tr
                                                key={slip.id}
                                                className={`hover:bg-slate-50/80 transition-colors ${
                                                    isSelected ? 'bg-blue-50/40' : ''
                                                }`}
                                            >
                                                <td className="py-3.5 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectOne(slip.id)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                    />
                                                </td>

                                                {/* Employee ID */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                                        {slip.employee_no}
                                                    </span>
                                                </td>

                                                {/* Employee Name */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-sm">
                                                            {(slip.employee_name || 'E').substring(0, 2)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                                <span>{slip.employee_name}</span>
                                                                {slip.user_id && (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                        Linked
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {slip.location && (
                                                                <div className="text-xs text-slate-500">
                                                                    {slip.location}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Month */}
                                                <td className="py-3.5 px-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                        <Calendar className="w-3 h-3 text-slate-500" />
                                                        {slip.month_year}
                                                    </span>
                                                </td>

                                                {/* Bank Details */}
                                                <td className="py-3.5 px-4 text-xs">
                                                    <div className="font-medium text-slate-800">{slip.bank_name || '-'}</div>
                                                    <div className="text-slate-500 font-mono">A/C: {slip.bank_account_no || '-'}</div>
                                                </td>

                                                {/* Gross Pay */}
                                                <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                                                    ₹{formatCurrency(slip.gross_earnings)}
                                                </td>

                                                {/* Deductions */}
                                                <td className="py-3.5 px-4 text-right font-mono text-rose-600">
                                                    ₹{formatCurrency(slip.total_deductions)}
                                                </td>

                                                {/* Net Pay */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                                                        ₹{formatCurrency(slip.net_pay)}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {/* Preview Modal Button */}
                                                        <button
                                                            onClick={() => setPreviewSlip(slip)}
                                                            title="Preview Payslip"
                                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>

                                                        {/* Download PDF */}
                                                        <a
                                                            href={route('admin.salary-slips.download', slip.id)}
                                                            title="Download PDF"
                                                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                            download
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>

                                                        {/* Open Stream in Tab */}
                                                        <a
                                                            href={route('admin.salary-slips.preview', slip.id)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Open in new tab"
                                                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>

                                                        {/* Delete */}
                                                        <button
                                                            onClick={() => handleDeleteSlip(slip)}
                                                            title="Delete"
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {salarySlips.links && (
                        <div className="border-t border-slate-200 bg-slate-50/50 px-4">
                            <Pagination links={salarySlips.links} />
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Upload className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-base">Upload Salary Excel Sheet</h3>
                                    <p className="text-xs text-slate-500">Auto-generate payslips for all employees</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setIsUploadOpen(false); reset(); }}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                            {/* File Dropzone */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                    Excel / CSV File <span className="text-rose-500">*</span>
                                </label>
                                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50 hover:bg-blue-50/40 transition cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => setData('file', e.target.files[0])}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        required
                                    />
                                    <div className="space-y-2">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 text-blue-600 flex items-center justify-center mx-auto">
                                            <FileSpreadsheet className="w-6 h-6" />
                                        </div>
                                        {data.file ? (
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{data.file.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {(data.file.size / 1024).toFixed(1)} KB &bull; Click to change
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    Drop your Excel sheet here, or <span className="text-blue-600 underline">browse</span>
                                                </p>
                                                <p className="text-xs text-slate-500">Supports .xlsx, .xls, .csv</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {errors.file && (
                                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {errors.file}
                                    </p>
                                )}
                            </div>

                            {/* Company Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    placeholder={tenantCompanyName || "e.g. Wishery"}
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-medium"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Payslips will be generated under this company name (defaults to: <span className="font-semibold text-slate-700">{tenantCompanyName || 'Wishery'}</span>).
                                </p>
                            </div>

                            {/* Optional Month / Year */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Payslip Month (Optional Override)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. AUGUST 2026"
                                    value={data.month_year}
                                    onChange={(e) => setData('month_year', e.target.value)}
                                    className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    If left empty, will auto-detect from the Excel header (e.g. "PAYSLIP FOR THE MONTH OF AUGUST 2026").
                                </p>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                                <div className="font-semibold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Smart Automated Processing
                                </div>
                                <p className="text-blue-800/80 leading-relaxed">
                                    Employees will be automatically linked via their Employee ID or Name. Gross earnings, deductions, net pay and Indian currency in words are calculated and rendered into verified PDF payslips.
                                </p>
                            </div>

                            {/* Progress bar */}
                            {progress && (
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress.percentage}%` }}
                                    />
                                </div>
                            )}

                            {/* Footer Buttons */}
                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => { setIsUploadOpen(false); reset(); }}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.file}
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-md shadow-blue-600/20"
                                >
                                    {processing ? 'Processing & Generating...' : 'Upload & Generate Slips'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payslip Modal Preview */}
            <PayslipModal
                isOpen={!!previewSlip}
                onClose={() => setPreviewSlip(null)}
                slip={previewSlip}
                downloadUrl={previewSlip ? route('admin.salary-slips.download', previewSlip.id) : null}
                previewUrl={previewSlip ? route('admin.salary-slips.preview', previewSlip.id) : null}
            />
        </AdminLayout>
    );
}
