import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import {
    Download, FileText, Calendar, Home, Search,
    CheckCircle2, Clock, XCircle, ChevronRight, UserCheck, Filter
} from 'lucide-react';
import MonthPicker from '@/Components/MonthPicker';

export default function Report({ users = [], exportPreviewData = [], leaves = [], leaveStats = {}, filters = {} }) {
    const [activeTab, setActiveTab] = useState(filters.active_tab || 'attendance');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
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

    const totalExportWorkMinutes = (exportPreviewData || [])
        .filter(row => selectedUserIds.includes(row.user_id))
        .reduce((acc, row) => acc + (row.total_worked_minutes || 0), 0);

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

            <div className="p-4 sm:p-6 w-full space-y-6 font-sans">
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
                                            onClick={() => {
                                                if (selectedUserIds.length === 0) {
                                                    alert('Please select at least one user to export PDF.');
                                                    return;
                                                }
                                                window.print();
                                            }}
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
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                            <span>Report Preview:</span>
                                            <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-xl text-xs font-black border border-blue-100">
                                                {formatMonthLabel(currentMonth)}
                                            </span>
                                        </h3>
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

                                {/* Preview Data Table */}
                                <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-xs">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                                                <th className="p-4 w-12 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={exportPreviewData && exportPreviewData.length > 0 && selectedUserIds.length === exportPreviewData.length}
                                                        onChange={handleToggleAll}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        title="Select / Deselect All Users"
                                                    />
                                                </th>
                                                <th className="p-4">Employee</th>
                                                <th className="p-4 text-center">Present</th>
                                                <th className="p-4 text-center">Absent</th>
                                                <th className="p-4 text-center">Leaves</th>
                                                <th className="p-4 text-center">Late Days</th>
                                                <th className="p-4 text-center">Early Leave</th>
                                                <th className="p-4 text-center">Missing Punchouts</th>
                                                <th className="p-4 text-center">No Break Days</th>
                                                <th className="p-4 text-center">Work Hours</th>
                                                <th className="p-4 text-center">Break Hours</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white text-sm font-semibold text-slate-800">
                                            {filteredExportData && filteredExportData.length > 0 ? (
                                                filteredExportData.map((row) => {
                                                    const isSelected = selectedUserIds.includes(row.user_id);
                                                    return (
                                                        <tr key={row.user_id} className={`transition-colors ${isSelected ? 'hover:bg-slate-50/50' : 'bg-slate-50/40 opacity-50'}`}>
                                                            <td className="p-4 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleToggleUser(row.user_id)}
                                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="p-4 flex items-center gap-3">
                                                                <img
                                                                    src={row.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=0D8ABC&color=fff`}
                                                                    alt={row.name}
                                                                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                                                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=0D8ABC&color=fff`; }}
                                                                />
                                                                <div>
                                                                    <div className="font-extrabold text-slate-900">{row.name}</div>
                                                                    <div className="text-[11px] text-slate-400 font-normal">{row.email}</div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                    {row.present_days} days
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-100">
                                                                    {row.absent_days} days
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-100">
                                                                    {row.leave_days} days
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-100">
                                                                    {row.late_days} days
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-sky-50 text-sky-700 border border-sky-100">
                                                                    {row.early_leave_days} days
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold ${row.missing_punchouts > 0 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                                    {row.missing_punchouts || 0} days
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold ${row.no_break_days > 0 ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                                                    {row.no_break_days || 0} days
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center font-black text-slate-900">{row.work_hours}</td>
                                                            <td className="p-4 text-center font-bold text-slate-600">{row.break_hours}</td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="11" className="p-8 text-center text-slate-400 font-medium">
                                                        No attendance preview data available for the selected filters.
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
                                            onClick={() => window.print()}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, textTransform: 'uppercase', color: '#0f172a' }}>
                            WorkNest - {activeTab === 'attendance' ? 'Monthly Attendance Report' : 'Monthly Leave Report'}
                        </h1>
                        <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#475569' }}>
                            Report Month: <strong>{formatMonthLabel(currentMonth)}</strong> &bull; Generated On: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                {activeTab === 'attendance' ? (
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Leaves</th>
                                <th>Late Days</th>
                                <th>Early Leave</th>
                                <th>Work Hours</th>
                                <th>Break Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exportPreviewData && exportPreviewData.filter(row => selectedUserIds.includes(row.user_id)).map(row => (
                                <tr key={row.user_id}>
                                    <td><strong>{row.name}</strong></td>
                                    <td>{row.present_days} days</td>
                                    <td>{row.absent_days} days</td>
                                    <td>{row.leave_days} days</td>
                                    <td>{row.late_days} days</td>
                                    <td>{row.early_leave_days} days</td>
                                    <td><strong>{row.work_hours}</strong></td>
                                    <td>{row.break_hours}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Leave Type</th>
                                <th>From Date</th>
                                <th>To Date</th>
                                <th>Days</th>
                                <th>Status</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeaves && filteredLeaves.map(l => (
                                <tr key={l.id}>
                                    <td><strong>{l.user?.name || 'N/A'}</strong></td>
                                    <td>{l.leave_type}</td>
                                    <td>{l.from_date}</td>
                                    <td>{l.to_date}</td>
                                    <td>{l.no_of_days || 1}</td>
                                    <td>{l.status}</td>
                                    <td>{l.reason || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                .font-sans { font-family: 'Plus Jakarta Sans', sans-serif !important; }

                .custom-scrollbar-h::-webkit-scrollbar { height: 4px; }
                .custom-scrollbar-h::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
                .custom-scrollbar-h::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    header, nav, aside, footer, .no-print, button, a, select, input, .print-hide, .print\\:hidden {
                        display: none !important;
                    }
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-only-report, .print-only-report * {
                        visibility: visible !important;
                    }
                    .print-only-report {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: #ffffff !important;
                        padding: 24px !important;
                        z-index: 999999 !important;
                    }
                    .print-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin-top: 15px !important;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid #cbd5e1 !important;
                        padding: 8px 10px !important;
                        font-size: 11px !important;
                        text-align: center !important;
                    }
                    .print-table th {
                        background-color: #f1f5f9 !important;
                        color: #0f172a !important;
                        font-weight: 800 !important;
                        text-transform: uppercase !important;
                    }
                    .print-table th:first-child, .print-table td:first-child {
                        text-align: left !important;
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
