import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Check, X, Calendar, User, FileText, Eye, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";

export default function Index({ leaves, users, filters, stats }) {
    const { data, links, current_page } = leaves;

    const [year, setYear] = React.useState(filters.year || new Date().getFullYear());
    const [month, setMonth] = React.useState(filters.month || '');
    const [userId, setUserId] = React.useState(filters.user_id || '');
    const [selectedLeave, setSelectedLeave] = React.useState(null);
    const [deleteId, setDeleteId] = React.useState(null);
    const [editingLeave, setEditingLeave] = React.useState(null);
    const [editForm, setEditForm] = React.useState({
        leave_type: '',
        day_type: '',
        from_date: '',
        to_date: '',
        reason: '',
        status: ''
    });

    const handleFilterChange = (key, value) => {
        const newFilters = {
            year: key === 'year' ? value : year,
            month: key === 'month' ? value : month,
            user_id: key === 'user_id' ? value : userId,
        };

        if (key === 'year') setYear(value);
        if (key === 'month') setMonth(value);
        if (key === 'user_id') setUserId(value);

        router.get(route('admin.leaves.index'), newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const handleAction = (id, action) => {
        router.post(route(`admin.leaves.${action}`, id), {}, {
            onSuccess: () => toast.success(`Leave ${action}d successfully`),
            onError: () => toast.error("Something went wrong"),
        });
    };

    const handleDelete = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        router.delete(route('admin.leaves.delete', deleteId), {
            onSuccess: () => {
                toast.success("Leave record deleted successfully");
                setDeleteId(null);
            },
            onError: () => toast.error("Failed to delete leave record"),
        });
    };

    const handleEdit = (leave) => {
        setEditingLeave(leave);
        setEditForm({
            leave_type: leave.leave_type,
            day_type: leave.day_type,
            from_date: leave.from_date.split('T')[0],
            to_date: leave.to_date.split('T')[0],
            reason: leave.reason || '',
            status: leave.status
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        router.put(route('admin.leaves.update', editingLeave.id), editForm, {
            onSuccess: () => {
                toast.success("Leave record updated successfully");
                setEditingLeave(null);
            },
            onError: () => toast.error("Failed to update leave record"),
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase();
        if (s === "approved")
            return (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                    Approved
                </span>
            );
        if (s === "rejected")
            return (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-medium">
                    Rejected
                </span>
            );
        return (
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-sm font-medium">
                Pending
            </span>
        );
    };

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        { value: '', label: 'All Months' },
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    return (
        <AdminLayout>
            <Head title="Leave Requests" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Leave Requests</h1>

                <div className="flex flex-wrap gap-3">
                    {/* User Filter */}
                    <select
                        value={userId}
                        onChange={(e) => handleFilterChange('user_id', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm text-sm"
                    >
                        <option value="">All Employees</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>

                    {/* Year Filter */}
                    <select
                        value={year}
                        onChange={(e) => handleFilterChange('year', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm text-sm"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    {/* Month Filter */}
                    <select
                        value={month}
                        onChange={(e) => handleFilterChange('month', e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm text-sm"
                    >
                        {months.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Leave Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Sick Leave (SL)</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{parseFloat(stats?.SL?.taken || 0)}</span>
                            {stats?.SL?.total && (
                                <span className="text-gray-400 font-bold">/ {stats.SL.total} Days Taken</span>
                            )}
                            {!stats?.SL?.total && (
                                <span className="text-gray-400 font-bold">Days Taken</span>
                            )}
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                        <Calendar size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Casual Leave (CL)</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{parseFloat(stats?.CL?.taken || 0)}</span>
                            {stats?.CL?.total && (
                                <span className="text-gray-400 font-bold">/ {stats.CL.total} Days Taken</span>
                            )}
                            {!stats?.CL?.total && (
                                <span className="text-gray-400 font-bold">Days Taken</span>
                            )}
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                        <Calendar size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Requests</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{stats?.pending || 0}</span>
                            <span className="text-gray-400 font-bold">Requests</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-500">
                        <FileText size={24} />
                    </div>
                </div>
            </div>

            {/* Leaves Table */}
            <div className="overflow-x-auto bg-white rounded-2xl shadow">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-blue-50 text-gray-700 text-sm uppercase">
                            <th className="px-4 py-2 text-left">Employee</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Dates</th>
                            <th className="px-4 py-2 text-left">Days</th>
                            <th className="px-4 py-2 text-center">Reason</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-8 text-gray-500 italic">
                                    No leave requests found.
                                </td>
                            </tr>
                        ) : (
                            data.map((leave) => (
                                <tr key={leave.id} className="border-t text-gray-700 hover:bg-gray-50 transition">
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                <User size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 text-sm">{leave.user?.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <span className="flex items-center gap-1">
                                            <FileText size={14} className="text-gray-400" />
                                            {leave.leave_type === 'SL' || leave.leave_type === 'CL' ? leave.leave_type : leave.leave_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 font-medium text-sm">
                                                {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
                                            </span>
                                            <span className="text-[10px] text-blue-600 uppercase font-bold">
                                                {leave.day_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 font-medium text-blue-600 text-sm">
                                        {leave.day_type === 'full'
                                            ? `${parseFloat(leave.no_of_days)} ${parseFloat(leave.no_of_days) > 1 ? 'Days' : 'Day'}`
                                            : leave.day_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                        }
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        {leave.reason ? (
                                            <button
                                                onClick={() => setSelectedLeave(leave)}
                                                className="text-gray-500 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                                                title="View Reason"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        {getStatusBadge(leave.status)}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-center gap-2">
                                            {leave.status === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(leave.id, 'approve')}
                                                        className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                                                        title="Approve"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(leave.id, 'reject')}
                                                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                        title="Reject"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : null}
                                            <button
                                                onClick={() => handleEdit(leave)}
                                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(leave.id)}
                                                className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {links.length > 3 && (
                <div className="flex justify-center mt-8 gap-2">
                    {links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || "#"}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${link.active
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
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
                            <button
                                onClick={() => setSelectedLeave(null)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 pb-4 border-b">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {selectedLeave.user?.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-gray-800">{selectedLeave.user?.name}</h4>
                                    <p className="text-sm text-gray-500">Employee</p>
                                </div>
                                <div className="ml-auto">
                                    {getStatusBadge(selectedLeave.status)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Leave Type</p>
                                    <p className="font-semibold text-gray-700">
                                        {selectedLeave.leave_type === 'SL' || selectedLeave.leave_type === 'CL'
                                            ? selectedLeave.leave_type
                                            : selectedLeave.leave_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Day Type</p>
                                    <p className="font-semibold text-gray-700 capitalize">
                                        {selectedLeave.day_type.replace('_', ' ')}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">From</p>
                                    <p className="font-semibold text-gray-700">{formatDate(selectedLeave.from_date)}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">To</p>
                                    <p className="font-semibold text-gray-700">{formatDate(selectedLeave.to_date)}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reason</p>
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedLeave.reason || "No reason provided."}
                                </p>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setSelectedLeave(null)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Are you sure?</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Do you really want to delete this leave record? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                            >
                                No, Keep it
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-md shadow-red-200"
                            >
                                Yes, Delete
                            </button>
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
                            <button
                                onClick={() => setEditingLeave(null)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Leave Type</label>
                                    <select
                                        value={editForm.leave_type}
                                        onChange={(e) => setEditForm({ ...editForm, leave_type: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg text-sm"
                                        required
                                    >
                                        <option value="SL">Sick Leave (SL)</option>
                                        <option value="CL">Casual Leave (CL)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Duration Type</label>
                                    <select
                                        value={editForm.day_type}
                                        onChange={(e) => setEditForm({ ...editForm, day_type: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg text-sm"
                                        required
                                    >
                                        <option value="full">Full Day</option>
                                        <option value="first_half">First Half</option>
                                        <option value="second_half">Second Half</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">From Date</label>
                                    <input
                                        type="date"
                                        value={editForm.from_date}
                                        onChange={(e) => setEditForm({ ...editForm, from_date: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">To Date</label>
                                    <input
                                        type="date"
                                        value={editForm.to_date}
                                        onChange={(e) => setEditForm({ ...editForm, to_date: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg text-sm"
                                        required
                                        disabled={editForm.day_type !== 'full'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full border-gray-300 rounded-lg text-sm"
                                    required
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Reason</label>
                                <textarea
                                    value={editForm.reason}
                                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                    className="w-full border-gray-300 rounded-lg text-sm"
                                    rows="3"
                                    required
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setEditingLeave(null)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md shadow-blue-200"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
