import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { 
    Layers, 
    Lock, 
    Save, 
    CheckSquare, 
    Square, 
    Search, 
    RefreshCw, 
    AlertCircle, 
    Crown, 
    ShieldCheck, 
    UserPlus, 
    X, 
    Check, 
    Users, 
    Sparkles,
    Briefcase,
    Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index({ 
    modules = [], 
    roles = [], 
    rolePermissions = {}, 
    moduleOrder = {}, 
    managers = [],
    departments = [] 
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [duplicateOrders, setDuplicateOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'managers'
    const [selectedManagerId, setSelectedManagerId] = useState(managers.length > 0 ? managers[0].id : null);
    
    // Add Manager Modal state
    const [isAddManagerOpen, setIsAddManagerOpen] = useState(false);
    const [addManagerForm, setAddManagerForm] = useState({
        designation: 'Production Manager',
        module_permissions: ['dashboard'],
    });
    const [addManagerProcessing, setAddManagerProcessing] = useState(false);
    const [addManagerErrors, setAddManagerErrors] = useState({});

    // Edit Manager Modal state
    const [isEditManagerOpen, setIsEditManagerOpen] = useState(false);
    const [editManagerForm, setEditManagerForm] = useState({
        id: '',
        name: '',
        email: '',
        designation: '',
        department_id: '',
        role: 'manager',
    });
    const [editManagerProcessing, setEditManagerProcessing] = useState(false);
    const [editManagerErrors, setEditManagerErrors] = useState({});

    const { data, setData, post, processing, errors } = useForm({
        permissions: rolePermissions || {},
        module_order: moduleOrder || {},
    });

    const { auth, allowedModules } = usePage().props;
    const isSuperAdmin = auth?.user?.role === 'superadmin';

    // Filter modules strictly by subscription (Super admin sees all system modules, Tenant Admins see only modules in their plan)
    const validModules = isSuperAdmin ? modules : modules.filter((mod) => 
        Array.isArray(allowedModules) && allowedModules.includes(mod.key)
    );

    const filteredModules = validModules.filter((mod) =>
        mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const checkDuplicates = (orderData) => {
        const counts = {};
        const dups = [];
        validModules.forEach((mod) => {
            const val = orderData[mod.key] ?? mod.order ?? 1;
            if (val !== '' && val !== null && val !== undefined) {
                const numVal = Number(val);
                counts[numVal] = (counts[numVal] || 0) + 1;
            }
        });
        Object.keys(counts).forEach((val) => {
            if (counts[val] > 1) {
                dups.push(Number(val));
            }
        });
        return dups;
    };

    const isChecked = (roleKey, moduleKey) => {
        if (roleKey === 'admin') return true; // Admin always has full access
        if (moduleKey === 'dashboard') return true; // Dashboard is ALWAYS active and cannot be unchecked
        const roleMods = data.permissions[roleKey] || [];
        return roleMods.includes(moduleKey);
    };

    const togglePermission = (roleKey, moduleKey) => {
        if (roleKey === 'admin') {
            toast.error("Admin access is permanent and cannot be changed.");
            return;
        }

        if (moduleKey === 'dashboard') {
            toast.error("Dashboard is required and cannot be unchecked.");
            return;
        }

        const currentMods = data.permissions[roleKey] ? [...data.permissions[roleKey]] : [];
        let updatedMods = [];
        if (currentMods.includes(moduleKey)) {
            updatedMods = currentMods.filter((m) => m !== moduleKey);
        } else {
            updatedMods = [...currentMods, moduleKey];
        }

        // Always keep dashboard
        if (!updatedMods.includes('dashboard')) {
            updatedMods.unshift('dashboard');
        }

        setData('permissions', {
            ...data.permissions,
            [roleKey]: updatedMods,
        });
    };

    const handleOrderChange = (moduleKey, newOrder) => {
        const val = parseInt(newOrder, 10);
        const updatedOrder = {
            ...data.module_order,
            [moduleKey]: isNaN(val) ? '' : val,
        };
        setData('module_order', updatedOrder);
        setDuplicateOrders(checkDuplicates(updatedOrder));
    };

    const selectAllForRole = (roleKey) => {
        if (roleKey === 'admin') return;
        const allKeys = validModules.map((m) => m.key);
        if (!allKeys.includes('dashboard')) {
            allKeys.unshift('dashboard');
        }
        setData('permissions', {
            ...data.permissions,
            [roleKey]: allKeys,
        });
        toast.success(`Selected all modules for ${getRoleName(roleKey)}`);
    };

    const clearAllForRole = (roleKey) => {
        if (roleKey === 'admin') return;
        setData('permissions', {
            ...data.permissions,
            [roleKey]: ['dashboard'],
        });
        toast.success(`Cleared other modules for ${getRoleName(roleKey)} (Dashboard retained)`);
    };

    const getRoleName = (roleKey) => {
        const found = roles.find((r) => r.key === roleKey);
        return found ? (found.short_name || found.name) : roleKey;
    };

    const handleSubmit = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const dups = checkDuplicates(data.module_order);
        if (dups.length > 0) {
            setDuplicateOrders(dups);
            toast.error(`Cannot save! Order number (${dups.join(', ')}) is used by multiple modules. Each module must have a unique order number.`);
            return;
        }

        setDuplicateOrders([]);
        post(route('admin.modules.update'), {
            onSuccess: () => toast.success("Module settings saved successfully!"),
            onError: () => toast.error("Failed to save module settings. Please check errors."),
        });
    };

    // Quick Add Manager submission
    const handleAddManagerSubmit = (e) => {
        e.preventDefault();
        setAddManagerProcessing(true);
        setAddManagerErrors({});

        router.post(route('admin.modules.add-manager'), {
            designation: addManagerForm.designation,
            module_permissions: addManagerForm.module_permissions,
        }, {
            onSuccess: () => {
                toast.success(`Manager "${addManagerForm.designation}" created successfully!`);
                setIsAddManagerOpen(false);
                setAddManagerForm({
                    designation: 'Production Manager',
                    module_permissions: ['dashboard'],
                });
            },
            onError: (errs) => {
                setAddManagerErrors(errs);
                const firstErr = Object.values(errs)[0] || 'Failed to create manager.';
                toast.error(firstErr);
            },
            onFinish: () => setAddManagerProcessing(false),
        });
    };

    const openEditManagerModal = (mgr, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        setEditManagerForm({
            id: mgr.id,
            designation: mgr.designation || 'Production Manager',
        });
        setEditManagerErrors({});
        setIsEditManagerOpen(true);
    };

    const handleEditManagerSubmit = (e) => {
        e.preventDefault();
        setEditManagerProcessing(true);
        setEditManagerErrors({});

        router.put(route('admin.users.update', editManagerForm.id), {
            designation: editManagerForm.designation,
        }, {
            onSuccess: () => {
                toast.success(`Manager title updated to "${editManagerForm.designation}"!`);
                setIsEditManagerOpen(false);
            },
            onError: (errs) => {
                setEditManagerErrors(errs);
                const firstErr = Object.values(errs)[0] || 'Failed to update manager title.';
                toast.error(firstErr);
            },
            onFinish: () => setEditManagerProcessing(false),
        });
    };

    const designationPresets = [
        'Production Manager',
        'Task Manager',
        'Project Manager',
        'Operations Manager',
        'HR Manager',
        'Sales Manager',
    ];

    const currentSelectedManager = managers.find(m => m.id === selectedManagerId) || managers[0];
    const currentSelectedRoleKey = currentSelectedManager ? `manager_${currentSelectedManager.id}` : null;
    const currentManagerPermissions = currentSelectedRoleKey ? (data.permissions[currentSelectedRoleKey] || []) : [];

    return (
        <AdminLayout title="Modules List & Manager Access Control">
            <Head title="Modules List" />

            <div className="w-full space-y-6 font-sans pb-16">
                {/* Header Banner */}
                <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                            <Layers size={16} />
                            <span>System Modules & Access Control</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                            Module Permissions & Multiple Managers
                        </h1>
                        <p className="text-gray-500 font-medium text-sm mt-1 max-w-2xl">
                            Assign unique modules to each Manager (e.g. Production Manager, Task Manager, Project Manager) separately. Each manager manages only their checked modules.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAddManagerOpen(true)}
                            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 !text-white text-white font-bold uppercase tracking-widest text-[11px] transition-all shadow-md shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer"
                        >
                            <UserPlus size={14} className="text-white !text-white" />
                            <span className="text-white !text-white font-bold">+ Add Manager</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 !text-white text-white font-bold uppercase tracking-widest text-[11px] transition-all shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            {processing ? <RefreshCw size={14} className="animate-spin text-white !text-white" /> : <Save size={14} className="text-white !text-white" />}
                            <span className="text-white !text-white font-bold">Save All Permissions</span>
                        </button>
                    </div>
                </div>

                {/* Duplicate Order Alert */}
                {(duplicateOrders.length > 0 || errors.module_order) && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-800 text-sm font-semibold shadow-sm">
                        <AlertCircle size={20} className="text-red-600 shrink-0" />
                        <div>
                            {errors.module_order || `Order numbers must be unique. Duplicate order number (${duplicateOrders.join(', ')}) detected! Please assign unique numbers to save.`}
                        </div>
                    </div>
                )}

                {/* View Tabs */}
                <div className="flex items-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl w-fit border border-gray-200/60 shadow-xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('matrix')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            activeTab === 'matrix'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Layers size={15} className={activeTab === 'matrix' ? 'text-blue-600' : 'text-gray-400'} />
                        <span>Full Matrix View</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('managers')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            activeTab === 'managers'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Crown size={15} className={activeTab === 'managers' ? 'text-amber-500' : 'text-gray-400'} />
                        <span>Managers Assignment ({managers.length})</span>
                    </button>
                </div>

                {/* TAB 1: FULL MATRIX TABLE VIEW (Admin, Editor, User) */}
                {activeTab === 'matrix' && (
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search modules by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                            <div className="text-xs font-semibold text-gray-500">
                                Showing {filteredModules.length} of {modules.length} modules
                            </div>
                        </div>

                        {/* Modules & Roles Matrix Table */}
                        <form onSubmit={handleSubmit}>
                            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                                                <th className="py-4 px-4 text-center min-w-[90px]">Order</th>
                                                <th className="py-4 px-6 min-w-[200px]">Module Name</th>
                                                {roles.map((role) => (
                                                    <th key={role.key} className="py-4 px-4 text-center min-w-[170px]">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="flex items-center gap-1.5 font-black text-gray-900 text-center">
                                                                <span>{role.short_name || role.name}</span>
                                                                {role.is_locked && (
                                                                    <Lock size={14} className="text-amber-500" title="Locked - Full Access" />
                                                                )}
                                                            </div>
                                                            {role.is_locked ? (
                                                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                                                    Locked (All Checked)
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center gap-2 text-[10px] font-semibold text-blue-600 normal-case mt-0.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => selectAllForRole(role.key)}
                                                                        className="hover:underline text-blue-600 font-bold cursor-pointer"
                                                                    >
                                                                        Select All
                                                                    </button>
                                                                    <span className="text-gray-300">|</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => clearAllForRole(role.key)}
                                                                        className="hover:underline text-gray-500 font-bold cursor-pointer"
                                                                    >
                                                                        Clear All
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm font-medium">
                                            {filteredModules.length > 0 ? (
                                                filteredModules.map((mod) => {
                                                    const orderVal = data.module_order[mod.key] ?? mod.order ?? 1;
                                                    const isDuplicate = duplicateOrders.includes(Number(orderVal));

                                                    return (
                                                        <tr key={mod.key} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="py-4 px-4 text-center align-middle">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="99"
                                                                    value={orderVal}
                                                                    onChange={(e) => handleOrderChange(mod.key, e.target.value)}
                                                                    className={`w-16 text-center py-1.5 px-2 border rounded-xl font-extrabold text-xs text-gray-900 outline-none transition-all ${
                                                                        isDuplicate
                                                                            ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200'
                                                                            : 'border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                                                    }`}
                                                                />
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="font-bold text-gray-900">{mod.name}</div>
                                                                {mod.description && (
                                                                    <div className="text-xs text-gray-400 font-normal">{mod.description}</div>
                                                                )}
                                                            </td>

                                                            {roles.map((role) => {
                                                                const isDashboard = mod.key === 'dashboard';
                                                                const checked = isDashboard || isChecked(role.key, mod.key);
                                                                const isLocked = role.is_locked || isDashboard;

                                                                return (
                                                                    <td key={role.key} className="py-4 px-4 text-center align-middle">
                                                                        <div className="flex items-center justify-center">
                                                                            <label
                                                                                className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all ${
                                                                                    isLocked
                                                                                        ? 'cursor-not-allowed bg-amber-50/50 border border-amber-200/50'
                                                                                        : 'cursor-pointer hover:bg-gray-100'
                                                                                }`}
                                                                                title={
                                                                                    isDashboard
                                                                                        ? "Dashboard is required and always enabled for all roles."
                                                                                        : isLocked
                                                                                        ? "Admin has access to all modules and cannot be changed."
                                                                                        : `Toggle ${mod.name} for ${role.short_name || role.name}`
                                                                                }
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={checked}
                                                                                    disabled={isLocked}
                                                                                    onChange={() => togglePermission(role.key, mod.key)}
                                                                                    className="sr-only"
                                                                                />
                                                                                {isLocked ? (
                                                                                    <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                                                                                        <CheckSquare size={20} className="text-amber-600 fill-amber-100" />
                                                                                    </div>
                                                                                ) : checked ? (
                                                                                    <CheckSquare size={22} className="text-blue-600 fill-blue-50" />
                                                                                ) : (
                                                                                    <Square size={22} className="text-gray-300" />
                                                                                )}
                                                                            </label>
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={roles.length + 2} className="py-12 text-center text-gray-400 font-medium">
                                                        No modules found matching "{searchQuery}"
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer Bar */}
                                <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-xs text-gray-500 font-medium">
                                        Changes take effect immediately after saving.
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing || duplicateOrders.length > 0}
                                        className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 !text-white text-white font-bold uppercase tracking-widest text-[11px] transition-all shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        {processing ? <RefreshCw size={14} className="animate-spin text-white !text-white" /> : <Save size={14} className="text-white !text-white" />}
                                        <span className="text-white !text-white font-bold">Save Changes</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 2: INDIVIDUAL MANAGERS MODULE ASSIGNMENT */}
                {activeTab === 'managers' && (
                    <div className="space-y-6">
                        {managers.length === 0 ? (
                            <div className="bg-white rounded-[28px] p-12 text-center border border-gray-100 shadow-sm space-y-4">
                                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                                    <Crown size={32} />
                                </div>
                                <h3 className="text-xl font-black text-gray-900">No Managers Created Yet</h3>
                                <p className="text-gray-500 text-sm max-w-md mx-auto">
                                    Create multiple managers (e.g. Production Manager, Task Manager, Project Manager) and assign each of them different modules.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsAddManagerOpen(true)}
                                    className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-600/25 inline-flex items-center gap-2 cursor-pointer"
                                >
                                    <UserPlus size={16} />
                                    <span>Add First Manager</span>
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Side: Managers List */}
                                <div className="lg:col-span-4 space-y-3">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                                            Select Manager ({managers.length})
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddManagerOpen(true)}
                                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            + Add Manager
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {managers.map((mgr) => {
                                            const roleKey = `manager_${mgr.id}`;
                                            const isSelected = selectedManagerId === mgr.id;
                                            const assignedCount = (data.permissions[roleKey] || []).length;
                                            const designation = mgr.designation || 'Manager';

                                            return (
                                                <button
                                                    key={mgr.id}
                                                    type="button"
                                                    onClick={() => setSelectedManagerId(mgr.id)}
                                                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                        isSelected
                                                            ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                                                            : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                                            isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            <Crown size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-extrabold text-sm text-gray-900 truncate">
                                                                {designation}
                                                            </div>
                                                            {mgr.email && !mgr.email.includes('@company.local') && mgr.name !== designation && (
                                                                <div className="text-xs font-medium text-gray-500 truncate">
                                                                    {mgr.name} • {mgr.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 flex items-center gap-1.5">
                                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                            assignedCount > 0
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {assignedCount} {assignedCount === 1 ? 'module' : 'modules'}
                                                        </span>
                                                        <span
                                                            onClick={(e) => openEditManagerModal(mgr, e)}
                                                            className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                            title="Edit manager title / name"
                                                        >
                                                            <Edit2 size={13} />
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Side: Module Checklist for Selected Manager */}
                                <div className="lg:col-span-8">
                                    {currentSelectedManager ? (
                                        <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
                                            {/* Manager Details Bar */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center font-bold shrink-0">
                                                        <Crown size={22} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h2 className="text-lg md:text-xl font-black text-gray-900">
                                                                {currentSelectedManager.designation || 'Manager'}
                                                            </h2>
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                                                Role: Manager
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => openEditManagerModal(currentSelectedManager, e)}
                                                                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                                                title="Edit manager title (e.g. Production Manager)"
                                                            >
                                                                <Edit2 size={12} className="text-blue-600" />
                                                                <span>Edit Title</span>
                                                            </button>
                                                        </div>
                                                        {currentSelectedManager.email && !currentSelectedManager.email.includes('@company.local') && currentSelectedManager.name !== (currentSelectedManager.designation || 'Manager') && (
                                                            <p className="text-gray-500 font-medium text-xs mt-0.5">
                                                                Employee: <strong className="text-gray-800">{currentSelectedManager.name}</strong> ({currentSelectedManager.email})
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => selectAllForRole(currentSelectedRoleKey)}
                                                        className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs cursor-pointer transition-all"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => clearAllForRole(currentSelectedRoleKey)}
                                                        className="px-3.5 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-xs cursor-pointer transition-all"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Notice banner */}
                                            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-blue-900 font-medium">
                                                <Sparkles size={18} className="text-blue-600 shrink-0" />
                                                <span>
                                                    Checked modules below are managed by <strong>{currentSelectedManager.designation || currentSelectedManager.name}</strong>. Other modules will remain hidden when this manager logs in.
                                                </span>
                                            </div>

                                            {/* Modules Checklist Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {validModules.map((mod) => {
                                                    const isDashboard = mod.key === 'dashboard';
                                                    const checked = isDashboard || isChecked(currentSelectedRoleKey, mod.key);

                                                    return (
                                                        <div
                                                            key={mod.key}
                                                            onClick={() => {
                                                                if (isDashboard) {
                                                                    toast.error("Dashboard is required and cannot be unchecked.");
                                                                    return;
                                                                }
                                                                togglePermission(currentSelectedRoleKey, mod.key);
                                                            }}
                                                            className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 select-none ${
                                                                isDashboard
                                                                    ? 'bg-amber-50/60 border-amber-200 cursor-not-allowed'
                                                                    : checked
                                                                    ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-400/30 cursor-pointer'
                                                                    : 'bg-gray-50/40 border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer'
                                                            }`}
                                                            title={isDashboard ? "Dashboard is required and cannot be unchecked" : `Toggle ${mod.name}`}
                                                        >
                                                            <div className="mt-0.5 shrink-0">
                                                                {isDashboard ? (
                                                                    <CheckSquare size={20} className="text-amber-600 fill-amber-100" />
                                                                ) : checked ? (
                                                                    <CheckSquare size={20} className="text-blue-600 fill-blue-50" />
                                                                ) : (
                                                                    <Square size={20} className="text-gray-300" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <span className={`font-bold text-xs truncate ${isDashboard ? 'text-amber-900' : checked ? 'text-blue-900' : 'text-gray-800'}`}>
                                                                        {mod.name}
                                                                    </span>
                                                                    {isDashboard && (
                                                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md shrink-0">
                                                                            Required
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {mod.description && (
                                                                    <div className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                                                                        {mod.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Save button for this manager */}
                                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                                <div className="text-xs text-gray-500 font-medium">
                                                    Currently assigned: <strong className="text-blue-600">{currentManagerPermissions.length}</strong> of {validModules.length} modules
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleSubmit}
                                                    disabled={processing}
                                                    className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 !text-white text-white font-bold uppercase tracking-widest text-[11px] transition-all shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                >
                                                    {processing ? <RefreshCw size={14} className="animate-spin text-white !text-white" /> : <Save size={14} className="text-white !text-white" />}
                                                    <span className="text-white !text-white font-bold">Save Module Permissions</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL: ADD NEW MANAGER */}
                {isAddManagerOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-[28px] max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                                        <Crown size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">Add New Manager</h3>
                                        <p className="text-gray-400 text-xs">Create a manager with designated modules</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddManagerOpen(false)}
                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleAddManagerSubmit} className="space-y-4">
                                {/* Designation Presets */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                                        Manager Type / Designation
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Production Manager, Task Manager"
                                        value={addManagerForm.designation}
                                        onChange={(e) => setAddManagerForm({ ...addManagerForm, designation: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    {/* Preset Chips */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {designationPresets.map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setAddManagerForm({ ...addManagerForm, designation: preset })}
                                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                                    addManagerForm.designation === preset
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Initial Module Assignment Checklist */}
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                                            Assign Initial Modules ({addManagerForm.module_permissions.length})
                                        </label>
                                        <div className="flex items-center gap-2 text-xs font-semibold">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const allKeys = validModules.map(m => m.key);
                                                    if (!allKeys.includes('dashboard')) allKeys.unshift('dashboard');
                                                    setAddManagerForm({ ...addManagerForm, module_permissions: allKeys });
                                                }}
                                                className="text-blue-600 hover:underline cursor-pointer"
                                            >
                                                Select All
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                type="button"
                                                onClick={() => setAddManagerForm({ ...addManagerForm, module_permissions: ['dashboard'] })}
                                                className="text-gray-500 hover:underline cursor-pointer"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100">
                                        {validModules.map((mod) => {
                                            const isDashboard = mod.key === 'dashboard';
                                            const isChecked = isDashboard || addManagerForm.module_permissions.includes(mod.key);
                                            return (
                                                <label
                                                    key={mod.key}
                                                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold transition-all ${
                                                        isDashboard
                                                            ? 'bg-amber-50/60 border-amber-200 text-amber-900 cursor-not-allowed'
                                                            : isChecked
                                                            ? 'bg-white border-blue-400 text-blue-900 shadow-xs cursor-pointer'
                                                            : 'bg-white/60 border-gray-200 text-gray-600 hover:border-gray-300 cursor-pointer'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        disabled={isDashboard}
                                                        onChange={() => {
                                                            if (isDashboard) return;
                                                            const current = [...addManagerForm.module_permissions];
                                                            let updated = isChecked
                                                                ? current.filter(k => k !== mod.key)
                                                                : [...current, mod.key];
                                                            if (!updated.includes('dashboard')) {
                                                                updated.unshift('dashboard');
                                                            }
                                                            setAddManagerForm({ ...addManagerForm, module_permissions: updated });
                                                        }}
                                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="truncate flex-1">{mod.name}</span>
                                                    {isDashboard && (
                                                        <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-100 px-1 py-0.2 rounded">Req</span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddManagerOpen(false)}
                                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addManagerProcessing}
                                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        {addManagerProcessing && <RefreshCw size={14} className="animate-spin" />}
                                        <span>Create Manager</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL: EDIT MANAGER TITLE */}
                {isEditManagerOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-[28px] max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                                        <Edit2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">Edit Manager Title</h3>
                                        <p className="text-gray-400 text-xs">Set manager title (e.g. Production Manager, Task Manager)</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditManagerOpen(false)}
                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleEditManagerSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                        Manager Title / Designation <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editManagerForm.designation}
                                        onChange={(e) => setEditManagerForm({ ...editManagerForm, designation: e.target.value })}
                                        placeholder="e.g. Production Manager, Task Manager, Project Manager"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                    {editManagerErrors.designation && (
                                        <div className="text-red-500 text-xs mt-1 font-semibold">{editManagerErrors.designation}</div>
                                    )}

                                    {/* Presets */}
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        <span className="text-[11px] font-bold text-gray-400 self-center mr-1">Suggestions:</span>
                                        {designationPresets.map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setEditManagerForm({ ...editManagerForm, designation: preset })}
                                                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                                    editManagerForm.designation === preset
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                }`}
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditManagerOpen(false)}
                                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editManagerProcessing}
                                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        {editManagerProcessing && <RefreshCw size={14} className="animate-spin" />}
                                        <span>Save Title</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
