import React from 'react';
import UserLayout from '@/Layouts/UserLayout';
import { Head, router, usePage, Link } from '@inertiajs/react';
import MonthPicker from '@/Components/MonthPicker';
import { Home, Phone, MessageSquare, ChevronRight } from 'lucide-react';

export default function Index({ attendanceData = [], filters = {}, totalMonthlyMinutes = 0 }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    const handleMonthChange = (val) => {
        router.get(route('attendance.index'), { month: val }, {
            preserveState: true,
            replace: true
        });
    };

    // Calculate Summary Stats
    const totalDays = attendanceData.length || 1;
    const presentRecords = attendanceData.filter(r => ['Present', 'Late', 'Early Leave', 'Late & Early Leave'].includes(r.status));
    const onTimeRecords = attendanceData.filter(r => r.status === 'Present');
    const lateRecords = attendanceData.filter(r => r.status && r.status.includes('Late'));
    const absentRecords = attendanceData.filter(r => r.status === 'Absent');

    const totalAttendanceDays = presentRecords.length;
    const totalWorkedHours = Math.round(totalMonthlyMinutes / 60);

    const onTimePct = Math.round((onTimeRecords.length / totalDays) * 100) || 0;
    const latePct = Math.round((lateRecords.length / totalDays) * 100) || 0;
    const absentPct = Math.round((absentRecords.length / totalDays) * 100) || 0;

    // Calculate Avg Check In & Check Out
    let checkInMinutesSum = 0;
    let checkInCount = 0;
    let checkOutMinutesSum = 0;
    let checkOutCount = 0;

    attendanceData.forEach(r => {
        if (r.punch_in_raw) {
            const d = new Date(r.punch_in_raw);
            checkInMinutesSum += d.getHours() * 60 + d.getMinutes();
            checkInCount++;
        }
        if (r.punch_out_raw) {
            const d = new Date(r.punch_out_raw);
            checkOutMinutesSum += d.getHours() * 60 + d.getMinutes();
            checkOutCount++;
        }
    });

    const formatMinutesToAMPM = (avgMins) => {
        if (!avgMins || isNaN(avgMins)) return '09:30 AM';
        let h = Math.floor(avgMins / 60);
        let m = Math.round(avgMins % 60);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        const mStr = m < 10 ? '0' + m : m;
        return `${h}:${mStr} ${ampm}`;
    };

    const avgCheckInStr = checkInCount > 0 ? formatMinutesToAMPM(checkInMinutesSum / checkInCount) : '09:30 AM';
    const avgCheckOutStr = checkOutCount > 0 ? formatMinutesToAMPM(checkOutMinutesSum / checkOutCount) : '05:00 PM';

    // Format current live date string e.g. "Today Wed, Sep 2, 2026"
    const todayStr = "Today " + new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    // Date range string for header
    let dateRangeStr = "Monthly Records";
    if (filters.month) {
        const [yr, mo] = filters.month.split('-');
        const dObj = new Date(parseInt(yr), parseInt(mo) - 1, 1);
        dateRangeStr = dObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
        dateRangeStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    const getStatusBadge = (status) => {
        if (status === 'Present') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-600 border border-sky-100">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> On time
                </span>
            );
        }
        if (status && status.includes('Late')) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Late
                </span>
            );
        }
        if (status === 'Absent') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Absent
                </span>
            );
        }
        if (status === 'OFF') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span> Holiday
                </span>
            );
        }
        if (status === 'On Leave' || status === 'Leave') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> On Leave
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-400 border border-gray-100">
                <span className="w-2 h-2 rounded-full bg-gray-300"></span> {status}
            </span>
        );
    };

    const getCardBorder = (status) => {
        if (status === 'Present') return 'border-l-4 border-l-sky-500';
        if (status && status.includes('Late')) return 'border-l-4 border-l-amber-500';
        if (status === 'Absent') return 'border-l-4 border-l-red-500';
        if (status === 'OFF') return 'border-l-4 border-l-gray-300';
        if (status === 'On Leave' || status === 'Leave') return 'border-l-4 border-l-purple-500';
        return 'border-l-4 border-l-gray-200';
    };

    const formatCardDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getAvatarUrl = (userObj) => {
        if (userObj?.image_url) return userObj.image_url;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(userObj?.name || 'User')}&background=0D8ABC&color=fff`;
    };

    return (
        <UserLayout title="Attendance History">
            <Head title="Attendance History" />

            <div className="space-y-8 p-1 sm:p-2 font-sans bg-[#fafbfd] min-h-screen rounded-3xl">
                
                {/* 1. TOP BREADCRUMB & HEADER SECTION */}
                <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-gray-100/80">
                    
                    {/* Breadcrumb & Date Picker Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                            <Home className="w-3.5 h-3.5 text-gray-400" />
                            <span>Members</span>
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <span>...</span>
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <span className="text-gray-700 font-bold bg-gray-100 px-2.5 py-1 rounded-lg">Attendance history</span>
                        </div>

                        {/* Month Picker / Range Selector */}
                        <div className="flex items-center gap-2">
                            <MonthPicker
                                value={filters.month || ''}
                                onChange={handleMonthChange}
                                className="min-w-[180px]"
                            />
                        </div>
                    </div>

                    {/* Title + Stats Pills + User Profile Header Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
                        
                        {/* Left Column: Title & Percentage Pills */}
                        <div className="lg:col-span-5 space-y-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Attendance history</h1>
                                <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium flex items-center gap-1.5">
                                    <span className="text-amber-400 text-sm">☼</span> {todayStr}
                                </p>
                            </div>

                            {/* Percentage Pills Bar */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-sky-50 text-slate-700 border border-sky-100/60 shadow-2xs">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> On time <span className="text-gray-500 font-medium">{onTimePct}%</span>
                                </span>
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-50 text-slate-700 border border-amber-100/60 shadow-2xs">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Late <span className="text-gray-500 font-medium">{latePct}%</span>
                                </span>
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-red-50 text-slate-700 border border-red-100/60 shadow-2xs">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Absent <span className="text-gray-500 font-medium">{absentPct}%</span>
                                </span>
                            </div>
                        </div>

                        {/* Right Column: Summary Metrics Grid */}
                        <div className="lg:col-span-7 flex items-center justify-end border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-6">
                            
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full text-left">
                                <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Attendance</span>
                                    <span className="text-lg font-black text-slate-800 mt-0.5 block">{totalAttendanceDays} days</span>
                                </div>
                                <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total hours</span>
                                    <span className="text-lg font-black text-slate-800 mt-0.5 block">{totalWorkedHours} hours</span>
                                </div>
                                <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Avg check in</span>
                                    <span className="text-base font-black text-slate-800 mt-0.5 block">{avgCheckInStr}</span>
                                </div>
                                <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Avg check out</span>
                                    <span className="text-base font-black text-slate-800 mt-0.5 block">{avgCheckOutStr}</span>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>

                {/* 2. SECTION SUBTITLE */}
                <div className="px-1">
                    <h2 className="text-sm font-extrabold text-slate-700 tracking-tight">{dateRangeStr}</h2>
                </div>

                {/* 3. DAILY ATTENDANCE CARDS GRID (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {attendanceData && attendanceData.length > 0 ? (
                        attendanceData.map((record) => (
                            <div
                                key={record.id}
                                className={`bg-white rounded-2xl p-5 shadow-xs border border-gray-100 transition-all hover:shadow-md flex flex-col justify-between ${getCardBorder(record.status)}`}
                            >
                                {/* Top Row: Date + Status Badge */}
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <span className="text-base sm:text-lg font-black text-slate-950">
                                        {formatCardDate(record.date)}
                                    </span>
                                    {getStatusBadge(record.status)}
                                </div>

                                {/* Body Metrics Grid: Check In | Check Out | Total */}
                                <div className="grid grid-cols-3 gap-2 py-4 my-1">
                                    <div>
                                        <span className="text-xs text-slate-700 font-bold block mb-1">Check In</span>
                                        <span className="text-lg font-black text-slate-950 block">{record.check_in || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-700 font-bold block mb-1">Check Out</span>
                                        <span className="text-lg font-black text-slate-950 block">{record.check_out || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-700 font-bold block mb-1">Total</span>
                                        <span className="text-lg font-black text-slate-950 block">{record.hours || '0hr'}</span>
                                    </div>
                                </div>

                                {/* Footer Notes Row (Only show if break time exists) */}
                                {record.break_time && record.break_time !== '0h 0m' && (
                                    <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100 text-slate-600 font-semibold">
                                        <span className="font-bold text-slate-700">Notes:</span>
                                        <span className="font-medium italic text-slate-600 text-right truncate max-w-[200px]">
                                            Break: {record.break_time}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 font-medium">
                            No attendance records found for this period.
                        </div>
                    )}
                </div>

            </div>
        </UserLayout>
    );
}
