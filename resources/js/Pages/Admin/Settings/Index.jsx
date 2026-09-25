import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { 
    Settings, 
    Users, 
    ClipboardList, 
    Save, 
    ChevronRight, 
    CheckCircle, 
    ArrowLeft, 
    Check,
    LayoutDashboard,
    FolderKanban,
    Calendar,
    Clock,
    HardDrive,
    MessageSquare,
    Globe,
    Bot,
    Eye,
    EyeOff,
    Database,
    Moon,
    Sun,
    Plus,
    Trash2,
    Edit2,
    Sparkles,
    AlertCircle,
    X,
    CheckSquare,
    ShieldCheck,
    Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import DatabaseBackupSettings from './DatabaseBackupSettings';

export default function Index({
    settings = {},
    users = [],
    worksheetSettings = {},
    shifts = [],
    tenantAdmins = [],
    backupSettings = {},
    gdriveStatus = {},
    backups = { data: [] },
    isProcessing = false
}) {
    const { auth, allowedModules = [] } = usePage().props;
    const isSuperAdmin = auth?.user?.role === 'superadmin';
    const [activeTab, setActiveTab] = useState('general');

    // Module access checks
    const hasWorksheetAccess = !isSuperAdmin && allowedModules.includes('daily_listings');
    const hasDesignersAccess = !isSuperAdmin && allowedModules.includes('designers_worklist');

    const tabs = [
        { id: 'general', label: 'GENERAL SETTINGS', icon: Settings, show: true },
        { id: 'backup', label: 'DATABASE BACKUP', icon: Database, show: isSuperAdmin },
        { id: 'worksheet', label: 'WORKSHEET CONFIGURATION', icon: Users, show: hasWorksheetAccess },
        { id: 'designers', label: 'DESIGNERS WORKLIST', icon: ClipboardList, show: hasDesignersAccess },
    ].filter(tab => tab.show);


    // Selected user for Worksheet Configuration detail view
    const [selectedUser, setSelectedUser] = useState(null);

    // --- FORM 1: GENERAL SETTINGS ---
    const generalForm = useForm({
        admin_email: settings.admin_email || auth?.user?.email || '',
        monthly_working_days: settings.monthly_working_days || '',
        month_start_day: settings.month_start_day ?? 25,
        month_end_day: settings.month_end_day ?? 24,
        casual_leaves: settings.casual_leaves ?? 12,
        sick_leaves: settings.sick_leaves ?? 12,
        office_start_time: settings.office_start_time || '09:00',
        office_end_time: settings.office_end_time || '18:00',
        login_buffer_minutes: settings.login_buffer_minutes ?? 30,
        shifts_enabled: settings.shifts_enabled === true || settings.shifts_enabled === '1' || settings.shifts_enabled === 1,
        csv_import_limit: settings.csv_import_limit ?? 100,
        beta_menu_items: JSON.parse(settings.beta_menu_items || '[]'),
        hidden_modules: JSON.parse(settings.hidden_modules || '[]'),
    });

    const isWorkshiftFeatureEnabled = isSuperAdmin ? true : Boolean(settings.workshift_enabled);
    const canSeeWorkShifts = isWorkshiftFeatureEnabled;
    const [togglingAdminId, setTogglingAdminId] = useState(null);

    const handleToggleAdminWorkshift = (adminId, newStatus) => {
        setTogglingAdminId(adminId);
        router.patch(route('admin.admin-users.toggle-workshift', adminId), { workshift_enabled: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Admin Work Shift feature updated!');
            },
            onError: () => {
                toast.error('Failed to update Work Shift status.');
            },
            onFinish: () => {
                setTogglingAdminId(null);
            }
        });
    };

    const shiftsEnabled = Boolean(generalForm.data.shifts_enabled);
    const [isTogglingShifts, setIsTogglingShifts] = useState(false);
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState(null);

    const shiftForm = useForm({
        name: '',
        start_time: '09:00',
        end_time: '18:00',
        buffer_minutes: 30,
        is_default: false,
        is_night_shift: false,
        description: '',
    });

    const shiftPresets = [
        {
            name: 'General Shift',
            start_time: '09:00',
            end_time: '18:00',
            buffer_minutes: 30,
            desc: 'Regular daytime shift (9:00 AM – 6:00 PM)',
            icon: Sun,
        },
        {
            name: 'Morning Shift',
            start_time: '06:00',
            end_time: '14:00',
            buffer_minutes: 30,
            desc: 'Early morning shift (6:00 AM – 2:00 PM)',
            icon: Clock,
        },
        {
            name: 'Evening Shift',
            start_time: '18:00',
            end_time: '02:00',
            buffer_minutes: 30,
            desc: 'Evening shift (6:00 PM – 2:00 AM next day)',
            icon: Moon,
        },
        {
            name: 'Night Shift',
            start_time: '22:00',
            end_time: '06:00',
            buffer_minutes: 30,
            desc: 'Overnight night shift (10:00 PM – 6:00 AM next day)',
            icon: Moon,
        },
    ];

    const openShiftModal = (shift = null) => {
        if (shift) {
            setEditingShift(shift);
            shiftForm.setData({
                name: shift.name || '',
                start_time: shift.start_time ? String(shift.start_time).substring(0, 5) : '09:00',
                end_time: shift.end_time ? String(shift.end_time).substring(0, 5) : '18:00',
                buffer_minutes: shift.buffer_minutes ?? 30,
                is_default: !!shift.is_default,
                is_night_shift: !!shift.is_night_shift,
                description: shift.description || '',
            });
        } else {
            setEditingShift(null);
            shiftForm.setData({
                name: '',
                start_time: '09:00',
                end_time: '18:00',
                buffer_minutes: 30,
                is_default: (shifts || []).length === 0,
                is_night_shift: false,
                description: '',
            });
        }
        shiftForm.clearErrors();
        setIsShiftModalOpen(true);
    };

    const handleApplyPreset = (preset) => {
        shiftForm.setData({
            ...shiftForm.data,
            name: preset.name,
            start_time: preset.start_time,
            end_time: preset.end_time,
            buffer_minutes: preset.buffer_minutes,
            description: preset.desc,
            is_night_shift: preset.end_time <= preset.start_time,
        });
    };

    const getShiftRoute = (name, param = null) => {
        try {
            const adminName = `admin.shifts.${name}`;
            if (typeof route === 'function') {
                return param !== null ? route(adminName, param) : route(adminName);
            }
        } catch (e) {
            // fallback to direct URL
        }
        if (name === 'toggle-multiple') return '/admin/settings/shifts/toggle-multiple';
        if (name === 'store') return '/admin/settings/shifts';
        if (name === 'update') return `/admin/settings/shifts/${param}`;
        if (name === 'default') return `/admin/settings/shifts/${param}/default`;
        if (name === 'toggle') return `/admin/settings/shifts/${param}/toggle`;
        if (name === 'destroy') return `/admin/settings/shifts/${param}`;
        return '/admin/settings/shifts';
    };

    const handleSaveShift = (e) => {
        e.preventDefault();
        if (editingShift) {
            shiftForm.put(getShiftRoute('update', editingShift.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsShiftModalOpen(false);
                    setEditingShift(null);
                    toast.success('Shift updated successfully!');
                },
                onError: () => {
                    toast.error('Failed to update shift.');
                }
            });
        } else {
            shiftForm.post(getShiftRoute('store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsShiftModalOpen(false);
                    shiftForm.reset();
                    toast.success('New shift created successfully!');
                },
                onError: () => {
                    toast.error('Failed to create shift.');
                }
            });
        }
    };

    const handleToggleMultipleShifts = () => {
        const nextVal = !shiftsEnabled;
        setIsTogglingShifts(true);
        const url = getShiftRoute('toggle-multiple');
        router.post(url, { shifts_enabled: nextVal }, {
            preserveScroll: true,
            onSuccess: () => {
                generalForm.setData('shifts_enabled', nextVal);
                toast.success(nextVal ? 'Multiple shifts enabled!' : 'Multiple shifts disabled.');
            },
            onError: () => {
                toast.error('Failed to change shift mode.');
            },
            onFinish: () => {
                setIsTogglingShifts(false);
            }
        });
    };

    const handleSetDefaultShift = (shiftId) => {
        router.post(getShiftRoute('default', shiftId), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Default shift updated!'),
            onError: () => toast.error('Failed to update default shift.')
        });
    };

    const handleToggleShiftActive = (shiftId) => {
        router.post(getShiftRoute('toggle', shiftId), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Shift status updated!'),
            onError: () => toast.error('Failed to update shift status.')
        });
    };

    const handleDeleteShift = (shift) => {
        if (!confirm(`Are you sure you want to delete shift "${shift.name}"? Employees on this shift will revert to the default shift.`)) {
            return;
        }
        router.delete(getShiftRoute('destroy', shift.id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Shift deleted successfully!'),
            onError: () => toast.error('Failed to delete shift.')
        });
    };

    const [showModuleVisibility, setShowModuleVisibility] = useState(true);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'leaves', label: 'Leaves', icon: Calendar },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'drive', label: 'Drive', icon: HardDrive },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'websites', label: 'Websites', icon: Globe },
        { id: 'ai_assistant', label: 'AI Voice Assistant', icon: Bot },
    ];

    const toggleHiddenModule = (id) => {
        const current = [...generalForm.data.hidden_modules];
        if (current.includes(id)) {
            generalForm.setData('hidden_modules', current.filter(item => item !== id));
        } else {
            generalForm.setData('hidden_modules', [...current, id]);
        }
    };

    const submitGeneral = (e) => {
        e.preventDefault();
        generalForm.post(route('admin.settings.update'), {
            onSuccess: () => toast.success("General settings saved successfully"),
        });
    };

    // --- FORM 2: WORKSHEET SETTINGS (per user) ---
    const worksheetForm = useForm({
        user_id: '',
        client_name_enabled: true,
        task_type_enabled: true,
        status_enabled: true,
        file_name_enabled: true,
        drive_link_enabled: true,
        project_enabled: true,
        task_type_freetext: false,
        task_type_options: 'DONE,NOT DONE,IN PROGRESS',
    });

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        const userSetting = worksheetSettings[user.id] || {};
        worksheetForm.setData({
            user_id: user.id,
            client_name_enabled: userSetting.client_name_enabled ?? true,
            task_type_enabled: userSetting.task_type_enabled ?? true,
            status_enabled: userSetting.status_enabled ?? true,
            file_name_enabled: userSetting.file_name_enabled ?? true,
            drive_link_enabled: userSetting.drive_link_enabled ?? true,
            project_enabled: userSetting.project_enabled ?? true,
            task_type_freetext: userSetting.task_type_freetext ?? false,
            task_type_options: userSetting.task_type_options ?? 'DONE,NOT DONE,IN PROGRESS',
        });
    };

    const submitWorksheet = (e) => {
        e.preventDefault();
        worksheetForm.post(route('admin.settings.worksheet.update'), {
            onSuccess: () => toast.success(`Worksheet settings for ${selectedUser?.name} saved`),
        });
    };

    // --- FORM 3: DESIGNERS WORKLIST SETTINGS ---
    const designersForm = useForm({
        designers_task_type_options: settings.designers_task_type_options || 'Poster, Thumbnail, Story, Carousel, Grid, Other',
    });

    const submitDesigners = (e) => {
        e.preventDefault();
        designersForm.post(route('admin.settings.designers.update'), {
            onSuccess: () => toast.success("Designers worklist settings saved successfully"),
        });
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    const formatTime12 = (timeStr) => {
        if (!timeStr) return '';
        try {
            const [h, m] = timeStr.split(':').map(Number);
            const period = h >= 12 ? 'PM' : 'AM';
            const hr12 = h % 12 || 12;
            return `${hr12}:${m.toString().padStart(2, '0')} ${period}`;
        } catch (e) {
            return timeStr;
        }
    };

    const calculateLateCutoff = (startTime, bufferMins) => {
        if (!startTime) return { onTimeUntil: '09:30 AM', lateFrom: '09:31 AM' };
        try {
            const [h, m] = startTime.split(':').map(Number);
            const totalMinutes = h * 60 + m + (parseInt(bufferMins, 10) || 0);
            const cutoffHour = Math.floor(totalMinutes / 60) % 24;
            const cutoffMinute = totalMinutes % 60;

            const onTimeUntil = formatTime12(`${cutoffHour.toString().padStart(2, '0')}:${cutoffMinute.toString().padStart(2, '0')}`);
            const lateMinuteTotal = totalMinutes + 1;
            const lateHour = Math.floor(lateMinuteTotal / 60) % 24;
            const lateMin = lateMinuteTotal % 60;
            const lateFrom = formatTime12(`${lateHour.toString().padStart(2, '0')}:${lateMin.toString().padStart(2, '0')}`);

            return { onTimeUntil, lateFrom };
        } catch (e) {
            return { onTimeUntil: '09:30 AM', lateFrom: '09:31 AM' };
        }
    };

    const renderSingleShiftInputs = () => (
        <>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Office Start Time</label>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                        {formatTime12(generalForm.data.office_start_time)}
                    </span>
                </div>
                <input
                    type="time"
                    value={generalForm.data.office_start_time}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                    onChange={(e) => generalForm.setData('office_start_time', e.target.value)}
                    required
                />
                {generalForm.errors.office_start_time && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.office_start_time}</p>}
                <p className="text-[11px] text-gray-400 font-medium ml-1">Official work shift opening time (e.g., 09:00 or 10:00).</p>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Office End Time</label>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                        {formatTime12(generalForm.data.office_end_time)}
                    </span>
                </div>
                <input
                    type="time"
                    value={generalForm.data.office_end_time}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                    onChange={(e) => generalForm.setData('office_end_time', e.target.value)}
                    required
                />
                {generalForm.errors.office_end_time && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.office_end_time}</p>}
                <p className="text-[11px] text-gray-400 font-medium ml-1">Official work shift closing time (e.g., 18:00 or 18:30). Punches before this are Early Leave.</p>
            </div>

            <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Login Grace Buffer Time (Minutes)</label>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">Grace Window</span>
                </div>
                <input
                    type="number"
                    value={generalForm.data.login_buffer_minutes}
                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                    onChange={(e) => generalForm.setData('login_buffer_minutes', e.target.value)}
                    min="0"
                    max="240"
                    placeholder="30"
                />
                {generalForm.errors.login_buffer_minutes && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.login_buffer_minutes}</p>}

                {/* Live explanation card */}
                {(() => {
                    const { onTimeUntil, lateFrom } = calculateLateCutoff(generalForm.data.office_start_time, generalForm.data.login_buffer_minutes);
                    return (
                        <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-100 rounded-2xl flex items-start gap-3 mt-2">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5">
                                <Clock size={16} />
                            </div>
                            <div className="space-y-1 text-xs">
                                <div className="font-bold text-blue-900">
                                    Shift: {formatTime12(generalForm.data.office_start_time) || '9:00 AM'} to {formatTime12(generalForm.data.office_end_time) || '6:00 PM'} ({generalForm.data.login_buffer_minutes || 0} mins buffer)
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                    Employees punch-in up to <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{onTimeUntil}</span> will be counted as <span className="font-bold text-emerald-700">Present (On-Time)</span>.
                                    Punch-in from <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{lateFrom}</span> onwards will be recorded as <span className="font-bold text-rose-700">Late Punch</span>.
                                </p>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </>
    );

    return (
        <AdminLayout title="System Settings">
            <Head title="Settings" />

            <div className="w-full space-y-6 font-sans">
                {/* Header Section */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Settings</h1>
                        <p className="text-gray-500 font-medium">Configure global application behavior and module defaults</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                        <Settings size={32} />
                    </div>
                </div>

                {/* Tabs Navigation (Pill Header Style matching screenshots) */}
                <div className="flex bg-white p-1.5 rounded-[20px] shadow-sm border border-gray-100 gap-1.5 overflow-x-auto custom-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id !== 'worksheet') setSelectedUser(null);
                                }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold uppercase tracking-wider text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-[#0f172a] text-white shadow-md'
                                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: GENERAL SETTINGS */}
                {activeTab === 'general' && (
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 animate-in fade-in duration-200">
                        <div className="mb-8 border-b border-gray-50 pb-6">
                            <h2 className="text-xl font-bold text-gray-900">General Configurations</h2>
                            <p className="text-sm text-gray-500 font-medium mt-1">Manage core system variables and menu appearance</p>
                        </div>

                        <form onSubmit={submitGeneral} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Admin Email Address</label>
                                    <input
                                        type="email"
                                        value={generalForm.data.admin_email}
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                        onChange={(e) => generalForm.setData('admin_email', e.target.value)}
                                        placeholder="admin@example.com"
                                    />
                                    {generalForm.errors.admin_email && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.admin_email}</p>}
                                </div>

                                {isSuperAdmin && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Premium Plan Total Employee Limit</label>
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">Super Admin Setting</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={generalForm.data.csv_import_limit}
                                            className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                            onChange={(e) => generalForm.setData('csv_import_limit', e.target.value)}
                                            min="1"
                                            max="10000"
                                            placeholder="100"
                                        />
                                        {generalForm.errors.csv_import_limit && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.csv_import_limit}</p>}
                                        <p className="text-[11px] text-gray-400 font-medium ml-1">Total ceiling of employees a Premium admin can have (e.g. 100). If an admin has 90, only 10 more can be added/imported unless approved for unlimited employees by Super Admin.</p>
                                    </div>
                                )}

                                {!isSuperAdmin && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Monthly Working Days</label>
                                            <input
                                                type="number"
                                                value={generalForm.data.monthly_working_days}
                                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                                onChange={(e) => generalForm.setData('monthly_working_days', e.target.value)}
                                                min="0"
                                                max="31"
                                            />
                                            {generalForm.errors.monthly_working_days && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.monthly_working_days}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Monthly Cycle Start Day</label>
                                            <input
                                                type="number"
                                                value={generalForm.data.month_start_day}
                                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                                onChange={(e) => generalForm.setData('month_start_day', e.target.value)}
                                                min="1"
                                                max="31"
                                            />
                                            {generalForm.errors.month_start_day && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.month_start_day}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Monthly Cycle End Day</label>
                                            <input
                                                type="number"
                                                value={generalForm.data.month_end_day}
                                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                                onChange={(e) => generalForm.setData('month_end_day', e.target.value)}
                                                min="1"
                                                max="31"
                                            />
                                            {generalForm.errors.month_end_day && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.month_end_day}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Annual Casual Leaves (CL)</label>
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">Per Employee / Year</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={generalForm.data.casual_leaves}
                                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                                onChange={(e) => generalForm.setData('casual_leaves', e.target.value)}
                                                min="0"
                                                max="365"
                                                placeholder="12"
                                            />
                                            {generalForm.errors.casual_leaves && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.casual_leaves}</p>}
                                            <p className="text-[11px] text-gray-400 font-medium ml-1">Total casual leaves allocated per employee annually for this company.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Annual Sick Leaves (SL)</label>
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full">Per Employee / Year</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={generalForm.data.sick_leaves}
                                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                                onChange={(e) => generalForm.setData('sick_leaves', e.target.value)}
                                                min="0"
                                                max="365"
                                                placeholder="12"
                                            />
                                            {generalForm.errors.sick_leaves && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.sick_leaves}</p>}
                                            <p className="text-[11px] text-gray-400 font-medium ml-1">Total sick leaves allocated per employee annually for this company.</p>
                                        </div>
                                    </>
                                )}

                                        {/* Super Admin Feature Control: Enable/Disable Workshift system for particular company admins */}
                                        {isSuperAdmin && (
                                            <div className="md:col-span-2 pt-6 pb-2 border-t border-gray-100">
                                                <div className="p-5 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-white rounded-2xl border border-amber-200/80 shadow-xs">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                        <div className="flex items-center gap-3.5">
                                                            <div className="p-3 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                                                                <ShieldCheck size={22} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-950">Super Admin Feature Control</h4>
                                                                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                                                                        Per-Admin Allocation
                                                                    </span>
                                                                </div>
                                                                <h3 className="text-sm font-bold text-gray-900 mt-0.5">Work Shift Feature for Particular Admins</h3>
                                                                <p className="text-xs text-gray-600 font-medium mt-0.5">
                                                                    Enable or disable the Work Shift System feature for particular company workspaces. Admins with this feature enabled can create custom multi-shifts and assign employees.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {(!tenantAdmins || tenantAdmins.length === 0) ? (
                                                        <p className="text-xs text-gray-400 font-medium italic">No company admin workspaces found.</p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-amber-200/50">
                                                            {tenantAdmins.map((adm) => {
                                                                const isEnabled = Boolean(adm.workshift_enabled);
                                                                const isBusy = togglingAdminId === adm.id;
                                                                return (
                                                                    <div
                                                                        key={adm.id}
                                                                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                                                                            isEnabled ? "bg-white border-amber-200 shadow-2xs" : "bg-gray-50/80 border-gray-200 opacity-80"
                                                                        }`}
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <h5 className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5">
                                                                                <Building size={13} className={isEnabled ? "text-amber-600" : "text-gray-400"} />
                                                                                {adm.company_name || adm.name}
                                                                            </h5>
                                                                            <p className="text-[11px] text-gray-500 truncate mt-0.5">{adm.email}</p>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleAdminWorkshift(adm.id, !isEnabled)}
                                                                            disabled={isBusy}
                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                                                                                isEnabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-600"
                                                                            } ${isBusy ? "opacity-50 cursor-wait" : ""}`}
                                                                            title={`Click to ${isEnabled ? "Disable" : "Enable"} Work Shift for ${adm.company_name || adm.name}`}
                                                                        >
                                                                            {isEnabled ? "Enabled" : "Disabled"}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {canSeeWorkShifts ? (
                                            <>
                                                {/* Office Hours & Multiple Shift Configuration */}
                                                <div className="md:col-span-2 pt-6 pb-2 border-t border-gray-100">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-white rounded-2xl border border-indigo-100/90 shadow-xs">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                                                                <Clock size={22} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Work Shift System</h3>
                                                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                                        shiftsEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                                                                    }`}>
                                                                        {shiftsEnabled ? 'Multiple Shifts Active' : 'Single Shift Mode'}
                                                                    </span>
                                                                </div>
                                                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                            {shiftsEnabled 
                                                                ? 'Configure custom shifts (Day, Evening, Night) with independent timings & buffer rules. Employees can be assigned to different shifts.' 
                                                                : 'Single office hours apply to all staff. Turn ON multiple shifts if your office runs evening or night shifts.'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Toggle Button */}
                                                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                                    <span className="text-xs font-bold text-gray-700">
                                                        {shiftsEnabled ? 'Multi-Shift ON' : 'Multi-Shift OFF'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleToggleMultipleShifts}
                                                        disabled={isTogglingShifts}
                                                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                                            shiftsEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                                                        } ${isTogglingShifts ? 'opacity-50 cursor-wait' : ''}`}
                                                        role="switch"
                                                        aria-checked={shiftsEnabled}
                                                        title="Toggle Multiple Shifts"
                                                    >
                                                        <span
                                                            aria-hidden="true"
                                                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                                shiftsEnabled ? 'translate-x-7' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Conditional Rendering: Multiple Shifts UI vs Single Shift Form */}
                                        {shiftsEnabled ? (
                                            <div className="md:col-span-2 space-y-4">
                                                {/* Shifts List Header */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/80">
                                                    <div>
                                                        <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Sparkles size={14} className="text-indigo-600" />
                                                            Office Shift Schedules ({(shifts || []).length})
                                                        </h4>
                                                        <p className="text-[11px] text-indigo-700/80 font-medium">
                                                            Supports cross-midnight shifts (e.g. 6:00 PM to 2:00 AM, 10:00 PM to 6:00 AM). Late punch and early leave are calculated per shift.
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => openShiftModal()}
                                                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                                                    >
                                                        <Plus size={16} />
                                                        Add New Shift
                                                    </button>
                                                </div>

                                                {/* Shifts Cards Grid */}
                                                {(shifts || []).length === 0 ? (
                                                    <div className="text-center py-10 px-4 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                                                            <Clock size={24} />
                                                        </div>
                                                        <h5 className="text-sm font-bold text-gray-900 mb-1">No Shifts Created Yet</h5>
                                                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                                                            Create your first shift schedule. You can create Morning, Evening (e.g. 6 PM – 2 AM), or Night shifts (10 PM – 6 AM).
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => openShiftModal()}
                                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                                                        >
                                                            <Plus size={15} />
                                                            Create First Shift
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {shifts.map((s) => {
                                                            const isOvernight = Boolean(s.is_night_shift || (s.end_time && s.start_time && s.end_time <= s.start_time));
                                                            const { onTimeUntil, lateFrom } = calculateLateCutoff(s.start_time, s.buffer_minutes);

                                                            return (
                                                                <div
                                                                    key={s.id}
                                                                    className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                                                                        s.is_default
                                                                            ? 'bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 border-indigo-200 shadow-sm ring-1 ring-indigo-200'
                                                                            : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-sm'
                                                                    } ${!s.is_active ? 'opacity-60 bg-gray-50' : ''}`}
                                                                >
                                                                    {/* Card Top / Badges */}
                                                                    <div>
                                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <h5 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                                                                                    {isOvernight ? <Moon size={15} className="text-indigo-600" /> : <Sun size={15} className="text-amber-500" />}
                                                                                    {s.name}
                                                                                </h5>
                                                                                {s.is_default && (
                                                                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                                        <CheckSquare size={11} /> Default
                                                                                    </span>
                                                                                )}
                                                                                {isOvernight && (
                                                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                                        <Moon size={10} /> Overnight
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* Active badge */}
                                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                                                                s.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                                                                            }`}>
                                                                                {s.is_active ? 'Active' : 'Inactive'}
                                                                            </span>
                                                                        </div>

                                                                        {s.description && (
                                                                            <p className="text-xs text-gray-500 font-medium mb-3 line-clamp-1">{s.description}</p>
                                                                        )}

                                                                        {/* Timings Pill */}
                                                                        <div className="p-3 bg-gray-50/90 rounded-xl border border-gray-100 mb-3 space-y-1.5">
                                                                            <div className="flex items-center justify-between text-xs">
                                                                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Hours:</span>
                                                                                <span className="font-black text-gray-900">
                                                                                    {formatTime12(s.start_time)} ➔ {formatTime12(s.end_time)}
                                                                                    {isOvernight && <span className="text-[10px] text-purple-600 ml-1 font-bold">(Next Day)</span>}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between text-xs">
                                                                                <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Grace Buffer:</span>
                                                                                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                                                                                    {s.buffer_minutes} mins
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Calculation helper */}
                                                                        <div className="text-[11px] text-slate-500 leading-tight space-y-1 mb-4">
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-emerald-700 font-bold">On-Time punch:</span> up to {onTimeUntil}
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-rose-600 font-bold">Late mark:</span> from {lateFrom} onwards
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Card Footer Actions */}
                                                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
                                                                        <div className="flex items-center gap-1.5">
                                                                            {!s.is_default && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleSetDefaultShift(s.id)}
                                                                                    className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                                                                    title="Make this the default fallback shift"
                                                                                >
                                                                                    Set Default
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleToggleShiftActive(s.id)}
                                                                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                                                                    s.is_active ? 'text-gray-500 hover:bg-gray-100' : 'text-emerald-600 hover:bg-emerald-50'
                                                                                }`}
                                                                            >
                                                                                {s.is_active ? 'Deactivate' : 'Activate'}
                                                                            </button>
                                                                        </div>

                                                                        <div className="flex items-center gap-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openShiftModal(s)}
                                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                                                                                title="Edit Shift"
                                                                            >
                                                                                <Edit2 size={13} />
                                                                                Edit Shift
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteShift(s)}
                                                                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                                                title="Delete Shift"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            renderSingleShiftInputs()
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {/* Work Shift system hidden by Super Admin -> Admin only sees standard office timings */}
                                        <div className="md:col-span-2 pt-6 pb-2 border-t border-gray-100">
                                            <div className="flex items-center gap-3 p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80">
                                                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Office Working Hours & Login Buffer</h3>
                                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                        Configure daily official office start time, end time, and grace period for attendance calculation.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {renderSingleShiftInputs()}
                                    </>
                                )}
                            </div>

                            {isSuperAdmin && (
                                <div className="bg-gray-50/50 rounded-[28px] p-8 border border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowModuleVisibility(!showModuleVisibility)}
                                        className="flex items-center justify-between w-full group cursor-pointer"
                                    >
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Module Visibility</h3>
                                            <p className="text-gray-500 font-medium text-sm">Control module access globally across the system (Super Admins bypass these restrictions)</p>
                                        </div>
                                        <div className={`p-2 bg-white rounded-full shadow-sm border border-gray-100 transition-transform duration-300 ${showModuleVisibility ? 'rotate-180' : ''}`}>
                                            <ChevronRight className="rotate-90 text-gray-400" />
                                        </div>
                                    </button>

                                    {showModuleVisibility && (
                                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-200">
                                            {menuItems.map((item) => {
                                                const ItemIcon = item.icon;
                                                const isHidden = generalForm.data.hidden_modules.includes(item.id);
                                                const isVisible = !isHidden;

                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => toggleHiddenModule(item.id)}
                                                        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                                                            isVisible
                                                                ? 'bg-white border-gray-100 hover:border-emerald-300 hover:shadow-md'
                                                                : 'bg-gray-50/70 border-gray-200/80 opacity-80 hover:opacity-100 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3.5">
                                                            <div className={`p-2.5 rounded-xl transition-colors ${
                                                                isVisible ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-gray-100 text-gray-400'
                                                            }`}>
                                                                <ItemIcon size={20} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-sm tracking-tight">{item.label}</h4>
                                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold mt-0.5 ${
                                                                    isVisible ? 'text-emerald-600' : 'text-rose-500'
                                                                }`}>
                                                                    {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                                                                    {isVisible ? 'Visible' : 'Hidden'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Toggle Switch */}
                                                        <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                                                            isVisible ? 'bg-emerald-500' : 'bg-gray-300'
                                                        }`}>
                                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                                                isVisible ? 'translate-x-5' : 'translate-x-0'
                                                            }`} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end pt-6">
                                <button
                                    type="submit"
                                    disabled={generalForm.processing}
                                    className="px-10 py-4 bg-[#1e88e5] hover:bg-[#1565c0] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                >
                                    <Save size={18} />
                                    {generalForm.processing ? 'SAVING...' : 'SAVE GENERAL SETTINGS'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB: DATABASE BACKUP (Super Admin Only) */}
                {activeTab === 'backup' && isSuperAdmin && (
                    <DatabaseBackupSettings
                        backupSettings={backupSettings}
                        gdriveStatus={gdriveStatus}
                        backups={backups}
                        isProcessing={isProcessing}
                    />
                )}


                {/* TAB 2: WORKSHEET CONFIGURATION */}
                {activeTab === 'worksheet' && (
                    <>
                        {!selectedUser ? (
                            /* User Selection Cards Grid (Screenshot 2) */
                            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 animate-in fade-in duration-200">
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900">Worksheet Configuration</h2>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Select a user to customize their daily worksheet field visibility</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleSelectUser(user)}
                                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex items-center justify-between cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                                    {getInitials(user.name)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">{user.name}</h3>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">{user.email}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" size={20} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Individual User Worksheet Configuration (Screenshot 3) */
                            <div className="space-y-4 animate-in fade-in duration-200">
                                {/* Top bar breadcrumb / sub-header */}
                                <div className="flex items-center gap-3 px-2 text-gray-600 font-bold text-sm">
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5 text-gray-500 hover:text-gray-900 cursor-pointer"
                                    >
                                        <ArrowLeft size={18} />
                                        <span>Back</span>
                                    </button>
                                    <span className="text-gray-300">/</span>
                                    <span className="text-gray-900">Worksheet Settings - {selectedUser.name}</span>
                                </div>

                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-bold text-gray-900">Worksheet Settings</h2>
                                        <p className="text-sm text-gray-500 font-medium mt-1">
                                            Select which fields should be visible for {selectedUser.name}&apos;s daily worksheet.
                                        </p>
                                    </div>

                                    <form onSubmit={submitWorksheet} className="space-y-8">
                                        {/* Field Toggles Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { key: 'client_name_enabled', label: 'Client Name' },
                                                { key: 'task_type_enabled', label: 'Task Type' },
                                                { key: 'status_enabled', label: 'Status' },
                                                { key: 'file_name_enabled', label: 'File Name' },
                                                { key: 'drive_link_enabled', label: 'Drive Link' },
                                                { key: 'project_enabled', label: 'Project' },
                                                { key: 'task_type_freetext', label: 'Task Type Free Text' },
                                            ].map((field) => {
                                                const checked = worksheetForm.data[field.key];
                                                return (
                                                    <label
                                                        key={field.key}
                                                        className={`p-4 border rounded-2xl flex items-center gap-3.5 cursor-pointer transition-all ${
                                                            checked
                                                                ? 'border-blue-500 bg-blue-50/20 shadow-sm'
                                                                : 'border-gray-100 bg-white hover:border-gray-200'
                                                        }`}
                                                    >
                                                        <div
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                worksheetForm.setData(field.key, !checked);
                                                            }}
                                                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                                                checked ? 'bg-blue-600 text-white shadow-sm' : 'border-2 border-gray-300 bg-white'
                                                            }`}
                                                        >
                                                            {checked && <Check size={14} strokeWidth={3} />}
                                                        </div>
                                                        <span className="font-bold text-gray-800 text-sm">{field.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        <div className="border-t border-gray-100 pt-8">
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                Task Type Options (Comma Separated)
                                            </label>
                                            <textarea
                                                rows="3"
                                                value={worksheetForm.data.task_type_options}
                                                onChange={(e) => worksheetForm.setData('task_type_options', e.target.value)}
                                                className="w-full p-4 border border-gray-200 rounded-2xl font-extrabold text-gray-900 uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm tracking-wide"
                                                placeholder="DONE,NOT DONE,IN PROGRESS"
                                            />
                                            <p className="text-xs text-gray-400 italic mt-2">
                                                Enter the options that will appear in the Task Type dropdown for this user.
                                            </p>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <button
                                                type="submit"
                                                disabled={worksheetForm.processing}
                                                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                            >
                                                {worksheetForm.processing ? 'SAVING...' : 'Save Settings'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* TAB 3: DESIGNERS WORKLIST (Screenshot 4) */}
                {activeTab === 'designers' && (
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 animate-in fade-in duration-200">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900">Designers Worklist Defaults</h2>
                            <p className="text-sm text-gray-500 font-medium mt-1">Configure global default values for the designers module</p>
                        </div>

                        <form onSubmit={submitDesigners} className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                    TASK TYPE OPTIONS (COMMA SEPARATED)
                                </label>
                                <textarea
                                    rows="4"
                                    value={designersForm.data.designers_task_type_options}
                                    onChange={(e) => designersForm.setData('designers_task_type_options', e.target.value)}
                                    className="w-full p-5 bg-gray-50/40 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    placeholder="Poster, Thumbnail, Story, Carousel, Grid, Other"
                                />
                            </div>

                            {/* Info Banner Alert */}
                            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center gap-3 text-blue-600">
                                <CheckCircle size={20} className="shrink-0 text-blue-500" />
                                <span className="text-[11px] font-black uppercase tracking-wider">
                                    THESE OPTIONS WILL APPEAR IN THE &quot;TASK TYPE&quot; DROPDOWN FOR ALL DESIGNERS TASKS.
                                </span>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={designersForm.processing}
                                    className="px-8 py-4 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                >
                                    <Save size={18} />
                                    {designersForm.processing ? 'SAVING...' : 'SAVE DESIGNERS SETTINGS'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Add / Edit Shift Modal */}
            {isShiftModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    <Clock className="text-indigo-600" size={20} />
                                    {editingShift ? 'Edit Work Shift' : 'Add New Work Shift'}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">
                                    Configure working hours, cross-midnight timings, and grace buffers.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsShiftModalOpen(false);
                                    setEditingShift(null);
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="mb-5">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Quick Shift Presets
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {shiftPresets.map((p, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleApplyPreset(p)}
                                        className="p-2.5 text-left bg-gray-50 hover:bg-indigo-50/80 border border-gray-200/80 hover:border-indigo-300 rounded-xl transition-all cursor-pointer group"
                                    >
                                        <div className="text-xs font-bold text-gray-800 group-hover:text-indigo-700 flex items-center gap-1.5">
                                            <p.icon size={13} className="text-indigo-500" />
                                            {p.name}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                                            {formatTime12(p.start_time)} - {formatTime12(p.end_time)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleSaveShift} className="space-y-4">
                            {/* Shift Name */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                                    Shift Name *
                                </label>
                                <input
                                    type="text"
                                    value={shiftForm.data.name}
                                    onChange={(e) => shiftForm.setData('name', e.target.value)}
                                    placeholder="e.g. Evening Shift, Night Shift, US Shift"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                {shiftForm.errors.name && <p className="text-xs text-rose-500 font-bold mt-1">{shiftForm.errors.name}</p>}
                            </div>

                            {/* Timings: Start and End */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                                        Start Time *
                                    </label>
                                    <input
                                        type="time"
                                        value={shiftForm.data.start_time}
                                        onChange={(e) => shiftForm.setData('start_time', e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                    <span className="text-[10px] text-indigo-600 font-bold mt-1 block">
                                        {formatTime12(shiftForm.data.start_time)}
                                    </span>
                                    {shiftForm.errors.start_time && <p className="text-xs text-rose-500 font-bold mt-1">{shiftForm.errors.start_time}</p>}
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                                        End Time *
                                    </label>
                                    <input
                                        type="time"
                                        value={shiftForm.data.end_time}
                                        onChange={(e) => shiftForm.setData('end_time', e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                    <span className="text-[10px] text-purple-600 font-bold mt-1 block">
                                        {formatTime12(shiftForm.data.end_time)}
                                    </span>
                                    {shiftForm.errors.end_time && <p className="text-xs text-rose-500 font-bold mt-1">{shiftForm.errors.end_time}</p>}
                                </div>
                            </div>

                            {/* Cross-Midnight Detection Alert */}
                            {Boolean(shiftForm.data.end_time && shiftForm.data.start_time && shiftForm.data.end_time <= shiftForm.data.start_time) && (
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2.5">
                                    <Moon size={16} className="text-purple-600 shrink-0 mt-0.5" />
                                    <div className="text-xs text-purple-900 leading-snug">
                                        <span className="font-bold">Overnight / Cross-Midnight Shift:</span> End time ({formatTime12(shiftForm.data.end_time)}) is next day. The attendance system will seamlessly manage punch-outs and breaks spanning past midnight.
                                    </div>
                                </div>
                            )}

                            {/* Grace Buffer */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        Login Grace Buffer (Minutes)
                                    </label>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md">
                                        Late grace window
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    max="240"
                                    value={shiftForm.data.buffer_minutes}
                                    onChange={(e) => shiftForm.setData('buffer_minutes', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="30"
                                />
                                {shiftForm.errors.buffer_minutes && <p className="text-xs text-rose-500 font-bold mt-1">{shiftForm.errors.buffer_minutes}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                                    Description / Department (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={shiftForm.data.description}
                                    onChange={(e) => shiftForm.setData('description', e.target.value)}
                                    placeholder="e.g. Night support desk, Designers evening shift"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            {/* Set as Default Checkbox */}
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="is_default_shift"
                                    checked={shiftForm.data.is_default}
                                    onChange={(e) => shiftForm.setData('is_default', e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <label htmlFor="is_default_shift" className="text-xs font-bold text-gray-700 cursor-pointer">
                                    Set as Default Shift for new employees
                                </label>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsShiftModalOpen(false);
                                        setEditingShift(null);
                                    }}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={shiftForm.processing}
                                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                                >
                                    <Save size={15} />
                                    {shiftForm.processing ? 'Saving...' : editingShift ? 'Update Shift' : 'Create Shift'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .font-sans { font-family: 'Poppins', sans-serif !important; }
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            ` }} />
        </AdminLayout>
    );
}
