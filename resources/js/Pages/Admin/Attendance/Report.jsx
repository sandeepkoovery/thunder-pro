import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Download, FileText, Calendar, Home, Search,
    CheckCircle2, Clock, XCircle, ChevronRight, UserCheck, Filter
} from 'lucide-react';
import MonthPicker from '@/Components/MonthPicker';

export default function Report({ users = [], exportPreviewData = [], leaves = [], leaveStats = {}, filters = {}, company = null }) {
    const { auth, company: sharedCompany } = usePage().props;
    const companyInfo = company || sharedCompany || {
        name: auth?.user?.company_name || 'WorkNest',
        address: (auth?.user?.address && auth.user.address !== '#') ? auth.user.address : null,
        phone: (auth?.user?.phone && auth.user.phone !== '#') ? auth.user.phone : ((auth?.user?.mobile && auth.user.mobile !== '#') ? auth.user.mobile : null),
        email: (auth?.user?.email && auth.user.email !== '#') ? auth.user.email : null,
        gst_no: (auth?.user?.gst_no && auth.user.gst_no !== '#') ? auth.user.gst_no : null,
        logo: (auth?.user?.thumb || auth?.user?.image) ? auth?.user?.image_url : null,
        has_logo: Boolean((auth?.user?.thumb || auth?.user?.image) && auth?.user?.image_url),
    };
    const companyName = companyInfo?.name || auth?.user?.company_name || 'WorkNest';

    const [activeTab, setActiveTab] = useState(filters.active_tab || 'attendance');
    const [selectedUserIds, setSelectedUserIds] = useState(
        exportPreviewData && exportPreviewData.length > 0 ? exportPreviewData.map(u => u.user_id) : []
    );
    const [searchTerm, setSearchTerm] = useState('');

    // Attendance Filters (synced with props)
    const [attendanceUserId, setAttendanceUserId] = useState(filters.user_id || '');
    const currentMonth = filters.month || new Date().toISOString().slice(0, 7);

    // Leave Filters (synced with props)
    const [leaveUserId, setLeaveUserId] = useState(filters.leave_user_id || '');
    const [leaveStatus, setLeaveStatus] = useState(filters.leave_status || 'all');

    // Keep filter states in sync with backend props
    useEffect(() => {
        setAttendanceUserId(filters.user_id || '');
        setLeaveUserId(filters.leave_user_id || '');
        setLeaveStatus(filters.leave_status || 'all');
        if (filters.active_tab) {
            setActiveTab(filters.active_tab);
        }
    }, [filters]);

    // Keep selectedUserIds in sync when exportPreviewData changes
    useEffect(() => {
        if (exportPreviewData && exportPreviewData.length > 0) {
            setSelectedUserIds(exportPreviewData.map(u => u.user_id));
        } else {
            setSelectedUserIds([]);
        }
    }, [exportPreviewData]);

    // Ensure scroll position is reset to (0,0) whenever printing starts (both via Export button and Ctrl+P)
    useEffect(() => {
        const resetPrintScroll = () => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            const mainEl = document.querySelector('.mp-main');
            if (mainEl) mainEl.scrollTop = 0;
            const wrapperEl = document.querySelector('.mp-wrapper');
            if (wrapperEl) wrapperEl.scrollTop = 0;
        };

        window.addEventListener('beforeprint', resetPrintScroll);
        return () => window.removeEventListener('beforeprint', resetPrintScroll);
    }, []);

    // Helper to send filter request
    const applyFilters = (newParams) => {
        const params = {
            month: currentMonth,
            user_id: attendanceUserId,
            leave_user_id: leaveUserId,
            leave_status: leaveStatus,
            active_tab: activeTab,
            ...newParams,
        };
        router.get(route('admin.attendance.report'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        applyFilters({ active_tab: tabId });
    };

    const handleExportPdf = () => {
        if (activeTab === 'attendance' && selectedUserIds.length === 0) {
            alert('Please select at least one user to export PDF.');
            return;
        }

        // Reset scroll position on window and scrollable layout containers so Chromium doesn't offset or crop the page
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const mainEl = document.querySelector('.mp-main');
        if (mainEl) mainEl.scrollTop = 0;
        const wrapperEl = document.querySelector('.mp-wrapper');
        if (wrapperEl) wrapperEl.scrollTop = 0;

        setTimeout(() => {
            window.print();
        }, 50);
    };

    const handleMonthChange = (newMonth) => {
        let monthStr = newMonth;
        if (typeof newMonth === 'object' && newMonth !== null) {
            monthStr = newMonth.target?.value || newMonth.value || '';
        }
        if (typeof monthStr === 'string' && monthStr) {
            applyFilters({ month: monthStr });
        }
    };

    const handleAttendanceUserChange = (userId) => {
        setAttendanceUserId(userId);
        applyFilters({ user_id: userId, active_tab: 'attendance' });
    };

    const handleLeaveUserChange = (userId) => {
        setLeaveUserId(userId);
        applyFilters({ leave_user_id: userId, active_tab: 'leave' });
    };

    const handleLeaveStatusChange = (status) => {
        setLeaveStatus(status);
        applyFilters({ leave_status: status, active_tab: 'leave' });
    };

    const handleToggleAll = (e) => {
        if (e.target.checked) {
            setSelectedUserIds(exportPreviewData ? exportPreviewData.map(u => u.user_id) : []);
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleToggleUser = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const commonWorkingDays = (exportPreviewData && exportPreviewData.length > 0)
        ? (exportPreviewData[0]?.total_working_days || (exportPreviewData[0]?.present_days + exportPreviewData[0]?.absent_days + exportPreviewData[0]?.leave_days) || 0)
        : 0;
    const commonNeededHours = (exportPreviewData && exportPreviewData.length > 0)
        ? (exportPreviewData[0]?.needed_hours || (commonWorkingDays * 8))
        : (commonWorkingDays * 8);

    const selectedAttendanceRows = (exportPreviewData || []).filter(row =>
        selectedUserIds.length > 0 ? selectedUserIds.includes(row.user_id) : true
    );

    const totalExportWorkMinutes = selectedAttendanceRows
        .reduce((acc, row) => acc + (row.total_worked_minutes || 0), 0);

    const totalExportBreakMinutes = selectedAttendanceRows
        .reduce((acc, row) => {
            if (typeof row.total_break_minutes === 'number') return acc + row.total_break_minutes;
            const match = (row.break_hours || '').match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
            if (match) {
                const h = parseInt(match[1] || '0', 10);
                const m = parseInt(match[2] || '0', 10);
                return acc + (h * 60 + m);
            }
            return acc;
        }, 0);

    const totalWorkingDaysSum = selectedAttendanceRows.reduce((acc, r) => acc + (r.total_working_days || (r.present_days + r.absent_days + r.leave_days) || 0), 0);
    const totalNeededHoursSum = selectedAttendanceRows.reduce((acc, r) => acc + (r.needed_hours || ((r.total_working_days || (r.present_days + r.absent_days + r.leave_days) || 0) * 8)), 0);
    const totalPresentDays = selectedAttendanceRows.reduce((acc, r) => acc + (r.present_days || 0), 0);
    const totalAbsentDays = selectedAttendanceRows.reduce((acc, r) => acc + (r.absent_days || 0), 0);
    const totalLeaveDays = selectedAttendanceRows.reduce((acc, r) => acc + (r.leave_days || 0), 0);
    const totalLateDays = selectedAttendanceRows.reduce((acc, r) => acc + (r.late_days || 0), 0);
    const totalEarlyLeaveDays = selectedAttendanceRows.reduce((acc, r) => acc + (r.early_leave_days || 0), 0);
    const totalMissingPunchouts = selectedAttendanceRows.reduce((acc, r) => acc + (r.missing_punchouts || 0), 0);
    const totalNoBreakDays = selectedAttendanceRows.reduce((acc, r) => acc + (r.no_break_days || 0), 0);

    const formatDuration = (mins) => {
        if (!mins || mins <= 0) return '0h 0m';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const formatMonthLabel = (monthStr) => {
        if (!monthStr) return '';
        try {
            const [y, m] = monthStr.split('-');
            const date = new Date(parseInt(y), parseInt(m) - 1, 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch (e) {
            return monthStr;
        }
    };

    const tabs = [
        { id: 'attendance', label: 'Attendance Report' },
        { id: 'leave', label: 'Leave Report' },
    ];

    const filteredExportData = (exportPreviewData || []).filter(row =>
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredLeaves = (leaves || []).filter(leave => {
        const userName = leave.user?.name || '';
        const userEmail = leave.user?.email || '';
        const reason = leave.reason || '';
        return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reason.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <AdminLayout title="Reports">
            <Head title="Reports & Analytics" />

            <div className="screen-content p-4 sm:p-6 w-full space-y-6 font-sans print:hidden no-print">
                {/* Header & Breadcrumb */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Reports</h1>
                        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-1">
                            <span className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition cursor-pointer">
                                <Home className="w-3.5 h-3.5" /> Home
                            </span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-slate-800 font-bold">Reports</span>
                        </nav>
                    </div>
                </div>

                {/* Tab Navigation System: Attendance Report & Leave Report */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar-h">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-xs ${
                                    isActive
                                        ? 'bg-[#2d3748] text-white shadow-md'
                                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: ATTENDANCE REPORT */}
                {activeTab === 'attendance' && (
                    <div className="space-y-6">
                        {/* Attendance Export Card Banner & Filters */}
                        <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-xs border border-slate-100 space-y-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                                        <Download className="w-6 h-6 text-blue-600" /> Attendance Monthly Data Export
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                                        Select a month and employee below to preview user metrics before generating CSV or PDF exports.
                                    </p>
                                </div>

                                {/* Month & User Filters + Action Buttons */}
                                <div className="flex flex-wrap items-end gap-3">
                                    {/* Month Selector */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Export Month</label>
                                        <MonthPicker
                                            value={currentMonth}
                                            onChange={handleMonthChange}
                                            className="min-w-[180px]"
                                        />
                                    </div>

                                    {/* User Filter Dropdown */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Employee</label>
                                        <select
                                            value={attendanceUserId}
                                            onChange={(e) => handleAttendanceUserChange(e.target.value)}
                                            className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none min-w-[180px]"
                                        >
                                            <option value="">All Employees</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Export CSV & PDF Buttons */}
                                    <div className="flex items-end gap-2 pt-5">
                                        <a
                                            href={selectedUserIds.length > 0
                                                ? route('admin.attendance.export', { month: currentMonth, user_id: attendanceUserId, user_ids: selectedUserIds.join(',') })
                                                : '#'
                                            }
                                            onClick={(e) => {
                                                if (selectedUserIds.length === 0) {
                                                    e.preventDefault();
                                                    alert('Please select at least one user to export CSV.');
                                                }
                                            }}
                                            className={`flex items-center gap-2 px-5 h-11 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs ${selectedUserIds.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}
                                        >
                                            <Download className="w-4 h-4" /> Export CSV ({selectedUserIds.length})
                                        </a>

                                        <button
                                            onClick={handleExportPdf}
                                            className={`flex items-center gap-2 px-5 h-11 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs ${selectedUserIds.length > 0 ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}
                                        >
                                            <FileText className="w-4 h-4" /> Export PDF ({selectedUserIds.length})
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Header & Search */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                            <span>Report Preview:</span>
                                            <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-xl text-xs font-black border border-blue-100">
                                                {formatMonthLabel(currentMonth)}
                                            </span>
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200">
                                            <span>Working Days: <strong className="text-slate-900 font-extrabold">{commonWorkingDays} Days</strong></span>
                                            <span className="text-slate-300">•</span>
                                            <span>Required Hours: <strong className="text-blue-700 font-extrabold">{commonNeededHours}h</strong></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-64">
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Search employee..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                                            />
                                        </div>
                                        <span className="text-xs text-slate-500 font-extrabold whitespace-nowrap">
                                            Selected {selectedUserIds.length} of {exportPreviewData?.length || 0} Employees
                                        </span>
                                    </div>
                                </div>

                                {/* Preview Data Table matching screenshot style */}
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs bg-white">
                                    <table className="w-full text-left border-collapse" style={{ borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr className="bg-slate-50 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                                                <th className="px-4 py-3.5 w-10 text-center" style={{ border: '1px solid #cbd5e1' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={exportPreviewData && exportPreviewData.length > 0 && selectedUserIds.length === exportPreviewData.length}
                                                        onChange={handleToggleAll}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        title="Select / Deselect All Users"
                                                    />
                                                </th>
                                                <th className="px-4 py-3.5 text-left" style={{ border: '1px solid #cbd5e1', minWidth: '160px' }}>Employee</th>
                                                <th className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>Present</th>
                                                <th className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>Absent</th>
                                                <th className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>Leaves</th>
                                                <th className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>Late Days</th>
                                                <th className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>Missing Punchouts</th>
                                                <th className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>
                                                    <div>Work Hours</div>
                                                    <div className="text-[10px] text-blue-600 font-semibold normal-case tracking-normal">
                                                        (Req: {commonNeededHours}h)
                                                    </div>
                                                </th>
                                                <th className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>Break Hours</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white text-[13.5px] font-normal text-slate-800">
                                            {filteredExportData && filteredExportData.length > 0 ? (
                                                filteredExportData.map((row) => {
                                                    const isSelected = selectedUserIds.includes(row.user_id);
                                                    const workedMins = row.total_worked_minutes || 0;
                                                    const targetMins = (commonNeededHours && commonNeededHours > 0)
                                                        ? (commonNeededHours * 60)
                                                        : (row.needed_minutes || ((commonWorkingDays || 21) * 8 * 60));
                                                    const isLowHours = workedMins < targetMins;
                                                    const missingDays = row.missing_punchouts || 0;
                                                    const hasLeave = (row.leave_days || 0) > 0;
                                                    const hasAbsent = (row.absent_days || 0) > 0;

                                                    return (
                                                        <tr key={row.user_id} className={`transition-colors ${isSelected ? 'hover:bg-slate-50/50' : 'bg-slate-50/40 opacity-50'}`}>
                                                            <td className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleToggleUser(row.user_id)}
                                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3.5 text-left" style={{ border: '1px solid #cbd5e1' }}>
                                                                <div className="font-bold text-[14.5px] text-slate-900 leading-snug">{row.name}</div>
                                                                {row.email && <div className="text-[11.5px] text-slate-400 font-normal mt-0.5">{row.email}</div>}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-slate-800 font-normal" style={{ border: '1px solid #cbd5e1' }}>
                                                                {row.present_days} days
                                                            </td>
                                                            <td className={`px-4 py-3.5 text-center font-normal ${hasAbsent ? 'text-red-600' : 'text-slate-800'}`} style={{ border: '1px solid #cbd5e1' }}>
                                                                {row.absent_days} days
                                                            </td>
                                                            <td className={`px-4 py-3.5 text-center font-normal ${hasLeave ? 'text-red-600' : 'text-slate-800'}`} style={{ border: '1px solid #cbd5e1' }}>
                                                                {row.leave_days} days
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-slate-800 font-normal" style={{ border: '1px solid #cbd5e1' }}>
                                                                {row.late_days || 0} days
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center font-normal" style={{ border: '1px solid #cbd5e1' }}>
                                                                <div className="text-slate-800">{missingDays} days</div>
                                                                {missingDays > 0 && (
                                                                    <div className="text-[12px] text-red-600 mt-0.5 font-medium">
                                                                        {missingDays * 8} hours
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className={`px-4 py-3.5 text-center font-normal ${isLowHours ? 'text-red-600' : 'text-slate-900'}`} style={{ border: '1px solid #cbd5e1' }}>
                                                                <span className={isLowHours ? 'text-red-600 font-semibold' : 'text-slate-900'}>
                                                                    {row.work_hours}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-slate-700 font-normal" style={{ border: '1px solid #cbd5e1' }}>
                                                                {row.break_hours}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="9" className="p-8 text-center text-slate-400 font-normal" style={{ border: '1px solid #cbd5e1' }}>
                                                        No attendance preview data available for the selected filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {filteredExportData && filteredExportData.length > 0 && (
                                            <tfoot>
                                                <tr className="bg-slate-50 font-normal text-[13px] text-slate-800">
                                                    <td className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}></td>
                                                    <td className="px-4 py-3.5 text-left font-medium" style={{ border: '1px solid #cbd5e1' }}>
                                                        Total ({selectedAttendanceRows.length} {selectedAttendanceRows.length === 1 ? 'Employee' : 'Employees'})
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>
                                                        {totalPresentDays} days
                                                    </td>
                                                    <td className={`px-4 py-3.5 text-center ${totalAbsentDays > 0 ? 'text-red-600' : ''}`} style={{ border: '1px solid #cbd5e1' }}>
                                                        {totalAbsentDays} days
                                                    </td>
                                                    <td className={`px-4 py-3.5 text-center ${totalLeaveDays > 0 ? 'text-red-600' : ''}`} style={{ border: '1px solid #cbd5e1' }}>
                                                        {totalLeaveDays} days
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>
                                                        {totalLateDays} days
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>
                                                        <div>{totalMissingPunchouts} days</div>
                                                        {totalMissingPunchouts > 0 && (
                                                            <div className="text-[12px] text-red-600 mt-0.5 font-medium">
                                                                {totalMissingPunchouts * 8} hours
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className={`px-4 py-3.5 text-center ${totalExportWorkMinutes < (selectedAttendanceRows.length * commonNeededHours * 60) ? 'text-red-600' : ''}`} style={{ border: '1px solid #cbd5e1' }}>
                                                        {formatDuration(totalExportWorkMinutes)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center" style={{ border: '1px solid #cbd5e1' }}>
                                                        {formatDuration(totalExportBreakMinutes)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: LEAVE REPORT */}
                {activeTab === 'leave' && (
                    <div className="space-y-6">
                        {/* Leave Export & Filter Card */}
                        <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-xs border border-slate-100 space-y-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                                        <FileText className="w-6 h-6 text-purple-600" /> Leave Monthly Report & Export
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                                        Filter leave requests by month, employee, and status before exporting reports.
                                    </p>
                                </div>

                                {/* Month, User & Status Filters + Export Buttons */}
                                <div className="flex flex-wrap items-end gap-3">
                                    {/* Month Selector */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Report Month</label>
                                        <MonthPicker
                                            value={currentMonth}
                                            onChange={handleMonthChange}
                                            className="min-w-[180px]"
                                        />
                                    </div>

                                    {/* User Filter Dropdown */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Employee</label>
                                        <select
                                            value={leaveUserId}
                                            onChange={(e) => handleLeaveUserChange(e.target.value)}
                                            className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none min-w-[180px]"
                                        >
                                            <option value="">All Employees</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Leave Status Filter Dropdown */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Status</label>
                                        <select
                                            value={leaveStatus}
                                            onChange={(e) => handleLeaveStatusChange(e.target.value)}
                                            className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none min-w-[140px]"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="approved">Approved</option>
                                            <option value="pending">Pending</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>

                                    {/* Export Leave CSV & PDF Buttons */}
                                    <div className="flex items-end gap-2">
                                        <a
                                            href={route('admin.attendance.report.export-leaves', {
                                                month: currentMonth,
                                                leave_user_id: leaveUserId,
                                                leave_status: leaveStatus
                                            })}
                                            className="flex items-center gap-2 px-5 h-11 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                                        >
                                            <Download className="w-4 h-4" /> Export CSV ({leaves?.length || 0})
                                        </a>

                                        <button
                                            onClick={handleExportPdf}
                                            className="flex items-center gap-2 px-5 h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                                        >
                                            <FileText className="w-4 h-4" /> Export PDF
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Metric Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Leave Requests</p>
                                        <FileText className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <p className="text-3xl font-black text-slate-900 mt-2">{leaveStats.total || 0}</p>
                                </div>
                                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/80">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Approved</p>
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <p className="text-3xl font-black text-emerald-700 mt-2">{leaveStats.approved || 0}</p>
                                </div>
                                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100/80">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">Pending</p>
                                        <Clock className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <p className="text-3xl font-black text-amber-700 mt-2">{leaveStats.pending || 0}</p>
                                </div>
                                <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100/80">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-extrabold text-rose-700 uppercase tracking-wider">Rejected</p>
                                        <XCircle className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <p className="text-3xl font-black text-rose-700 mt-2">{leaveStats.rejected || 0}</p>
                                </div>
                            </div>

                            {/* Leave Report Logs Table */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                        <span>Leave Report Preview:</span>
                                        <span className="text-purple-600 bg-purple-50 px-3 py-1 rounded-xl text-xs font-black border border-purple-100">
                                            {formatMonthLabel(currentMonth)}
                                        </span>
                                    </h3>
                                    <div className="relative w-64">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Search leave log..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-xs">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                                                <th className="p-4">Employee</th>
                                                <th className="p-4">Leave Type</th>
                                                <th className="p-4 text-center">Day Type</th>
                                                <th className="p-4 text-center">From Date</th>
                                                <th className="p-4 text-center">To Date</th>
                                                <th className="p-4 text-center">Days</th>
                                                <th className="p-4 text-center">Status</th>
                                                <th className="p-4">Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-800">
                                            {filteredLeaves && filteredLeaves.length > 0 ? (
                                                filteredLeaves.map(l => (
                                                    <tr key={l.id} className="hover:bg-slate-50/60 transition">
                                                        <td className="p-4 flex items-center gap-3">
                                                            <img
                                                                src={l.user?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(l.user?.name || 'User')}&background=6366F1&color=fff`}
                                                                alt={l.user?.name}
                                                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                                                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(l.user?.name || 'User')}&background=6366F1&color=fff`; }}
                                                            />
                                                            <div>
                                                                <div className="font-extrabold text-slate-900">{l.user?.name || 'N/A'}</div>
                                                                <div className="text-[11px] text-slate-400 font-normal">{l.user?.email}</div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-slate-700 capitalize font-bold">
                                                            {l.leave_type ? l.leave_type.replace('_', ' ') : 'Casual Leave'}
                                                        </td>
                                                        <td className="p-4 text-center text-xs text-slate-500 font-medium capitalize">
                                                            {l.day_type ? l.day_type.replace('_', ' ') : 'Full Day'}
                                                        </td>
                                                        <td className="p-4 text-center font-bold text-slate-700">{l.from_date}</td>
                                                        <td className="p-4 text-center font-bold text-slate-700">{l.to_date}</td>
                                                        <td className="p-4 text-center">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                                                                {l.no_of_days || 1} day(s)
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                                                                l.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                                l.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                                'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}>
                                                                {l.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-xs text-slate-600 max-w-xs truncate" title={l.reason}>
                                                            {l.reason || '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">
                                                        No leave records found matching your filters for this month.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Printable PDF Template */}
            <div className="print-only-report">
                {/* Header Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {companyInfo?.has_logo && companyInfo?.logo && (
                            <img
                                src={companyInfo.logo}
                                alt={companyName}
                                style={{ maxHeight: '38px', maxWidth: '140px', objectFit: 'contain', display: 'block' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        )}
                        <div>
                            <h1 style={{ fontSize: '17px', fontWeight: '900', margin: 0, textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.02em', lineHeight: '1.2' }}>
                                {companyName}
                            </h1>
                            <div style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#334155', letterSpacing: '0.03em', marginTop: '2px' }}>
                                {activeTab === 'attendance' ? 'Monthly Attendance Report' : 'Monthly Leave Report'}
                            </div>
                            <p style={{ fontSize: '9.5px', margin: '2px 0 0 0', color: '#475569' }}>
                                Report Month: <strong>{formatMonthLabel(currentMonth)}</strong> &bull; Working Days: <strong>{commonWorkingDays} Days</strong> &bull; Required Hours: <strong>{commonNeededHours}h</strong> &bull; Generated On: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '9.5px', color: '#334155', lineHeight: '1.4' }}>
                        {activeTab === 'attendance' ? (
                            <>
                                <p style={{ margin: 0 }}>Selected Employees: <strong>{selectedAttendanceRows.length} of {exportPreviewData?.length || 0}</strong></p>
                                <p style={{ margin: '2px 0 0 0' }}>Total Work Hours: <strong>{formatDuration(totalExportWorkMinutes)}</strong></p>
                            </>
                        ) : (
                            <>
                                <p style={{ margin: 0 }}>Total Requests: <strong>{leaveStats.total ?? filteredLeaves?.length ?? 0}</strong></p>
                                <p style={{ margin: '2px 0 0 0' }}>Approved: <strong>{leaveStats.approved ?? filteredLeaves?.filter(l => l.status === 'approved').length ?? 0}</strong> &bull; Pending: <strong>{leaveStats.pending ?? filteredLeaves?.filter(l => l.status === 'pending').length ?? 0}</strong></p>
                            </>
                        )}
                    </div>
                </div>

                {/* Summary Metric Cards matching report screen */}
                {activeTab === 'attendance' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#f8fafc' }}>
                            <div style={{ fontSize: '8.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Selected Employees</div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', marginTop: '2px', lineHeight: '1.2' }}>{selectedAttendanceRows.length}</div>
                        </div>
                        <div style={{ border: '1px solid #bbf7d0', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#f0fdf4' }}>
                            <div style={{ fontSize: '8.5px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Present Days</div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#166534', marginTop: '2px', lineHeight: '1.2' }}>{totalPresentDays} days</div>
                        </div>
                        <div style={{ border: '1px solid #fecdd3', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#fff1f2' }}>
                            <div style={{ fontSize: '8.5px', fontWeight: '800', color: '#be123c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Absent Days</div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#9f1239', marginTop: '2px', lineHeight: '1.2' }}>{totalAbsentDays} days</div>
                        </div>
                        <div style={{ border: '1px solid #bfdbfe', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#eff6ff' }}>
                            <div style={{ fontSize: '8.5px', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Work Hours</div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#1e40af', marginTop: '2px', lineHeight: '1.2' }}>{formatDuration(totalExportWorkMinutes)}</div>
                            <div style={{ fontSize: '8px', fontWeight: '700', color: '#64748b', marginTop: '1px' }}>Target: {commonNeededHours}h / emp</div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#f8fafc' }}>
                            <div style={{ fontSize: '8.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Leave Requests</div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', marginTop: '2px', lineHeight: '1.2' }}>{leaveStats.total ?? filteredLeaves?.length ?? 0}</div>
                        </div>
                        <div style={{ border: '1px solid #bbf7d0', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#f0fdf4' }}>
                            <div style={{ fontSize: '8.5px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Approved</div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#166534', marginTop: '2px', lineHeight: '1.2' }}>{leaveStats.approved ?? filteredLeaves?.filter(l => l.status === 'approved').length ?? 0}</div>
                        </div>
                        <div style={{ border: '1px solid #fde68a', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#fffbeb' }}>
                            <div style={{ fontSize: '8.5px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending</div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#92400e', marginTop: '2px', lineHeight: '1.2' }}>{leaveStats.pending ?? filteredLeaves?.filter(l => l.status === 'pending').length ?? 0}</div>
                        </div>
                        <div style={{ border: '1px solid #fecdd3', borderRadius: '6px', padding: '7px 10px', backgroundColor: '#fff1f2' }}>
                            <div style={{ fontSize: '8.5px', fontWeight: '800', color: '#be123c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rejected</div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#9f1239', marginTop: '2px', lineHeight: '1.2' }}>{leaveStats.rejected ?? filteredLeaves?.filter(l => l.status === 'rejected').length ?? 0}</div>
                        </div>
                    </div>
                )}

                {/* Tab 1: Attendance Report Table matching screenshot style */}
                {activeTab === 'attendance' ? (
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', minWidth: '160px' }}>Employee</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Leaves</th>
                                <th>Late Days</th>
                                <th>Missing Punchouts</th>
                                <th>Work Hours</th>
                                <th>Break Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedAttendanceRows && selectedAttendanceRows.length > 0 ? (
                                selectedAttendanceRows.map(row => {
                                    const workedMins = row.total_worked_minutes || 0;
                                    const targetMins = (commonNeededHours && commonNeededHours > 0)
                                        ? (commonNeededHours * 60)
                                        : (row.needed_minutes || ((commonWorkingDays || 21) * 8 * 60));
                                    const isLowHours = workedMins < targetMins;
                                    const missingDays = row.missing_punchouts || 0;
                                    const hasLeave = (row.leave_days || 0) > 0;
                                    const hasAbsent = (row.absent_days || 0) > 0;

                                    return (
                                        <tr key={row.user_id}>
                                            <td style={{ textAlign: 'left' }}>
                                                <div style={{ color: '#0f172a', fontWeight: '700', fontSize: '11.5px', lineHeight: '1.25' }}>{row.name}</div>
                                                {row.email && (
                                                    <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '400', marginTop: '2px', lineHeight: '1.2' }}>{row.email}</div>
                                                )}
                                            </td>
                                            <td>{row.present_days} days</td>
                                            <td className={hasAbsent ? 'text-red' : ''}>
                                                <span style={{ color: hasAbsent ? '#dc2626' : '#334155' }}>{row.absent_days} days</span>
                                            </td>
                                            <td className={hasLeave ? 'text-red' : ''}>
                                                <span style={{ color: hasLeave ? '#dc2626' : '#334155' }}>{row.leave_days} days</span>
                                            </td>
                                            <td>{row.late_days || 0} days</td>
                                            <td>
                                                <div>{missingDays} days</div>
                                                {missingDays > 0 && (
                                                    <div className="text-red" style={{ color: '#dc2626', fontSize: '9px', marginTop: '2px', fontWeight: '600', lineHeight: '1.2' }}>
                                                        {missingDays * 8} hours
                                                    </div>
                                                )}
                                            </td>
                                            <td className={isLowHours ? 'text-red' : ''}>
                                                <span style={{ color: isLowHours ? '#dc2626' : '#0f172a', fontWeight: isLowHours ? '600' : '400' }}>
                                                    {row.work_hours}
                                                </span>
                                            </td>
                                            <td style={{ color: '#475569' }}>{row.break_hours}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                                        No attendance records selected for export.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {selectedAttendanceRows && selectedAttendanceRows.length > 0 && (
                            <tbody style={{ borderTop: '2px solid #cbd5e1', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <tr style={{ backgroundColor: '#f8fafc', fontWeight: '700' }}>
                                    <td style={{ textAlign: 'left' }}>
                                        Total ({selectedAttendanceRows.length} {selectedAttendanceRows.length === 1 ? 'Employee' : 'Employees'})
                                    </td>
                                    <td>{totalPresentDays} days</td>
                                    <td className={totalAbsentDays > 0 ? 'text-red' : ''} style={{ color: totalAbsentDays > 0 ? '#dc2626' : 'inherit' }}>{totalAbsentDays} days</td>
                                    <td className={totalLeaveDays > 0 ? 'text-red' : ''} style={{ color: totalLeaveDays > 0 ? '#dc2626' : 'inherit' }}>{totalLeaveDays} days</td>
                                    <td>{totalLateDays} days</td>
                                    <td>
                                        <div>{totalMissingPunchouts} days</div>
                                        {totalMissingPunchouts > 0 && (
                                            <div className="text-red" style={{ color: '#dc2626', fontSize: '9px', marginTop: '2px', fontWeight: '600' }}>
                                                {totalMissingPunchouts * 8} hours
                                            </div>
                                        )}
                                    </td>
                                    <td className={totalExportWorkMinutes < (selectedAttendanceRows.length * commonNeededHours * 60) ? 'text-red' : ''} style={{ color: totalExportWorkMinutes < (selectedAttendanceRows.length * commonNeededHours * 60) ? '#dc2626' : 'inherit' }}>
                                        {formatDuration(totalExportWorkMinutes)}
                                    </td>
                                    <td>{formatDuration(totalExportBreakMinutes)}</td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                ) : (
                    /* Tab 2: Leave Report Table */
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', minWidth: '160px' }}>Employee</th>
                                <th style={{ textAlign: 'left' }}>Leave Type</th>
                                <th>Day Type</th>
                                <th>From Date</th>
                                <th>To Date</th>
                                <th>Days</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'left' }}>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeaves && filteredLeaves.length > 0 ? (
                                filteredLeaves.map(l => (
                                    <tr key={l.id}>
                                        <td style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '11.5px' }}>{l.user?.name || 'N/A'}</div>
                                            {l.user?.email && (
                                                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '400', marginTop: '2px' }}>{l.user.email}</div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'left', textTransform: 'capitalize', fontWeight: '700', color: '#334155', fontSize: '10.5px' }}>
                                            {l.leave_type ? l.leave_type.replace(/_/g, ' ') : 'Casual Leave'}
                                        </td>
                                        <td style={{ textTransform: 'capitalize', color: '#475569', fontSize: '10.5px' }}>
                                            {l.day_type ? l.day_type.replace(/_/g, ' ') : 'Full Day'}
                                        </td>
                                        <td style={{ fontWeight: '700', color: '#334155', fontSize: '10.5px' }}>{l.from_date}</td>
                                        <td style={{ fontWeight: '700', color: '#334155', fontSize: '10.5px' }}>{l.to_date}</td>
                                        <td>
                                            <span className="print-badge print-badge-neutral">{l.no_of_days || 1} day(s)</span>
                                        </td>
                                        <td>
                                            <span className={`print-badge ${
                                                l.status === 'approved' ? 'print-badge-present' :
                                                l.status === 'pending' ? 'print-badge-late' :
                                                'print-badge-absent'
                                            }`} style={{ textTransform: 'capitalize' }}>
                                                {l.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'left', fontSize: '9.5px', color: '#475569', maxWidth: '240px', wordBreak: 'break-word', lineHeight: '1.3' }}>
                                            {l.reason || '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                                        No leave records found matching your filters for this month.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredLeaves && filteredLeaves.length > 0 && (
                            <tbody style={{ borderTop: '2px solid #94a3b8', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '800' }}>
                                    <td style={{ textAlign: 'left' }}>
                                        Total ({filteredLeaves.length} {filteredLeaves.length === 1 ? 'Record' : 'Records'})
                                    </td>
                                    <td style={{ textAlign: 'left' }}>-</td>
                                    <td>-</td>
                                    <td>-</td>
                                    <td>-</td>
                                    <td>
                                        {filteredLeaves.reduce((acc, l) => acc + (parseFloat(l.no_of_days) || 1), 0)} day(s)
                                    </td>
                                    <td>
                                        Approved: {filteredLeaves.filter(l => l.status === 'approved').length}
                                    </td>
                                    <td style={{ textAlign: 'left' }}>-</td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                )}

                {/* Professional Letterhead Footer */}
                <div className="print-footer" style={{ marginTop: '12px', paddingTop: '6px', borderTop: '1px solid #cbd5e1', fontSize: '9px', color: '#475569', textAlign: 'center', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.04em', marginBottom: '2px' }}>
                        {companyName}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '3px 12px', color: '#334155' }}>
                        {companyInfo?.address && (
                            <span><strong>Address:</strong> {companyInfo.address}</span>
                        )}
                        {companyInfo?.phone && (
                            <span><strong>Phone:</strong> {companyInfo.phone}</span>
                        )}
                        {companyInfo?.email && (
                            <span><strong>Email:</strong> {companyInfo.email}</span>
                        )}
                        {companyInfo?.gst_no && (
                            <span><strong>GSTIN:</strong> {companyInfo.gst_no}</span>
                        )}
                    </div>
                    <div style={{ marginTop: '3px', fontSize: '7.5px', color: '#94a3b8' }}>
                        Confidential &bull; Generated via {companyName} HRMS &bull; Computer generated report, signature not required.
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                .font-sans { font-family: 'Plus Jakarta Sans', sans-serif !important; }

                .custom-scrollbar-h::-webkit-scrollbar { height: 4px; }
                .custom-scrollbar-h::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
                .custom-scrollbar-h::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

                @page {
                    size: landscape;
                    margin: 6mm 8mm;
                }

                @media print {
                    /* 1. Hide on-screen UI components */
                    .screen-content,
                    .no-print,
                    .print-hide,
                    .print\\:hidden,
                    header,
                    nav,
                    aside,
                    footer,
                    button,
                    a,
                    select,
                    input,
                    .mp-sidebar,
                    .mp-topbar,
                    .mp-header,
                    .mp-bottom-nav,
                    .theme-customizer {
                        display: none !important;
                    }

                    /* 2. Reset parents so everything displays cleanly without clipping or blank offsets */
                    html,
                    html:has(.mp-wrapper),
                    body,
                    body:has(.mp-wrapper),
                    #app,
                    .mp-wrapper,
                    .mp-shell,
                    .mp-body-row,
                    .mp-body,
                    .mp-main,
                    .mp-fade,
                    main {
                        display: block !important;
                        position: static !important;
                        overflow: visible !important;
                        overflow-x: visible !important;
                        overflow-y: visible !important;
                        height: auto !important;
                        min-height: 0 !important;
                        max-height: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        float: none !important;
                        transform: none !important;
                        filter: none !important;
                        box-shadow: none !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* 3. Display print container in normal flow right from top of Page 1 */
                    .print-only-report {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        position: static !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        box-sizing: border-box !important;
                        overflow: visible !important;
                    }

                    .print-only-report * {
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    .print-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin-top: 6px !important;
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                    }
                    .print-table thead {
                        display: table-header-group !important;
                    }
                    .print-table tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        break-inside: avoid-page !important;
                        -webkit-column-break-inside: avoid !important;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid #cbd5e1 !important;
                        padding: 7px 9px !important;
                        font-size: 10.5px !important;
                        line-height: 1.35 !important;
                        font-weight: 400 !important;
                        text-align: center !important;
                        vertical-align: middle !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .print-table th {
                        background-color: #f8fafc !important;
                        color: #1e293b !important;
                        font-weight: 700 !important;
                        text-transform: uppercase !important;
                        font-size: 9.5px !important;
                        letter-spacing: 0.04em !important;
                        padding: 8px 9px !important;
                    }
                    .print-table td {
                        color: #1e293b;
                    }
                    .print-table td.text-red,
                    .print-table td.text-red *,
                    .print-table .text-red,
                    .print-table span.text-red {
                        color: #dc2626 !important;
                    }
                    .print-table td:first-child, .print-table th:first-child {
                        text-align: left !important;
                        padding-left: 10px !important;
                    }
                    .print-footer {
                        width: 100% !important;
                        margin-top: 12px !important;
                        padding-top: 6px !important;
                        border-top: 1px solid #cbd5e1 !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .print-badge {
                        display: inline-block !important;
                        padding: 2.5px 6px !important;
                        border-radius: 4px !important;
                        font-size: 9.5px !important;
                        font-weight: 800 !important;
                        border: 1px solid transparent !important;
                        white-space: nowrap !important;
                    }
                    .print-badge-present {
                        background-color: #ecfdf5 !important;
                        color: #047857 !important;
                        border-color: #a7f3d0 !important;
                    }
                    .print-badge-absent {
                        background-color: #fff1f2 !important;
                        color: #be123c !important;
                        border-color: #fecdd3 !important;
                    }
                    .print-badge-leave {
                        background-color: #faf5ff !important;
                        color: #7e22ce !important;
                        border-color: #e9d5ff !important;
                    }
                    .print-badge-late {
                        background-color: #fffbeb !important;
                        color: #b45309 !important;
                        border-color: #fde68a !important;
                    }
                    .print-badge-early {
                        background-color: #f0f9ff !important;
                        color: #0369a1 !important;
                        border-color: #bae6fd !important;
                    }
                    .print-badge-warn {
                        background-color: #fef3c7 !important;
                        color: #92400e !important;
                        border-color: #fcd34d !important;
                    }
                    .print-badge-teal {
                        background-color: #f0fdfa !important;
                        color: #0f766e !important;
                        border-color: #99f6e4 !important;
                    }
                    .print-badge-neutral {
                        background-color: #f8fafc !important;
                        color: #475569 !important;
                        border-color: #e2e8f0 !important;
                    }
                }
                @media screen {
                    .print-only-report {
                        display: none !important;
                    }
                }
            ` }} />
        </AdminLayout>
    );
}
