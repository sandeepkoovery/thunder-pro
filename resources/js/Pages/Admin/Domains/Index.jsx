import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Globe, 
    Server, 
    Plus, 
    Trash2, 
    Edit3, 
    X,
    CheckCircle2,
    RefreshCw,
    AlertCircle,
    XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index({ domains = [], hostings = [] }) {
    const [activeTab, setActiveTab] = useState('domains'); // 'domains' | 'hosting'

    // Domain Modals
    const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
    const [editingDomain, setEditingDomain] = useState(null);

    // Hosting Modals
    const [isHostingModalOpen, setIsHostingModalOpen] = useState(false);
    const [editingHosting, setEditingHosting] = useState(null);

    // Domain Form
    const domainForm = useForm({
        domain_name: '',
        provider: 'Hostinger',
        status: 'Active',
        expiration_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        auto_renewal: true,
        price: 499,
    });

    // Hosting Form
    const hostingForm = useForm({
        site_name: '',
        provider: 'Hostinger',
        plan: 'Business',
        server_ip: '',
        status: 'Active',
        expiration_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        auto_renewal: false,
        price: 499,
        notes: '',
    });

    // Domain Handlers
    const handleDomainSubmit = (e) => {
        e.preventDefault();
        if (editingDomain) {
            domainForm.put(route('domains.update', editingDomain.id), {
                onSuccess: () => {
                    toast.success('Domain updated successfully!');
                    setIsDomainModalOpen(false);
                    setEditingDomain(null);
                    domainForm.reset();
                },
                onError: () => toast.error('Failed to update domain'),
            });
        } else {
            domainForm.post(route('domains.store'), {
                onSuccess: () => {
                    toast.success('Domain added successfully!');
                    setIsDomainModalOpen(false);
                    domainForm.reset();
                },
                onError: () => toast.error('Failed to add domain'),
            });
        }
    };

    const handleOpenEditDomain = (domain) => {
        setEditingDomain(domain);
        domainForm.setData({
            domain_name: domain.domain_name || '',
            provider: domain.provider || 'Hostinger',
            status: domain.status || 'Active',
            expiration_date: domain.expiration_date || new Date().toISOString().split('T')[0],
            auto_renewal: Boolean(domain.auto_renewal),
            price: domain.price || 499,
        });
        setIsDomainModalOpen(true);
    };

    const handleDeleteDomain = (id) => {
        if (confirm('Are you sure you want to delete this domain?')) {
            router.delete(route('domains.destroy', id), {
                onSuccess: () => toast.success('Domain deleted'),
                onError: () => toast.error('Failed to delete domain'),
            });
        }
    };

    // Hosting Handlers
    const handleHostingSubmit = (e) => {
        e.preventDefault();
        if (editingHosting) {
            hostingForm.put(route('domains.hostings.update', editingHosting.id), {
                onSuccess: () => {
                    toast.success('Hosting updated successfully!');
                    setIsHostingModalOpen(false);
                    setEditingHosting(null);
                    hostingForm.reset();
                },
                onError: () => toast.error('Failed to update hosting'),
            });
        } else {
            hostingForm.post(route('domains.hostings.store'), {
                onSuccess: () => {
                    toast.success('Hosting added successfully!');
                    setIsHostingModalOpen(false);
                    hostingForm.reset();
                },
                onError: () => toast.error('Failed to add hosting'),
            });
        }
    };

    const handleOpenEditHosting = (hosting) => {
        setEditingHosting(hosting);
        hostingForm.setData({
            site_name: hosting.site_name || '',
            provider: hosting.provider || 'Hostinger',
            plan: hosting.plan || 'Business',
            server_ip: hosting.server_ip || '',
            status: hosting.status || 'Active',
            expiration_date: hosting.expiration_date || new Date().toISOString().split('T')[0],
            auto_renewal: Boolean(hosting.auto_renewal),
            price: hosting.price || 499,
            notes: hosting.notes || '',
        });
        setIsHostingModalOpen(true);
    };

    const handleDeleteHosting = (id) => {
        if (confirm('Are you sure you want to delete this hosting entry?')) {
            router.delete(route('domains.hostings.destroy', id), {
                onSuccess: () => toast.success('Hosting deleted'),
                onError: () => toast.error('Failed to delete hosting'),
            });
        }
    };

    // Format Expiration Date (e.g. 23 Jul 2026)
    const formatDate = (dateStr) => {
        if (!dateStr) return { text: '-', isExpired: false };
        try {
            const d = new Date(dateStr);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const formatted = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
            
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const isExpired = d < now;

            return { text: formatted, isExpired };
        } catch (e) {
            return { text: dateStr, isExpired: false };
        }
    };

    const domainsList = Array.isArray(domains) ? domains : (domains.data || []);
    const hostingsList = Array.isArray(hostings) ? hostings : (hostings.data || []);

    return (
        <AdminLayout title="Websites">
            <Head title="Websites" />

            <div className="w-full space-y-6 font-sans pb-12 bg-slate-50/50 min-h-screen p-3 sm:p-6">
                
                {/* 1. WEBSITES HEADER & NAVIGATION TABS */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
                        Websites
                    </h1>

                    {/* Tabs */}
                    <div className="flex items-center gap-6 border-b border-gray-200">
                        <button
                            type="button"
                            onClick={() => setActiveTab('domains')}
                            className={`pb-3 font-bold text-sm transition-all flex items-center gap-2 relative cursor-pointer ${
                                activeTab === 'domains' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <Globe size={18} />
                            <span>Domains</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                activeTab === 'domains' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {domainsList.length}
                            </span>
                            {activeTab === 'domains' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('hosting')}
                            className={`pb-3 font-bold text-sm transition-all flex items-center gap-2 relative cursor-pointer ${
                                activeTab === 'hosting' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <Server size={18} />
                            <span>Hosting</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                activeTab === 'hosting' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {hostingsList.length}
                            </span>
                            {activeTab === 'hosting' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                            )}
                        </button>
                    </div>
                </div>

                {/* 2. ACTION BAR (Record count & Add button) */}
                <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-gray-500">
                        {activeTab === 'domains' 
                            ? `${domainsList.length} ${domainsList.length === 1 ? 'record' : 'records'}`
                            : `${hostingsList.length} ${hostingsList.length === 1 ? 'record' : 'records'}`}
                    </span>

                    {activeTab === 'domains' ? (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingDomain(null);
                                domainForm.reset();
                                setIsDomainModalOpen(true);
                            }}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus size={16} /> Add Domain
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingHosting(null);
                                hostingForm.reset();
                                setIsHostingModalOpen(true);
                            }}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus size={16} /> Add Hosting
                        </button>
                    )}
                </div>

                {/* 3. TABLES (Exact Match to Screenshots) */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        {activeTab === 'domains' ? (
                            /* DOMAINS TABLE */
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-white">
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">DOMAIN NAME</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">STATUS</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">EXPIRATION DATE</th>
                                        <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-400">AUTO-RENEWAL</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {domainsList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-gray-400">
                                                <Globe size={40} className="mx-auto mb-2 text-gray-300" />
                                                <p className="font-bold text-sm text-gray-700">No domains registered yet.</p>
                                                <p className="text-xs text-gray-400 mt-1">Click "+ Add Domain" above to add domain records.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        domainsList.map((item) => {
                                            const exp = formatDate(item.expiration_date);

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                    
                                                    {/* DOMAIN NAME & PROVIDER */}
                                                    <td className="py-4 px-6">
                                                        <div className="font-extrabold text-gray-900 text-sm">{item.domain_name}</div>
                                                        <div className="text-xs font-medium text-gray-400 mt-0.5">{item.provider || 'GoDaddy'}</div>
                                                    </td>

                                                    {/* STATUS */}
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            <CheckCircle2 size={13} className="text-emerald-500" />
                                                            {item.status || 'Active'}
                                                        </span>
                                                    </td>

                                                    {/* EXPIRATION DATE */}
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        {exp.isExpired ? (
                                                            <div>
                                                                <div className="font-extrabold text-rose-600 text-sm">{exp.text}</div>
                                                                <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-0.5">EXPIRED</div>
                                                            </div>
                                                        ) : (
                                                            <div className="font-extrabold text-gray-900 text-sm">{exp.text}</div>
                                                        )}
                                                    </td>

                                                    {/* AUTO-RENEWAL */}
                                                    <td className="py-4 px-4 whitespace-nowrap">
                                                        {item.auto_renewal ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-600 border border-blue-200">
                                                                <RefreshCw size={12} className="text-blue-500" />
                                                                Auto
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gray-50 text-gray-600 border border-gray-200">
                                                                <XCircle size={12} className="text-gray-400" />
                                                                Manual
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* ACTIONS */}
                                                    <td className="py-4 px-6 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleOpenEditDomain(item)}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                                                title="Edit Domain"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDomain(item.id)}
                                                                className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                                title="Delete Domain"
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
                        ) : (
                            /* HOSTING TABLE */
                            <table className="w-full text-left border-collapse min-w-[950px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-white">
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">SITE / PROVIDER</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">PLAN</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">SERVER IP</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">STATUS</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400">EXPIRATION DATE</th>
                                        <th className="py-5 px-4 text-xs font-extrabold uppercase tracking-wider text-gray-400">AUTO-RENEWAL</th>
                                        <th className="py-5 px-6 text-xs font-extrabold uppercase tracking-wider text-gray-400 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {hostingsList.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-20 text-center text-gray-400">
                                                <Server size={40} className="mx-auto mb-2 text-gray-300" />
                                                <p className="font-bold text-sm text-gray-700">No hosting plans added yet.</p>
                                                <p className="text-xs text-gray-400 mt-1">Click "+ Add Hosting" above to add hosting records.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        hostingsList.map((item) => {
                                            const exp = formatDate(item.expiration_date);

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                                    
                                                    {/* SITE / PROVIDER */}
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                                <Server size={16} />
                                                            </div>
                                                            <div>
                                                                <div className="font-extrabold text-gray-900 text-sm">{item.site_name}</div>
                                                                <div className="text-xs font-medium text-gray-400 mt-0.5">{item.provider || 'Hostinger'}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* PLAN */}
                                                    <td className="py-4 px-6 font-semibold text-gray-800 text-sm">{item.plan || 'Business'}</td>

                                                    {/* SERVER IP */}
                                                    <td className="py-4 px-6 font-mono text-sm text-gray-500">{item.server_ip || '-'}</td>

                                                    {/* STATUS */}
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            <CheckCircle2 size={13} className="text-emerald-500" />
                                                            {item.status || 'Active'}
                                                        </span>
                                                    </td>

                                                    {/* EXPIRATION DATE */}
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        {exp.isExpired ? (
                                                            <div>
                                                                <div className="font-extrabold text-rose-600 text-sm">{exp.text}</div>
                                                                <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-0.5">EXPIRED</div>
                                                            </div>
                                                        ) : (
                                                            <div className="font-extrabold text-gray-900 text-sm">{exp.text}</div>
                                                        )}
                                                    </td>

                                                    {/* AUTO-RENEWAL */}
                                                    <td className="py-4 px-4 whitespace-nowrap">
                                                        {item.auto_renewal ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-600 border border-blue-200">
                                                                <RefreshCw size={12} className="text-blue-500" />
                                                                Auto
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gray-50 text-gray-600 border border-gray-200">
                                                                <XCircle size={12} className="text-gray-400" />
                                                                Manual
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* ACTIONS */}
                                                    <td className="py-4 px-6 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleOpenEditHosting(item)}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                                                title="Edit Hosting"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteHosting(item.id)}
                                                                className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                                title="Delete Hosting"
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
                        )}
                    </div>
                </div>

                {/* 4. ADD / EDIT DOMAIN MODAL */}
                {isDomainModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editingDomain ? 'Edit Domain Record' : 'Add Domain Record'}
                                </h3>
                                <button onClick={() => setIsDomainModalOpen(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleDomainSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Domain Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={domainForm.data.domain_name}
                                        onChange={(e) => domainForm.setData('domain_name', e.target.value)}
                                        placeholder="example.com"
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Provider</label>
                                        <input
                                            type="text"
                                            value={domainForm.data.provider}
                                            onChange={(e) => domainForm.setData('provider', e.target.value)}
                                            placeholder="GoDaddy / Hostinger"
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                                        <select
                                            value={domainForm.data.status}
                                            onChange={(e) => domainForm.setData('status', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Expired">Expired</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expiration Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={domainForm.data.expiration_date}
                                        onChange={(e) => domainForm.setData('expiration_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                                    />
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                    <input
                                        type="checkbox"
                                        id="auto_renewal"
                                        checked={domainForm.data.auto_renewal}
                                        onChange={(e) => domainForm.setData('auto_renewal', e.target.checked)}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                    />
                                    <label htmlFor="auto_renewal" className="text-xs font-bold text-gray-800 cursor-pointer">
                                        Enable Auto-Renewal
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsDomainModalOpen(false)}
                                        className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold uppercase"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={domainForm.processing}
                                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase shadow-md"
                                    >
                                        {domainForm.processing ? 'Saving...' : editingDomain ? 'Update Domain' : 'Add Domain'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 5. ADD / EDIT HOSTING MODAL */}
                {isHostingModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editingHosting ? 'Edit Hosting Record' : 'Add Hosting Record'}
                                </h3>
                                <button onClick={() => setIsHostingModalOpen(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleHostingSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Site / Project Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={hostingForm.data.site_name}
                                        onChange={(e) => hostingForm.setData('site_name', e.target.value)}
                                        placeholder="Nailit By Gayathri"
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Provider *</label>
                                        <input
                                            type="text"
                                            required
                                            value={hostingForm.data.provider}
                                            onChange={(e) => hostingForm.setData('provider', e.target.value)}
                                            placeholder="Hostinger / AWS"
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hosting Plan</label>
                                        <input
                                            type="text"
                                            value={hostingForm.data.plan}
                                            onChange={(e) => hostingForm.setData('plan', e.target.value)}
                                            placeholder="Business / Cloud"
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Server IP</label>
                                        <input
                                            type="text"
                                            value={hostingForm.data.server_ip}
                                            onChange={(e) => hostingForm.setData('server_ip', e.target.value)}
                                            placeholder="192.168.1.1"
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                                        <select
                                            value={hostingForm.data.status}
                                            onChange={(e) => hostingForm.setData('status', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Expired">Expired</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expiration Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={hostingForm.data.expiration_date}
                                        onChange={(e) => hostingForm.setData('expiration_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                                    />
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                    <input
                                        type="checkbox"
                                        id="hosting_auto_renewal"
                                        checked={hostingForm.data.auto_renewal}
                                        onChange={(e) => hostingForm.setData('auto_renewal', e.target.checked)}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                    />
                                    <label htmlFor="hosting_auto_renewal" className="text-xs font-bold text-gray-800 cursor-pointer">
                                        Enable Auto-Renewal
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsHostingModalOpen(false)}
                                        className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold uppercase"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={hostingForm.processing}
                                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase shadow-md"
                                    >
                                        {hostingForm.processing ? 'Saving...' : editingHosting ? 'Update Hosting' : 'Add Hosting'}
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
