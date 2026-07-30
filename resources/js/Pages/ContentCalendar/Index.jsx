import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import UserLayout from '@/Layouts/UserLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { 
    Calendar as CalendarIcon, 
    Plus, 
    Trash2, 
    Edit2, 
    Eye,
    ExternalLink, 
    Zap, 
    X,
    FolderKanban,
    Image as ImageIcon,
    User,
    Check,
    Search,
    ChevronDown,
    Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index({ calendarItems = [], users = [], projects = [] }) {
    const { auth } = usePage().props;
    const isUser = auth?.user?.role === 'user';
    const Layout = isUser ? UserLayout : AdminLayout;

    // Filter States
    const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
    const [selectedMonthFilter, setSelectedMonthFilter] = useState('2026-07');
    const [selectedUserFilter, setSelectedUserFilter] = useState('');
    const [selectedDateFilter, setSelectedDateFilter] = useState('');
    const [updationFilter, setUpdationFilter] = useState('');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    const [assigningItem, setAssigningItem] = useState(null);

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
        generateMonthForm.setData({
            month: selectedMonthFilter,
            project_id: selectedProjectFilter,
        });
        generateMonthForm.post(route('content-calendar.generate-month'), {
            onSuccess: () => toast.success(`Generated calendar entries for ${selectedMonthFilter}`),
            onError: () => toast.error('Failed to generate month entries'),
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
            creative_type: item.creative_type || 'POSTER',
            updation: item.updation || 'POSTED',
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

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this calendar entry?')) {
            router.delete(route('content-calendar.destroy', id), {
                onSuccess: () => toast.success('Entry deleted'),
                onError: () => toast.error('Failed to delete'),
            });
        }
    };

    const handleAssignUserToggle = (itemId, currentUsers, targetUserId) => {
        const currentIds = currentUsers ? currentUsers.map(u => u.id) : [];
        const newIds = currentIds.includes(targetUserId)
            ? currentIds.filter(id => id !== targetUserId)
            : [...currentIds, targetUserId];

        router.put(route('content-calendar.update', itemId), { assigned_user_ids: newIds }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Assigned team updated'),
        });
    };

    // Filtered Items
    const filteredItems = useMemo(() => {
        return calendarItems.filter(item => {
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
            return true;
        });
    }, [calendarItems, selectedProjectFilter, selectedUserFilter, selectedDateFilter, updationFilter]);

    // Format date string for table
    const formatDate = (dateStr) => {
        if (!dateStr) return { main: '-', sub: '' };
        try {
            const d = new Date(dateStr);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            return {
                main: `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`,
                sub: days[d.getDay()]
            };
        } catch (e) {
            return { main: dateStr, sub: '' };
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
        'bg-emerald-500 text-white',
        'bg-amber-500 text-white',
        'bg-slate-400 text-white',
        'bg-purple-500 text-white',
        'bg-blue-500 text-white',
        'bg-rose-500 text-white'
    ];

    return (
        <Layout title="Content Calendar">
            <Head title="Content Calendar" />

            <div className="w-full space-y-6 font-sans pb-12 bg-slate-50/50 min-h-screen p-3 sm:p-6">
                
                {/* 1. TOP FILTERS CARD */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-4 w-full flex-1">
                        
                        {/* PROJECT Dropdown */}
                        <div className="min-w-[180px]">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Project</label>
                            <div className="relative">
                                <select
                                    value={selectedProjectFilter}
                                    onChange={(e) => setSelectedProjectFilter(e.target.value)}
                                    className="w-full pl-4 pr-9 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
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
                        <div className="min-w-[170px]">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">{isUser ? 'Month' : 'Month (Monthly View)'}</label>
                            <input
                                type="month"
                                value={selectedMonthFilter}
                                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                            />
                        </div>

                        {/* DATE FILTER */}
                        <div className="min-w-[170px]">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Date Filter</label>
                            <input
                                type="date"
                                value={selectedDateFilter}
                                onChange={(e) => setSelectedDateFilter(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                            />
                        </div>

                        {/* Admin Quick Filters */}
                        {!isUser && (
                            <>
                                <div className="min-w-[170px]">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Quick Filters</label>
                                    <div className="relative">
                                        <select
                                            value={selectedUserFilter}
                                            onChange={(e) => setSelectedUserFilter(e.target.value)}
                                            className="w-full pl-4 pr-9 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                                        >
                                            <option value="">By User</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="min-w-[170px]">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Status Filter</label>
                                    <input
                                        type="text"
                                        placeholder="Filter Updation..."
                                        value={updationFilter}
                                        onChange={(e) => setUpdationFilter(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* GENERATE MONTH BUTTON (ADMIN ONLY) */}
                    {!isUser && (
                        <div className="self-end xl:self-center flex-shrink-0">
                            <button
                                type="button"
                                onClick={handleGenerateMonth}
                                disabled={generateMonthForm.processing}
                                className="px-6 py-3.5 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                                <Zap size={18} fill="currentColor" />
                                {generateMonthForm.processing ? "Generating..." : "GENERATE MONTH"}
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. MAIN CALENDAR TABLE */}
                <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1050px]">
                            <thead>
                                <tr className="border-b border-gray-100 bg-white">
                                    <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">#</th>
                                    {isUser && <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">CREATIVE NO:</th>}
                                    <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">DATE</th>
                                    <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">PROJECT</th>
                                    <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">CREATIVE TYPE</th>
                                    <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">ASSIGNED TO</th>
                                    <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">UPDATION</th>
                                    <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">DRIVE LINK</th>
                                    <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">THUMBNAIL</th>
                                    <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">CREATIVE CAPTION</th>
                                    <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-500 text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={isUser ? 11 : 10} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                                                    <Filter className="text-gray-300" size={32} />
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-base">No assigned content found</h4>
                                                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mt-1">ITEMS WILL APPEAR ONCE YOU ARE ASSIGNED.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item, idx) => {
                                        const dateFmt = formatDate(item.date);
                                        const assignedList = item.assigned_users || [];
                                        const rowNum = String(idx + 1).padStart(2, '0');

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                                                
                                                {/* # INDEX */}
                                                <td className="py-4 px-4 font-mono font-bold text-sm text-gray-400">{rowNum}</td>

                                                {/* CREATIVE NO: (USER SIDE) */}
                                                {isUser && (
                                                    <td className="py-4 px-4 font-mono font-bold text-sm text-purple-700">{item.creative_uid || '-'}</td>
                                                )}

                                                {/* DATE */}
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    <div className="font-extrabold text-gray-900 text-base">{dateFmt.main}</div>
                                                    <div className="text-xs font-extrabold text-gray-400 tracking-wider">{dateFmt.sub}</div>
                                                </td>

                                                {/* PROJECT */}
                                                <td className="py-4 px-4">
                                                    {isUser ? (
                                                        <span className="font-extrabold text-gray-900 text-sm uppercase">{item.project?.name || '-'}</span>
                                                    ) : (
                                                        <select
                                                            value={item.project_id || ''}
                                                            onChange={(e) => handleInlineUpdate(item.id, 'project_id', e.target.value)}
                                                            className="font-extrabold text-gray-900 text-sm bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-4"
                                                        >
                                                            <option value="">Select Project</option>
                                                            {projects.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>

                                                {/* CREATIVE TYPE */}
                                                <td className="py-4 px-4">
                                                    {isUser ? (
                                                        <span className="font-extrabold text-sm text-gray-900 uppercase">{item.creative_type || '-'}</span>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            defaultValue={item.creative_type || ''}
                                                            onBlur={(e) => handleInlineUpdate(item.id, 'creative_type', e.target.value)}
                                                            placeholder="CREATIVE TYPE"
                                                            className="font-extrabold text-sm text-gray-900 uppercase bg-transparent border-none focus:ring-1 focus:ring-orange-400 rounded px-1 w-40"
                                                        />
                                                    )}
                                                </td>

                                                {/* ASSIGNED TO (Overlapping Avatar Circles) */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center -space-x-2 relative group/assign">
                                                        {assignedList.length > 0 ? (
                                                            assignedList.map((u, i) => (
                                                                <div
                                                                    key={u.id}
                                                                    title={u.name}
                                                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs ring-2 ring-white ${avatarColors[i % avatarColors.length]}`}
                                                                >
                                                                    {getInitials(u.name)}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                                                                -
                                                            </div>
                                                        )}

                                                        {!isUser && (
                                                            <button
                                                                onClick={() => setAssigningItem(item)}
                                                                className="ml-3 opacity-0 group-hover:opacity-100 text-xs font-bold text-orange-600 underline"
                                                            >
                                                                Assign
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* UPDATION */}
                                                <td className="py-4 px-4">
                                                    {isUser ? (
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase border text-center ${
                                                            (item.updation || '').toUpperCase() === 'POSTED' || (item.updation || '').toUpperCase() === 'PUBLISHED'
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                                : 'bg-amber-50 text-amber-600 border-amber-200'
                                                        }`}>
                                                            {item.updation || 'POSTED'}
                                                        </span>
                                                    ) : (
                                                        <select
                                                            value={item.updation || 'POSTED'}
                                                            onChange={(e) => handleInlineUpdate(item.id, 'updation', e.target.value)}
                                                            className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase border cursor-pointer appearance-none text-center ${
                                                                (item.updation || '').toUpperCase() === 'POSTED' || (item.updation || '').toUpperCase() === 'PUBLISHED'
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                                    : (item.updation || '').toUpperCase() === 'DRAFT'
                                                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                                    : 'bg-blue-50 text-blue-600 border-blue-200'
                                                            }`}
                                                        >
                                                            <option value="POSTED">POSTED</option>
                                                            <option value="DRAFT">DRAFT</option>
                                                            <option value="PENDING">PENDING</option>
                                                            <option value="SCHEDULED">SCHEDULED</option>
                                                        </select>
                                                    )}
                                                </td>

                                                {/* DRIVE LINK */}
                                                <td className="py-4 px-4">
                                                    {item.drive_link ? (
                                                        <a
                                                            href={item.drive_link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold max-w-[120px] truncate"
                                                        >
                                                            https://... <ExternalLink size={13} className="text-blue-400 flex-shrink-0" />
                                                        </a>
                                                    ) : isUser ? (
                                                        <span className="text-gray-300 text-sm">-</span>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder="Paste Link..."
                                                            onBlur={(e) => e.target.value && handleInlineUpdate(item.id, 'drive_link', e.target.value)}
                                                            className="text-xs text-gray-400 placeholder-gray-300 bg-transparent border-none p-0 focus:ring-0 w-28"
                                                        />
                                                    )}
                                                </td>

                                                {/* THUMBNAIL */}
                                                <td className="py-4 px-4">
                                                    {item.thumbnail_link ? (
                                                        <a
                                                            href={item.thumbnail_link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-semibold max-w-[120px] truncate"
                                                        >
                                                            https://... <ImageIcon size={13} className="text-purple-400 flex-shrink-0" />
                                                        </a>
                                                    ) : isUser ? (
                                                        <span className="text-gray-300 text-sm">-</span>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder="Paste Image UR.."
                                                            onBlur={(e) => e.target.value && handleInlineUpdate(item.id, 'thumbnail_link', e.target.value)}
                                                            className="text-xs text-purple-600 placeholder-purple-300 bg-transparent border-none p-0 focus:ring-0 w-32 italic"
                                                        />
                                                    )}
                                                </td>

                                                {/* CREATIVE CAPTION */}
                                                <td className="py-4 px-4 max-w-xs">
                                                    {isUser ? (
                                                        <span className="text-sm italic font-medium text-gray-800">{item.creative_caption || 'Enter caption...'}</span>
                                                    ) : (
                                                        <textarea
                                                            rows={1}
                                                            defaultValue={item.creative_caption || ''}
                                                            onBlur={(e) => handleInlineUpdate(item.id, 'creative_caption', e.target.value)}
                                                            placeholder="Enter caption..."
                                                            className="w-full text-sm italic font-medium text-gray-800 placeholder-gray-300 bg-transparent border-none p-0 focus:ring-1 focus:ring-orange-300 rounded resize-none"
                                                        />
                                                    )}
                                                </td>

                                                {/* ACTIONS */}
                                                <td className="py-4 px-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setPreviewItem(item)}
                                                            className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                                                            title="Preview Entry"
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        {!isUser && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleOpenEdit(item)}
                                                                    className="w-8 h-8 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-600 flex items-center justify-center transition-colors cursor-pointer"
                                                                    title="Edit Entry"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                                                                    title="Delete Entry"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
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

                {/* ASSIGN TEAM MODAL (ADMIN ONLY) */}
                {assigningItem && !isUser && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="text-base font-bold text-gray-900">Assign Team Members</h3>
                                <button onClick={() => setAssigningItem(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {users.map(u => {
                                    const isAssigned = (assigningItem.assigned_users || []).some(au => au.id === u.id);
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => handleAssignUserToggle(assigningItem.id, assigningItem.assigned_users, u.id)}
                                            className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                                isAssigned ? 'bg-orange-50 border-orange-300 text-orange-900' : 'bg-gray-50 border-gray-100 text-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
                                                    {getInitials(u.name)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-xs">{u.name}</div>
                                                    <div className="text-[10px] text-gray-400">{u.email}</div>
                                                </div>
                                            </div>
                                            {isAssigned && <Check size={16} className="text-orange-600 stroke-[3]" />}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end pt-3">
                                <button
                                    onClick={() => setAssigningItem(null)}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold uppercase"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PREVIEW MODAL */}
                {previewItem && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100 space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div>
                                    <span className="text-xs font-extrabold uppercase text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                        {previewItem.creative_type || 'POSTER'}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900 mt-2">{previewItem.creative_uid}</h3>
                                </div>
                                <button onClick={() => setPreviewItem(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 text-xs text-gray-700">
                                <div>
                                    <span className="font-bold text-gray-400 uppercase text-xs block">Scheduled Date</span>
                                    <span className="font-extrabold text-base">{previewItem.date}</span>
                                </div>

                                <div>
                                    <span className="font-bold text-gray-400 uppercase text-xs block">Creative Caption</span>
                                    <p className="p-4 bg-gray-50 rounded-2xl italic text-gray-800 text-sm font-medium leading-relaxed mt-1">
                                        {previewItem.creative_caption || 'No caption provided.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {previewItem.drive_link && (
                                        <a href={previewItem.drive_link} target="_blank" rel="noreferrer" className="p-3 bg-blue-50 text-blue-700 rounded-2xl font-bold flex items-center justify-between">
                                            <span>Google Drive Asset</span>
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                    {previewItem.thumbnail_link && (
                                        <a href={previewItem.thumbnail_link} target="_blank" rel="noreferrer" className="p-3 bg-purple-50 text-purple-700 rounded-2xl font-bold flex items-center justify-between">
                                            <span>Thumbnail Link</span>
                                            <ExternalLink size={14} />
                                        </a>
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
