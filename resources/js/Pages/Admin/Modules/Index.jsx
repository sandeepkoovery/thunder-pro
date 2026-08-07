import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Layers, Lock, Save, CheckSquare, Square, Search, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index({ modules = [], roles = [], rolePermissions = {}, moduleOrder = {} }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [duplicateOrders, setDuplicateOrders] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        permissions: rolePermissions || {},
        module_order: moduleOrder || {},
    });

    const { auth, allowedModules } = usePage().props;
    const isSuperAdmin = auth?.user?.role === 'superadmin';

    // Filter modules strictly by subscription (Super admin sees all)
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
        modules.forEach((mod) => {
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
        const roleMods = data.permissions[roleKey] || [];
        return roleMods.includes(moduleKey);
    };

    const togglePermission = (roleKey, moduleKey) => {
        if (roleKey === 'admin') {
            toast.error("Admin access is permanent and cannot be changed.");
            return;
        }

        const currentMods = data.permissions[roleKey] ? [...data.permissions[roleKey]] : [];
        let updatedMods = [];
        if (currentMods.includes(moduleKey)) {
            updatedMods = currentMods.filter((m) => m !== moduleKey);
        } else {
            updatedMods = [...currentMods, moduleKey];
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
            [roleKey]: [],
        });
        toast.success(`Cleared all modules for ${getRoleName(roleKey)}`);
    };

    const getRoleName = (roleKey) => {
        const found = roles.find((r) => r.key === roleKey);
        return found ? found.name : roleKey;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
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

    return (
        <AdminLayout title="Modules List & Access Control">
            <Head title="Modules List" />

            <div className="w-full space-y-6 font-sans pb-12">
                {/* Header Banner */}
                <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                            <Layers size={16} />
                            <span>System Modules & Role Management</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                            Modules List
                        </h1>
                        <p className="text-gray-500 font-medium text-sm mt-1">
                            Configure module access and left menu order for user roles.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 !text-white text-white font-bold uppercase tracking-widest text-[11px] transition-all shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            {processing ? <RefreshCw size={14} className="animate-spin text-white !text-white" /> : <Save size={14} className="text-white !text-white" />}
                            <span className="text-white !text-white font-bold">Save Permissions</span>
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

                {/* Filter and Search Bar */}
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
                                            <th key={role.key} className="py-4 px-4 text-center min-w-[150px]">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1.5 font-black text-gray-900">
                                                        <span>{role.name}</span>
                                                        {role.is_locked && (
                                                            <Lock size={14} className="text-amber-500" title="Locked - Full Access" />
                                                        )}
                                                    </div>
                                                    {role.is_locked ? (
                                                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                                            Locked (All Checked)
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-[10px] font-semibold text-blue-600 normal-case">
                                                            <button
                                                                type="button"
                                                                onClick={() => selectAllForRole(role.key)}
                                                                className="hover:underline text-blue-600"
                                                            >
                                                                Select All
                                                            </button>
                                                            <span className="text-gray-300">|</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => clearAllForRole(role.key)}
                                                                className="hover:underline text-gray-500"
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
                                                    </td>

                                                    {roles.map((role) => {
                                                        const checked = isChecked(role.key, mod.key);
                                                        const isLocked = role.is_locked;

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
                                                                            isLocked
                                                                                ? "Admin has access to all modules and cannot be changed."
                                                                                : `Toggle ${mod.name} for ${role.name}`
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
        </AdminLayout>
    );
}
