import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Building2, 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Users, 
    X, 
    CheckCircle, 
    XCircle,
    Check,
    AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index({ departments, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [deletingDepartment, setDeletingDepartment] = useState(null);

    // Form for Create & Edit
    const createForm = useForm({
        name: '',
        code: '',
        description: '',
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        code: '',
        description: '',
        is_active: true,
    });

    // Handle Search
    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.departments.index'), { search }, { preserveState: true, replace: true });
    };

    // Open Edit Modal
    const handleEditOpen = (dept) => {
        setEditingDepartment(dept);
        editForm.setData({
            name: dept.name || '',
            code: dept.code || '',
            description: dept.description || '',
            is_active: Boolean(dept.is_active),
        });
    };

    // Handle Create Submit
    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post(route('admin.departments.store'), {
            onSuccess: () => {
                toast.success('Department created successfully!');
                setIsCreateModalOpen(false);
                createForm.reset();
            },
            onError: () => toast.error('Failed to create department. Please check errors.'),
        });
    };

    // Handle Edit Submit
    const handleEditSubmit = (e) => {
        e.preventDefault();
        editForm.put(route('admin.departments.update', editingDepartment.id), {
            onSuccess: () => {
                toast.success('Department updated successfully!');
                setEditingDepartment(null);
            },
            onError: () => toast.error('Failed to update department.'),
        });
    };

    // Handle Delete Confirm
    const handleDeleteConfirm = () => {
        if (!deletingDepartment) return;
        router.delete(route('admin.departments.destroy', deletingDepartment.id), {
            onSuccess: () => {
                toast.success('Department deleted successfully!');
                setDeletingDepartment(null);
            },
            onError: () => toast.error('Failed to delete department.'),
        });
    };

    const deptList = departments.data || [];
    const totalDepartments = departments.total || deptList.length;
    const activeDepartments = deptList.filter(d => d.is_active).length;
    const totalEmployees = deptList.reduce((acc, d) => acc + (d.employees_count || 0), 0);

    return (
        <AdminLayout title="Departments">
            <Head title="Departments" />

            <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 font-jakarta">
                
                {/* 1. PAGE HEADER & STATS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <Building2 size={22} />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Departments</h1>
                                <p className="text-sm font-semibold text-gray-500">Manage company departments, codes, descriptions, and employees.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3 bg-[#1e88e5] hover:bg-[#1565c0] text-white rounded-full font-semibold uppercase tracking-wider text-xs shadow-lg shadow-[#1e88e5]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 self-start sm:self-auto"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Add Department
                    </button>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-[22px] border border-gray-100 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Building2 size={22} />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Total Departments</span>
                            <span className="text-2xl font-black text-gray-900">{totalDepartments}</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-[22px] border border-gray-100 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle size={22} />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Active Departments</span>
                            <span className="text-2xl font-black text-gray-900">{activeDepartments}</span>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-[22px] border border-gray-100 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Users size={22} />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Assigned Employees</span>
                            <span className="text-2xl font-black text-gray-900">{totalEmployees}</span>
                        </div>
                    </div>
                </div>

                {/* 2. SEARCH & TABLE CARD */}
                <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100/90 overflow-hidden space-y-4">
                    
                    {/* SEARCH FILTER BAR */}
                    <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-4">
                        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Search departments by name or code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-[15px] font-semibold text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </form>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[750px]">
                            <thead>
                                <tr className="border-b border-gray-100 bg-slate-50/50">
                                    <th className="py-4 px-5 text-sm font-black uppercase tracking-wider text-gray-400 w-12">#</th>
                                    <th className="py-4 px-5 text-sm font-black uppercase tracking-wider text-gray-400">Department Name</th>
                                    <th className="py-4 px-5 text-sm font-black uppercase tracking-wider text-gray-400">Code</th>
                                    <th className="py-4 px-5 text-sm font-black uppercase tracking-wider text-gray-400">Description</th>
                                    <th className="py-4 px-5 text-sm font-black uppercase tracking-wider text-gray-400">Employees</th>
                                    <th className="py-4 px-5 text-sm font-black uppercase tracking-wider text-gray-400">Status</th>
                                    <th className="py-4 px-5 text-sm font-black uppercase tracking-wider text-gray-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {deptList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-gray-400 text-sm font-bold uppercase">
                                            No departments found. Click "Add Department" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    deptList.map((dept, idx) => (
                                        <tr key={dept.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-4 px-5 text-sm font-bold text-gray-400">
                                                {String(idx + 1).padStart(2, '0')}
                                            </td>

                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <span className="font-extrabold text-sm text-gray-900">
                                                        {dept.name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-5">
                                                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-extrabold text-sm uppercase border border-gray-200">
                                                    {dept.code || 'N/A'}
                                                </span>
                                            </td>

                                            <td className="py-4 px-5 max-w-xs truncate text-sm font-medium text-gray-500">
                                                {dept.description || <span className="italic text-gray-300">No description</span>}
                                            </td>

                                            <td className="py-4 px-5">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 text-slate-700 text-sm border border-slate-200/50">
                                                    <Users size={13} className="text-slate-500 shrink-0" />
                                                    <span className="inline-flex items-center gap-1">
                                                        <strong className="font-extrabold text-slate-900">{dept.employees_count || 0}</strong>
                                                        <span className="text-slate-600 font-medium">{dept.employees_count === 1 ? 'Employee' : 'Employees'}</span>
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-5">
                                                {dept.is_active ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle size={12} />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                                                        <XCircle size={12} />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* EDIT BUTTON */}
                                                    <button
                                                        onClick={() => handleEditOpen(dept)}
                                                        className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer"
                                                        title="Edit Department"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>

                                                    {/* DELETE BUTTON */}
                                                    <button
                                                        onClick={() => setDeletingDepartment(dept)}
                                                        className="w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
                                                        title="Delete Department"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CREATE DEPARTMENT MODAL */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setIsCreateModalOpen(false)}>
                        <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="text-base font-extrabold text-gray-900">Add New Department</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Department Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Graphic Design / IT"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-[15px] font-semibold text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    {createForm.errors.name && <span className="text-red-500 text-xs font-bold mt-1 block">{createForm.errors.name}</span>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Department Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. MKTG / HR / IT"
                                        value={createForm.data.code}
                                        onChange={(e) => createForm.setData('code', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-[15px] font-semibold text-gray-800 uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Enter brief department description..."
                                        value={createForm.data.description}
                                        onChange={(e) => createForm.setData('description', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-[15px] font-medium text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="create_is_active"
                                        checked={createForm.data.is_active}
                                        onChange={(e) => createForm.setData('is_active', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="create_is_active" className="text-sm font-extrabold text-gray-800 cursor-pointer">Active Status</label>
                                </div>

                                <div className="flex justify-end gap-2 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold uppercase transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="px-5 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-sm font-extrabold uppercase shadow-sm transition-all"
                                    >
                                        {createForm.processing ? "Saving..." : "Create Department"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* EDIT DEPARTMENT MODAL */}
                {editingDepartment && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setEditingDepartment(null)}>
                        <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="text-base font-extrabold text-gray-900">Edit Department</h3>
                                <button onClick={() => setEditingDepartment(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Department Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-[15px] font-semibold text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    {editForm.errors.name && <span className="text-red-500 text-xs font-bold mt-1 block">{editForm.errors.name}</span>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Department Code</label>
                                    <input
                                        type="text"
                                        value={editForm.data.code}
                                        onChange={(e) => editForm.setData('code', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-[15px] font-semibold text-gray-800 uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        value={editForm.data.description}
                                        onChange={(e) => editForm.setData('description', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-200 text-[15px] font-medium text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="edit_is_active"
                                        checked={editForm.data.is_active}
                                        onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="edit_is_active" className="text-sm font-extrabold text-gray-800 cursor-pointer">Active Status</label>
                                </div>

                                <div className="flex justify-end gap-2 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditingDepartment(null)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold uppercase transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="px-5 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-sm font-extrabold uppercase shadow-sm transition-all"
                                    >
                                        {editForm.processing ? "Saving..." : "Update Department"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {deletingDepartment && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setDeletingDepartment(null)}>
                        <div className="bg-white rounded-[24px] max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2">
                                <AlertTriangle size={24} />
                            </div>

                            <div className="text-center space-y-1">
                                <h3 className="text-base font-extrabold text-gray-900">Delete Department?</h3>
                                <p className="text-sm font-semibold text-gray-500">
                                    Are you sure you want to delete <strong className="text-gray-900">{deletingDepartment.name}</strong>? Any assigned employees will be unassigned.
                                </p>
                            </div>

                            <div className="flex justify-center gap-3 pt-2">
                                <button
                                    onClick={() => setDeletingDepartment(null)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold uppercase transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-extrabold uppercase shadow-sm transition-all"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
