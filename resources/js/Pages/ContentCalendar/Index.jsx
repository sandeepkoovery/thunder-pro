import React, { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import UserLayout from '@/Layouts/UserLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { 
    Calendar as CalendarIcon, 
    Plus, 
    Trash2, 
    Edit2, 
    RotateCcw,
    Eye,
    ExternalLink, 
    Zap, 
    X,
    FolderKanban,
    Image as ImageIcon,
    User as UserIcon,
    Check,
    Search,
    ChevronDown,
    Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index({ calendarItems = [], users = [], projects = [], monthStartDay = 25, monthEndDay = 24 }) {
    const { auth } = usePage().props;
    const isUser = auth?.user?.role === 'user';
    const Layout = isUser ? UserLayout : AdminLayout;

    // Filter States
    const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
    const [selectedMonthFilter, setSelectedMonthFilter] = useState('2026-07');
    const [selectedUserFilter, setSelectedUserFilter] = useState('');
    const [selectedDateFilter, setSelectedDateFilter] = useState('');
    const [updationFilter, setUpdationFilter] = useState('');

    // Helper to calculate custom month date range (e.g. July 2026 -> June 25 to July 24)
    const getMonthDateRange = (monthStr, startDay = 25, endDay = 24) => {
        if (!monthStr) return { start: null, end: null };
        try {
            const parts = monthStr.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);

            if (startDay === 1) {
                const start = `${year}-${String(month).padStart(2, '0')}-01`;
                const lastDay = new Date(year, month, 0).getDate();
                const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                return { start, end };
            } else {
                let prevYear = year;
                let prevMonth = month - 1;
                if (prevMonth === 0) {
                    prevMonth = 12;
                    prevYear = year - 1;
                }
                const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
                const actualStartDay = Math.min(startDay, daysInPrevMonth);
                const start = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(actualStartDay).padStart(2, '0')}`;

                const daysInCurrentMonth = new Date(year, month, 0).getDate();
                const actualEndDay = Math.min(endDay, daysInCurrentMonth);
                const end = `${year}-${String(month).padStart(2, '0')}-${String(actualEndDay).padStart(2, '0')}`;

                return { start, end };
            }
        } catch (e) {
            return { start: null, end: null };
        }
    };

    const monthRangeText = useMemo(() => {
        const { start, end } = getMonthDateRange(selectedMonthFilter, monthStartDay, monthEndDay);
        if (!start || !end) return '';
        const fmt = (s) => {
            const d = new Date(s);
            const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
            return `${m} ${d.getDate()}`;
        };
        return `${fmt(start)} - ${fmt(end)}`;
    }, [selectedMonthFilter, monthStartDay, monthEndDay]);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    const [assigningItemId, setAssigningItemId] = useState(null);

    // Local state for instant optimistic updates
    const [localItems, setLocalItems] = useState(calendarItems);
    useEffect(() => {
        setLocalItems(calendarItems);
    }, [calendarItems]);

    // Form
    const form = useForm({
        project_id: '',
        creative_uid: '',
        date: new Date().toISOString().split('T')[0],
        creative_type: 'POSTER',
        updation: 'POSTED',
        drive_link: '',
        thumbnail_link: '',
        creative_caption: '',
        is_additional: false,
        assigned_user_ids: [],
    });

    const generateMonthForm = useForm({
        month: selectedMonthFilter,
        project_id: selectedProjectFilter,
    });

    const handleGenerateMonth = () => {
        router.post(route('content-calendar.generate-month'), {
            month: selectedMonthFilter,
            project_id: selectedProjectFilter ? selectedProjectFilter : null,
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Generated calendar entries for ${selectedMonthFilter}`),
            onError: () => toast.error('Failed to generate month entries'),
        });
    };

    // Quick Add Row automatically on Plus button click
    const handleQuickAddRow = (targetDate, projectId) => {
        if (isUser) return;
        const uid = 'CR_' + Math.random().toString(36).substring(2, 8).toUpperCase();
        router.post(route('content-calendar.store'), {
            date: targetDate,
            project_id: projectId || '',
            creative_uid: uid,
            creative_type: '',
            updation: 'STATUS',
            is_additional: true,
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success('New creative row added'),
            onError: (err) => {
                console.error('Failed to add row:', err);
                toast.error('Failed to add row');
            },
        });
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            form.put(route('content-calendar.update', editingItem.id), {
                onSuccess: () => {
                    toast.success('Content calendar item updated');
                    setIsCreateModalOpen(false);
                    setEditingItem(null);
                    form.reset();
                },
                onError: () => toast.error('Failed to update item'),
            });
        } else {
            form.post(route('content-calendar.store'), {
                onSuccess: () => {
                    toast.success('Content calendar item created');
                    setIsCreateModalOpen(false);
                    form.reset();
                },
                onError: () => toast.error('Failed to create item'),
            });
        }
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        const assignedIds = item.assigned_users ? item.assigned_users.map(u => u.id) : [];
        form.setData({
            project_id: item.project_id || '',
            creative_uid: item.creative_uid || '',
            date: item.date || new Date().toISOString().split('T')[0],
            creative_type: item.creative_type || '',
            updation: item.updation || 'STATUS',
            drive_link: item.drive_link || '',
            thumbnail_link: item.thumbnail_link || '',
            creative_caption: item.creative_caption || '',
            is_additional: item.is_additional ?? false,
            assigned_user_ids: assignedIds,
        });
        setIsCreateModalOpen(true);
    };

    const handleInlineUpdate = (id, field, value) => {
        if (isUser) return;
        router.put(route('content-calendar.update', id), { [field]: value }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Updated'),
            onError: () => toast.error('Update failed'),
        });
    };

    const handleClearRow = (id) => {
        if (confirm('Are you sure you want to clear all information from this row?')) {
            // 1. Instant optimistic local update
            setLocalItems(prev => prev.map(item => {
                if (item.id !== id) return item;
                return {
                    ...item,
                    project_id: null,
                    creative_type: '',
                    updation: 'STATUS',
                    drive_link: '',
                    thumbnail_link: '',
                    creative_caption: '',
                    assigned_users: [],
                };
            }));

            // 2. Put request to backend
            router.put(route('content-calendar.update', id), {
                project_id: null,
                creative_type: '',
                updation: 'STATUS',
                drive_link: '',
                thumbnail_link: '',
                creative_caption: '',
                assigned_user_ids: [],
            }, {
                preserveScroll: true,
                preserveState: true,
                only: ['calendarItems'],
                onSuccess: () => toast.success('Row information cleared'),
                onError: () => toast.error('Failed to clear row'),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this additional row?')) {
            setLocalItems(prev => prev.filter(item => item.id !== id));

            router.delete(route('content-calendar.destroy', id), {
                preserveScroll: true,
                preserveState: true,
                only: ['calendarItems'],
                onSuccess: () => toast.success('Additional row deleted'),
                onError: () => toast.error('Failed to delete row'),
            });
        }
    };

    const handleAssignUserToggle = (itemId, targetUserId) => {
        // 1. Instant optimistic local state update (0ms latency!)
        setLocalItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            const currentUsers = item.assigned_users || [];
            const isAssigned = currentUsers.some(u => u.id === targetUserId);
            const targetUserObj = users.find(u => u.id === targetUserId);
            const updatedUsers = isAssigned
                ? currentUsers.filter(u => u.id !== targetUserId)
                : (targetUserObj ? [...currentUsers, targetUserObj] : currentUsers);
            return { ...item, assigned_users: updatedUsers };
        }));

        // 2. Background server update
        const targetItem = localItems.find(i => i.id === itemId);
        const currentUsers = targetItem?.assigned_users || [];
        const isAssigned = currentUsers.some(u => u.id === targetUserId);
        const newIds = isAssigned
            ? currentUsers.filter(u => u.id !== targetUserId).map(u => u.id)
            : [...currentUsers.map(u => u.id), targetUserId];

        router.put(route('content-calendar.update', itemId), { assigned_user_ids: newIds }, {
            preserveScroll: true,
            preserveState: true,
            only: ['calendarItems'],
        });
    };

    // Filtered Items
    const filteredItems = useMemo(() => {
        const { start, end } = getMonthDateRange(selectedMonthFilter, monthStartDay, monthEndDay);

        return localItems.filter(item => {
            if (selectedProjectFilter && String(item.project_id) !== String(selectedProjectFilter)) {
                return false;
            }
            if (selectedUserFilter) {
                const userIds = item.assigned_users ? item.assigned_users.map(u => String(u.id)) : [];
                if (!userIds.includes(String(selectedUserFilter))) return false;
            }
            if (selectedDateFilter && item.date !== selectedDateFilter) {
                return false;
            }
            if (updationFilter) {
                const statusStr = (item.updation || '').toLowerCase();
                if (!statusStr.includes(updationFilter.toLowerCase())) return false;
            }
            if (start && end && !selectedDateFilter) {
                if (item.date < start || item.date > end) {
                    return false;
                }
            }
            return true;
        });
    }, [localItems, selectedProjectFilter, selectedUserFilter, selectedDateFilter, selectedMonthFilter, updationFilter, monthStartDay, monthEndDay]);

    // Check if entries already exist for the selected month range
    const isMonthGenerated = useMemo(() => {
        if (!selectedMonthFilter) return false;
        const { start, end } = getMonthDateRange(selectedMonthFilter, monthStartDay, monthEndDay);
        if (!start || !end) return false;
        return localItems.some(item => {
            if (selectedProjectFilter && String(item.project_id) !== String(selectedProjectFilter)) {
                return false;
            }
            return item.date >= start && item.date <= end;
        });
    }, [localItems, selectedMonthFilter, selectedProjectFilter, monthStartDay, monthEndDay]);

    // Format date string for table
    const formatDate = (dateStr) => {
        if (!dateStr) return { main: '-', sub: '', isSunday: false };
        try {
            const d = new Date(dateStr);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            const dayIdx = d.getDay();
            return {
                main: `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`,
                sub: days[dayIdx],
                isSunday: dayIdx === 0,
            };
        } catch (e) {
            return { main: dateStr, sub: '', isSunday: false };
        }
    };

    // Get Avatar Initials
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].slice(0, 2).toUpperCase();
    };

    const avatarColors = [
        'bg-[#37474f] text-white',
        'bg-[#c0ca33] text-gray-900',
        'bg-[#388e3c] text-white',
        'bg-[#cfd8dc] text-gray-800',
        'bg-[#ffee58] text-gray-900',
        'bg-[#ab47bc] text-white',
        'bg-[#42a5f5] text-white',
    ];

    const getUserColor = (userId) => {
        const idx = users.findIndex(u => u.id === userId);
        return avatarColors[idx >= 0 ? idx % avatarColors.length : 0];
    };

    return (
        <Layout title="Content Calendar">
            <Head title="Content Calendar" />

            <div className="w-full space-y-6 font-jakarta pb-16 bg-[#f4f6f9] min-h-screen p-4 sm:p-8">
                
                {/* 1. TOP FILTERS CARD */}
                <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100/90 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
                    <div className="flex flex-wrap items-center gap-4 w-full flex-1">
                        
                        {/* PROJECT Dropdown */}
                        <div className="min-w-[180px] flex-1 sm:flex-none">
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">PROJECT</label>
                            <div className="relative">
                                <select
                                    value={selectedProjectFilter}
                                    onChange={(e) => setSelectedProjectFilter(e.target.value)}
                                    className="w-full pl-4 pr-9 py-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-800 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none cursor-pointer"
                                >
                                    <option value="">{isUser ? 'All Projects' : 'Select Project'}</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* MONTH Picker */}
                        <div className="min-w-[190px] flex-1 sm:flex-none">
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">
                                {isUser ? 'MONTH' : 'MONTH (MONTHLY VIEW)'}
                                {monthRangeText && <span className="text-[10px] text-orange-600 font-extrabold ml-1">({monthRangeText})</span>}
                            </label>
                            <input
                                type="month"
                                value={selectedMonthFilter}
                                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-800 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                            />
                        </div>

                        {/* DATE FILTER */}
                        <div className="min-w-[160px] flex-1 sm:flex-none">
                            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">DATE FILTER</label>
                            <input
                                type="date"
                                value={selectedDateFilter}
                                onChange={(e) => setSelectedDateFilter(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-800 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                            />
                        </div>

                        {/* Admin Quick Filters */}
                        {!isUser && (
                            <>
                                <div className="min-w-[160px] flex-1 sm:flex-none">
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">QUICK FILTERS</label>
                                    <div className="relative">
                                        <select
                                            value={selectedUserFilter}
                                            onChange={(e) => setSelectedUserFilter(e.target.value)}
                                            className="w-full pl-4 pr-9 py-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-800 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none cursor-pointer"
                                        >
                                            <option value="">By User</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="min-w-[170px] flex-1 sm:flex-none">
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5">STATUS FILTER</label>
                                    <input
                                        type="text"
                                        placeholder="Filter Updation.."
                                        value={updationFilter}
                                        onChange={(e) => setUpdationFilter(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* GENERATE MONTH BUTTON (ADMIN ONLY - SHOW ONLY IF NOT YET GENERATED) */}
                    {!isUser && !isMonthGenerated && (
                        <div className="self-end xl:self-center flex-shrink-0">
                            <button
                                type="button"
                                onClick={handleGenerateMonth}
                                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#ff5722] to-[#ea580c] hover:brightness-105 active:scale-95 text-white text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-orange-500/30 flex items-center gap-2 cursor-pointer"
                            >
                                <Zap size={16} fill="currentColor" />
                                GENERATE MONTH
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. MAIN CALENDAR TABLE */}
                <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100/90 overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1150px]">
                            <thead>
                                <tr className="border-b border-gray-100 bg-white">
                                    <th className="py-5 px-5 text-xs font-black uppercase tracking-wider text-gray-400 w-12">#</th>
                                    {isUser && <th className="py-5 px-5 text-xs font-black uppercase tracking-wider text-gray-400">CREATIVE NO:</th>}
                                    <th className="py-5 px-5 text-xs font-black uppercase tracking-wider text-gray-400">DATE</th>
                                    <th className="py-5 px-5 text-xs font-black uppercase tracking-wider text-gray-400">PROJECT</th>
                                    <th className="py-5 px-5 text-xs font-black uppercase tracking-wider text-gray-400">CREATIVE TYPE</th>
                                    <th className="py-5 px-5 text-xs font-black uppercase tracking-wider text-gray-400">ASSIGNED TO</th>
                                    <th className="py-5 px-5 text-xs font-black uppercase tracking-wider text-gray-400">UPDATION</th>
                                    <th className="py-5 px-5 text-xs font-black uppercase tracking-wider text-gray-400">DRIVE LINK</th>
                                    <th className="py-5 px-5 text-xs font-black uppercase tracking-wider text-gray-400">THUMBNAIL</th>
                                    <th className="py-5 px-5 text-xs font-black uppercase tracking-wider text-gray-400">CREATIVE CAPTION</th>
                                    <th className="py-5 px-5 text-xs font-black uppercase tracking-wider text-gray-400 text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/80">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={isUser ? 11 : 10} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                                                    <Filter className="text-gray-300" size={30} />
                                                </div>
                                                <h4 className="font-bold text-gray-800 text-base">No content entries found</h4>
                                                <p className="text-xs font-extrabold tracking-wider text-gray-400 uppercase mt-1">TRY ADJUSTING YOUR FILTERS OR GENERATE A NEW MONTH.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item, idx) => {
                                        const isNearBottom = idx >= filteredItems.length - 4;
                                        const dateFmt = formatDate(item.date);
                                        const assignedList = item.assigned_users || [];
                                        const rowNum = String(idx + 1).padStart(2, '0');

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group relative">
                                                
                                                {/* # INDEX */}
                                                <td className="py-5 px-5 font-mono font-bold text-sm text-gray-400 relative">
                                                    {rowNum}
                                                </td>

                                                {/* CREATIVE NO: (USER SIDE) */}
                                                {isUser && (
                                                    <td className="py-5 px-5 font-mono font-bold text-sm text-purple-700">{item.creative_uid || '-'}</td>
                                                )}

                                                {/* DATE */}
                                                <td className="py-5 px-5 whitespace-nowrap relative">
                                                    {/* FLOATING BLUE PLUS BUTTON ON MOUSEOVER */}
                                                    {!isUser && (
                                                        <div className="absolute -bottom-4 -left-4 z-30 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-auto">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleQuickAddRow(item.date, item.project_id);
                                                                }}
                                                                className="w-8 h-8 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-blue-500/40 flex items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95 transition-all"
                                                                title="Add Row for this Date"
                                                            >
                                                                <Plus size={16} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <div className={`text-sm sm:text-base font-black tracking-tight ${dateFmt.isSunday ? 'text-[#dc2626]' : 'text-gray-900'}`}>
                                                            {dateFmt.main}
                                                        </div>
                                                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                                            {dateFmt.sub}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* PROJECT */}
                                                <td className="py-5 px-5">
                                                    {isUser ? (
                                                        <span className="font-black text-sm text-gray-900 uppercase tracking-tight">{item.project?.name || 'Select Project'}</span>
                                                    ) : (
                                                        <div className="relative inline-block">
                                                            <select
                                                                value={item.project_id || ''}
                                                                onChange={(e) => handleInlineUpdate(item.id, 'project_id', e.target.value)}
                                                                className="font-black text-sm text-gray-900 uppercase tracking-tight bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-5 appearance-none"
                                                            >
                                                                <option value="">Select Project</option>
                                                                {projects.map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                        </div>
                                                    )}
                                                </td>

                                                {/* CREATIVE TYPE */}
                                                <td className="py-5 px-5">
                                                    {isUser ? (
                                                        <span className="font-black text-sm text-gray-900 uppercase tracking-tight">{item.creative_type || 'Enter Type...'}</span>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            defaultValue={item.creative_type || ''}
                                                            onBlur={(e) => handleInlineUpdate(item.id, 'creative_type', e.target.value)}
                                                            placeholder="Enter Type..."
                                                            className="font-black text-sm text-gray-900 uppercase tracking-tight bg-transparent border-none focus:ring-1 focus:ring-orange-400 rounded p-0 w-44 placeholder-gray-300 placeholder:italic placeholder:font-normal"
                                                        />
                                                    )}
                                                </td>

                                                {/* ASSIGNED TO (Overlapping Avatar Circles with Floating Popover Dropdown) */}
                                                <td className="py-5 px-5 relative">
                                                    <div 
                                                        className="flex items-center -space-x-2 cursor-pointer"
                                                        onClick={() => !isUser && setAssigningItemId(assigningItemId === item.id ? null : item.id)}
                                                        title="Click to Assign Team Members"
                                                    >
                                                        {assignedList.length > 0 ? (
                                                            assignedList.map((u) => (
                                                                <div
                                                                    key={u.id}
                                                                    title={u.name}
                                                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs ring-2 ring-white shadow-sm ${getUserColor(u.id)}`}
                                                                >
                                                                    {getInitials(u.name)}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 hover:border-orange-400 text-gray-300 hover:text-orange-500 flex items-center justify-center transition-colors">
                                                                <Plus size={16} strokeWidth={2.5} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* FLOATING POPOVER DROPDOWN ATTACHED TO THIS CELL */}
                                                    {assigningItemId === item.id && !isUser && (
                                                        <>
                                                            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setAssigningItemId(null)} />
                                                            <div className={`absolute left-0 z-50 bg-white rounded-[24px] w-64 p-3 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.18)] border border-slate-100 font-jakarta animate-in fade-in zoom-in-95 duration-150 ${
                                                                isNearBottom ? 'bottom-12 mb-1' : 'top-12 mt-1'
                                                            }`} onClick={(e) => e.stopPropagation()}>
                                                                <div className="space-y-1 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                                                                    {users.map((u) => {
                                                                        const isAssigned = (item.assigned_users || []).some(au => au.id === u.id);
                                                                        const userColor = getUserColor(u.id);

                                                                        return (
                                                                            <div
                                                                                key={u.id}
                                                                                onClick={() => handleAssignUserToggle(item.id, u.id)}
                                                                                className={`flex items-center gap-3 px-3 py-2 rounded-2xl cursor-pointer transition-colors ${
                                                                                    isAssigned ? 'bg-[#f0f4f8]' : 'hover:bg-[#f8fafc]'
                                                                                }`}
                                                                            >
                                                                                {/* Checkbox with inner white dot matching screenshot */}
                                                                                {isAssigned ? (
                                                                                    <div className="w-5 h-5 rounded-full bg-[#2563eb] flex items-center justify-center flex-shrink-0 shadow-xs">
                                                                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-white flex-shrink-0" />
                                                                                )}

                                                                                {/* Initial Avatar Badge */}
                                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs flex-shrink-0 ${userColor}`}>
                                                                                    {getInitials(u.name)}
                                                                                </div>

                                                                                {/* Full Name */}
                                                                                <span className="font-extrabold text-xs sm:text-sm text-[#1e293b] truncate">
                                                                                    {u.name}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </td>

                                                {/* UPDATION */}
                                                <td className="py-5 px-5">
                                                    {isUser ? (
                                                        <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase border text-center inline-block ${
                                                            (item.updation || '').toUpperCase() === 'POSTED' || (item.updation || '').toUpperCase() === 'PUBLISHED'
                                                                ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]'
                                                                : (item.updation || '').toUpperCase() === 'NO POST'
                                                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                                                : 'bg-[#f4f6f9] text-gray-400 border-gray-200'
                                                        }`}>
                                                            {item.updation || 'STATUS'}
                                                        </span>
                                                    ) : (
                                                        <div className="relative inline-block">
                                                            <select
                                                                value={item.updation || 'STATUS'}
                                                                onChange={(e) => handleInlineUpdate(item.id, 'updation', e.target.value)}
                                                                className={`pl-4 pr-7 py-1.5 rounded-xl text-xs font-black uppercase border cursor-pointer appearance-none text-center shadow-sm ${
                                                                    (item.updation || '').toUpperCase() === 'POSTED' || (item.updation || '').toUpperCase() === 'PUBLISHED'
                                                                        ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]'
                                                                        : (item.updation || '').toUpperCase() === 'DRAFT'
                                                                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                                        : (item.updation || '').toUpperCase() === 'NO POST'
                                                                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                                                                        : 'bg-[#f4f6f9] text-gray-400 border-gray-200'
                                                                }`}
                                                            >
                                                                <option value="STATUS">STATUS</option>
                                                                <option value="POSTED">POSTED</option>
                                                                <option value="NO POST">NO POST</option>
                                                                <option value="DRAFT">DRAFT</option>
                                                                <option value="PENDING">PENDING</option>
                                                                <option value="SCHEDULED">SCHEDULED</option>
                                                            </select>
                                                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                                        </div>
                                                    )}
                                                </td>

                                                {/* DRIVE LINK */}
                                                <td className="py-5 px-5">
                                                    {item.drive_link ? (
                                                        <a
                                                            href={item.drive_link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-bold max-w-[130px] truncate underline"
                                                        >
                                                            https://... <ExternalLink size={13} className="text-blue-500 flex-shrink-0" />
                                                        </a>
                                                    ) : isUser ? (
                                                        <span className="text-blue-400/80 text-sm italic font-medium">Paste Link...</span>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder="Paste Link..."
                                                            onBlur={(e) => e.target.value && handleInlineUpdate(item.id, 'drive_link', e.target.value)}
                                                            className="text-sm text-blue-600 placeholder-blue-300 bg-transparent border-none p-0 focus:ring-0 w-32 italic underline font-semibold"
                                                        />
                                                    )}
                                                </td>

                                                {/* THUMBNAIL */}
                                                <td className="py-5 px-5">
                                                    {item.thumbnail_link ? (
                                                        <a
                                                            href={item.thumbnail_link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-bold max-w-[130px] truncate underline"
                                                        >
                                                            https://d.. <ImageIcon size={13} className="text-purple-500 flex-shrink-0" />
                                                        </a>
                                                    ) : isUser ? (
                                                        <span className="text-purple-400/80 text-sm italic font-medium">Paste Image UR..</span>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder="Paste Image UR.."
                                                            onBlur={(e) => e.target.value && handleInlineUpdate(item.id, 'thumbnail_link', e.target.value)}
                                                            className="text-sm text-purple-600 placeholder-purple-300 bg-transparent border-none p-0 focus:ring-0 w-36 italic underline font-bold"
                                                        />
                                                    )}
                                                </td>

                                                {/* CREATIVE CAPTION */}
                                                <td className="py-5 px-5 max-w-xs">
                                                    {isUser ? (
                                                        <span className="text-sm italic font-medium text-gray-800">{item.creative_caption || 'Enter caption...'}</span>
                                                    ) : (
                                                        <textarea
                                                            rows={1}
                                                            defaultValue={item.creative_caption || ''}
                                                            onBlur={(e) => handleInlineUpdate(item.id, 'creative_caption', e.target.value)}
                                                            placeholder="Enter caption..."
                                                            className="w-full text-sm italic font-medium text-gray-800 placeholder-gray-400 bg-transparent border-none p-0 focus:ring-1 focus:ring-orange-300 rounded resize-none"
                                                        />
                                                    )}
                                                </td>

                                                {/* ACTIONS (3 CIRCULAR BUTTONS) */}
                                                <td className="py-5 px-5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* PREVIEW */}
                                                        <button
                                                            onClick={() => setPreviewItem(item)}
                                                            className="w-9 h-9 rounded-full bg-[#e3f2fd] hover:bg-[#bbdefb] text-[#1976d2] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                                                            title="Preview Entry"
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        {!isUser && (
                                                            <>
                                                                {/* CLEAR ROW INFORMATION */}
                                                                <button
                                                                    onClick={() => handleClearRow(item.id)}
                                                                    className="w-9 h-9 rounded-full bg-[#fff3e0] hover:bg-[#ffe0b2] text-[#e65100] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                                                                    title="Clear Row Information"
                                                                >
                                                                    <RotateCcw size={15} />
                                                                </button>
                                                                
                                                                {/* DELETE (ONLY FOR ADDITIONAL ROWS) */}
                                                                {Boolean(item.is_additional) && (
                                                                    <button
                                                                        onClick={() => handleDelete(item.id)}
                                                                        className="w-9 h-9 rounded-full bg-[#ffebee] hover:bg-[#ffcdd2] text-[#d32f2f] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                                                                        title="Delete Additional Row"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CREATE / EDIT MODAL */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 font-jakarta">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="text-base font-bold text-gray-900">
                                    {editingItem ? 'Edit Content Entry' : 'Create Content Entry'}
                                </h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-600 uppercase mb-1">Project</label>
                                    <select
                                        value={form.data.project_id}
                                        onChange={(e) => form.setData('project_id', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800"
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-gray-600 uppercase mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={form.data.date}
                                            onChange={(e) => form.setData('date', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-600 uppercase mb-1">Creative UID</label>
                                        <input
                                            type="text"
                                            value={form.data.creative_uid}
                                            onChange={(e) => form.setData('creative_uid', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-gray-600 uppercase mb-1">Creative Type</label>
                                        <input
                                            type="text"
                                            value={form.data.creative_type}
                                            onChange={(e) => form.setData('creative_type', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-600 uppercase mb-1">Updation Status</label>
                                        <select
                                            value={form.data.updation}
                                            onChange={(e) => form.setData('updation', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800"
                                        >
                                            <option value="STATUS">STATUS</option>
                                            <option value="POSTED">POSTED</option>
                                            <option value="NO POST">NO POST</option>
                                            <option value="DRAFT">DRAFT</option>
                                            <option value="PENDING">PENDING</option>
                                            <option value="SCHEDULED">SCHEDULED</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-600 uppercase mb-1">Drive Link</label>
                                    <input
                                        type="url"
                                        placeholder="https://drive.google.com/..."
                                        value={form.data.drive_link}
                                        onChange={(e) => form.setData('drive_link', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-600 uppercase mb-1">Thumbnail Link</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={form.data.thumbnail_link}
                                        onChange={(e) => form.setData('thumbnail_link', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-600 uppercase mb-1">Creative Caption</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Enter caption..."
                                        value={form.data.creative_caption}
                                        onChange={(e) => form.setData('creative_caption', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs italic text-gray-800"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold uppercase"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="px-5 py-2 bg-gradient-to-r from-[#ff5722] to-[#ea580c] text-white rounded-xl font-black uppercase shadow-md shadow-orange-500/20"
                                    >
                                        {form.processing ? "Saving..." : "Save Entry"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}



                {/* PREVIEW MODAL (FULL DETAILS INCLUDING ASSIGNEES) */}
                {previewItem && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
                        <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 font-jakarta animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                                            {previewItem.creative_type || 'CREATIVE ENTRY'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                                            (previewItem.updation || '').toUpperCase() === 'POSTED' || (previewItem.updation || '').toUpperCase() === 'PUBLISHED'
                                                ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]'
                                                : (previewItem.updation || '').toUpperCase() === 'NO POST'
                                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                                : 'bg-slate-50 text-slate-400 border-slate-200'
                                        }`}>
                                            {previewItem.updation || 'STATUS'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{previewItem.creative_uid}</h3>
                                </div>
                                <button onClick={() => setPreviewItem(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content Details Grid */}
                            <div className="space-y-4 text-xs text-gray-700">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                        <span className="font-extrabold text-gray-400 uppercase text-[10px] tracking-wider block mb-0.5">SCHEDULED DATE</span>
                                        <span className="font-extrabold text-sm text-slate-900">{previewItem.date}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                        <span className="font-extrabold text-gray-400 uppercase text-[10px] tracking-wider block mb-0.5">PROJECT</span>
                                        <span className="font-extrabold text-sm text-slate-900 truncate block">
                                            {previewItem.project?.name || projects.find(p => String(p.id) === String(previewItem.project_id))?.name || 'ALL PROJECTS'}
                                        </span>
                                    </div>
                                </div>

                                {/* Assigned Team Members */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                    <span className="font-extrabold text-gray-400 uppercase text-[10px] tracking-wider block">ASSIGNED TEAM MEMBERS</span>
                                    {previewItem.assigned_users && previewItem.assigned_users.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {previewItem.assigned_users.map(u => (
                                                <div key={u.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/70 shadow-xs">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] ${getUserColor(u.id)}`}>
                                                        {getInitials(u.name)}
                                                    </div>
                                                    <span className="font-extrabold text-xs text-slate-800">{u.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic font-semibold block text-xs">No team members assigned to this entry yet.</span>
                                    )}
                                </div>

                                {/* Creative Caption */}
                                <div className="space-y-1">
                                    <span className="font-extrabold text-gray-400 uppercase text-[10px] tracking-wider block">CREATIVE CAPTION</span>
                                    <p className="p-4 bg-slate-50 border border-slate-100 rounded-2xl italic text-gray-800 text-sm font-semibold leading-relaxed">
                                        {previewItem.creative_caption || 'No caption provided.'}
                                    </p>
                                </div>

                                {/* External Assets */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    {previewItem.drive_link ? (
                                        <a href={previewItem.drive_link} target="_blank" rel="noreferrer" className="p-3.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-colors border border-blue-200/60">
                                            <span>Google Drive Asset</span>
                                            <ExternalLink size={14} className="text-blue-600" />
                                        </a>
                                    ) : (
                                        <div className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl font-bold text-xs border border-slate-100 italic">No Drive Link</div>
                                    )}

                                    {previewItem.thumbnail_link ? (
                                        <a href={previewItem.thumbnail_link} target="_blank" rel="noreferrer" className="p-3.5 bg-purple-50 hover:bg-purple-100/80 text-purple-700 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-colors border border-purple-200/60">
                                            <span>Thumbnail Link</span>
                                            <ExternalLink size={14} className="text-purple-600" />
                                        </a>
                                    ) : (
                                        <div className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl font-bold text-xs border border-slate-100 italic">No Thumbnail Link</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
