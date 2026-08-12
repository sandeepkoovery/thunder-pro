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
    X,
    ChevronDown,
    User,
    Check,
    Search,
    FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index({ worklists = [], users = [], taskTypeOptionsSetting = 'Poster, Thumbnail, Story, Carousel, Grid, Other' }) {
    const { auth } = usePage().props;
    const isAdmin = ['admin', 'superadmin', 'manager'].includes(auth?.user?.role);
    const Layout = isAdmin ? AdminLayout : UserLayout;
    const isUser = !['admin', 'superadmin', 'editor'].includes(auth?.user?.role);

    const taskOptions = useMemo(() => {
        if (!taskTypeOptionsSetting) return ['Poster', 'Thumbnail', 'Story', 'Carousel', 'Grid', 'Other'];
        return taskTypeOptionsSetting.split(',').map(s => s.trim()).filter(Boolean);
    }, [taskTypeOptionsSetting]);

    // Filter States
    const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
    const [selectedDateFilter, setSelectedDateFilter] = useState('');
    const [selectedDesignerFilter, setSelectedDesignerFilter] = useState('');

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    };

    const getAvatarBgColor = (name) => {
        const colors = [
            'bg-slate-700',
            'bg-[#84cc16]',
            'bg-[#4d7c0f]',
            'bg-[#06b6d4]',
            'bg-[#6366f1]',
            'bg-[#ec4899]',
            'bg-[#f59e0b]',
            'bg-[#10b981]'
        ];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const getSelectedAssigneeNames = () => {
        if (!form.data.assigned_user_ids || form.data.assigned_user_ids.length === 0) {
            return 'Select Assignee(s)';
        }
        const selectedUsers = users.filter(u => form.data.assigned_user_ids.includes(u.id));
        return selectedUsers.map(u => u.name).join(', ');
    };

    // Form
    const form = useForm({
        client_name: '',
        task_date: new Date().toISOString().split('T')[0],
        task_type: taskOptions[0] || 'Poster',
        description: '',
        status: 'Not Done',
        assigned_user_ids: [],
    });

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            form.put(route('designers-worklist.update', editingItem.id), {
                onSuccess: () => {
                    toast.success('Designers worklist task updated');
                    setIsCreateModalOpen(false);
                    setEditingItem(null);
                    form.reset();
                },
                onError: () => toast.error('Failed to update task'),
            });
        } else {
            form.post(route('designers-worklist.store'), {
                onSuccess: () => {
                    toast.success('Designers worklist task created');
                    setIsCreateModalOpen(false);
                    form.reset();
                },
                onError: () => toast.error('Failed to create task'),
            });
        }
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        const assignedIds = item.assigned_users ? item.assigned_users.map(u => u.id) : [];
        form.setData({
            client_name: item.client_name || '',
            task_date: item.task_date || new Date().toISOString().split('T')[0],
            task_type: item.task_type || 'POSTER',
            description: item.description || '',
            status: item.status || 'Not Done',
            assigned_user_ids: assignedIds,
        });
        setIsCreateModalOpen(true);
    };

    const handleInlineStatusChange = (id, newStatus) => {
        router.patch(route('designers-worklist.status', id), { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Task status updated'),
            onError: (err) => {
                console.error('Status update error:', err);
                toast.error('Failed to update status');
            },
        });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this designer task?')) {
            router.delete(route('designers-worklist.destroy', id), {
                onSuccess: () => toast.success('Task deleted'),
                onError: () => toast.error('Failed to delete task'),
            });
        }
    };

    // Filtered Worklist Items
    const filteredWorklists = useMemo(() => {
        return worklists.filter(item => {
            if (selectedMonthFilter && item.task_date) {
                if (!item.task_date.startsWith(selectedMonthFilter)) {
                    return false;
                }
            }
            if (selectedDateFilter && item.task_date !== selectedDateFilter) {
                return false;
            }
            if (selectedDesignerFilter) {
                const userIds = item.assigned_users ? item.assigned_users.map(u => String(u.id)) : [];
                if (!userIds.includes(String(selectedDesignerFilter))) return false;
            }
            return true;
        });
    }, [worklists, selectedMonthFilter, selectedDateFilter, selectedDesignerFilter]);

    // Reset pagination on filter change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedMonthFilter, selectedDateFilter, selectedDesignerFilter, itemsPerPage]);

    const totalPages = Math.ceil(filteredWorklists.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const paginatedWorklists = useMemo(() => {
        return filteredWorklists.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredWorklists, indexOfFirstItem, indexOfLastItem]);

    // Format Date helper (e.g. Jul 30 / THU)
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

    return (
        <Layout title={isUser ? "My Worklist" : "Designers Worklist"}>
            <Head title={isUser ? "My Worklist" : "Designers Worklist"} />

            <div className="w-full space-y-6 font-sans pb-12 bg-slate-50/50 min-h-screen p-3 sm:p-6">
                
                {/* 1. TOP HEADER CARD */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                            {isUser ? "My Worklist" : "Designers Worklist"}
                        </h1>
                        <p className="text-gray-500 font-medium text-xs sm:text-sm mt-0.5">
                            {isUser ? "Tasks assigned to you by managers" : "Assign and manage tasks for designers"}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
                        
                        {/* Month Picker Filter */}
                        <div className="relative">
                            <input
                                type="month"
                                value={selectedMonthFilter}
                                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                                className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                title="Filter by Month"
                            />
                        </div>

                        {/* Date Picker Filter */}
                        <div className="relative">
                            <input
                                type="date"
                                value={selectedDateFilter}
                                onChange={(e) => setSelectedDateFilter(e.target.value)}
                                className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                title="Filter by Date"
                            />
                        </div>

                        {/* Designer Filter (Admin Side) */}
                        {!isUser && (
                            <div className="relative">
                                <select
                                    value={selectedDesignerFilter}
                                    onChange={(e) => setSelectedDesignerFilter(e.target.value)}
                                    className="pl-4 pr-9 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                >
                                    <option value="">DESIGNER: All Designers</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        )}

                        {/* Clear Filters Button */}
                        {(selectedMonthFilter || selectedDateFilter || selectedDesignerFilter) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedMonthFilter('');
                                    setSelectedDateFilter('');
                                    setSelectedDesignerFilter('');
                                }}
                                className="px-3.5 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-all cursor-pointer"
                            >
                                Clear Filters
                            </button>
                        )}

                        {/* + ADD TASK Button (Admin Side) */}
                        {!isUser && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingItem(null);
                                    form.reset();
                                    form.setData('task_date', new Date().toISOString().split('T')[0]);
                                    setIsCreateModalOpen(true);
                                }}
                                className="px-5 py-2.5 rounded-2xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                            >
                                <Plus size={16} /> ADD TASK
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. MAIN WORKLIST TABLE */}
                <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead>
                                <tr className="border-b border-gray-100 bg-white">
                                    <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">DATE</th>
                                    <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">CLIENT</th>
                                    {!isUser && <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">ASSIGNED TO</th>}
                                    <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">TASK TYPE</th>
                                    {isUser && <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">OTHER ASSIGNEES</th>}
                                    <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">STATUS</th>
                                    <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400 text-right">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedWorklists.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                                                    <CalendarIcon className="text-gray-300" size={32} />
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-base">No worklist tasks found</h4>
                                                <p className="text-xs text-gray-400 mt-1">Select a different month, date, or filter above.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedWorklists.map((item) => {
                                        const dateFmt = formatDate(item.task_date);
                                        const assignedList = item.assigned_users || [];
                                        const isDone = (item.status || '').toLowerCase() === 'done' || (item.status || '').toLowerCase() === 'completed';

                                        // Other assignees text for user side
                                        let otherAssigneesText = 'ONLY YOU';
                                        if (assignedList.length > 1) {
                                            const others = assignedList.filter(u => u.id !== auth?.user?.id);
                                            if (others.length > 0) {
                                                otherAssigneesText = others.map(u => u.name.toUpperCase()).join(', ');
                                            }
                                        }

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                                                
                                                {/* DATE */}
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="font-extrabold text-gray-900 text-base">{dateFmt.main}</div>
                                                    <div className="text-xs font-extrabold text-gray-400 tracking-wider uppercase">{dateFmt.sub}</div>
                                                </td>

                                                {/* CLIENT */}
                                                <td className="py-4 px-6 font-extrabold text-gray-900 text-sm uppercase max-w-xs">{item.client_name || '-'}</td>

                                                {/* ASSIGNED TO */}
                                                {!isUser && (
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                            {assignedList.length === 0 ? (
                                                                <span className="text-xs font-extrabold text-gray-400 uppercase">UNASSIGNED</span>
                                                            ) : (
                                                                assignedList.map(u => (
                                                                    <span key={u.id} className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold uppercase border border-blue-100/50">
                                                                        {u.name}
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                    </td>
                                                )}

                                                {/* TASK TYPE */}
                                                <td className="py-4 px-6 font-extrabold text-gray-900 text-sm uppercase whitespace-nowrap">{item.task_type || '-'}</td>

                                                {/* OTHER ASSIGNEES */}
                                                {isUser && (
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <span className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                                                            {otherAssigneesText}
                                                        </span>
                                                    </td>
                                                )}

                                                {/* STATUS */}
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    {isUser ? (
                                                        <select
                                                            value={item.status || 'Not Done'}
                                                            onChange={(e) => handleInlineStatusChange(item.id, e.target.value)}
                                                            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase border cursor-pointer appearance-none text-center ${
                                                                isDone
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                    : 'bg-red-50 text-red-600 border-red-100'
                                                            }`}
                                                        >
                                                            <option value="Not Done">NOT DONE ∨</option>
                                                            <option value="Done">DONE ∨</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase border text-center ${
                                                            isDone
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                : 'bg-red-50 text-red-600 border-red-100'
                                                        }`}>
                                                            {isDone ? 'DONE' : 'NOT DONE'}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* ACTION */}
                                                <td className="py-4 px-6 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isUser ? (
                                                            <button
                                                                onClick={() => setPreviewItem(item)}
                                                                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                                                                title="View Task Details"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleOpenEdit(item)}
                                                                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                                    title="Edit Task"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                                    title="Delete Task"
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

                    {/* PAGINATION FOOTER */}
                    {filteredWorklists.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-500">
                            <div className="flex items-center gap-2">
                                <span>Show</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value={10}>10 per page</option>
                                    <option value={20}>20 per page</option>
                                    <option value={50}>50 per page</option>
                                    <option value={filteredWorklists.length}>All ({filteredWorklists.length})</option>
                                </select>
                                <span>(Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredWorklists.length)} of {filteredWorklists.length} tasks)</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-gray-700 transition shadow-sm cursor-pointer"
                                >
                                    Previous
                                </button>
                                
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                        .map((p, idx, arr) => {
                                            const isCurrent = p === currentPage;
                                            return (
                                                <React.Fragment key={p}>
                                                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1 text-gray-400">...</span>}
                                                    <button
                                                        onClick={() => setCurrentPage(p)}
                                                        className={`w-8 h-8 rounded-xl font-bold transition text-xs cursor-pointer ${
                                                            isCurrent 
                                                                ? 'bg-[#0f172a] text-white shadow-sm' 
                                                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                </React.Fragment>
                                            );
                                        })}
                                </div>

                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-gray-700 transition shadow-sm cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. PREVIEW MODAL */}
                {previewItem && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-8 sm:p-9 shadow-2xl border border-slate-100 space-y-6 my-auto">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div>
                                    <span className="text-xs font-extrabold uppercase text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full">
                                        {previewItem.task_type || 'POSTER'}
                                    </span>
                                    <h3 className="text-2xl font-extrabold text-gray-900 mt-2.5 uppercase tracking-tight">{previewItem.client_name}</h3>
                                </div>
                                <button onClick={() => setPreviewItem(null)} className="p-2.5 rounded-2xl text-gray-400 hover:bg-gray-100 transition-colors">
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="space-y-5 text-xs text-gray-700">
                                <div>
                                    <span className="font-bold text-gray-400 uppercase text-xs block mb-1">Task Date</span>
                                    <span className="font-extrabold text-base text-gray-900">{previewItem.task_date || '-'}</span>
                                </div>

                                <div>
                                    <span className="font-bold text-gray-400 uppercase text-xs block mb-1.5">Description / Guidelines</span>
                                    <div className="p-6 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-gray-800 text-sm font-medium leading-relaxed whitespace-pre-line min-h-[240px] max-h-[460px] overflow-y-auto shadow-inner">
                                        {previewItem.description || 'No specific guidelines provided.'}
                                    </div>
                                </div>

                                <div>
                                    <span className="font-bold text-gray-400 uppercase text-xs block mb-1.5">Assigned Designers</span>
                                    <div className="flex flex-wrap gap-2">
                                        {(previewItem.assigned_users || []).map(u => (
                                            <span key={u.id} className="px-3.5 py-1.5 bg-blue-50 text-blue-600 rounded-full font-extrabold text-xs uppercase border border-blue-100/60">
                                                {u.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. CREATE / EDIT TASK MODAL (ADMIN ONLY) */}
                {isCreateModalOpen && !isUser && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-8 sm:p-9 shadow-2xl border border-slate-100 space-y-6 my-auto">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingItem ? 'Edit Designer Task' : 'Add Designer Task'}
                                </h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Client Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.data.client_name}
                                        onChange={(e) => form.setData('client_name', e.target.value)}
                                        placeholder="KALPAKA - 30"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Task Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={form.data.task_date}
                                            onChange={(e) => form.setData('task_date', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Task Type *</label>
                                        <select
                                            required
                                            value={form.data.task_type}
                                            onChange={(e) => form.setData('task_type', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold uppercase cursor-pointer focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            {taskOptions.map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Assign Designers</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-medium bg-white hover:bg-slate-50 focus:outline-none transition-all cursor-pointer min-h-[46px] ${
                                            isAssigneeDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200'
                                        }`}
                                    >
                                        <span className="truncate text-slate-700 text-sm font-medium">
                                            {form.data.assigned_user_ids.length === 0 ? 'Select Assignee(s)' : getSelectedAssigneeNames()}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isAssigneeDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                                    </button>

                                    {isAssigneeDropdownOpen && (
                                        <div className="absolute z-30 w-full mt-2 bg-white border border-slate-150 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 space-y-1">
                                            {users.map(u => {
                                                const isAssigned = form.data.assigned_user_ids.includes(u.id);
                                                return (
                                                    <div
                                                        key={u.id}
                                                        onClick={() => {
                                                            const current = form.data.assigned_user_ids;
                                                            const next = current.includes(u.id)
                                                                ? current.filter(id => id !== u.id)
                                                                : [...current, u.id];
                                                            form.setData('assigned_user_ids', next);
                                                        }}
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                                                            isAssigned ? 'bg-indigo-50/60 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isAssigned}
                                                            onChange={() => {}}
                                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                                                        />
                                                        <div className={`w-7 h-7 rounded-full text-[11px] font-bold text-white flex items-center justify-center shrink-0 ${getAvatarBgColor(u.name)}`}>
                                                            {getInitials(u.name)}
                                                        </div>
                                                        <span className="truncate">{u.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description / Notes</label>
                                    <textarea
                                        rows={8}
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Creative brief and designer guidelines..."
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[220px] leading-relaxed resize-y"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                                    <select
                                        value={form.data.status || 'Not Done'}
                                        onChange={(e) => form.setData('status', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold uppercase cursor-pointer focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="Not Done">NOT DONE</option>
                                        <option value="Done">DONE</option>
                                        <option value="In Progress">IN PROGRESS</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold uppercase hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="px-6 py-2.5 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold uppercase shadow-md transition-colors"
                                    >
                                        {form.processing ? 'Saving...' : editingItem ? 'Update Task' : 'Add Task'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
