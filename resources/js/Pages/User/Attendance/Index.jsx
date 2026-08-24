import React, { useState } from 'react';
import UserLayout from '@/Layouts/UserLayout';
import { Head, router, usePage, useForm, Link } from '@inertiajs/react';
import MonthPicker from '@/Components/MonthPicker';
import Modal from '@/Components/Modal';
import { Home, ChevronRight, Clock, Plus, Edit2, AlertCircle, CheckCircle2, XCircle, Coffee, Trash2 } from 'lucide-react';

export default function Index({ attendanceData = [], correctionRequests = [], filters = {}, totalMonthlyMinutes = 0 }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    const [showModal, setShowModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'requests'
    const [deletingReqId, setDeletingReqId] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        request_type: 'punch_time',
        break_action: 'add',
        date: new Date().toISOString().split('T')[0],
        attendance_id: '',
        attendance_break_id: '',
        requested_punch_in: '09:30',
        requested_punch_out: '18:00',
        requested_break_start: '13:00',
        requested_break_end: '14:00',
        reason: '',
    });

    const handleMonthChange = (val) => {
        const monthStr = (typeof val === 'object' && val?.target) ? val.target.value : (typeof val === 'string' ? val : '');
        router.get(route('attendance.index'), { month: monthStr }, {
            preserveState: true,
            replace: true
        });
    };

    const handleDeleteRequest = (id) => {
        setDeletingReqId(id);
    };

    const confirmDeleteRequest = () => {
        if (deletingReqId) {
            router.delete(route('attendance.correction.delete', deletingReqId), {
                preserveScroll: true,
                onSuccess: () => setDeletingReqId(null),
            });
        }
    };

    const openCorrectionModal = (record = null, initialType = 'punch_time', initialBreakId = null) => {
        clearErrors();
        const targetDate = record ? record.date : new Date().toISOString().split('T')[0];
        const targetRecord = record || attendanceData.find(r => r.date === targetDate);

        setSelectedRecord(targetRecord || null);

        let pIn = '09:30';
        if (targetRecord && targetRecord.punch_in_raw) {
            const d = new Date(targetRecord.punch_in_raw);
            pIn = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        let pOut = '';
        if (targetRecord && targetRecord.punch_out_raw) {
            const d = new Date(targetRecord.punch_out_raw);
            pOut = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        let defaultBreakStart = '13:00';
        let defaultBreakEnd = '14:00';

        if (targetDate === todayStr) {
            const endStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const startObj = new Date(now.getTime() - 30 * 60000);
            const startStr = `${String(startObj.getHours()).padStart(2, '0')}:${String(startObj.getMinutes()).padStart(2, '0')}`;
            defaultBreakStart = startStr;
            defaultBreakEnd = endStr;
        }

        let selectedBreakAction = 'add';
        let selectedBreakId = initialBreakId || '';

        if (initialBreakId && targetRecord?.breaks) {
            selectedBreakAction = 'edit';
            const bObj = targetRecord.breaks.find(b => b.id == initialBreakId);
            if (bObj) {
                if (bObj.start_time) {
                    const d = new Date(bObj.start_time);
                    if (!isNaN(d)) defaultBreakStart = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                }
                if (bObj.end_time) {
                    const d = new Date(bObj.end_time);
                    if (!isNaN(d)) defaultBreakEnd = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                } else {
                    defaultBreakEnd = '';
                }
            }
        } else if (initialType === 'break_time' && targetRecord?.breaks?.length > 0) {
            const ongoingBreak = targetRecord.breaks.find(b => !b.end_time);
            const targetB = ongoingBreak || targetRecord.breaks[targetRecord.breaks.length - 1];
            if (targetB) {
                selectedBreakAction = 'edit';
                selectedBreakId = targetB.id;
                if (targetB.start_time) {
                    const d = new Date(targetB.start_time);
                    if (!isNaN(d)) defaultBreakStart = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                }
                if (targetB.end_time) {
                    const d = new Date(targetB.end_time);
                    if (!isNaN(d)) defaultBreakEnd = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                } else {
                    defaultBreakEnd = '';
                }
            }
        }

        setData({
            request_type: initialType,
            break_action: selectedBreakAction,
            date: targetDate,
            attendance_id: targetRecord?.attendance_id || '',
            attendance_break_id: selectedBreakId,
            requested_punch_in: pIn,
            requested_punch_out: pOut,
            requested_break_start: defaultBreakStart,
            requested_break_end: defaultBreakEnd,
            reason: '',
        });
        setShowModal(true);
    };

    const handleSubmitCorrection = (e) => {
        e.preventDefault();

        const dateRecord = attendanceData.find(r => r.date === data.date);
        const hasPunchIn = dateRecord && !!dateRecord.punch_in_raw;
        const now = new Date();

        if (data.request_type === 'break_time') {
            if (!hasPunchIn) {
                alert('Break time cannot be requested because check-in time is missing for this date.');
                return;
            }

            if (data.requested_break_start) {
                const bStart = new Date(`${data.date}T${data.requested_break_start}:00`);
                if (bStart > now) {
                    alert('Break start time cannot be a future time.');
                    return;
                }
            }

            if (data.requested_break_end) {
                const bEnd = new Date(`${data.date}T${data.requested_break_end}:00`);
                if (bEnd > now) {
                    alert('Break end time cannot be a future time.');
                    return;
                }
            }
        }

        if (data.request_type === 'punch_time') {
            if (data.requested_punch_in) {
                const pIn = new Date(`${data.date}T${data.requested_punch_in}:00`);
                if (pIn > now) {
                    alert('Punch in time cannot be a future time.');
                    return;
                }
            }

            if (data.requested_punch_out) {
                const pOut = new Date(`${data.date}T${data.requested_punch_out}:00`);
                if (pOut > now) {
                    alert('Punch out time cannot be a future time.');
                    return;
                }

                if (!hasPunchIn && !data.requested_punch_in) {
                    alert('Checkout time cannot be requested without providing a check-in time.');
                    return;
                }
            }
        }

        // Convert simple HH:MM times to full datetime YYYY-MM-DD HH:MM:00
        const payload = {
            ...data,
            requested_punch_in: data.requested_punch_in ? `${data.date} ${data.requested_punch_in}:00` : null,
            requested_punch_out: data.requested_punch_out ? `${data.date} ${data.requested_punch_out}:00` : null,
            requested_break_start: data.requested_break_start ? `${data.date} ${data.requested_break_start}:00` : null,
            requested_break_end: data.requested_break_end ? `${data.date} ${data.requested_break_end}:00` : null,
        };

        router.post(route('attendance.correction.store'), payload, {
            onSuccess: () => {
                setShowModal(false);
                reset();
            }
        });
    };

    // Calculate Summary Stats
    const totalDays = attendanceData.length || 1;
    const presentRecords = attendanceData.filter(r => ['Present', 'Late', 'Early Leave', 'Late & Early Leave'].includes(r.status));
    const onTimeRecords = attendanceData.filter(r => r.status === 'Present');
    const lateRecords = attendanceData.filter(r => r.status && r.status.includes('Late'));
    const absentRecords = attendanceData.filter(r => r.status === 'Absent');

    const totalAttendanceDays = presentRecords.length;
    const formatWorkedTime = (totalMins) => {
        if (!totalMins || totalMins <= 0) return '0 hrs 0 mins';
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        if (mins === 0) return `${hrs} hours`;
        if (hrs === 0) return `${mins} mins`;
        return `${hrs} hrs ${mins} mins`;
    };

    const onTimePct = Math.round((onTimeRecords.length / totalDays) * 100) || 0;
    const latePct = Math.round((lateRecords.length / totalDays) * 100) || 0;
    const absentPct = Math.round((absentRecords.length / totalDays) * 100) || 0;

    const isRecordMissingPunchout = (r) => {
        if (!r) return false;
        if (r.is_missing_punchout) return true;
        if (r.check_out === '11:59 PM') return true;
        if (r.punch_out_raw && (r.punch_out_raw.includes('23:59:59') || r.punch_out_raw.includes('23:59:00'))) return true;
        if (r.check_out && r.check_out !== '-' && (r.hours === '0h 0m' || r.hours === '--')) return true;
        return false;
    };

    const missingPunchoutRecords = attendanceData ? attendanceData.filter(r => isRecordMissingPunchout(r)) : [];
    const missingPunchoutsCount = missingPunchoutRecords.length;
    const missingPunchoutPct = Math.round((missingPunchoutsCount / totalDays) * 100) || 0;

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

    const todayStr = "Today " + new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

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

    const getCorrectionStatusBadge = (status) => {
        if (status === 'approved') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
                </span>
            );
        }
        if (status === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Pending Approval
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

    const formatTimeDisplay = (timeStr) => {
        if (!timeStr) return '-';
        const d = new Date(timeStr);
        if (isNaN(d)) return timeStr;
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const pendingRequestsCount = correctionRequests.filter(r => r.status === 'pending').length;

    return (
        <UserLayout title="Attendance History">
            <Head title="Attendance History" />

            <div className="space-y-8 p-1 sm:p-2 font-sans bg-[#fafbfd] min-h-screen rounded-3xl">
                
                {/* 1. TOP BREADCRUMB & HEADER SECTION */}
                <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-gray-100/80">
                    
                    {/* Breadcrumb & Request Button Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                            <Home className="w-3.5 h-3.5 text-gray-400" />
                            <span>Members</span>
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <span className="text-gray-700 font-bold bg-gray-100 px-2.5 py-1 rounded-lg">Attendance history</span>
                        </div>

                        {/* Month Picker + Request Correction Button */}
                        <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                            <MonthPicker
                                value={filters.month || ''}
                                onChange={handleMonthChange}
                                className="min-w-[180px]"
                            />
                            <button
                                onClick={() => openCorrectionModal()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition inline-flex items-center gap-2 text-sm font-medium shrink-0 whitespace-nowrap"
                            >
                                <Plus size={18} />
                                <span>Request Correction / Break Change</span>
                            </button>
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
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-50 text-slate-700 border border-rose-100/60 shadow-2xs">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Missing Punchout <span className="text-gray-500 font-medium">{missingPunchoutPct}%</span>
                                </span>
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-red-50 text-slate-700 border border-red-100/60 shadow-2xs">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Absent <span className="text-gray-500 font-medium">{absentPct}%</span>
                                </span>
                            </div>
                        </div>

                        {/* Right Column: Summary Metrics Grid */}
                        <div className="lg:col-span-7 flex items-center justify-end border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-6">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 w-full text-left">
                                <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Attendance</span>
                                    <span className="text-base font-black text-slate-800 mt-0.5 block">{totalAttendanceDays} days</span>
                                </div>
                                <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total hours</span>
                                    <span className="text-base font-black text-slate-800 mt-0.5 block">{formatWorkedTime(totalMonthlyMinutes)}</span>
                                </div>
                                <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg check in</span>
                                    <span className="text-sm font-black text-slate-800 mt-0.5 block">{avgCheckInStr}</span>
                                </div>
                                <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg check out</span>
                                    <span className="text-sm font-black text-slate-800 mt-0.5 block">{avgCheckOutStr}</span>
                                </div>
                                <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-100">
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Missing Punchout</span>
                                    <span className="text-base font-black text-amber-900 mt-0.5 block">{missingPunchoutsCount} days</span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* 2. NAVIGATION TABS: Attendance Logs vs My Correction Requests */}
                <div className="flex overflow-x-auto border-b border-gray-100 bg-white rounded-t-[24px] px-4 sm:px-6 pt-2 sm:pt-4 no-scrollbar">
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 sm:px-8 py-3 text-xs sm:text-[13px] font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap transition-all border-b-2 ${
                            activeTab === 'attendance'
                                ? 'border-blue-600 text-blue-600 font-extrabold'
                                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                        }`}
                    >
                        {dateRangeStr} Records
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 sm:px-8 py-3 text-xs sm:text-[13px] font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'requests'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                        }`}
                    >
                        My Correction Requests
                        {pendingRequestsCount > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full font-black">
                                {pendingRequestsCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* 3. MAIN CONTENT BASED ON TAB */}
                {activeTab === 'attendance' ? (
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
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`text-lg font-black block ${isRecordMissingPunchout(record) ? 'text-amber-600' : 'text-slate-950'}`}>{record.check_out || '—'}</span>
                                                {isRecordMissingPunchout(record) && (
                                                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-100 text-amber-800 rounded-md uppercase tracking-wider border border-amber-200" title="System auto-closed session (missing manual punch-out)">
                                                        Auto Closed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-700 font-bold block mb-1">Total</span>
                                            <span className="text-lg font-black text-slate-950 block">{record.hours || '0hr'}</span>
                                        </div>
                                    </div>

                                    {/* Footer Action & Notes */}
                                    <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100 text-slate-600 font-semibold">
                                        <div className="flex items-center gap-1 text-slate-600">
                                            {record.break_time && record.break_time !== '0h 0m' && (
                                                <span className="font-medium italic text-slate-600">
                                                    Break: {record.break_time}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => openCorrectionModal(record)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            <span>Request Change</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 font-medium">
                                No attendance records found for this period.
                            </div>
                        )}
                    </div>
                ) : (
                    /* REQUESTS TAB CONTENT */
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-extrabold text-slate-900">Submitted Requests</h3>
                            <button
                                onClick={() => openCorrectionModal()}
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>New Request</span>
                            </button>
                        </div>

                        {correctionRequests && correctionRequests.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4">Request Type</th>
                                            <th className="py-3 px-4">Requested Change</th>
                                            <th className="py-3 px-4">Reason</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Admin Note</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {correctionRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3.5 px-4 font-bold text-slate-800">
                                                    {formatCardDate(req.date)}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {req.request_type === 'punch_time' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                                                            <Clock className="w-3.5 h-3.5" /> Punch In/Out
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">
                                                            <Coffee className="w-3.5 h-3.5" /> {req.break_action === 'edit' ? 'Modify Break' : 'Add Break'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 font-medium text-slate-700">
                                                    {req.request_type === 'punch_time' ? (
                                                        <span>
                                                            In: <strong>{formatTimeDisplay(req.requested_punch_in)}</strong> | Out: <strong>{formatTimeDisplay(req.requested_punch_out)}</strong>
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            Start: <strong>{formatTimeDisplay(req.requested_break_start)}</strong> | End: <strong>{formatTimeDisplay(req.requested_break_end)}</strong>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-600 max-w-[200px] truncate">
                                                    {req.reason}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {getCorrectionStatusBadge(req.status)}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs italic text-gray-500">
                                                    {req.admin_note || '—'}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    {req.status === 'pending' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRequest(req.id)}
                                                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all inline-flex items-center gap-1 font-bold text-xs"
                                                            title="Delete Pending Request"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Delete</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400 font-medium">
                                No correction or break requests submitted yet.
                            </div>
                        )}
                    </div>
                )}

                {/* 4. MODAL FOR SUBMITTING CORRECTION / BREAK REQUEST */}
                <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="lg">
                    <form onSubmit={handleSubmitCorrection} className="p-6 space-y-5">
                        <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                            <h3 className="text-lg font-extrabold text-slate-900">
                                Request Time or Break Correction
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Request Type Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">
                                Correction Type
                            </label>
                            {(() => {
                                const selectedDateRecord = attendanceData.find(r => r.date === data.date);
                                const hasCheckInForSelectedDate = !!selectedDateRecord?.punch_in_raw;

                                return (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setData('request_type', 'punch_time')}
                                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                                data.request_type === 'punch_time'
                                                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-2xs'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Clock className="w-4 h-4" /> Punch In/Out Time
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!hasCheckInForSelectedDate}
                                            onClick={() => {
                                                if (hasCheckInForSelectedDate) {
                                                    setData('request_type', 'break_time');
                                                }
                                            }}
                                            title={!hasCheckInForSelectedDate ? 'Punch in / check-in time is required before requesting break time' : ''}
                                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                                !hasCheckInForSelectedDate
                                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                                                    : data.request_type === 'break_time'
                                                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-2xs'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Coffee className="w-4 h-4" /> Break Time
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Date</label>
                            <input
                                type="date"
                                value={data.date}
                                onChange={(e) => {
                                    const newDate = e.target.value;
                                    const recordForNewDate = attendanceData.find(r => r.date === newDate);
                                    const dateHasPunchIn = !!recordForNewDate?.punch_in_raw;

                                    let pIn = '09:30';
                                    if (recordForNewDate && recordForNewDate.punch_in_raw) {
                                        const d = new Date(recordForNewDate.punch_in_raw);
                                        pIn = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                    }

                                    let pOut = '';
                                    if (recordForNewDate && recordForNewDate.punch_out_raw) {
                                        const d = new Date(recordForNewDate.punch_out_raw);
                                        pOut = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                    }

                                    const now = new Date();
                                    const todayStr = now.toISOString().split('T')[0];
                                    let defaultBreakStart = '13:00';
                                    let defaultBreakEnd = '14:00';

                                    if (newDate === todayStr) {
                                        const endStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                                        const startObj = new Date(now.getTime() - 30 * 60000);
                                        const startStr = `${String(startObj.getHours()).padStart(2, '0')}:${String(startObj.getMinutes()).padStart(2, '0')}`;
                                        defaultBreakStart = startStr;
                                        defaultBreakEnd = endStr;
                                    }

                                    setSelectedRecord(recordForNewDate || null);
                                    setData(prev => ({
                                        ...prev,
                                        date: newDate,
                                        attendance_id: recordForNewDate?.attendance_id || '',
                                        requested_punch_in: pIn,
                                        requested_punch_out: pOut,
                                        requested_break_start: defaultBreakStart,
                                        requested_break_end: defaultBreakEnd,
                                        request_type: (!dateHasPunchIn && prev.request_type === 'break_time') ? 'punch_time' : prev.request_type
                                    }));
                                }}
                                className="w-full rounded-xl border-gray-200 text-sm font-semibold focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>

                        {/* Missing Check-In Warning Banner for Break Request */}
                        {data.request_type === 'break_time' && !(attendanceData.find(r => r.date === data.date)?.punch_in_raw) && (
                            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Check-in time (punch-in) is not recorded for this date. You cannot request a break time until check-in time is added.</span>
                            </div>
                        )}

                        {/* Missing Check-In Notice Banner for Punch Request */}
                        {data.request_type === 'punch_time' && !(attendanceData.find(r => r.date === data.date)?.punch_in_raw) && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-semibold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>Check-in time is missing for this date. You must fill in the Requested Punch In time to request a checkout time.</span>
                            </div>
                        )}

                        {/* PUNCH IN / PUNCH OUT FIELDS */}
                        {(() => {
                            const now = new Date();
                            const inlineErrors = {
                                requested_break_start: null,
                                requested_break_end: null,
                                requested_punch_in: null,
                                requested_punch_out: null,
                            };

                            const recordForDate = selectedRecord || attendanceData.find(r => r.date === data.date);
                            const recPunchIn = recordForDate?.punch_in_raw ? new Date(recordForDate.punch_in_raw) : null;
                            const recPunchOut = recordForDate?.punch_out_raw ? new Date(recordForDate.punch_out_raw) : null;

                            let shiftStart = recPunchIn;
                            let shiftEnd = recPunchOut;

                            const pendingPunchReq = (correctionRequests || []).find(r => r.date === data.date && r.request_type === 'punch_time' && (r.status === 'pending' || r.status === 'approved'));
                            if (pendingPunchReq) {
                                if (pendingPunchReq.requested_punch_in) shiftStart = new Date(pendingPunchReq.requested_punch_in);
                                if (pendingPunchReq.requested_punch_out) shiftEnd = new Date(pendingPunchReq.requested_punch_out);
                            }

                            if (data.request_type === 'break_time' && data.requested_break_start) {
                                const bStart = new Date(`${data.date}T${data.requested_break_start}:00`);
                                if (bStart > now) {
                                    inlineErrors.requested_break_start = 'Break start time cannot be a future time.';
                                } else if (shiftStart && bStart < shiftStart) {
                                    const timeStr = shiftStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    inlineErrors.requested_break_start = `Break start time cannot be before check-in time (${timeStr}).`;
                                }
                            }

                            if (data.request_type === 'break_time' && data.requested_break_end) {
                                const bEnd = new Date(`${data.date}T${data.requested_break_end}:00`);
                                if (bEnd > now) {
                                    inlineErrors.requested_break_end = 'Break end time cannot be a future time.';
                                } else if (data.requested_break_start) {
                                    const bStart = new Date(`${data.date}T${data.requested_break_start}:00`);
                                    if (bEnd <= bStart) {
                                        inlineErrors.requested_break_end = 'Break end time must be after break start time.';
                                    } else if (shiftEnd && bEnd > shiftEnd) {
                                        const timeStr = shiftEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        inlineErrors.requested_break_end = `Break end time cannot be after check-out time (${timeStr}).`;
                                    }
                                }
                            }

                            if (data.request_type === 'break_time' && data.requested_break_start && data.requested_break_end && !inlineErrors.requested_break_start && !inlineErrors.requested_break_end) {
                                const formatHHMMTo12Hr = (hhmm) => {
                                    if (!hhmm) return '';
                                    const [h, m] = hhmm.split(':').map(Number);
                                    if (isNaN(h) || isNaN(m)) return hhmm;
                                    const period = h >= 12 ? 'PM' : 'AM';
                                    const displayH = h % 12 === 0 ? 12 : h % 12;
                                    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
                                };

                                const bStart = new Date(`${data.date}T${data.requested_break_start}:00`);
                                const bEnd = new Date(`${data.date}T${data.requested_break_end}:00`);

                                const existingBreaks = [];
                                if (recordForDate?.breaks) {
                                    recordForDate.breaks.forEach(b => {
                                        if (data.break_action === 'edit' && data.attendance_break_id == b.id) return;
                                        if (b.start_time && b.end_time) {
                                            existingBreaks.push({
                                                start: new Date(b.start_time),
                                                end: new Date(b.end_time),
                                                label: `${new Date(b.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${new Date(b.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`
                                            });
                                        }
                                    });
                                }

                                (correctionRequests || []).forEach(cr => {
                                    if (cr.date === data.date && cr.request_type === 'break_time' && (cr.status === 'pending' || cr.status === 'approved')) {
                                        if (data.attendance_break_id && cr.attendance_break_id == data.attendance_break_id) return;
                                        if (cr.requested_break_start && cr.requested_break_end) {
                                            existingBreaks.push({
                                                start: new Date(cr.requested_break_start),
                                                end: new Date(cr.requested_break_end),
                                                label: `${new Date(cr.requested_break_start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${new Date(cr.requested_break_end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`
                                            });
                                        }
                                    }
                                });

                                for (const eb of existingBreaks) {
                                    if (bStart < eb.end && bEnd > eb.start) {
                                        const reqLabel = `${formatHHMMTo12Hr(data.requested_break_start)} - ${formatHHMMTo12Hr(data.requested_break_end)}`;
                                        const overlapMsg = `Break time (${reqLabel}) overlaps with another break (${eb.label}).`;
                                        inlineErrors.requested_break_start = overlapMsg;
                                        inlineErrors.requested_break_end = overlapMsg;
                                        break;
                                    }
                                }
                            }

                            if (data.request_type === 'punch_time' && data.requested_punch_in) {
                                const pIn = new Date(`${data.date}T${data.requested_punch_in}:00`);
                                if (pIn > now) {
                                    inlineErrors.requested_punch_in = 'Punch in time cannot be a future time.';
                                }
                            }

                            if (data.request_type === 'punch_time' && data.requested_punch_out) {
                                const pOut = new Date(`${data.date}T${data.requested_punch_out}:00`);
                                if (pOut > now) {
                                    inlineErrors.requested_punch_out = 'Punch out time cannot be a future time.';
                                } else if (data.requested_punch_in) {
                                    const pIn = new Date(`${data.date}T${data.requested_punch_in}:00`);
                                    if (pOut <= pIn) {
                                        inlineErrors.requested_punch_out = 'Punch out time must be after punch in time.';
                                    }
                                }
                            }

                            const hasAnyInlineError = Object.values(inlineErrors).some(err => err !== null);

                            return (
                                <>
                                    {data.request_type === 'punch_time' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Requested Punch In *</label>
                                                <input
                                                    type="time"
                                                    value={data.requested_punch_in}
                                                    onChange={(e) => setData('requested_punch_in', e.target.value)}
                                                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-[#635bfc] focus:ring-4 focus:ring-[#635bfc]/15 outline-none transition-all cursor-pointer ${
                                                        inlineErrors.requested_punch_in ? 'border-rose-500 bg-rose-50/40 text-rose-900' : 'border-gray-300 bg-white'
                                                    }`}
                                                    required={!(attendanceData.find(r => r.date === data.date)?.punch_in_raw)}
                                                />
                                                {inlineErrors.requested_punch_in && (
                                                    <p className="text-xs text-rose-600 font-normal mt-1">
                                                        {inlineErrors.requested_punch_in}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Requested Punch Out</label>
                                                <input
                                                    type="time"
                                                    value={data.requested_punch_out}
                                                    onChange={(e) => setData('requested_punch_out', e.target.value)}
                                                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-[#635bfc] focus:ring-4 focus:ring-[#635bfc]/15 outline-none transition-all cursor-pointer ${
                                                        inlineErrors.requested_punch_out ? 'border-rose-500 bg-rose-50/40 text-rose-900' : 'border-gray-300 bg-white'
                                                    }`}
                                                />
                                                {inlineErrors.requested_punch_out && (
                                                    <p className="text-xs text-rose-600 font-normal mt-1">
                                                        {inlineErrors.requested_punch_out}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* BREAK TIME FIELDS */}
                                    {data.request_type === 'break_time' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="break_action"
                                                        value="add"
                                                        checked={data.break_action === 'add'}
                                                        onChange={() => setData('break_action', 'add')}
                                                        className="text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    Add New Break
                                                </label>
                                                {selectedRecord && selectedRecord.breaks && selectedRecord.breaks.length > 0 && (
                                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="break_action"
                                                            value="edit"
                                                            checked={data.break_action === 'edit'}
                                                            onChange={() => setData('break_action', 'edit')}
                                                            className="text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        Modify Existing Break
                                                    </label>
                                                )}
                                            </div>

                                            {data.break_action === 'edit' && selectedRecord?.breaks && (
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-700 block mb-1">Select Break to Modify</label>
                                                    <select
                                                        value={data.attendance_break_id}
                                                        onChange={(e) => {
                                                            const selectedBreakId = e.target.value;
                                                            const selectedB = selectedRecord?.breaks?.find(b => b.id == selectedBreakId);
                                                            let bStart = data.requested_break_start;
                                                            let bEnd = data.requested_break_end;
                                                            if (selectedB) {
                                                                if (selectedB.start_time) {
                                                                    const d = new Date(selectedB.start_time);
                                                                    if (!isNaN(d)) bStart = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                                                }
                                                                if (selectedB.end_time) {
                                                                    const d = new Date(selectedB.end_time);
                                                                    if (!isNaN(d)) bEnd = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                                                } else {
                                                                    bEnd = '';
                                                                }
                                                            }
                                                            setData(prev => ({
                                                                ...prev,
                                                                attendance_break_id: selectedBreakId,
                                                                requested_break_start: bStart,
                                                                requested_break_end: bEnd,
                                                            }));
                                                        }}
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-[#635bfc] focus:ring-4 focus:ring-[#635bfc]/15 outline-none transition-all cursor-pointer"
                                                        required
                                                    >
                                                        <option value="">Select a break...</option>
                                                        {selectedRecord.breaks.map((b) => (
                                                            <option key={b.id} value={b.id}>
                                                                Break #{b.id}: {formatTimeDisplay(b.start_time)} - {b.end_time ? formatTimeDisplay(b.end_time) : 'Ongoing (Not Resumed)'} ({b.total_minutes || 0} mins)
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <p className="text-[11px] text-indigo-600 font-semibold pt-1">
                                                        💡 Forgot to resume work on time? Select the break above and set Break End Time to your actual resume time (e.g. 1:15 PM).
                                                    </p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-700 block mb-1">Break Start Time *</label>
                                                    <input
                                                        type="time"
                                                        value={data.requested_break_start}
                                                        onChange={(e) => setData('requested_break_start', e.target.value)}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-[#635bfc] focus:ring-4 focus:ring-[#635bfc]/15 outline-none transition-all cursor-pointer ${
                                                            inlineErrors.requested_break_start ? 'border-rose-500 bg-rose-50/40 text-rose-900' : 'border-gray-300 bg-white'
                                                        }`}
                                                        required
                                                    />
                                                    {inlineErrors.requested_break_start && (
                                                        <p className="text-xs text-rose-600 font-normal mt-1">
                                                            {inlineErrors.requested_break_start}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-700 block mb-1">Break End Time *</label>
                                                    <input
                                                        type="time"
                                                        value={data.requested_break_end}
                                                        onChange={(e) => setData('requested_break_end', e.target.value)}
                                                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-[#635bfc] focus:ring-4 focus:ring-[#635bfc]/15 outline-none transition-all cursor-pointer ${
                                                            inlineErrors.requested_break_end ? 'border-rose-500 bg-rose-50/40 text-rose-900' : 'border-gray-300 bg-white'
                                                        }`}
                                                        required
                                                    />
                                                    {inlineErrors.requested_break_end && (
                                                        <p className="text-xs text-rose-600 font-normal mt-1">
                                                            {inlineErrors.requested_break_end}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reason Field */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Reason for Request</label>
                                        <textarea
                                            value={data.reason}
                                            onChange={(e) => setData('reason', e.target.value)}
                                            rows={3}
                                            placeholder="Explain why you are requesting this punch/break change..."
                                            className="w-full rounded-xl border-gray-200 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>

                                    {/* Modal Action Buttons */}
                                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing || hasAnyInlineError}
                                            className="px-6 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            {processing ? 'SUBMITTING...' : 'SUBMIT'}
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </form>
                </Modal>

                {/* ✅ Delete Confirmation Modal */}
                {deletingReqId && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm">
                            <h2 className="text-lg font-bold mb-4 text-gray-800">Confirm Cancellation</h2>
                            <p className="mb-6 text-gray-600">
                                Are you sure you want to delete this pending request?
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setDeletingReqId(null)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                >
                                    No, Keep it
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeleteRequest}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition"
                                >
                                    Yes, Delete Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </UserLayout>
    );
}
