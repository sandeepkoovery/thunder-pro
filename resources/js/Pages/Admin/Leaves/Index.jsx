import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import DatePicker from "@/Components/DatePicker";
import { Check, X, Calendar, User, FileText, Eye, Trash2, Pencil, Clock, Settings, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

const TABS = [
    { key: '',         label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
];

export default function Index({ leaves, users, filters, stats, tab_counts, leave_quotas = { CL: 12, SL: 12 } }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth?.user?.role === 'super_admin';
    const { data, links, current_page } = leaves;

    const [year,   setYear]   = React.useState(filters.year    || new Date().getFullYear());
    const [month,  setMonth]  = React.useState(filters.month   || '');
    const [userId, setUserId] = React.useState(filters.user_id || '');
    const [status, setStatus] = React.useState(filters.status  || '');

    const [selectedLeave, setSelectedLeave] = React.useState(null);
    const [deleteId,      setDeleteId]      = React.useState(null);
    const [editingLeave,  setEditingLeave]  = React.useState(null);
    const [editForm, setEditForm] = React.useState({
        leave_type: '', day_type: '', from_date: '', to_date: '', reason: '', status: ''
    });

    const [quotaModalOpen, setQuotaModalOpen] = React.useState(false);
    const [quotaForm, setQuotaForm] = React.useState({
        casual_leaves: leave_quotas?.CL ?? 12,
        sick_leaves:   leave_quotas?.SL ?? 12,
    });
    const [savingQuotas, setSavingQuotas] = React.useState(false);

    React.useEffect(() => {
        setQuotaForm({
            casual_leaves: leave_quotas?.CL ?? 12,
            sick_leaves:   leave_quotas?.SL ?? 12,
        });
    }, [leave_quotas]);

    const navigate = (newFilters) => {
        router.get(route('admin.leaves.index'), newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilterChange = (key, value) => {
        const next = {
            year:    key === 'year'    ? value : year,
            month:   key === 'month'   ? value : month,
            user_id: key === 'user_id' ? value : userId,
            status:  key === 'status'  ? value : status,
        };
        if (key === 'year')    setYear(value);
        if (key === 'month')   setMonth(value);
        if (key === 'user_id') setUserId(value);
        if (key === 'status')  setStatus(value);
        navigate(next);
    };

    const handleAction = (id, action) => {
        router.post(route(`admin.leaves.${action}`, id), {}, {
            onSuccess: () => toast.success(`Leave ${action}d successfully`),
            onError:   () => toast.error("Something went wrong"),
        });
    };

    const confirmDelete = () => {
        router.delete(route('admin.leaves.delete', deleteId), {
            onSuccess: () => { toast.success("Leave record deleted successfully"); setDeleteId(null); },
            onError:   () => toast.error("Failed to delete leave record"),
        });
    };

    const handleEdit = (leave) => {
        setEditingLeave(leave);
        setEditForm({
            leave_type: leave.leave_type,
            day_type:   leave.day_type,
            from_date:  leave.from_date.split('T')[0],
            to_date:    leave.to_date.split('T')[0],
            reason:     leave.reason || '',
            status:     leave.status
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        router.put(route('admin.leaves.update', editingLeave.id), editForm, {
            onSuccess: () => { toast.success("Leave record updated successfully"); setEditingLeave(null); },
            onError:   () => toast.error("Failed to update leave record"),
        });
    };

    const handleSaveQuotas = (e) => {
        e.preventDefault();
        setSavingQuotas(true);
        router.post(route('admin.leaves.update-quotas'), quotaForm, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Company leave quotas updated successfully!");
                setQuotaModalOpen(false);
                setSavingQuotas(false);
            },
            onError: () => {
                toast.error("Failed to update company leave quotas");
                setSavingQuotas(false);
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
        });
    };

    const getStatusBadge = (s) => {
        const status = s?.toLowerCase();
        if (status === "approved") return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">Approved</span>;
        if (status === "rejected") return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-medium">Rejected</span>;
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-sm font-medium">Pending</span>;
    };

    const years  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        { value: '',   label: 'All Months'  },
        { value: '1',  label: 'January'     }, { value: '2',  label: 'February'  },
        { value: '3',  label: 'March'       }, { value: '4',  label: 'April'     },
        { value: '5',  label: 'May'         }, { value: '6',  label: 'June'      },
        { value: '7',  label: 'July'        }, { value: '8',  label: 'August'    },
        { value: '9',  label: 'September'   }, { value: '10', label: 'October'   },
        { value: '11', label: 'November'    }, { value: '12', label: 'December'  },
    ];

    const tabBadgeColor = (key) => {
        if (key === 'pending')  return 'bg-yellow-100 text-yellow-700';
        if (key === 'approved') return 'bg-green-100 text-green-700';
        if (key === 'rejected') return 'bg-red-100 text-red-700';
        return 'bg-gray-100 text-gray-600';
    };

    return (
        <AdminLayout>
            <Head title="Leave Requests" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Leave Requests</h1>
                    {!isSuperAdmin && (
                        <p className="text-xs text-gray-400 mt-1">
                            Company Quota: <span className="font-semibold text-gray-700">{leave_quotas?.CL ?? 12} Casual</span> & <span className="font-semibold text-gray-700">{leave_quotas?.SL ?? 12} Sick</span> leaves / year per employee
                        </p>
                    )}
                </div>
                <div className="mp-filter-bar flex flex-wrap items-center gap-2">
                    {!isSuperAdmin && (
                        <button
                            type="button"
                            onClick={() => setQuotaModalOpen(true)}
                            className="px-3.5 py-2.5 bg-white border border-blue-200 hover:border-blue-500 text-blue-700 hover:bg-blue-50/50 rounded-lg shadow-xs font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                            style={{ minHeight: '44px' }}
                            title="Configure company casual & sick leave quotas"
                        >
                            <Settings size={15} className="text-blue-600" />
                            <span>Leave Policy</span>
                        </button>
                    )}
                    <select
                        value={userId}
                        onChange={(e) => handleFilterChange('user_id', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 rounded-lg shadow-sm text-sm flex-1"
                        style={{ minHeight: '44px' }}
                    >
                        <option value="">All Employees</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => handleFilterChange('year', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 rounded-lg shadow-sm text-sm flex-1"
                        style={{ minHeight: '44px' }}
                    >
                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select
                        value={month}
                        onChange={(e) => handleFilterChange('month', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 rounded-lg shadow-sm text-sm flex-1"
                        style={{ minHeight: '44px' }}
                    >
                        {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sick Leave (SL)</p>
                            {!isSuperAdmin && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded">Quota: {leave_quotas?.SL ?? 12}</span>}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{parseFloat(stats?.SL?.taken || 0)}</span>
                            {stats?.SL?.total  && <span className="text-gray-400 font-bold">/ {stats.SL.total} Days Taken</span>}
                            {!stats?.SL?.total && <span className="text-gray-400 font-bold">Days Taken</span>}
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500"><Calendar size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Casual Leave (CL)</p>
                            {!isSuperAdmin && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">Quota: {leave_quotas?.CL ?? 12}</span>}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{parseFloat(stats?.CL?.taken || 0)}</span>
                            {stats?.CL?.total  && <span className="text-gray-400 font-bold">/ {stats.CL.total} Days Taken</span>}
                            {!stats?.CL?.total && <span className="text-gray-400 font-bold">Days Taken</span>}
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500"><Calendar size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Requests</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{stats?.pending || 0}</span>
                            <span className="text-gray-400 font-bold">Requests</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-500"><FileText size={24} /></div>
                </div>
            </div>

            {/* Status tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-0 overflow-hidden">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {TABS.map((tab) => {
                        const isActive = status === tab.key;
                        const count = tab.key === '' ? tab_counts?.all : tab_counts?.[tab.key];
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleFilterChange('status', tab.key)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                                    isActive
                                        ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                {tab.label}
                                {count !== undefined && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : tabBadgeColor(tab.key)}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-400 text-[13px] font-bold uppercase tracking-widest border-b border-gray-100">
                                <th className="px-6 py-4 text-left">Employee</th>
                                <th className="px-6 py-4 text-left">Type</th>
                                <th className="px-6 py-4 text-left">Dates</th>
                                <th className="px-6 py-4 text-left">Days</th>
                                <th className="px-6 py-4 text-left">Applied On</th>
                                <th className="px-6 py-4 text-center">Reason</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12 text-gray-400 italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={32} className="opacity-30" />
                                            <span>No leave requests found.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((leave) => (
                                    <tr key={leave.id} className="border-t border-gray-50 text-gray-700 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {leave.user?.name?.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-800 text-[15px]">{leave.user?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-gray-700 font-medium">
                                            {leave.leave_type === 'SL' || leave.leave_type === 'CL'
                                                ? leave.leave_type
                                                : leave.leave_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[15px] text-gray-700 font-medium">
                                            {formatDate(leave.from_date)} – {formatDate(leave.to_date)}
                                            <br />
                                            <span className="text-[10px] text-blue-600 uppercase font-bold">{leave.day_type.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-blue-600 text-[15px]">
                                            {leave.day_type === 'full'
                                                ? `${parseFloat(leave.no_of_days)} ${parseFloat(leave.no_of_days) > 1 ? 'Days' : 'Day'}`
                                                : leave.day_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-gray-500 text-[13px]">
                                                <Clock size={13} className="text-gray-400" />
                                                {formatDateTime(leave.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {leave.reason
                                                ? <button onClick={() => setSelectedLeave(leave)} className="text-gray-500 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 inline-flex" title="View Reason"><Eye size={18} /></button>
                                                : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(leave.status)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-1.5">
                                                {leave.status === 'pending' && <>
                                                    <button onClick={() => handleAction(leave.id, 'approve')} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Approve"><Check size={16} /></button>
                                                    <button onClick={() => handleAction(leave.id, 'reject')}  className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"     title="Reject"><X size={16} /></button>
                                                </>}
                                                <button onClick={() => handleEdit(leave)}         className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"       title="Edit"><Pencil size={16} /></button>
                                                <button onClick={() => setDeleteId(leave.id)}     className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-gray-50">
                    {data.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm italic">No leave requests found.</div>
                    ) : (
                        data.map((leave) => (
                            <div key={leave.id} className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">{leave.user?.name?.charAt(0)}</div>
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">{leave.user?.name}</div>
                                            <div className="text-xs text-gray-400">{leave.leave_type === 'SL' ? 'Sick Leave' : leave.leave_type === 'CL' ? 'Casual Leave' : leave.leave_type}</div>
                                        </div>
                                    </div>
                                    {getStatusBadge(leave.status)}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 bg-gray-50 rounded-lg px-3 py-2">
                                    <Calendar size={13} className="text-blue-400" />
                                    <span>{formatDate(leave.from_date)} – {formatDate(leave.to_date)}</span>
                                    <span className="ml-auto font-semibold text-blue-600">{leave.day_type === 'full' ? `${parseFloat(leave.no_of_days)}d` : leave.day_type.replace('_', ' ')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 px-1">
                                    <Clock size={12} />
                                    <span>Applied: {formatDateTime(leave.created_at)}</span>
                                </div>
                                <div className="flex gap-2">
                                    {leave.status === 'pending' && <>
                                        <button onClick={() => handleAction(leave.id, 'approve')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 transition" style={{ minHeight: '44px' }}><Check size={15} />Approve</button>
                                        <button onClick={() => handleAction(leave.id, 'reject')}  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold hover:bg-red-100 transition"   style={{ minHeight: '44px' }}><X size={15} />Reject</button>
                                    </>}
                                    {leave.reason && <button onClick={() => setSelectedLeave(leave)} className="p-2.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200" style={{ minHeight: '44px' }} title="View Reason"><Eye size={16} /></button>}
                                    <button onClick={() => handleEdit(leave)}     className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"  style={{ minHeight: '44px' }} title="Edit"><Pencil size={16} /></button>
                                    <button onClick={() => setDeleteId(leave.id)} className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600" style={{ minHeight: '44px' }} title="Delete"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pagination */}
            {links.length > 3 && (
                <div className="flex justify-center mt-6 gap-2">
                    {links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || "#"}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                link.active ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                            } ${!link.url && "opacity-50 cursor-not-allowed"}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}

            {/* Leave Details Modal */}
            {selectedLeave && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Leave Details</h3>
                            <button onClick={() => setSelectedLeave(null)} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 pb-4 border-b">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">{selectedLeave.user?.name.charAt(0)}</div>
                                <div>
                                    <h4 className="font-bold text-lg text-gray-800">{selectedLeave.user?.name}</h4>
                                    <p className="text-sm text-gray-500">Employee</p>
                                </div>
                                <div className="ml-auto">{getStatusBadge(selectedLeave.status)}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Leave Type</p>
                                    <p className="font-semibold text-gray-700">{selectedLeave.leave_type === 'SL' || selectedLeave.leave_type === 'CL' ? selectedLeave.leave_type : selectedLeave.leave_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Day Type</p>
                                    <p className="font-semibold text-gray-700 capitalize">{selectedLeave.day_type.replace('_', ' ')}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">From</p>
                                    <p className="font-semibold text-gray-700">{formatDate(selectedLeave.from_date)}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">To</p>
                                    <p className="font-semibold text-gray-700">{formatDate(selectedLeave.to_date)}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Applied On</p>
                                    <p className="font-semibold text-gray-700">{formatDateTime(selectedLeave.created_at)}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reason</p>
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{selectedLeave.reason || "No reason provided."}</p>
                            </div>

                            {selectedLeave.user?.leave_stats && (
                                <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-xl space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-gray-700">Annual Quota Utilization ({year || new Date().getFullYear()}):</span>
                                        <span className="text-[11px] font-semibold text-blue-600">Company Policy</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                        <div className="bg-white p-2 rounded-lg border border-blue-100 flex justify-between">
                                            <span className="text-gray-500 font-medium">Sick Leave (SL):</span>
                                            <span className="font-bold text-gray-800">{selectedLeave.user.leave_stats.SL_taken || 0} / {selectedLeave.user.leave_stats.SL_total ?? leave_quotas?.SL ?? 12} days</span>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg border border-blue-100 flex justify-between">
                                            <span className="text-gray-500 font-medium">Casual Leave (CL):</span>
                                            <span className="font-bold text-gray-800">{selectedLeave.user.leave_stats.CL_taken || 0} / {selectedLeave.user.leave_stats.CL_total ?? leave_quotas?.CL ?? 12} days</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button onClick={() => setSelectedLeave(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Company Leave Policy / Quotas Modal */}
            {quotaModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                    <Settings size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800">Company Leave Policy</h3>
                                    <p className="text-[11px] text-gray-500">Configure annual leave quotas per employee</p>
                                </div>
                            </div>
                            <button onClick={() => setQuotaModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuotas} className="p-6 space-y-4">
                            <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl text-blue-900 text-xs leading-relaxed">
                                💡 Configure how many Casual Leaves and Sick Leaves are allocated annually to each employee in this company.
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Annual Casual Leaves (CL)</label>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">Days / Year</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={quotaForm.casual_leaves}
                                    onChange={(e) => setQuotaForm(prev => ({ ...prev, casual_leaves: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-800 text-sm"
                                    required
                                />
                                <p className="text-[11px] text-gray-400">Default company allowance: 12 days</p>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Annual Sick Leaves (SL)</label>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full">Days / Year</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={quotaForm.sick_leaves}
                                    onChange={(e) => setQuotaForm(prev => ({ ...prev, sick_leaves: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-800 text-sm"
                                    required
                                />
                                <p className="text-[11px] text-gray-400">Default company allowance: 12 days</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setQuotaModalOpen(false)}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingQuotas}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {savingQuotas ? "Saving..." : "Save Policy"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Are you sure?</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">Do you really want to delete this leave record? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">No, Keep it</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-md shadow-red-200">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Leave Modal */}
            {editingLeave && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Edit Leave Record</h3>
                            <button onClick={() => setEditingLeave(null)} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Leave Type</label>
                                    <select value={editForm.leave_type} onChange={(e) => setEditForm({ ...editForm, leave_type: e.target.value })} className="w-full border-gray-300 rounded-lg text-sm" required>
                                        <option value="SL">Sick Leave (SL)</option>
                                        <option value="CL">Casual Leave (CL)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Duration Type</label>
                                    <select value={editForm.day_type} onChange={(e) => setEditForm({ ...editForm, day_type: e.target.value })} className="w-full border-gray-300 rounded-lg text-sm" required>
                                        <option value="full">Full Day</option>
                                        <option value="first_half">First Half</option>
                                        <option value="second_half">Second Half</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">From Date</label>
                                    <DatePicker value={editForm.from_date} onChange={(e) => setEditForm(prev => ({ ...prev, from_date: e.target ? e.target.value : e }))} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">To Date</label>
                                    <DatePicker value={editForm.to_date} onChange={(e) => setEditForm(prev => ({ ...prev, to_date: e.target ? e.target.value : e }))} required={editForm.day_type === 'full'} disabled={editForm.day_type !== 'full'} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full border-gray-300 rounded-lg text-sm" required>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Reason</label>
                                <textarea value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} className="w-full border-gray-300 rounded-lg text-sm" rows="3" required></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setEditingLeave(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md shadow-blue-200">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
