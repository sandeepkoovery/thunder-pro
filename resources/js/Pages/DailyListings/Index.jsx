import React, { useState, useMemo, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import UserLayout from '@/Layouts/UserLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import DatePicker from '@/Components/DatePicker';
import MonthPicker from '@/Components/MonthPicker';
import html2canvas from 'html2canvas';
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
    Sparkles,
    FileImage,
    ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index({ worksheets = [], settings, users = [] }) {
    const { auth } = usePage().props;
    const isUser = auth?.user?.role !== 'admin' && auth?.user?.role !== 'superadmin';
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
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const previewCardRef = useRef(null);

    const taskTypeOptions = useMemo(() => {
        const raw = settings?.task_type_options || 'REEL, YT VIDEO, STORY, Listing, Design, Content, Maintenance, Review';
        return raw.split(',').map(s => s.trim()).filter(Boolean);
    }, [settings?.task_type_options]);

    // Format Date Header for Image Preview (e.g. Wednesday, August 5, 2026)
    const formatFullDateHeader = (dateStr) => {
        if (!dateStr) return '';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const d = new Date(year, month, day);
                return d.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            }
            return dateStr;
        } catch (e) {
            return dateStr;
        }
    };

    // Download Preview Image Handler using html2canvas
    const handleDownloadImage = async () => {
        if (!previewCardRef.current) return;
        try {
            setIsCapturing(true);

            if (document.fonts) {
                await document.fonts.ready;
            }

            const canvas = await html2canvas(previewCardRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    const badges = clonedDoc.querySelectorAll('.pill-badge');
                    badges.forEach(b => {
                        b.style.display = 'inline-flex';
                        b.style.alignItems = 'center';
                        b.style.justifyContent = 'center';
                        b.style.whiteSpace = 'nowrap';
                        b.style.wordBreak = 'keep-all';
                        b.style.paddingTop = '2px';
                        b.style.paddingBottom = '4px';
                        b.style.paddingLeft = '12px';
                        b.style.paddingRight = '12px';
                        b.style.height = '24px';
                        b.style.borderRadius = '9999px';
                        b.style.boxSizing = 'border-box';
                    });

                    const texts = clonedDoc.querySelectorAll('.pill-text');
                    texts.forEach(t => {
                        t.style.position = 'relative';
                        t.style.top = '-3px';
                        t.style.lineHeight = '1';
                        t.style.display = 'inline-block';
                        t.style.verticalAlign = 'middle';
                    });
                }
            });
            const empName = selectedEmployeeObj?.name || 'export';
            const empSlug = empName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const imageUri = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.setAttribute('href', imageUri);
            link.setAttribute('download', `daily_worklist_${empSlug}_${selectedDate || 'export'}.png`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Worklist image downloaded successfully!');
        } catch (err) {
            console.error('Failed to capture image', err);
            toast.error('Failed to download worklist image');
        } finally {
            setIsCapturing(false);
        }
    };

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

    const handleOpenCreate = () => {
        setEditingItem(null);
        form.setData({
            date: selectedDate,
            client_name: '',
            task_type: taskTypeOptions[0] || '',
            status: 'DONE',
            file_name: '',
            drive_link: '',
            project: '',
            user_id: '',
        });
        setIsCreateModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        form.setData({
            date: item.date || selectedDate,
            client_name: item.client_name || '',
            task_type: item.task_type || (taskTypeOptions[0] || ''),
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
        const selectedMonthStr = typeof selectedMonth === 'object' && selectedMonth?.target
            ? selectedMonth.target.value
            : String(selectedMonth || '');

        const selectedDateStr = typeof selectedDate === 'object' && selectedDate?.target
            ? selectedDate.target.value
            : String(selectedDate || '');

        return worksheets.filter(w => {
            if (!w.date) return false;

            if (viewMode === 'DAILY') {
                if (selectedDateStr && w.date !== selectedDateStr) {
                    return false;
                }
            } else if (viewMode === 'MONTHLY') {
                const targetMonth = selectedMonthStr || (selectedDateStr ? selectedDateStr.slice(0, 7) : todayStr.slice(0, 7));
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

    const selectedEmployeeObj = useMemo(() => {
        if (isUser) return auth?.user;
        if (!selectedEmployeeFilter) return null;
        return users.find(u => String(u.id) === String(selectedEmployeeFilter)) || null;
    }, [isUser, auth, users, selectedEmployeeFilter]);

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
            return st === 'APPROVED';
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
                        <div className="relative min-w-[170px]">
                            {viewMode === 'DAILY' ? (
                                <DatePicker
                                    value={selectedDate}
                                    onChange={(e) => {
                                        const val = e.target ? e.target.value : e;
                                        setSelectedDate(val);
                                        if (val) {
                                            setSelectedMonth(val.slice(0, 7));
                                        }
                                    }}
                                    placeholder="Select Date"
                                />
                            ) : (
                                <MonthPicker
                                    value={selectedMonth}
                                    onChange={(val) => {
                                        const monthVal = val?.target ? val.target.value : val;
                                        setSelectedMonth(monthVal);
                                    }}
                                    placeholder="Select Month"
                                />
                            )}
                        </div>

                        {/* Employee Filter (Admin Side) */}
                        {!isUser && (
                            <select
                                value={selectedEmployeeFilter}
                                onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                                className="w-full sm:w-56 border border-gray-200 pl-4 pr-10 py-2.5 rounded-2xl bg-white text-[15px] font-medium text-slate-800 focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-[size:18px] bg-no-repeat cursor-pointer"
                            >
                                <option value="">EMPLOYEE: All Users</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        )}

                        {isUser && (
                            <button
                                type="button"
                                onClick={handleOpenCreate}
                                className="px-6 py-3 bg-[#1e88e5] hover:bg-[#1565c0] text-white rounded-full font-semibold uppercase tracking-wider text-xs shadow-lg shadow-[#1e88e5]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <Plus size={16} /> ADD TASK
                            </button>
                        )}

                        {viewMode === 'DAILY' && (isUser || (selectedEmployeeFilter && selectedEmployeeFilter !== '')) && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (filteredWorksheets.length === 0) {
                                        toast.error('No tasks to preview');
                                        return;
                                    }
                                    setIsImagePreviewOpen(true);
                                }}
                                className="px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                            >
                                <FileImage size={16} /> PREVIEW IMAGE
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleExport}
                            className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Download size={16} /> CSV
                        </button>
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
                                                            <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">FILE NAME</th>
                                                            <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">LINK</th>
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
                                                                        <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase bg-gray-100 text-gray-700 leading-none text-center">
                                                                            {item.task_type || 'TASK'}
                                                                        </span>
                                                                    </td>

                                                                    {/* STATUS */}
                                                                    <td className="py-4 px-6">
                                                                        <span className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase border text-center leading-none ${
                                                                            statusUpper === 'APPROVED'
                                                                                ? 'bg-purple-50 text-purple-600 border-purple-100'
                                                                                : statusUpper === 'DONE' || statusUpper === 'COMPLETED'
                                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                                : statusUpper === 'IN PROGRESS'
                                                                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                                                : 'bg-red-50 text-red-600 border-red-100'
                                                                        }`}>
                                                                            {item.status || 'DONE'}
                                                                        </span>
                                                                    </td>

                                                                    {/* FILE NAME */}
                                                                    <td className="py-4 px-6 font-semibold text-slate-700 text-sm">{item.file_name || '-'}</td>

                                                                    {/* DRIVE LINK */}
                                                                    <td className="py-4 px-6">
                                                                        {item.drive_link ? (
                                                                            <a
                                                                                href={item.drive_link.startsWith('http') ? item.drive_link : `https://${item.drive_link}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-100/80 transition-all"
                                                                                title={item.drive_link}
                                                                            >
                                                                                <ExternalLink size={12} /> Link
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-gray-400 text-xs font-medium">—</span>
                                                                        )}
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
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">FILE NAME</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">LINK</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredWorksheets.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-24 text-center">
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
                                                            statusUpper === 'APPROVED'
                                                                ? 'bg-purple-50 text-purple-600 border-purple-100'
                                                                : statusUpper === 'DONE' || statusUpper === 'COMPLETED'
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                : statusUpper === 'IN PROGRESS'
                                                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                                : 'bg-red-50 text-red-600 border-red-100'
                                                        }`}>
                                                            {item.status || 'DONE'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 font-semibold text-slate-700 text-sm">{item.file_name || '-'}</td>
                                                    <td className="py-4 px-6">
                                                        {item.drive_link ? (
                                                            <a
                                                                href={item.drive_link.startsWith('http') ? item.drive_link : `https://${item.drive_link}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-100/80 transition-all"
                                                                title={item.drive_link}
                                                            >
                                                                <ExternalLink size={12} /> Link
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs font-medium">—</span>
                                                        )}
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

                {/* 4. CREATE / EDIT TASK MODAL (Exact match to Screenshot) */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-7 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                        {editingItem ? 'EDIT TASK' : 'LOG NEW TASK'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        Fill in the details below
                                    </p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)} 
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                {/* DATE */}
                                <div>
                                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                        DATE
                                    </label>
                                    <DatePicker
                                        value={form.data.date}
                                        onChange={(e) => form.setData('date', e.target ? e.target.value : e)}
                                        required
                                    />
                                </div>

                                {/* CLIENT NAME */}
                                {Boolean(settings?.client_name_enabled ?? true) && (
                                    <div>
                                        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                            CLIENT NAME
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={form.data.client_name}
                                            onChange={(e) => form.setData('client_name', e.target.value)}
                                            placeholder="Enter client name"
                                            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/30 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all outline-none"
                                        />
                                    </div>
                                )}

                                {/* CATEGORY / TASK TYPE */}
                                {Boolean(settings?.task_type_enabled ?? true) && (
                                    <div>
                                        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                            CATEGORY
                                        </label>
                                        {Boolean(settings?.task_type_freetext) ? (
                                            <input
                                                type="text"
                                                required
                                                value={form.data.task_type}
                                                onChange={(e) => form.setData('task_type', e.target.value)}
                                                placeholder="Enter category"
                                                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/30 text-sm font-bold text-slate-800 uppercase focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all outline-none"
                                            />
                                        ) : (
                                            <select
                                                value={form.data.task_type}
                                                onChange={(e) => form.setData('task_type', e.target.value)}
                                                required
                                                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/30 text-sm font-bold text-slate-800 uppercase focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all outline-none cursor-pointer"
                                            >
                                                <option value="" disabled>SELECT CATEGORY</option>
                                                {taskTypeOptions.map((opt, idx) => (
                                                    <option key={idx} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                {/* STATUS */}
                                {Boolean(settings?.status_enabled ?? true) && (
                                    <div>
                                        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                            STATUS
                                        </label>
                                        <select
                                            value={form.data.status}
                                            onChange={(e) => form.setData('status', e.target.value)}
                                            required
                                            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/30 text-sm font-bold text-slate-800 uppercase focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all outline-none cursor-pointer"
                                        >
                                            <option value="" disabled>SELECT STATUS</option>
                                            <option value="DONE">DONE</option>
                                            <option value="NOT DONE">NOT DONE</option>
                                            <option value="IN PROGRESS">IN PROGRESS</option>
                                            <option value="APPROVED">APPROVED</option>
                                        </select>
                                    </div>
                                )}

                                {/* FILE NAME */}
                                {Boolean(settings?.file_name_enabled ?? true) && (
                                    <div>
                                        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                            FILE NAME
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.file_name}
                                            onChange={(e) => form.setData('file_name', e.target.value)}
                                            placeholder="Enter file name"
                                            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/30 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all outline-none"
                                        />
                                    </div>
                                )}

                                {/* DRIVE LINK */}
                                {Boolean(settings?.drive_link_enabled ?? true) && (
                                    <div>
                                        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                            DRIVE LINK
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.drive_link}
                                            onChange={(e) => form.setData('drive_link', e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/30 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all outline-none"
                                        />
                                    </div>
                                )}

                                {/* PROJECT (OPTIONAL) */}
                                {Boolean(settings?.project_enabled ?? true) && (
                                    <div>
                                        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 ml-0.5">
                                            PROJECT (OPTIONAL)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.project}
                                            onChange={(e) => form.setData('project', e.target.value)}
                                            placeholder="Associated Project"
                                            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/30 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all outline-none"
                                        />
                                    </div>
                                )}

                                {/* ACTION BUTTONS: DISCARD & SAVE CHANGES */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-6 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                        DISCARD
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="px-6 py-2.5 rounded-2xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                                    >
                                        {form.processing ? 'SAVING...' : 'SAVE CHANGES'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* IMAGE PREVIEW & DOWNLOAD MODAL (Matching Screenshot Design) */}
                {isImagePreviewOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-[32px] max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] flex flex-col my-auto">
                            
                            {/* Modal Header Bar */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Worklist Image Preview</h3>
                                    <p className="text-xs text-gray-500 font-medium">Review your daily worklist image before downloading</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDownloadImage}
                                        disabled={isCapturing}
                                        className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                                    >
                                        <Download size={16} /> {isCapturing ? 'GENERATING...' : 'DOWNLOAD IMAGE'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsImagePreviewOpen(false)}
                                        className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Container for Image Preview Canvas */}
                            <div className="overflow-y-auto custom-scrollbar p-3 bg-slate-50/50 rounded-2xl">
                                
                                {/* TARGET CARD TO CAPTURE WITH html2canvas */}
                                <div
                                    ref={previewCardRef}
                                    className="bg-white p-8 sm:p-12 rounded-[28px] border border-gray-100 shadow-sm space-y-8 max-w-4xl mx-auto font-sans"
                                    style={{ backgroundColor: '#ffffff' }}
                                >
                                    {/* Header Title & Date */}
                                    <div className="text-center space-y-1.5">
                                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                                            {selectedEmployeeObj ? `${selectedEmployeeObj.name} - DAILY WORKLIST` : 'DAILY WORKLIST'}
                                        </h1>
                                        <p className="text-base font-bold text-blue-600">
                                            {formatFullDateHeader(selectedDate)}
                                        </p>
                                    </div>

                                    {/* 4 Summary Stat Cards Row */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {/* TOTAL TASKS */}
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                <ListFilter size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">TOTAL TASKS</span>
                                                <span className="text-xl font-black text-slate-900 leading-none mt-0.5 block">{stats.total}</span>
                                            </div>
                                        </div>

                                        {/* COMPLETED */}
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">COMPLETED</span>
                                                <span className="text-xl font-black text-slate-900 leading-none mt-0.5 block">{stats.completed}</span>
                                            </div>
                                        </div>

                                        {/* IN PROGRESS */}
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">IN PROGRESS</span>
                                                <span className="text-xl font-black text-slate-900 leading-none mt-0.5 block">{stats.inProgress}</span>
                                            </div>
                                        </div>

                                        {/* APPROVED */}
                                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 shrink-0">
                                                <CheckSquare size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">APPROVED</span>
                                                <span className="text-xl font-black text-slate-900 leading-none mt-0.5 block">{stats.approved}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Table */}
                                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                                                    <th className="py-4 px-6">CLIENT</th>
                                                    <th className="py-4 px-6">TASK TYPE</th>
                                                    <th className="py-4 px-6">STATUS</th>
                                                    <th className="py-4 px-6">FILE NAME</th>
                                                    <th className="py-4 px-6">LINK</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 text-sm">
                                                {filteredWorksheets.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="py-8 text-center text-gray-400 font-bold uppercase text-xs">
                                                            No daily tasks logged for this date
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredWorksheets.map((row, idx) => {
                                                        const isDone = (row.status || '').toUpperCase() === 'DONE' || (row.status || '').toUpperCase() === 'COMPLETED';
                                                        const isInProgress = (row.status || '').toUpperCase() === 'IN PROGRESS';
                                                        return (
                                                            <tr key={row.id || idx} className="hover:bg-gray-50/50">
                                                                <td className="py-4 px-6 font-black text-slate-900 uppercase">
                                                                    {row.client_name || '-'}
                                                                </td>
                                                                <td className="py-4 px-6">
                                                                    <span
                                                                        className="pill-badge whitespace-nowrap inline-flex items-center justify-center rounded-full text-[10px] font-extrabold uppercase bg-gray-100 text-gray-700 text-center"
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            whiteSpace: 'nowrap',
                                                                            borderRadius: '9999px',
                                                                            padding: '3px 12px',
                                                                            height: '24px',
                                                                        }}
                                                                    >
                                                                        <span className="pill-text relative -top-[1px] inline-block leading-none">
                                                                            {row.task_type || 'TASK'}
                                                                        </span>
                                                                    </span>
                                                                </td>
                                                                <td className="py-4 px-6">
                                                                    <span
                                                                        className={`pill-badge whitespace-nowrap inline-flex items-center justify-center rounded-full text-[10px] font-extrabold uppercase text-center ${
                                                                            isDone 
                                                                                ? 'bg-emerald-50 text-emerald-600' 
                                                                                : isInProgress 
                                                                                    ? 'bg-blue-50 text-blue-600' 
                                                                                    : 'bg-red-50 text-red-600'
                                                                        }`}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            whiteSpace: 'nowrap',
                                                                            borderRadius: '9999px',
                                                                            padding: '3px 12px',
                                                                            height: '24px',
                                                                        }}
                                                                    >
                                                                        <span className="pill-text relative -top-[1px] inline-block leading-none">
                                                                            {row.status || 'PENDING'}
                                                                        </span>
                                                                    </span>
                                                                </td>
                                                                <td className="py-4 px-6 font-bold text-slate-700 text-xs uppercase">
                                                                    {row.file_name || '-'}
                                                                </td>
                                                                <td className="py-4 px-6 text-xs text-blue-600 font-semibold truncate max-w-[150px]">
                                                                    {row.drive_link ? 'Link Available' : '-'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>

                            {/* Modal Bottom Footer Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2 shrink-0 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsImagePreviewOpen(false)}
                                    className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadImage}
                                    disabled={isCapturing}
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    <Download size={16} /> {isCapturing ? 'Generating Image...' : 'Download Image'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
