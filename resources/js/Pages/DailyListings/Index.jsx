import React, { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import UserLayout from '@/Layouts/UserLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { 
    Calendar as CalendarIcon, 
    Plus, 
    Trash2, 
    Edit2, 
    X,
    CheckCircle2,
    Clock,
    XCircle,
    ListFilter,
    ChevronDown,
    ChevronUp,
    Download,
    CheckSquare,
    Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index({ worksheets = [], settings, users = [] }) {
    const { auth } = usePage().props;
    const isUser = auth?.user?.role === 'user';
    const Layout = isUser ? UserLayout : AdminLayout;

    // View Mode & Filters
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const [viewMode, setViewMode] = useState('DAILY'); // 'DAILY' | 'MONTHLY'
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(todayStr.slice(0, 7));
    const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('');

    // Collapsible Accordion State for Admin (track which employee accordions are open)
    const [openAccordions, setOpenAccordions] = useState({});

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form
    const form = useForm({
        date: selectedDate,
        client_name: '',
        task_type: 'POSTER',
        status: 'DONE',
        file_name: '',
        drive_link: '',
        project: '',
        user_id: '',
    });

    const toggleAccordion = (userId) => {
        setOpenAccordions(prev => ({
            ...prev,
            [userId]: prev[userId] === undefined ? false : !prev[userId]
        }));
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            form.put(route('daily-listings.update', editingItem.id), {
                onSuccess: () => {
                    toast.success('Worksheet task updated');
                    setIsCreateModalOpen(false);
                    setEditingItem(null);
                    form.reset();
                },
                onError: () => toast.error('Failed to update task'),
            });
        } else {
            form.post(route('daily-listings.store'), {
                onSuccess: () => {
                    toast.success('Daily task added successfully');
                    setIsCreateModalOpen(false);
                    form.reset();
                },
                onError: () => toast.error('Failed to add task'),
            });
        }
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        form.setData({
            date: item.date || selectedDate,
            client_name: item.client_name || '',
            task_type: item.task_type || 'POSTER',
            status: item.status || 'DONE',
            file_name: item.file_name || '',
            drive_link: item.drive_link || '',
            project: item.project || '',
            user_id: item.user_id || '',
        });
        setIsCreateModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this worksheet task?')) {
            router.delete(route('daily-listings.destroy', id), {
                onSuccess: () => toast.success('Task deleted'),
                onError: () => toast.error('Failed to delete task'),
            });
        }
    };

    // Filtered Worksheets
    const filteredWorksheets = useMemo(() => {
        return worksheets.filter(w => {
            if (!w.date) return false;

            if (viewMode === 'DAILY') {
                if (selectedDate && w.date !== selectedDate) {
                    return false;
                }
            } else if (viewMode === 'MONTHLY') {
                const targetMonth = selectedMonth || (selectedDate ? selectedDate.slice(0, 7) : todayStr.slice(0, 7));
                if (!w.date.startsWith(targetMonth)) {
                    return false;
                }
            }

            if (selectedEmployeeFilter && String(w.user_id) !== String(selectedEmployeeFilter)) {
                return false;
            }
            return true;
        });
    }, [worksheets, viewMode, selectedDate, selectedMonth, selectedEmployeeFilter, todayStr]);

    // KPI Counts
    const stats = useMemo(() => {
        const total = filteredWorksheets.length;
        const completed = filteredWorksheets.filter(w => {
            const st = (w.status || '').toUpperCase();
            return st === 'DONE' || st === 'COMPLETED';
        }).length;
        const inProgress = filteredWorksheets.filter(w => (w.status || '').toUpperCase() === 'IN PROGRESS').length;
        const pendingNotDone = filteredWorksheets.filter(w => {
            const st = (w.status || '').toUpperCase();
            return st === 'NOT DONE' || st === 'PENDING';
        }).length;
        const approved = filteredWorksheets.filter(w => {
            const st = (w.status || '').toUpperCase();
            return st === 'APPROVED' || st === 'DONE';
        }).length;

        return { total, completed, inProgress, pendingNotDone, approved };
    }, [filteredWorksheets]);

    // Group Worksheets by Employee for Admin View
    const groupedByEmployee = useMemo(() => {
        const groups = {};
        filteredWorksheets.forEach(w => {
            const uid = w.user_id || 'unassigned';
            const uname = w.user?.name || 'Unassigned';
            if (!groups[uid]) {
                groups[uid] = {
                    userId: uid,
                    userName: uname,
                    items: []
                };
            }
            groups[uid].items.push(w);
        });
        return Object.values(groups);
    }, [filteredWorksheets]);

    // Format Date helper (e.g. Jul 30 / THU)
    const formatDate = (dateStr) => {
        if (!dateStr) return { main: '-', sub: '' };
        try {
            const d = new Date(dateStr);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            return {
                main: `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`,
                sub: days[d.getDay()],
                full: `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
            };
        } catch (e) {
            return { main: dateStr, sub: '', full: dateStr };
        }
    };

    // Helper for Avatar Initials
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].slice(0, 2).toUpperCase();
    };

    // Export CSV
    const handleExport = () => {
        if (filteredWorksheets.length === 0) {
            toast.error('No tasks to export');
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,Date,Employee,Client,Task Type,Status,Project\n";
        filteredWorksheets.forEach(row => {
            csvContent += `"${row.date}","${row.user?.name || ''}","${row.client_name || ''}","${row.task_type || ''}","${row.status || ''}","${row.project || ''}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `daily_worksheet_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Worksheet exported to CSV');
    };

    return (
        <Layout title={isUser ? "Daily Worksheet" : "Daily Worksheet Overview"}>
            <Head title={isUser ? "Daily Worksheet" : "Daily Worksheet Overview"} />

            <div className="w-full space-y-6 font-sans pb-12 bg-slate-50/50 min-h-screen p-3 sm:p-6">

                {/* 1. HEADER CONTROL CARD (Exact match to Screenshots) */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                            {isUser ? "Daily Worksheet" : "Daily Worksheet Overview"}
                        </h1>
                        <p className="text-gray-500 font-medium text-xs sm:text-sm mt-0.5">
                            {isUser ? "Track your daily activities" : "View daily activities logged by all employees"}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
                        
                        {/* DAILY / MONTHLY Toggle */}
                        <div className="bg-gray-100 p-1 rounded-2xl flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('DAILY')}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                                    viewMode === 'DAILY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                DAILY
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('MONTHLY')}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                                    viewMode === 'MONTHLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                MONTHLY
                            </button>
                        </div>

                        {/* Date / Month Picker */}
                        <div className="relative">
                            {viewMode === 'DAILY' ? (
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        if (e.target.value) {
                                            setSelectedMonth(e.target.value.slice(0, 7));
                                        }
                                    }}
                                    className="pl-4 pr-3 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                            ) : (
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="pl-4 pr-3 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                            )}
                        </div>

                        {/* Employee Filter (Admin Side) */}
                        {!isUser && (
                            <div className="relative">
                                <select
                                    value={selectedEmployeeFilter}
                                    onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                                    className="pl-4 pr-8 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                >
                                    <option value="">EMPLOYEE: All Users</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        )}

                        {/* + ADD TASK & EXPORT Buttons (User Side) */}
                        {isUser && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingItem(null);
                                        form.reset();
                                        form.setData('date', selectedDate);
                                        setIsCreateModalOpen(true);
                                    }}
                                    className="px-5 py-2.5 rounded-2xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                                >
                                    <Plus size={16} /> ADD TASK
                                </button>

                                <button
                                    type="button"
                                    onClick={handleExport}
                                    className="px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <Download size={16} /> EXPORT
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 2. 4 KPI STATISTICS CARDS ROW (Exact match to Screenshots) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* TOTAL TASKS */}
                    <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                            <ListFilter size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">TOTAL TASKS</span>
                            <span className="text-2xl font-black text-gray-900 leading-none mt-1 block">{stats.total}</span>
                        </div>
                    </div>

                    {/* COMPLETED */}
                    <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 flex-shrink-0">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">COMPLETED</span>
                            <span className="text-2xl font-black text-gray-900 leading-none mt-1 block">{stats.completed}</span>
                        </div>
                    </div>

                    {/* IN PROGRESS */}
                    <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                            <Clock size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">IN PROGRESS</span>
                            <span className="text-2xl font-black text-gray-900 leading-none mt-1 block">{stats.inProgress}</span>
                        </div>
                    </div>

                    {/* PENDING / NOT DONE (Admin) vs APPROVED (User) */}
                    {!isUser ? (
                        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0">
                                <XCircle size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">PENDING / NOT DONE</span>
                                <span className="text-2xl font-black text-gray-900 leading-none mt-1 block">{stats.pendingNotDone}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 flex-shrink-0">
                                <CheckSquare size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">APPROVED</span>
                                <span className="text-2xl font-black text-gray-900 leading-none mt-1 block">{stats.approved}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. MAIN SECTION: ADMIN EMPLOYEE ACCORDIONS vs USER TABLE */}

                {!isUser ? (
                    /* ADMIN VIEW: EMPLOYEE GROUP ACCORDIONS */
                    <div className="space-y-4">
                        {groupedByEmployee.length === 0 ? (
                            <div className="bg-white rounded-[28px] p-16 border border-gray-100 text-center shadow-sm">
                                <CalendarIcon size={48} className="mx-auto text-gray-300 mb-2" />
                                <h4 className="font-bold text-gray-900 text-base">No tasks found for this date</h4>
                                <p className="text-xs text-gray-400 mt-1">Select a different date or employee filter above.</p>
                            </div>
                        ) : (
                            groupedByEmployee.map((group) => {
                                const isOpen = openAccordions[group.userId] !== false; // Default open
                                return (
                                    <div key={group.userId} className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden transition-all">
                                        
                                        {/* Employee Accordion Header */}
                                        <div
                                            onClick={() => toggleAccordion(group.userId)}
                                            className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors border-b border-gray-100"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/20">
                                                    {getInitials(group.userName)}
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-extrabold text-gray-900 leading-none">{group.userName}</h3>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1 block">
                                                        {group.items.length} {group.items.length === 1 ? 'TASK LOGGED' : 'TASKS LOGGED'}
                                                    </span>
                                                </div>
                                            </div>

                                            <button type="button" className="text-gray-400 hover:text-gray-600 p-1">
                                                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </div>

                                        {/* Accordion Table Body */}
                                        {isOpen && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse min-w-[900px]">
                                                    <thead>
                                                        <tr className="border-b border-gray-100 bg-slate-50/40">
                                                            <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">DATE</th>
                                                            <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">CLIENT</th>
                                                            <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">TASK TYPE</th>
                                                            <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">STATUS</th>
                                                            <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">PROJECT</th>
                                                            <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">ADDED ON</th>
                                                            <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400 text-right">ACTION</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {group.items.map((item) => {
                                                            const dateFmt = formatDate(item.date);
                                                            const statusUpper = (item.status || 'DONE').toUpperCase();

                                                            return (
                                                                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                                    {/* DATE */}
                                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                                        <div className="font-extrabold text-gray-900 text-sm">{dateFmt.main}</div>
                                                                        <div className="text-[10px] font-extrabold text-gray-400 tracking-wider">{dateFmt.sub}</div>
                                                                    </td>

                                                                    {/* CLIENT */}
                                                                    <td className="py-4 px-6 font-bold text-gray-900 text-sm max-w-xs">{item.client_name || '-'}</td>

                                                                    {/* TASK TYPE */}
                                                                    <td className="py-4 px-6">
                                                                        <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-gray-100 text-gray-700">
                                                                            {item.task_type || 'TASK'}
                                                                        </span>
                                                                    </td>

                                                                    {/* STATUS */}
                                                                    <td className="py-4 px-6">
                                                                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border text-center ${
                                                                            statusUpper === 'DONE' || statusUpper === 'COMPLETED'
                                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                                : 'bg-red-50 text-red-600 border-red-100'
                                                                        }`}>
                                                                            {item.status || 'DONE'}
                                                                        </span>
                                                                    </td>

                                                                    {/* PROJECT */}
                                                                    <td className="py-4 px-6 font-semibold text-gray-600 text-sm">{item.project || '-'}</td>

                                                                    {/* ADDED ON */}
                                                                    <td className="py-4 px-6 text-gray-500 font-semibold text-xs whitespace-nowrap">{dateFmt.full}</td>

                                                                    {/* ACTION */}
                                                                    <td className="py-4 px-6 text-right whitespace-nowrap">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <button
                                                                                onClick={() => handleOpenEdit(item)}
                                                                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                                                title="Edit Task"
                                                                            >
                                                                                <Edit2 size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDelete(item.id)}
                                                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                                                title="Delete Task"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* USER VIEW: SINGLE TABLE & EXACT EMPTY STATE FROM SCREENSHOT 2 */
                    <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-white">
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">DATE</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">CLIENT</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">TASK TYPE</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">STATUS</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredWorksheets.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                                                        <CalendarIcon className="text-gray-300" size={32} />
                                                    </div>
                                                    <h4 className="font-bold text-gray-400 text-sm">No tasks found</h4>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredWorksheets.map((item) => {
                                            const dateFmt = formatDate(item.date);
                                            const statusUpper = (item.status || 'DONE').toUpperCase();

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <div className="font-extrabold text-gray-900 text-sm">{dateFmt.main}</div>
                                                        <div className="text-[10px] font-extrabold text-gray-400 tracking-wider">{dateFmt.sub}</div>
                                                    </td>
                                                    <td className="py-4 px-6 font-bold text-gray-900 text-sm">{item.client_name || '-'}</td>
                                                    <td className="py-4 px-6">
                                                        <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-gray-100 text-gray-700">
                                                            {item.task_type || 'TASK'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border text-center ${
                                                            statusUpper === 'DONE' || statusUpper === 'COMPLETED'
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                : 'bg-red-50 text-red-600 border-red-100'
                                                        }`}>
                                                            {item.status || 'DONE'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleOpenEdit(item)}
                                                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit Task"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Task"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
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
                )}

                {/* 4. CREATE / EDIT TASK MODAL */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editingItem ? 'Edit Task Entry' : 'Log Daily Task'}
                                </h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.data.date}
                                        onChange={(e) => form.setData('date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Client Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.data.client_name}
                                        onChange={(e) => form.setData('client_name', e.target.value)}
                                        placeholder="KALPAKA - Herbal Body Pack"
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Task Type *</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.data.task_type}
                                            onChange={(e) => form.setData('task_type', e.target.value)}
                                            placeholder="POSTER / STORY"
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                                        <select
                                            value={form.data.status}
                                            onChange={(e) => form.setData('status', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                                        >
                                            <option value="DONE">DONE</option>
                                            <option value="NOT DONE">NOT DONE</option>
                                            <option value="IN PROGRESS">IN PROGRESS</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Project (Optional)</label>
                                    <input
                                        type="text"
                                        value={form.data.project}
                                        onChange={(e) => form.setData('project', e.target.value)}
                                        placeholder="Associated Project"
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold uppercase"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="px-5 py-2 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold uppercase shadow-md"
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
