import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm, Link } from '@inertiajs/react';
import { Filter, Edit, RotateCcw, MapPin, Smartphone, Monitor, Info, X, Download, Coffee, Clock, Plus, Home, Phone, MessageSquare, ChevronRight, FileText, Printer, Trash2, Eye } from 'lucide-react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import MonthPicker from '@/Components/MonthPicker';
import DatePicker from '@/Components/DatePicker';
import CalendarView from '@/Components/CalendarView';

export default function Index({ attendanceData, filters, users, viewType, totalMonthlyMinutes, selectedUser, leaves, settings, exportPreviewData, correctionRequests = [] }) {
    const [displayMode, setDisplayMode] = useState(filters.display || 'table');
    const [editingAttendance, setEditingAttendance] = useState(null);
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    const [selectedReqStatus, setSelectedReqStatus] = useState('all');
    const [approvingReq, setApprovingReq] = useState(null);
    const [rejectingReq, setRejectingReq] = useState(null);
    const [viewingReasonReq, setViewingReasonReq] = useState(null);
    const [adminNoteText, setAdminNoteText] = useState('');

    const pendingRequestsCount = (correctionRequests || []).filter(r => r.status === 'pending').length;

    useEffect(() => {
        if (exportPreviewData && exportPreviewData.length > 0) {
            setSelectedUserIds(exportPreviewData.map(u => u.user_id));
        }
    }, [exportPreviewData]);

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

    // Calculate Summary Stats for selected user / monthly view
    const totalDays = attendanceData ? attendanceData.length : 1;
    const presentRecords = attendanceData ? attendanceData.filter(r => ['Present', 'Late', 'Early Leave', 'Late & Early Leave'].includes(r?.status)) : [];
    const onTimeRecords = attendanceData ? attendanceData.filter(r => r?.status === 'Present') : [];
    const lateRecords = attendanceData ? attendanceData.filter(r => r?.status && r?.status.includes('Late')) : [];
    const absentRecords = attendanceData ? attendanceData.filter(r => r?.status === 'Absent') : [];

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

    const isRecordNoBreak = (r) => {
        if (!r) return false;
        const isWorked = r.status && ['Present', 'Late', 'Early Leave', 'Late & Early Leave'].includes(r.status);
        if (!isWorked) return false;
        return (r.total_break_minutes === 0 || r.break_time === '0h 0m' || r.break_time === '-');
    };

    const noBreakRecords = attendanceData ? attendanceData.filter(r => isRecordNoBreak(r)) : [];
    const noBreakDaysCount = noBreakRecords.length;
    const noBreakPct = Math.round((noBreakDaysCount / totalDays) * 100) || 0;

    // Calculate Avg Check In & Check Out
    let checkInMinutesSum = 0;
    let checkInCount = 0;
    let checkOutMinutesSum = 0;
    let checkOutCount = 0;

    if (attendanceData) {
        attendanceData.forEach(r => {
            if (r?.punch_in_raw) {
                const d = new Date(r.punch_in_raw);
                if (!isNaN(d)) {
                    checkInMinutesSum += d.getHours() * 60 + d.getMinutes();
                    checkInCount++;
                }
            }
            if (r?.punch_out_raw) {
                const d = new Date(r.punch_out_raw);
                if (!isNaN(d)) {
                    checkOutMinutesSum += d.getHours() * 60 + d.getMinutes();
                    checkOutCount++;
                }
            }
        });
    }

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
                <span className="w-2 h-2 rounded-full bg-gray-300"></span> {status || '—'}
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

    const BreakAddForm = ({ attendanceRecord, onCancel, onSuccess }) => {
        const [localError, setLocalError] = useState(null);
        const { data, setData, post, processing, errors } = useForm({
            start_time: '',
            end_time: '',
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            setLocalError(null);

            const recordDate = attendanceRecord.date ? attendanceRecord.date.toString().substring(0, 10) : '';
            const fullStart = `${recordDate}T${data.start_time}`;
            const fullEnd = data.end_time ? `${recordDate}T${data.end_time}` : null;

            const toHHMM = (raw) => {
                if (!raw) return null;
                const d = new Date(raw.toString().replace(' ', 'T'));
                if (isNaN(d)) return null;
                return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            };

            const punchInHHMM = toHHMM(attendanceRecord.punch_in_raw);
            const punchOutHHMM = attendanceRecord.punch_out_raw ? toHHMM(attendanceRecord.punch_out_raw) : null;

            if (punchInHHMM && data.start_time < punchInHHMM) {
                setLocalError(`Break cannot start before punch in time (${punchInHHMM})`);
                return;
            }

            if (data.end_time) {
                if (data.end_time <= data.start_time) {
                    setLocalError("Break end time must be after start time");
                    return;
                }
                if (punchOutHHMM && data.end_time > punchOutHHMM) {
                    setLocalError(`Break cannot end after punch out time (${punchOutHHMM})`);
                    return;
                }
            }

            router.post(route('admin.attendance.break.store', attendanceRecord.attendance_id), {
                start_time: fullStart,
                end_time: fullEnd,
            }, {
                onSuccess: () => onSuccess(),
                preserveScroll: true,
            });
        };

        return (
            <form onSubmit={handleSubmit} className="p-5 bg-white rounded-2xl border border-gray-200 mb-5 shadow-xs transition-all space-y-4">
                <div>
                    <h3 className="text-base font-bold text-gray-900">Add New Break</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Date: {attendanceRecord.date ? attendanceRecord.date.toString().substring(0, 10) : ''}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Start Time *</label>
                        <input
                            type="time"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-[#635bfc] focus:ring-4 focus:ring-[#635bfc]/15 outline-none transition-all cursor-pointer"
                            value={data.start_time}
                            onChange={(e) => setData('start_time', e.target.value)}
                            required
                        />
                        {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block mb-1">End Time (Optional)</label>
                        <input
                            type="time"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-[#635bfc] focus:ring-4 focus:ring-[#635bfc]/15 outline-none transition-all cursor-pointer"
                            value={data.end_time}
                            onChange={(e) => setData('end_time', e.target.value)}
                        />
                        {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time}</p>}
                    </div>
                </div>

                {localError && <p className="text-rose-600 text-xs font-semibold bg-rose-50 px-3 py-2 rounded-xl border border-rose-100">{localError}</p>}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                        CANCEL
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                        UPDATE
                    </button>
                </div>
            </form>
        );
    };

    const [viewingBreaks, setViewingBreaks] = useState(null);
    const [editingBreakId, setEditingBreakId] = useState(null);
    const [showAddBreak, setShowAddBreak] = useState(false);

    useEffect(() => {
        if (viewingBreaks) {
            const updated = attendanceData.find(r =>
                (r.attendance_id && r.attendance_id === viewingBreaks.attendance_id) ||
                (!r.attendance_id && r.date === viewingBreaks.date && r.id === viewingBreaks.id)
            );
            if (updated) setViewingBreaks(updated);
        }
    }, [attendanceData]);

    const BreakEditForm = ({ breakRecord, attendanceRecord, onCancel, onSuccess }) => {
        const [localError, setLocalError] = useState(null);
        const formatTimeOnly = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
        };

        const { data, setData, put, processing, errors } = useForm({
            start_time: formatTimeOnly(breakRecord.start_time),
            end_time: formatTimeOnly(breakRecord.end_time),
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            setLocalError(null);

            const recordDate = attendanceRecord.date ? attendanceRecord.date.toString().substring(0, 10) : '';
            const fullStart = `${recordDate}T${data.start_time}`;
            const fullEnd = data.end_time ? `${recordDate}T${data.end_time}` : null;

            const toHHMM = (raw) => {
                if (!raw) return null;
                const d = new Date(raw.toString().replace(' ', 'T'));
                if (isNaN(d)) return null;
                return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            };

            const punchInHHMM = toHHMM(attendanceRecord.punch_in_raw);
            const punchOutHHMM = attendanceRecord.punch_out_raw ? toHHMM(attendanceRecord.punch_out_raw) : null;

            if (punchInHHMM && data.start_time < punchInHHMM) {
                setLocalError(`Break cannot start before punch in time (${punchInHHMM})`);
                return;
            }

            if (data.end_time) {
                if (data.end_time <= data.start_time) {
                    setLocalError("Break end time must be after start time");
                    return;
                }
                if (punchOutHHMM && data.end_time > punchOutHHMM) {
                    setLocalError(`Break cannot end after punch out time (${punchOutHHMM})`);
                    return;
                }
            }

            router.put(route('admin.attendance.break.update', breakRecord.id), {
                start_time: fullStart,
                end_time: fullEnd,
            }, {
                onSuccess: () => onSuccess(),
                preserveScroll: true,
            });
        };

        return (
            <form onSubmit={handleSubmit} className="p-5 bg-white rounded-2xl border border-gray-200 my-3 shadow-xs transition-all space-y-4">
                <div>
                    <h3 className="text-base font-bold text-gray-900">Edit Break Details</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Date: {attendanceRecord.date ? attendanceRecord.date.toString().substring(0, 10) : ''}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Start Time *</label>
                        <input
                            type="time"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-[#635bfc] focus:ring-4 focus:ring-[#635bfc]/15 outline-none transition-all cursor-pointer"
                            value={data.start_time}
                            onChange={(e) => setData('start_time', e.target.value)}
                            required
                        />
                        {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block mb-1">End Time</label>
                        <input
                            type="time"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-[#635bfc] focus:ring-4 focus:ring-[#635bfc]/15 outline-none transition-all cursor-pointer"
                            value={data.end_time}
                            onChange={(e) => setData('end_time', e.target.value)}
                        />
                        {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time}</p>}
                    </div>
                </div>

                {localError && <p className="text-rose-600 text-xs font-semibold bg-rose-50 px-3 py-2 rounded-xl border border-rose-100">{localError}</p>}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                        CANCEL
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                        UPDATE
                    </button>
                </div>
            </form>
        );
    };

    useEffect(() => {
        const interval = setInterval(() => {
            // router.reload preserves state like viewingBreaks modal open
            router.reload({
                preserveScroll: true,
                preserveState: true,
                only: ['attendanceData'],
            });
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Update displayMode when filters.display changes from server
    useEffect(() => {
        if (filters.display) {
            setDisplayMode(filters.display);
        }
    }, [filters.display]);
    const { data, setData, put, post, processing, errors, reset } = useForm({
        user_id: '',
        date: '',
        punch_in: '',
        punch_out: '',
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatMonthLabel = (monthStr) => {
        if (!monthStr) return '';
        try {
            const [year, month] = monthStr.split('-');
            const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch (e) {
            return monthStr;
        }
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters };

        if (key === 'user_id') {
            if (!value) {
                // User selected "All Users":
                // All Users view shows all users for current date (Daily View)
                newFilters.user_id = '';
                delete newFilters.month;
                if (!newFilters.date) {
                    const now = new Date();
                    newFilters.date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                }
                if (displayMode === 'calendar') {
                    setDisplayMode('table');
                    newFilters.display = 'table';
                }
            } else {
                // Specific user selected: switch to Month view for that user
                newFilters.user_id = value;
                delete newFilters.date;
                if (!newFilters.month) {
                    const now = new Date();
                    newFilters.month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                }
            }
        } else if (key === 'month') {
            const monthVal = (typeof value === 'object' && value?.target) ? value.target.value : (typeof value === 'string' ? value : value);
            if (monthVal) {
                delete newFilters.date;
                newFilters.month = monthVal;
                // Month view is for individual user; if no user selected, default to first user
                if (!newFilters.user_id && users && users.length > 0) {
                    newFilters.user_id = users[0].id;
                }
            } else {
                delete newFilters.month;
            }
        } else if (key === 'date') {
            if (value) {
                delete newFilters.month;
                newFilters.date = value;
            } else {
                delete newFilters.date;
            }
        }

        router.get(route('admin.attendance.index'), newFilters, {
            preserveState: true,
            replace: true
        });
    };

    const [deletingReqId, setDeletingReqId] = useState(null);

    const handleReset = () => {
        router.get(route('admin.attendance.index'), {}, { replace: true });
    };

    const handleDeleteRequest = (id) => {
        setDeletingReqId(id);
    };

    const confirmDeleteRequest = () => {
        if (deletingReqId) {
            router.delete(route('attendance.correction.destroy', deletingReqId), {
                preserveScroll: true,
                onSuccess: () => setDeletingReqId(null),
            });
        }
    };

    const openEditModal = (record) => {
        setEditingAttendance(record);

        const formatDateForInput = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        const targetDate = record.date || filters.date || new Date().toISOString().slice(0, 10);
        const punchInVal = record.punch_in_raw ? formatDateForInput(record.punch_in_raw) : `${targetDate}T09:00`;
        const punchOutVal = record.punch_out_raw ? formatDateForInput(record.punch_out_raw) : '';

        setData({
            user_id: record.id || (selectedUser ? selectedUser.id : ''),
            date: targetDate,
            punch_in: punchInVal,
            punch_out: punchOutVal,
        });
    };

    const getInDate = (punchInStr) => {
        if (!punchInStr) return '';
        return String(punchInStr).slice(0, 10);
    };

    const getInTime = (punchInStr) => {
        if (!punchInStr || String(punchInStr).length < 16) return '';
        return String(punchInStr).slice(11, 16);
    };

    const getOutDate = (punchOutStr) => {
        if (punchOutStr && String(punchOutStr).length >= 10 && String(punchOutStr).slice(0, 10).match(/^\d{4}-\d{2}-\d{2}$/)) {
            return String(punchOutStr).slice(0, 10);
        }
        return getInDate(data.punch_in) || data.date || filters.date || new Date().toISOString().slice(0, 10);
    };

    const getOutTime = (punchOutStr) => {
        if (!punchOutStr || String(punchOutStr).length < 16) return '';
        return String(punchOutStr).slice(11, 16);
    };

    const closeEditModal = () => {
        setEditingAttendance(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const options = {
            onSuccess: () => closeEditModal(),
            preserveScroll: true,
        };

        if (editingAttendance.attendance_id) {
            put(route('admin.attendance.update', editingAttendance.attendance_id), options);
        } else {
            post(route('admin.attendance.store'), options);
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '0h 0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-600';
            case 'Late':
            case 'Early Leave':
            case 'Late & Early Leave': return 'bg-orange-100 text-orange-600';
            case 'Absent': return 'bg-red-100 text-red-600';
            case 'OFF': return 'bg-blue-100 text-blue-600';
            case 'On Leave':
            case 'Leave': return 'bg-purple-100 text-purple-600';
            default: return 'bg-gray-50 text-gray-400';
        }
    };

    const getRowStyle = (status) => {
        if (status === 'OFF') return 'bg-blue-50/30';
        if (status === 'Absent') return 'bg-red-50/30';
        if (status === 'Leave') return 'bg-purple-50/30';
        return '';
    };

    return (
        <AdminLayout>
            <Head title="Attendance Monitoring" />

            <div className="py-8 font-sans print:hidden">
                <div className="w-full">
                    
                    {/* User Selected Header Card (User-like Design) */}
                    {selectedUser && displayMode !== 'export' ? (
                        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-gray-100/80 mb-6 space-y-6">
                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                                <Home className="w-3.5 h-3.5 text-gray-400" />
                                <span>Admin</span>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span>Attendance</span>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className="text-gray-700 font-bold bg-gray-100 px-2.5 py-1 rounded-lg">
                                    {selectedUser.name}'s Attendance history
                                </span>
                            </div>

                            {/* Title + Stats Pills + Selected User Header Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
                                
                                {/* Left Column: Title & Percentage Pills */}
                                <div className="lg:col-span-5 space-y-4">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                            {selectedUser.name}'s Attendance
                                        </h1>
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
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-teal-50 text-slate-700 border border-teal-100/60 shadow-2xs">
                                            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> No Break Days <span className="text-gray-500 font-medium">{noBreakPct}%</span>
                                        </span>
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-red-50 text-slate-700 border border-red-100/60 shadow-2xs">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Absent <span className="text-gray-500 font-medium">{absentPct}%</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Right Column: Adjusted Summary Metrics Grid */}
                                <div className="lg:col-span-7 flex items-center justify-end border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-6">
                                    
                                    {/* Summary Metrics */}
                                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 w-full text-left">
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
                                        <div className="bg-teal-50/80 p-3 rounded-2xl border border-teal-100">
                                            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">No Break Days</span>
                                            <span className="text-base font-black text-teal-900 mt-0.5 block">{noBreakDaysCount} days</span>
                                        </div>
                                    </div>

                                </div>

                            </div>
                        </div>
                    ) : (
                        /* Header Card for All Users / Daily View */
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-8 flex-wrap">
                                <div className="flex flex-col gap-1.5">
                                    <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Attendance Monitoring</h2>
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-indigo-100">
                                        Office Hours: 9 AM - 6 PM IST
                                    </div>
                                </div>
                            </div>
                            {displayMode === 'export' ? (
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 px-6 py-3 rounded-xl font-bold border border-indigo-100 shadow-sm">
                                    Monthly Total: {formatDuration(totalExportWorkMinutes)}
                                </div>
                            ) : viewType === 'monthly' && (
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="bg-amber-50 text-amber-900 px-4 py-2.5 rounded-xl font-bold border border-amber-200/80 shadow-2xs flex items-center gap-2 text-xs sm:text-sm">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                        <span>Missing Punchouts: <strong className="text-amber-950 font-black text-sm sm:text-base">{missingPunchoutsCount}</strong></span>
                                    </div>
                                    <div className="bg-teal-50 text-teal-900 px-4 py-2.5 rounded-xl font-bold border border-teal-200/80 shadow-2xs flex items-center gap-2 text-xs sm:text-sm">
                                        <Coffee className="w-4 h-4 text-teal-600" />
                                        <span>No Break Days: <strong className="text-teal-950 font-black text-sm sm:text-base">{noBreakDaysCount}</strong></span>
                                    </div>
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 px-6 py-3 rounded-xl font-bold border border-indigo-100 shadow-sm">
                                        Monthly Total: {formatDuration(totalMonthlyMinutes)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab Switcher */}
                    <div className="flex overflow-x-auto custom-scrollbar-h border-b border-gray-100 mb-6 bg-white rounded-t-[24px] px-4 sm:px-6 pt-4 sm:pt-6 no-scrollbar">
                        <button
                            onClick={() => {
                                setDisplayMode('table');
                                router.get(route('admin.attendance.index'), { ...filters, display: 'table' }, { preserveState: true });
                            }}
                            className={`px-4 sm:px-8 py-3 text-xs sm:text-[13px] font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap transition-all border-b-2 ${displayMode === 'table'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                                }`}
                        >
                            Table View
                        </button>
                        <button
                            onClick={() => {
                                setDisplayMode('cards');
                                router.get(route('admin.attendance.index'), { ...filters, display: 'cards' }, { preserveState: true });
                            }}
                            className={`px-4 sm:px-8 py-3 text-xs sm:text-[13px] font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap transition-all border-b-2 ${displayMode === 'cards'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                                }`}
                        >
                            Cards View
                        </button>
                        <button
                            onClick={() => {
                                setDisplayMode('calendar');
                                const newParams = { ...filters, display: 'calendar' };
                                if (!filters.user_id && users.length > 0) {
                                    newParams.user_id = users[0].id;
                                }
                                router.get(route('admin.attendance.index'), newParams, { preserveState: true });
                            }}
                            className={`px-4 sm:px-8 py-3 text-xs sm:text-[13px] font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap transition-all border-b-2 ${displayMode === 'calendar'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                                }`}
                        >
                            Calendar View
                        </button>
                        <button
                            onClick={() => {
                                setDisplayMode('requests');
                            }}
                            className={`px-4 sm:px-8 py-3 text-xs sm:text-[13px] font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap transition-all border-b-2 inline-flex items-center gap-2 ${displayMode === 'requests'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                                }`}
                        >
                            Correction Requests
                            {pendingRequestsCount > 0 && (
                                <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full font-black">
                                    {pendingRequestsCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Filters (Hidden in Export tab and Requests tab) */}
                    {displayMode !== 'export' && displayMode !== 'requests' && (
                        <div className="bg-white p-6 rounded-b-[24px] shadow-sm border border-gray-100 mb-6">
                            <div className="flex flex-wrap gap-6 items-end">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.05em]">User</label>
                                    <select
                                        value={filters.user_id || ''}
                                        onChange={(e) => handleFilterChange('user_id', e.target.value)}
                                        className="text-[14px] border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-gray-800 bg-gray-50/50 min-w-[200px] h-11 transition-all hover:bg-white hover:border-gray-300"
                                    >
                                        {displayMode !== 'calendar' && <option value="">All Users</option>}
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.05em]">Date (Daily View)</label>
                                    <DatePicker
                                        value={filters.date || ''}
                                        onChange={(val) => handleFilterChange('date', val.target ? val.target.value : val)}
                                        placeholder="Select Date"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.05em]">Month (Monthly View)</label>
                                    <MonthPicker
                                        value={filters.month || ''}
                                        onChange={(val) => handleFilterChange('month', val)}
                                        className="min-w-[200px]"
                                    />
                                </div>
                                <div className="flex items-end gap-3">
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-2 px-6 h-11 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold text-[12px] uppercase tracking-widest"
                                        title="Reset Filters"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Correction Requests View */}
                    {displayMode === 'requests' && (
                        <div className="space-y-6">
                            {/* Filter Bar */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    {['all', 'pending', 'approved', 'rejected'].map(st => (
                                        <button
                                            key={st}
                                            onClick={() => setSelectedReqStatus(st)}
                                            className={`px-4 py-2 rounded-xl text-xs font-extrabold capitalize transition-all ${
                                                selectedReqStatus === st
                                                    ? 'bg-slate-900 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {st} {st === 'pending' && pendingRequestsCount > 0 ? `(${pendingRequestsCount})` : ''}
                                        </button>
                                    ))}
                                </div>
                                <div className="text-xs font-bold text-gray-400">
                                    Total Requests: {(correctionRequests || []).length}
                                </div>
                            </div>

                            {/* Table of Requests */}
                            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 ring-1 ring-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#fcfcfd] border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                            <tr>
                                                <th className="py-5 px-6">Employee</th>
                                                <th className="py-5 px-4">Date</th>
                                                <th className="py-5 px-4">Request Type</th>
                                                <th className="py-5 px-4">Requested Change</th>
                                                <th className="py-5 px-4">Reason</th>
                                                <th className="py-5 px-4">Status</th>
                                                <th className="py-5 px-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm font-medium">
                                            {(correctionRequests || [])
                                                .filter(r => selectedReqStatus === 'all' || r.status === selectedReqStatus)
                                                .map(req => (
                                                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs">
                                                                    {req.user?.name?.charAt(0) || 'U'}
                                                                </div>
                                                                <div>
                                                                    <div className="font-extrabold text-slate-900">{req.user?.name || 'Unknown'}</div>
                                                                    <div className="text-xs text-gray-400">{req.user?.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 font-bold text-slate-800">
                                                            {req.date ? new Date(req.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : req.date}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {req.request_type === 'punch_time' ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                                                                    <Clock className="w-3.5 h-3.5" /> Punch Correction
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">
                                                                    <Coffee className="w-3.5 h-3.5" /> {req.break_action === 'edit' ? 'Modify Break' : 'Add Break'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4 font-semibold text-slate-700">
                                                            {req.request_type === 'punch_time' ? (
                                                                <div className="text-xs space-y-0.5">
                                                                    <div>In: <strong className="text-slate-900">{req.requested_punch_in ? new Date(req.requested_punch_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</strong></div>
                                                                    <div>Out: <strong className="text-slate-900">{req.requested_punch_out ? new Date(req.requested_punch_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</strong></div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs space-y-0.5">
                                                                    <div>Start: <strong className="text-slate-900">{req.requested_break_start ? new Date(req.requested_break_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</strong></div>
                                                                    <div>End: <strong className="text-slate-900">{req.requested_break_end ? new Date(req.requested_break_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</strong></div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {req.reason ? (
                                                                <button
                                                                    onClick={() => setViewingReasonReq(req)}
                                                                    className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/80 flex items-center justify-center transition-all shadow-2xs group"
                                                                    title="Click to view full reason"
                                                                >
                                                                    <Eye className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-gray-300 font-medium">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {req.status === 'approved' && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                                                                    ✓ Approved
                                                                </span>
                                                            )}
                                                            {req.status === 'rejected' && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
                                                                    ✕ Rejected
                                                                </span>
                                                            )}
                                                            {req.status === 'pending' && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                                                                    ⏳ Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {req.status === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => {
                                                                                setApprovingReq(req);
                                                                                setAdminNoteText('');
                                                                            }}
                                                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setRejectingReq(req);
                                                                                setAdminNoteText('');
                                                                            }}
                                                                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {req.status !== 'pending' && (
                                                                    <span className="text-xs text-gray-400 font-medium">
                                                                        {req.admin_note ? `Note: ${req.admin_note}` : 'Actioned'}
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteRequest(req.id)}
                                                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                                    title="Delete Request"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            {(correctionRequests || []).length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                                                        No time correction requests found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cards View (User-like 3-Column Daily Card Grid for Admin) */}
                    {displayMode === 'cards' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                            {attendanceData && attendanceData.length > 0 ? (
                                attendanceData.map((record) => (
                                    <div
                                        key={record?.id || Math.random()}
                                        className={`bg-white rounded-2xl p-5 shadow-xs border border-gray-100 transition-all hover:shadow-md flex flex-col justify-between ${getCardBorder(record?.status)}`}
                                    >
                                        {/* Top Row: Date + Status Badge */}
                                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                            <div>
                                                {viewType === 'daily' && record?.name && (
                                                    <span className="text-xs font-extrabold text-slate-600 block uppercase tracking-wide">{record.name}</span>
                                                )}
                                                <span className="text-base sm:text-lg font-black text-slate-950">
                                                    {formatDate(record?.date || filters?.date)}
                                                </span>
                                            </div>
                                            {getStatusBadge(record?.status)}
                                        </div>

                                        {/* Body Metrics Grid: Check In | Check Out | Total */}
                                        <div className="grid grid-cols-3 gap-2 py-4 my-1">
                                            <div>
                                                <span className="text-xs text-slate-700 font-bold block mb-1">Check In</span>
                                                <span className="text-lg font-black text-slate-950 block">{record?.check_in === '-' ? '--' : record?.check_in}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-700 font-bold block mb-1">Check Out</span>
                                                <span className="text-lg font-black text-slate-950 block">{record?.check_out === '-' ? '--' : record?.check_out}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-700 font-bold block mb-1">Total</span>
                                                <span className="text-lg font-black text-slate-950 block">{record?.hours === '0h 0m' ? '--' : record?.hours}</span>
                                            </div>
                                        </div>

                                        {/* Admin Action & Details Footer Row */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-slate-700 font-semibold">
                                            <div className="flex items-center gap-2">
                                                {record?.punch_in_lat && (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${record.punch_in_lat},${record.punch_in_lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-emerald-600 hover:text-emerald-700 transition-all p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-100"
                                                        title="Check-in Location"
                                                    >
                                                        <MapPin className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {record?.punch_out_lat && (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${record.punch_out_lat},${record.punch_out_lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-rose-600 hover:text-rose-700 transition-all p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-100"
                                                        title="Check-out Location"
                                                    >
                                                        <MapPin className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {record?.attendance_id && (
                                                    <button
                                                        onClick={() => setViewingBreaks(record)}
                                                        className="text-blue-700 hover:text-blue-800 transition-colors px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 flex items-center gap-1.5 font-bold"
                                                        title="Break History"
                                                    >
                                                        <Info className="w-4 h-4 text-blue-600" />
                                                        <span className="text-xs font-bold text-blue-900">{record.break_time === '0h 0m' ? 'Break' : record.break_time}</span>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(record)}
                                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all border border-blue-100"
                                                    title="Edit Attendance"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 font-medium">
                                    No attendance records found.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Table View (Used for both Daily and Monthly) */}
                    {displayMode === 'table' ? (
                        <>
                            <div className="hidden md:block bg-white rounded-[32px] shadow-sm border border-gray-100 ring-1 ring-gray-100">
                                <div className="overflow-x-auto overflow-y-hidden w-full custom-scrollbar-h">
                                    <table className="w-full text-left border-collapse min-w-[1400px]">
                                        <thead className="bg-[#fcfcfd] border-b border-gray-100">
                                            <tr>
                                                {viewType === 'daily' && (
                                                    <th className="py-6 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest pl-10">Name</th>
                                                )}
                                                <th className="py-6 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                                                <th className="py-6 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Check In</th>
                                                <th className="py-6 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Check Out</th>
                                                <th className="py-6 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                                <th className="py-6 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Current Status</th>
                                                <th className="py-6 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Hours</th>
                                                <th className="py-6 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Break</th>
                                                <th className="py-6 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Location</th>
                                                <th className="py-6 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Device</th>
                                                <th className="py-6 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest text-right pr-10">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {attendanceData && attendanceData.length > 0 ? (
                                                attendanceData.map((record, idx) => (
                                                    <tr key={record?.id || Math.random()} className={`group hover:bg-gray-50/30 transition-all ${getRowStyle(record?.status)}`}>
                                                        {viewType === 'daily' && (
                                                            <td className="py-5 px-4 pl-10">
                                                                <div className="text-[14px] font-bold text-gray-900">{record?.name}</div>
                                                            </td>
                                                        )}
                                                        <td className="py-5 px-4">
                                                            <div className="text-[14px] font-bold text-gray-800">{formatDate(record?.date || filters?.date)}</div>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <div className="text-[14px] font-semibold text-gray-700">{record?.check_in === '-' ? '--' : record?.check_in}</div>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`text-[14px] font-semibold ${isRecordMissingPunchout(record) ? 'text-amber-600 font-bold' : 'text-gray-700'}`}>
                                                                    {record?.check_out === '-' ? '--' : record?.check_out}
                                                                </span>
                                                                {isRecordMissingPunchout(record) && (
                                                                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 rounded-md uppercase tracking-wider border border-amber-200" title="System auto-closed session (missing manual punch-out)">
                                                                        Auto Closed
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <span className={`px-4 py-1.5 inline-flex text-[11px] leading-5 font-bold rounded-xl uppercase tracking-wider ${getStatusColor(record?.status)}`}>
                                                                {record?.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            {record?.current_status === 'Working' ? (
                                                                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-[10px] font-bold uppercase tracking-wide">
                                                                    Working
                                                                </span>
                                                            ) : record?.current_status === 'Break' ? (
                                                                <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-xl text-[10px] font-bold uppercase tracking-wide">
                                                                    Break
                                                                </span>
                                                            ) : record?.current_status === 'Punched Out' ? (
                                                                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-bold uppercase tracking-wide">
                                                                    Punched Out
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <div className="text-[14px] font-bold text-gray-800">{record?.hours === '0h 0m' ? '--' : record?.hours}</div>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[14px] font-bold text-gray-800">{record?.break_time === '0h 0m' ? '--' : record?.break_time}</span>
                                                                {record?.attendance_id && (
                                                                    <button
                                                                        onClick={() => setViewingBreaks(record)}
                                                                        className="text-blue-500 hover:text-blue-700 transition-colors p-1 hover:bg-blue-50 rounded-lg"
                                                                        title={record.breaks && record.breaks.length > 0 ? "View Break History" : "Add Break"}
                                                                    >
                                                                        <Info className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <div className="flex items-center gap-3">
                                                                {record?.punch_in_lat && (
                                                                    <a
                                                                        href={`https://www.google.com/maps?q=${record.punch_in_lat},${record.punch_in_lng}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-green-500 hover:text-green-700 transition-all p-2 hover:bg-green-50 rounded-xl"
                                                                        title="Check-in Location"
                                                                    >
                                                                        <MapPin className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                {record?.punch_out_lat && (
                                                                    <a
                                                                        href={`https://www.google.com/maps?q=${record.punch_out_lat},${record.punch_out_lng}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-red-500 hover:text-red-700 transition-all p-2 hover:bg-red-50 rounded-xl"
                                                                        title="Check-out Location"
                                                                    >
                                                                        <MapPin className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                {!record?.punch_in_lat && !record?.punch_out_lat && <span className="text-gray-400">--</span>}
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            {record?.device_type === 'Mobile' ? (
                                                                <span className="flex items-center gap-2 text-[13px] font-bold text-gray-700" title="Mobile">
                                                                    <Smartphone className="w-4 h-4 text-gray-500" /> Mobile
                                                                </span>
                                                            ) : record?.device_type === 'Desktop' ? (
                                                                <span className="flex items-center gap-2 text-[13px] font-bold text-gray-700" title="Desktop">
                                                                    <Monitor className="w-4 h-4 text-gray-500" /> Desktop
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">--</span>
                                                            )}
                                                        </td>
                                                        <td className="py-5 px-4 text-right pr-10">
                                                            <button
                                                                onClick={() => openEditModal(record)}
                                                                className="w-10 h-10 bg-white text-blue-500 rounded-xl hover:shadow-xl hover:shadow-blue-100 transition-all active:scale-90 border border-gray-100 flex items-center justify-center"
                                                                title="Edit"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={viewType === 'daily' ? 11 : 10} className="py-40 text-center">
                                                        <div className="flex flex-col items-center gap-6">
                                                            <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center shadow-sm">
                                                                <Filter size={32} className="text-gray-200" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <h4 className="text-[16px] font-bold text-gray-900">No records found</h4>
                                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Try adjusting your filters</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {attendanceData && attendanceData.length > 0 ? (
                                    attendanceData.map((record) => (
                                        <div
                                            key={record?.id || Math.random()}
                                            className={`bg-white rounded-[24px] shadow-sm border border-gray-100 p-5 ${getRowStyle(record?.status)}`}
                                        >
                                            {/* Card Header: Name + Date */}
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div>
                                                    {viewType === 'daily' && (
                                                        <h4 className="font-bold text-gray-900 text-[15px]">{record?.name}</h4>
                                                    )}
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                                                        {formatDate(record?.date || filters?.date)}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 text-[10px] leading-5 font-bold rounded-full uppercase tracking-wider ${getStatusColor(record?.status)}`}>
                                                    {record?.status}
                                                </span>
                                            </div>

                                            {/* Worked / Break details */}
                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                <div className="text-center bg-green-50/50 rounded-xl py-2 px-1 border border-green-50">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">In</div>
                                                    <div className="text-xs font-bold text-green-700">{record?.check_in === '-' ? '--' : record?.check_in}</div>
                                                </div>
                                                <div className="text-center bg-red-50/50 rounded-xl py-2 px-1 border border-red-50">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Out</div>
                                                    <div className="text-xs font-bold text-red-600">{record?.check_out === '-' ? '--' : record?.check_out}</div>
                                                </div>
                                                <div className="text-center bg-blue-50/50 rounded-xl py-2 px-1 border border-blue-50">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hours</div>
                                                    <div className="text-xs font-bold text-blue-700">{record?.hours === '0h 0m' ? '--' : record?.hours}</div>
                                                </div>
                                            </div>

                                            {/* Metadata Row: Current status + Break + Location + Device */}
                                            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3 space-y-2.5 text-xs mb-4">
                                                {/* Current Status */}
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-gray-400">Current Status:</span>
                                                    {record?.current_status === 'Working' ? (
                                                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                                            Working
                                                        </span>
                                                    ) : record?.current_status === 'Break' ? (
                                                        <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                                            Break
                                                        </span>
                                                    ) : record?.current_status === 'Punched Out' ? (
                                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                                            Punched Out
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </div>

                                                {/* Break Time */}
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-gray-400">Break Time:</span>
                                                    <div className="flex items-center gap-1.5 font-bold text-gray-700">
                                                        <span>{record?.break_time === '0h 0m' ? '--' : record?.break_time}</span>
                                                        {record?.attendance_id && (
                                                            <button
                                                                onClick={() => setViewingBreaks(record)}
                                                                className="text-blue-500 hover:text-blue-700 transition-colors p-0.5 hover:bg-blue-50 rounded"
                                                                title={record.breaks && record.breaks.length > 0 ? "View Break History" : "Add Break"}
                                                            >
                                                                <Info className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Location Maps */}
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-gray-400">Location:</span>
                                                    <div className="flex items-center gap-2">
                                                        {record?.punch_in_lat && (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${record.punch_in_lat},${record.punch_in_lng}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-green-600 hover:underline flex items-center gap-1 font-bold"
                                                            >
                                                                Check In Maps
                                                            </a>
                                                        )}
                                                        {record?.punch_in_lat && record?.punch_out_lat && <span className="text-gray-300">|</span>}
                                                        {record?.punch_out_lat && (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${record.punch_out_lat},${record.punch_out_lng}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-red-600 hover:underline flex items-center gap-1 font-bold"
                                                            >
                                                                Check Out Maps
                                                            </a>
                                                        )}
                                                        {!record?.punch_in_lat && !record?.punch_out_lat && <span className="text-gray-400">--</span>}
                                                    </div>
                                                </div>

                                                {/* Device Type */}
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-gray-400">Device:</span>
                                                    {record?.device_type === 'Mobile' ? (
                                                        <span className="flex items-center gap-1.5 font-bold text-gray-700" title="Mobile">
                                                            <Smartphone className="w-3.5 h-3.5 text-gray-400" /> Mobile
                                                        </span>
                                                    ) : record?.device_type === 'Desktop' ? (
                                                        <span className="flex items-center gap-1.5 font-bold text-gray-700" title="Desktop">
                                                            <Monitor className="w-3.5 h-3.5 text-gray-400" /> Desktop
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">--</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions Bar */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(record)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                                                    style={{ minHeight: '44px' }}
                                                >
                                                    <Edit className="w-4 h-4" /> Edit Record
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-[24px] p-12 text-center border border-gray-100 shadow-sm">
                                        <div className="w-16 h-16 bg-gray-50 rounded-[20px] flex items-center justify-center mx-auto mb-4">
                                            <Filter size={24} className="text-gray-300" />
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-900">No records found</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Try adjusting your filters</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : displayMode === 'calendar' ? (
                        <CalendarView
                            attendanceData={attendanceData}
                            leaves={leaves}
                            filters={filters}
                            settings={settings}
                            onFilterChange={handleFilterChange}
                        />
                    ) : null}
                </div>
            </div>

            <Modal show={!!editingAttendance} onClose={closeEditModal}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {editingAttendance?.attendance_id ? 'Edit Attendance' : 'Add Attendance'}
                            {viewType === 'daily' ? ` - ${editingAttendance?.name}` : ` - ${selectedUser?.name}`}
                        </h2>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            Date: {editingAttendance?.date || data.date || filters.date}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        {/* CHECK IN TIME */}
                        <div className="space-y-1">
                            <InputLabel htmlFor="punch_in_time" value="Check In Time *" />
                            <input
                                type="time"
                                id="punch_in_time"
                                value={getInTime(data.punch_in)}
                                onChange={(e) => {
                                    const timeVal = e.target.value;
                                    const dateVal = data.date || filters.date || new Date().toISOString().slice(0, 10);
                                    setData('punch_in', `${dateVal}T${timeVal || '09:00'}`);
                                }}
                                required
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-[#635bfc] focus:ring-4 focus:ring-[#635bfc]/15 outline-none transition-all cursor-pointer"
                            />
                            <InputError message={errors.punch_in} className="mt-1" />
                        </div>

                        {/* CHECK OUT TIME */}
                        <div className="space-y-1">
                            <InputLabel htmlFor="punch_out_time" value="Check Out Time" />
                            <input
                                type="time"
                                id="punch_out_time"
                                value={getOutTime(data.punch_out)}
                                onChange={(e) => {
                                    const timeVal = e.target.value;
                                    const dateVal = data.date || filters.date || new Date().toISOString().slice(0, 10);
                                    if (!timeVal) {
                                        setData('punch_out', '');
                                    } else {
                                        setData('punch_out', `${dateVal}T${timeVal}`);
                                    }
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-[#635bfc] focus:ring-4 focus:ring-[#635bfc]/15 outline-none transition-all cursor-pointer"
                            />
                            <InputError message={errors.punch_out} className="mt-1" />
                        </div>
                    </div>

                    <div className="flex items-center justify-end mt-6 pt-3 border-t border-gray-100">
                        <SecondaryButton onClick={closeEditModal} className="mr-3">
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingAttendance?.attendance_id ? 'Update' : 'Create'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Break History Modal */}
            <Modal show={!!viewingBreaks} onClose={() => { setViewingBreaks(null); setEditingBreakId(null); setShowAddBreak(false); }} maxWidth="md">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-5 mb-5 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                                <Coffee className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                                    Break History
                                </h3>
                                <p className="text-xs font-semibold text-gray-400 mt-0.5">
                                    {viewType === 'daily' ? viewingBreaks?.name : viewingBreaks && formatDate(viewingBreaks.date)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowAddBreak(!showAddBreak)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    showAddBreak 
                                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' 
                                        : 'bg-[#1e88e5] text-white hover:bg-[#1565c0] shadow-2xs hover:shadow-xs'
                                }`}
                            >
                                {showAddBreak ? (
                                    <>
                                        <X className="w-3.5 h-3.5" />
                                        Cancel
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Break
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => { setViewingBreaks(null); setEditingBreakId(null); setShowAddBreak(false); }} 
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                title="Close Modal"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {showAddBreak && viewingBreaks && (
                            <BreakAddForm
                                attendanceRecord={viewingBreaks}
                                onCancel={() => setShowAddBreak(false)}
                                onSuccess={() => setShowAddBreak(false)}
                            />
                        )}

                        {viewingBreaks && viewingBreaks.breaks && viewingBreaks.breaks.length > 0 ? (
                            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                                {viewingBreaks.breaks.slice().sort((a, b) => b.id - a.id).map((brk, index) => {
                                    const parseDate = (d) => {
                                        if (!d) return null;
                                        const s = d.toString().replace(/\s/, 'T');
                                        return new Date(s);
                                    };

                                    const isEditing = editingBreakId === brk.id;

                                    if (isEditing) {
                                        return (
                                            <BreakEditForm
                                                key={brk.id}
                                                breakRecord={brk}
                                                attendanceRecord={viewingBreaks}
                                                onCancel={() => setEditingBreakId(null)}
                                                onSuccess={() => setEditingBreakId(null)}
                                            />
                                        );
                                    }

                                    const start = parseDate(brk.start_time);
                                    const end = parseDate(brk.end_time);

                                    return (
                                        <div key={brk.id || index} className="flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shadow-2xs">
                                                    {viewingBreaks.breaks.length - index}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-800">
                                                        {start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '??'} – {end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                                                    </p>
                                                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                                                        Recorded break
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 bg-white text-blue-600 rounded-xl text-xs font-bold shadow-2xs border border-gray-100">
                                                    {brk.total_minutes} min
                                                </span>
                                                <button
                                                    onClick={() => setEditingBreakId(brk.id)}
                                                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-gray-200"
                                                    title="Edit Break"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-10 px-6 bg-gray-50/60 rounded-2xl text-center border border-gray-100 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-2xs flex items-center justify-center text-gray-400 mb-3">
                                    <Clock className="w-6 h-6 stroke-[1.5]" />
                                </div>
                                <p className="text-sm font-bold text-gray-700">No detailed break history available</p>
                                <p className="text-xs text-gray-400 mt-1 max-w-xs font-medium">
                                    {viewingBreaks?.total_break_minutes > 0 
                                        ? "This record contains legacy break totals from an earlier version." 
                                        : "Click '+ Add Break' above to record a break for this session."}
                                </p>
                            </div>
                        )}

                        {/* Footer Summary */}
                        {viewingBreaks && (
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-5">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Break Time</span>
                                <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-600 text-sm font-black tracking-tight border border-blue-100/50">
                                    {viewingBreaks.break_time || "0h 0m"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* REASON POPUP MODAL */}
            <Modal show={!!viewingReasonReq} onClose={() => setViewingReasonReq(null)} maxWidth="md">
                {viewingReasonReq && (
                    <div className="p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-2xs">
                                    <Eye className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Correction Request Reason</h3>
                                    <p className="text-xs text-gray-400 font-medium">
                                        {viewingReasonReq.user?.name} • {viewingReasonReq.date ? new Date(viewingReasonReq.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : viewingReasonReq.date}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingReasonReq(null)}
                                className="p-1.5 text-gray-400 hover:text-slate-600 hover:bg-gray-100 rounded-xl transition-all font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Reason Provided by Employee</div>
                            <p className="text-sm font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {viewingReasonReq.reason || 'No reason provided.'}
                            </p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setViewingReasonReq(null)}
                                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* APPROVE CONFIRMATION MODAL */}
            <Modal show={!!approvingReq} onClose={() => setApprovingReq(null)} maxWidth="md">
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <span className="text-emerald-600">✓</span> Approve Correction Request
                        </h3>
                        <button onClick={() => setApprovingReq(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                    </div>

                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                        Approving this request will automatically update <strong>{approvingReq?.user?.name}</strong>'s attendance and break records for <strong>{approvingReq?.date}</strong> and recalculate total worked hours.
                    </p>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Admin Note (Optional)</label>
                        <textarea
                            value={adminNoteText}
                            onChange={(e) => setAdminNoteText(e.target.value)}
                            rows={2}
                            placeholder="Add a comment or confirmation note..."
                            className="w-full text-xs rounded-xl border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setApprovingReq(null)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                router.post(route('admin.attendance.correction.approve', approvingReq.id), {
                                    admin_note: adminNoteText,
                                }, {
                                    onSuccess: () => setApprovingReq(null),
                                });
                            }}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                        >
                            Confirm Approval
                        </button>
                    </div>
                </div>
            </Modal>

            {/* REJECT CONFIRMATION MODAL */}
            <Modal show={!!rejectingReq} onClose={() => setRejectingReq(null)} maxWidth="md">
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <span className="text-rose-600">✕</span> Reject Correction Request
                        </h3>
                        <button onClick={() => setRejectingReq(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                    </div>

                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                        Rejecting this request will mark it as rejected. <strong>No changes</strong> will be made to <strong>{rejectingReq?.user?.name}</strong>'s attendance or break time.
                    </p>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Rejection Reason / Note</label>
                        <textarea
                            value={adminNoteText}
                            onChange={(e) => setAdminNoteText(e.target.value)}
                            rows={3}
                            placeholder="Explain why this request is being rejected..."
                            className="w-full text-xs rounded-xl border-gray-200 focus:ring-rose-500 focus:border-rose-500"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setRejectingReq(null)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                router.post(route('admin.attendance.correction.reject', rejectingReq.id), {
                                    admin_note: adminNoteText,
                                }, {
                                    onSuccess: () => setRejectingReq(null),
                                });
                            }}
                            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                        >
                            Confirm Rejection
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Clean PDF Print Container (Visible only during window.print()) */}
            <div className="print-only-report">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, textTransform: 'uppercase', color: '#0f172a' }}>WorkNest - Monthly Attendance Report</h1>
                        <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#475569' }}>
                            Report Month: <strong>{formatMonthLabel(filters.month || new Date().toISOString().slice(0, 7))}</strong> &bull; Generated On: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#334155' }}>
                        <p style={{ margin: 0 }}>Selected Employees: <strong>{selectedUserIds.length}</strong></p>
                        <p style={{ margin: '2px 0 0 0' }}>Total Work Hours: <strong>{formatDuration(totalExportWorkMinutes)}</strong></p>
                    </div>
                </div>

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
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                .font-sans { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #eef2f6; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #dde5ed; }

                .custom-scrollbar-h { overflow-y: hidden !important; }
                .custom-scrollbar-h::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar-h::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
                .custom-scrollbar-h::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar-h::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; filter: opacity(0.2); }

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
        </AdminLayout >
    );
}
