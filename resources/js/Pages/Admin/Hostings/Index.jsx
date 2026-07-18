import React, { useState, useEffect } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    Edit, Trash2, Plus, X, CheckCircle, AlertCircle, Server
} from "lucide-react";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";

export default function Index({ hostings, filters, success }) {
    const [deleteId, setDeleteId]       = useState(null);
    const [showModal, setShowModal]     = useState(false);
    const [editingHosting, setEditingHosting] = useState(null);
    const [showSuccess, setShowSuccess] = useState(!!success);
    const [fade, setFade]               = useState(false);

    const { data, setData, post, put, reset, errors, clearErrors } = useForm({
        site_name:       "",
        provider:        "",
        plan:            "",
        server_ip:       "",
        status:          "Active",
        expiration_date: "",
        auto_renewal:    true,
        price:           "",
        notes:           "",
    });

    const rows = Array.isArray(hostings) ? hostings : hostings?.data ?? [];

    useEffect(() => {
        if (success) {
            setShowSuccess(true);
            const timer = setTimeout(() => {
                setFade(true);
                setTimeout(() => setShowSuccess(false), 500);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const openCreateModal = () => {
        reset();
        setEditingHosting(null);
        setShowModal(true);
    };

    const openEditModal = (hosting) => {
        setEditingHosting(hosting);
        setData({
            site_name:       hosting.site_name,
            provider:        hosting.provider,
            plan:            hosting.plan || "",
            server_ip:       hosting.server_ip || "",
            status:          hosting.status,
            expiration_date: hosting.expiration_date ? hosting.expiration_date.split("T")[0] : "",
            auto_renewal:    !!hosting.auto_renewal,
            price:           hosting.price ?? "",
            notes:           hosting.notes || "",
        });
        setShowModal(true);
    };

    const closeModal = () => {
        reset();
        clearErrors();
        setShowModal(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingHosting) {
            put(route("admin.hostings.update", editingHosting.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route("admin.hostings.store"), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        router.delete(route("admin.hostings.destroy", id), {
            onSuccess: () => setDeleteId(null),
        });
    };

    // ── Expiry helpers ──────────────────────────────────────────
    const isExpired = (dateStr) => {
        if (!dateStr) return false;
        const expiry = new Date(dateStr);
        const today  = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        return expiry < today;
    };

    const isExpiringSoon = (dateStr) => {
        if (!dateStr) return false;
        const expiry = new Date(dateStr);
        const today  = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        if (expiry < today) return false;
        const oneMonthFromNow = new Date(today);
        oneMonthFromNow.setMonth(today.getMonth() + 1);
        return expiry <= oneMonthFromNow;
    };

    // ── Status badge colours ────────────────────────────────────
    const statusClass = (status) => {
        switch (status) {
            case "Active":      return "bg-green-100 text-green-700";
            case "Expired":     return "bg-red-100   text-red-700";
            case "Suspended":   return "bg-orange-100 text-orange-700";
            case "Transferred": return "bg-blue-100  text-blue-700";
            default:            return "bg-gray-100  text-gray-700";
        }
    };

    return (
        <AdminLayout title="Hosting">
            <Head title="Hosting" />

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Hosting</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    Add Hosting
                </button>
            </div>

            {showSuccess && (
                <div
                    className={`mb-4 flex justify-between items-center bg-green-100 text-green-700 px-4 py-2 rounded-lg border border-green-400 transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"}`}
                >
                    <span>{success}</span>
                    <button onClick={() => setShowSuccess(false)}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                                <th className="p-4 text-left">Site / Provider</th>
                                <th className="p-4 text-left">Plan</th>
                                <th className="p-4 text-left">Server IP</th>
                                <th className="p-4 text-left">Status</th>
                                <th className="p-4 text-left">Expiration Date</th>
                                <th className="p-4 text-left">Auto-renewal</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length > 0 ? (
                                rows.map((hosting) => {
                                    const expired      = isExpired(hosting.expiration_date);
                                    const expiringSoon = isExpiringSoon(hosting.expiration_date);
                                    return (
                                        <tr key={hosting.id} className="border-t hover:bg-gray-50 transition">
                                            {/* Site / Provider */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Server className="w-4 h-4 text-blue-500 shrink-0" />
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{hosting.site_name}</div>
                                                        <div className="text-xs text-gray-500">{hosting.provider}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Plan */}
                                            <td className="p-4 text-sm text-gray-700">
                                                {hosting.plan || <span className="text-gray-400 italic">—</span>}
                                            </td>

                                            {/* Server IP */}
                                            <td className="p-4 text-sm font-mono text-gray-700">
                                                {hosting.server_ip || <span className="text-gray-400 italic">—</span>}
                                            </td>

                                            {/* Status */}
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded-full text-xs font-medium ${statusClass(hosting.status)}`}>
                                                    {hosting.status === "Active"
                                                        ? <CheckCircle className="w-3 h-3" />
                                                        : <AlertCircle className="w-3 h-3" />}
                                                    {hosting.status}
                                                </span>
                                            </td>

                                            {/* Expiration */}
                                            <td className="p-4">
                                                <span className={`font-medium ${expired ? "text-red-600" : expiringSoon ? "text-orange-600 font-bold" : "text-gray-700"}`}>
                                                    {new Date(hosting.expiration_date).toLocaleDateString("en-GB", {
                                                        day:   "2-digit",
                                                        month: "short",
                                                        year:  "numeric",
                                                    })}
                                                </span>
                                                {expired      && <div className="text-[10px] text-red-500    font-bold uppercase mt-1">Expired</div>}
                                                {expiringSoon && <div className="text-[10px] text-orange-500 font-bold uppercase mt-1">Expiring Soon</div>}
                                            </td>

                                            {/* Auto-renewal */}
                                            <td className="p-4">
                                                {hosting.auto_renewal
                                                    ? <FaToggleOn className="text-blue-600 text-2xl" />
                                                    : <FaToggleOff className="text-gray-400 text-2xl" />}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(hosting)}
                                                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(hosting.id)}
                                                        className="p-1 hover:bg-red-50 rounded text-red-600"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500 italic">
                                        No hosting records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Add / Edit Modal ───────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editingHosting ? "Edit Hosting" : "Add New Hosting"}
                            </h2>
                            <button onClick={closeModal} className="p-1 hover:bg-gray-200 rounded-full transition">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            {/* Site Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Site Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={data.site_name}
                                    onChange={e => setData("site_name", e.target.value)}
                                    placeholder="example.com"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${errors.site_name ? "border-red-500" : "border-gray-300"}`}
                                />
                                {errors.site_name && <p className="text-red-500 text-xs mt-1">{errors.site_name}</p>}
                            </div>

                            {/* Provider + Plan */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Provider *</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.provider}
                                        onChange={e => setData("provider", e.target.value)}
                                        placeholder="SiteGround, Hostinger…"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${errors.provider ? "border-red-500" : "border-gray-300"}`}
                                    />
                                    {errors.provider && <p className="text-red-500 text-xs mt-1">{errors.provider}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Plan</label>
                                    <input
                                        type="text"
                                        value={data.plan}
                                        onChange={e => setData("plan", e.target.value)}
                                        placeholder="Basic, Pro, Business…"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Server IP + Price */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Server IP</label>
                                    <input
                                        type="text"
                                        value={data.server_ip}
                                        onChange={e => setData("server_ip", e.target.value)}
                                        placeholder="192.168.1.1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.price}
                                        onChange={e => setData("price", e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Status + Expiration Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                    <select
                                        value={data.status}
                                        onChange={e => setData("status", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Suspended">Suspended</option>
                                        <option value="Expired">Expired</option>
                                        <option value="Transferred">Transferred</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expiration Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={data.expiration_date}
                                        onChange={e => setData("expiration_date", e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${errors.expiration_date ? "border-red-500" : "border-gray-300"}`}
                                    />
                                    {errors.expiration_date && <p className="text-red-500 text-xs mt-1">{errors.expiration_date}</p>}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                                <textarea
                                    rows={2}
                                    value={data.notes}
                                    onChange={e => setData("notes", e.target.value)}
                                    placeholder="Any additional info…"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                                />
                            </div>

                            {/* Auto-renewal */}
                            <div className="flex items-center gap-2 py-1">
                                <input
                                    type="checkbox"
                                    id="auto_renewal"
                                    checked={data.auto_renewal}
                                    onChange={e => setData("auto_renewal", e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="auto_renewal" className="text-sm font-medium text-gray-700">Enable Auto-renewal</label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t mt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                                >
                                    {editingHosting ? "Update Hosting" : "Add Hosting"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ────────────────────────────────────── */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
                        <h2 className="text-lg font-bold mb-2">Confirm Delete</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this hosting record? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
