import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Filter, Edit, RotateCcw, MapPin, Smartphone, Monitor, Info, X, Download } from 'lucide-react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import MonthPicker from '@/Components/MonthPicker';
import CalendarView from '@/Components/CalendarView';

export default function Index({ attendanceData, filters, users, viewType, totalMonthlyMinutes, selectedUser, leaves, settings }) {
    const [displayMode, setDisplayMode] = useState(filters.display || 'table');
    const [editingAttendance, setEditingAttendance] = useState(null);
    // Sub-component for adding a new break
    const BreakAddForm = ({ attendanceRecord, onCancel, onSuccess }) => {
        const [localError, setLocalError] = useState(null);
        const { data, setData, post, processing, errors } = useForm({
            start_time: '',
            end_time: '',
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            setLocalError(null);

            // Combine attendance date with time
            const recordDate = attendanceRecord.date ? attendanceRecord.date.toString().substring(0, 10) : '';
            const fullStart = `${recordDate}T${data.start_time}`;
            const fullEnd = data.end_time ? `${recordDate}T${data.end_time}` : null;

            
            // Extract HH:MM from a raw ISO/UTC timestamp for timezone-safe comparison
            const toHHMM = (raw) => {
                if (!raw) return null;
                const d = new Date(raw.toString().replace(' ', 'T'));
                if (isNaN(d)) return null;
                return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            };

            const punchInHHMM = toHHMM(attendanceRecord.punch_in_raw);
            const punchOutHHMM = attendanceRecord.punch_out_raw ? toHHMM(attendanceRecord.punch_out_raw) : null;

            // Validation: Start time >= Punch In time (HH:MM string comparison)
            if (punchInHHMM && data.start_time < punchInHHMM) {
                setLocalError(`Break cannot start before punch in time (${punchInHHMM})`);
                return;
            }

            // Validation: End time rules
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

            // Use router directly to ensure correctly formatted date strings are sent
            router.post(route('admin.attendance.break.store', attendanceRecord.attendance_id), {
                start_time: fullStart,
                end_time: fullEnd,
            }, {
                onSuccess: () => onSuccess(),
                preserveScroll: true,
            });
        };

        return (
            <form onSubmit={handleSubmit} className="p-4 bg-green-50/50 rounded-[20px] border border-green-100 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold text-xs">+</div>
                    <span className="font-bold text-green-800 text-sm">Add New Break</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                        <InputLabel value="Start Time" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5" />
                        <TextInput
                            type="time"
                            className="w-full text-sm rounded-xl"
                            value={data.start_time}
                            onChange={(e) => setData('start_time', e.target.value)}
                            required
                        />
                        <InputError message={errors.start_time} className="text-xs mt-1" />
                    </div>
                    <div>
                        <InputLabel value="End Time" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5" />
                        <TextInput
                            type="time"
                            className="w-full text-sm rounded-xl"
                            value={data.end_time}
                            onChange={(e) => setData('end_time', e.target.value)}
                        />
                        <InputError message={errors.end_time} className="text-xs mt-1" />
                    </div>
                </div>
                {localError && <p className="text-red-500 text-[11px] font-bold mb-3">{localError}</p>}
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-[12px] font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-2 text-[12px] font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                        Save Break
                    </button>
                </div>
            </form>
        );
    };

    const [viewingBreaks, setViewingBreaks] = useState(null); // For break history modal
    const [editingBreakId, setEditingBreakId] = useState(null);
    const [showAddBreak, setShowAddBreak] = useState(false);

    // Keep viewingBreaks in sync with updated props (important after saves/auto-refresh)
    useEffect(() => {
        if (viewingBreaks) {
            const updated = attendanceData.find(r =>
                (r.attendance_id && r.attendance_id === viewingBreaks.attendance_id) ||
                (!r.attendance_id && r.date === viewingBreaks.date && r.id === viewingBreaks.id)
            );
            if (updated) setViewingBreaks(updated);
        }
    }, [attendanceData]);

    // ... (rest of search/utility functions)
    // Sub-component for editing a break
    const BreakEditForm = ({ breakRecord, attendanceRecord, onCancel, onSuccess }) => {
        const [localError, setLocalError] = useState(null);
        // Helper to format date for time input (HH:mm)
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

            
            // Extract HH:MM from a raw ISO/UTC timestamp for timezone-safe comparison
            const toHHMM = (raw) => {
                if (!raw) return null;
                const d = new Date(raw.toString().replace(' ', 'T'));
                if (isNaN(d)) return null;
                return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            };

            const punchInHHMM = toHHMM(attendanceRecord.punch_in_raw);
            const punchOutHHMM = attendanceRecord.punch_out_raw ? toHHMM(attendanceRecord.punch_out_raw) : null;

            // Validation: Start time >= Punch In time (HH:MM string comparison)
            if (punchInHHMM && data.start_time < punchInHHMM) {
                setLocalError(`Break cannot start before punch in time (${punchInHHMM})`);
                return;
            }

            // Validation: End time rules
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

            // Use router directly to ensure correctly formatted date strings are sent
            router.put(route('admin.attendance.break.update', breakRecord.id), {
                start_time: fullStart,
                end_time: fullEnd,
            }, {
                onSuccess: () => onSuccess(),
                preserveScroll: true,
            });
        };

        return (
            <form onSubmit={handleSubmit} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                        <InputLabel value="Start Time" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1" />
                        <TextInput
                            type="time"
                            className="w-full text-xs h-9 px-2 rounded-lg"
                            value={data.start_time}
                            onChange={(e) => setData('start_time', e.target.value)}
                            required
                        />
                        <InputError message={errors.start_time} className="text-xs mt-1" />
                    </div>
                    <div>
                        <InputLabel value="End Time" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1" />
                        <TextInput
                            type="time"
                            className="w-full text-xs h-9 px-2 rounded-lg"
                            value={data.end_time}
                            onChange={(e) => setData('end_time', e.target.value)}
                        />
                        <InputError message={errors.end_time} className="text-xs mt-1" />
                    </div>
                </div>
                {localError && <p className="text-red-500 text-[10px] font-bold mb-2">{localError}</p>}
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-md disabled:opacity-50 transition-all"
                    >
                        Save
                    </button>
                </div>
            </form>
        );
    };

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // Only reload if we are in daily view for today, or just general reload
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
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const handleFilterChange = (key, value) => {
        const newParams = {
            date: filters.date || '',
            month: filters.month || '',
            user_id: filters.user_id || '',
            display: displayMode,
            [key]: value
        };

        if (key === 'month' && value) {
            newParams.date = '';
        }
        if (key === 'date' && value) {
            newParams.month = '';
            newParams.user_id = ''; // Clear user filter when switching to daily view
        }

        router.get(route('admin.attendance.index'), newParams, {
            preserveState: true,
            replace: true
        });
    };

    const handleReset = () => {
        router.get(route('admin.attendance.index'), {}, { replace: true });
    };

    const openEditModal = (record) => {
        setEditingAttendance(record);

        const formatDateForInput = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().slice(0, 16);
        };

        let defaultPunchIn = '';
        if (!record.attendance_id && filters.date) {
            defaultPunchIn = `${filters.date}T09:00`;
        } else if (!record.attendance_id && record.date) {
            defaultPunchIn = `${record.date}T09:00`;
        }

        setData({
            user_id: record.id || (selectedUser ? selectedUser.id : ''),
            date: record.date || filters.date,
            punch_in: record.punch_in_raw ? formatDateForInput(record.punch_in_raw) : defaultPunchIn,
            punch_out: record.punch_out_raw ? formatDateForInput(record.punch_out_raw) : '',
        });
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

            <div className="py-12 font-sans">
                <div className="w-full">
                    {/* Header Card */}
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-8 flex-wrap">
                            <div className="flex flex-col gap-1.5">
                                <h2 className="text-[28px] font-black text-gray-900 tracking-tight">Attendance Monitoring</h2>
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-indigo-100">
                                    Office Hours: 9 AM - 6 PM IST
                                </div>
                            </div>
                        </div>
                        {viewType === 'monthly' && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 px-6 py-3 rounded-xl font-bold border border-indigo-100 shadow-sm">
                                Monthly Total: {formatDuration(totalMonthlyMinutes)}
                            </div>
                        )}
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex border-b border-gray-100 mb-6 bg-white rounded-t-[24px] px-6 pt-6">
                        <button
                            onClick={() => {
                                setDisplayMode('table');
                                router.get(route('admin.attendance.index'), { ...filters, display: 'table' }, { preserveState: true });
                            }}
                            className={`px-8 py-3 text-[13px] font-bold uppercase tracking-widest transition-all border-b-2 ${displayMode === 'table'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                                }`}
                        >
                            Table View
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
                            className={`px-8 py-3 text-[13px] font-bold uppercase tracking-widest transition-all border-b-2 ${displayMode === 'calendar'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                                }`}
                        >
                            Calendar View
                        </button>
                    </div>

                    {/* Filters */}
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
                                <input
                                    type="date"
                                    value={filters.date || ''}
                                    onChange={(e) => handleFilterChange('date', e.target.value)}
                                    className="text-[14px] border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400/20 bg-gray-50/50 font-semibold text-gray-700 h-11 transition-all hover:bg-white hover:border-gray-300"
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
                                <a
                                    href={route('admin.attendance.export', { month: filters.month || '' })}
                                    className="flex items-center gap-2 px-6 h-11 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-[12px] uppercase tracking-widest"
                                >
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Table View (Used for both Daily and Monthly) */}
                    {displayMode === 'table' ? (
                        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 ring-1 ring-gray-100">
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
                                                        <div className="text-[14px] font-semibold text-gray-700">{record?.check_out === '-' ? '--' : record?.check_out}</div>
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
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        {editingAttendance?.attendance_id ? 'Edit Attendance' : 'Add Attendance'}
                        {viewType === 'daily' ? ` - ${editingAttendance?.name}` : ` - ${selectedUser?.name}`}
                    </h2>

                    <div className="mb-4">
                        <InputLabel htmlFor="punch_in" value="Check In" />
                        <TextInput
                            id="punch_in"
                            type="datetime-local"
                            className="mt-1 block w-full"
                            value={data.punch_in}
                            onChange={(e) => setData('punch_in', e.target.value)}
                            required
                        />
                        <InputError message={errors.punch_in} className="mt-2" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="punch_out" value="Check Out" />
                        <TextInput
                            id="punch_out"
                            type="datetime-local"
                            className="mt-1 block w-full"
                            value={data.punch_out}
                            onChange={(e) => setData('punch_out', e.target.value)}
                        />
                        <InputError message={errors.punch_out} className="mt-2" />
                    </div>

                    <div className="flex items-center justify-end mt-6">
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
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900">
                                Break History
                            </h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                {viewType === 'daily' ? viewingBreaks?.name : viewingBreaks && formatDate(viewingBreaks.date)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAddBreak(!showAddBreak)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showAddBreak ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'}`}
                            >
                                {showAddBreak ? 'Close Form' : '+ Add Break'}
                            </button>
                            <button onClick={() => { setViewingBreaks(null); setEditingBreakId(null); setShowAddBreak(false); }} className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
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
                            viewingBreaks.breaks.slice().sort((a, b) => b.id - a.id).map((brk, index) => {
                                const parseDate = (d) => {
                                    if (!d) return null;
                                    const s = d.toString().replace(/\s/, 'T');
                                    return new Date(s);
                                };

                                const isEditing = editingBreakId === brk.id;

                                if (isEditing) {
                                    // Edit Mode
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
                                    <div key={brk.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">
                                                Break {viewingBreaks.breaks.length - index}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '??'} -
                                                {end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ' Ongoing'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 bg-white text-gray-600 rounded-lg text-xs font-bold shadow-sm border border-gray-100">
                                                {brk.total_minutes} min
                                            </span>
                                            <button
                                                onClick={() => setEditingBreakId(brk.id)}
                                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all opacity-0 group-hover:opacity-100"
                                                title="Edit Break"
                                            >
                                                <Edit className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-6 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-sm font-medium text-gray-500">No detailed break history available.</p>
                                {viewingBreaks?.total_break_minutes > 0 && (
                                    <p className="text-[11px] text-gray-400 mt-1 italic">
                                        This record contains legacy break totals from an earlier version.
                                    </p>
                                )}
                            </div>
                        )}

                        {viewingBreaks && (
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                                <span className="font-bold text-gray-900">Total Break Time</span>
                                <span className="font-bold text-blue-600">{viewingBreaks.break_time}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

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
            ` }} />
        </AdminLayout >
    );
}
