import React, { useState, useEffect } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Edit, Trash2, Plus, X, CheckCircle, AlertCircle, Globe, Server, RefreshCw, XCircle } from "lucide-react";

// ── Shared helpers ────────────────────────────────────────────────────────────
const isExpired = (d) => { if (!d) return false; const e=new Date(d),t=new Date(); e.setHours(0,0,0,0); t.setHours(0,0,0,0); return e<t; };
const isExpiringSoon = (d) => { if (!d) return false; const e=new Date(d),t=new Date(); e.setHours(0,0,0,0); t.setHours(0,0,0,0); if(e<t) return false; const m=new Date(t); m.setMonth(t.getMonth()+1); return e<=m; };
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const statusClass = (s) => ({Active:"bg-green-100 text-green-700",Expired:"bg-red-100 text-red-700",Suspended:"bg-orange-100 text-orange-700",Transferred:"bg-blue-100 text-blue-700"}[s]??"bg-gray-100 text-gray-700");

// ── Expiry cell ───────────────────────────────────────────────────────────────
function ExpiryCell({ date }) {
    const exp = isExpired(date), soon = isExpiringSoon(date);
    return (
        <td className="p-4">
            <span className={`font-medium ${exp?"text-red-600":soon?"text-orange-600 font-bold":"text-gray-700"}`}>{fmtDate(date)}</span>
            {exp  && <div className="text-[10px] text-red-500    font-bold uppercase mt-1">Expired</div>}
            {soon && <div className="text-[10px] text-orange-500 font-bold uppercase mt-1">Expiring Soon</div>}
        </td>
    );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    return (
        <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded-full text-xs font-medium ${statusClass(status)}`}>
            {status==="Active"?<CheckCircle className="w-3 h-3"/>:<AlertCircle className="w-3 h-3"/>}
            {status}
        </span>
    );
}

// ── Auto Renewal badge ──────────────────────────────────────────────────────────
function AutoRenewalBadge({ enabled }) {
    return enabled ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3 h-3 animate-spin-slow" />
            Auto
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
            <XCircle className="w-3 h-3" />
            Manual
        </span>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// DOMAINS TAB
// ══════════════════════════════════════════════════════════════════════════════
function DomainsTab({ domains }) {
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, reset, errors, clearErrors } = useForm({
        domain_name:"", status:"Active", expiration_date:"", auto_renewal:true, provider:"",
    });

    const open = (d=null) => { reset(); clearErrors(); if(d){setEditing(d);setData({domain_name:d.domain_name,status:d.status,expiration_date:d.expiration_date?.split("T")[0]??"",auto_renewal:!!d.auto_renewal,provider:d.provider??""});}else setEditing(null); setShowModal(true); };
    const close = () => { reset(); clearErrors(); setShowModal(false); };
    const submit = (e) => { e.preventDefault(); editing ? put(route("admin.domains.update",editing.id),{onSuccess:close}) : post(route("admin.domains.store"),{onSuccess:close}); };

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">{domains.length} record{domains.length!==1?"s":""}</p>
                <button onClick={()=>open()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition text-sm">
                    <Plus className="w-4 h-4"/> Add Domain
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                                <th className="p-4 text-left">Domain Name</th>
                                <th className="p-4 text-left">Status</th>
                                <th className="p-4 text-left">Expiration Date</th>
                                <th className="p-4 text-left">Auto-renewal</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {domains.length>0 ? domains.map(d=>(
                                <tr key={d.id} className="border-t hover:bg-gray-50 transition">
                                    <td className="p-4"><div className="font-semibold text-gray-900">{d.domain_name}</div>{d.provider&&<div className="text-xs text-gray-500">{d.provider}</div>}</td>
                                    <td className="p-4"><StatusBadge status={d.status}/></td>
                                    <ExpiryCell date={d.expiration_date}/>
                                    <td className="p-4"><AutoRenewalBadge enabled={d.auto_renewal}/></td>
                                    <td className="p-4"><div className="flex justify-center gap-2">
                                        <button onClick={()=>open(d)} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Edit"><Edit className="w-4 h-4"/></button>
                                        <button onClick={()=>setDeleteId(d.id)} className="p-1 hover:bg-red-50 rounded text-red-600" title="Delete"><Trash2 className="w-4 h-4"/></button>
                                    </div></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500 italic">No domains found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">{editing?"Edit Domain":"Add New Domain"}</h2>
                            <button onClick={close} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-500"/></button>
                        </div>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Domain Name</label>
                                <input type="text" required value={data.domain_name} onChange={e=>setData("domain_name",e.target.value)} placeholder="example.com" className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.domain_name?"border-red-500":"border-gray-300"}`}/>
                                {errors.domain_name&&<p className="text-red-500 text-xs mt-1">{errors.domain_name}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                    <select value={data.status} onChange={e=>setData("status",e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option>Active</option><option>Inactive</option><option>Expired</option><option>Transferred</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expiration Date</label>
                                    <input type="date" required value={data.expiration_date} onChange={e=>setData("expiration_date",e.target.value)} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.expiration_date?"border-red-500":"border-gray-300"}`}/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Provider</label>
                                <input type="text" value={data.provider} onChange={e=>setData("provider",e.target.value)} placeholder="GoDaddy, Namecheap..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                            </div>
                            <div className="flex items-center gap-2 py-1">
                                <input type="checkbox" id="d_auto_renewal" checked={data.auto_renewal} onChange={e=>setData("auto_renewal",e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded"/>
                                <label htmlFor="d_auto_renewal" className="text-sm font-medium text-gray-700">Enable Auto-renewal</label>
                            </div>
                            <div className="flex gap-3 pt-4 border-t">
                                <button type="button" onClick={close} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">{editing?"Update Domain":"Add Domain"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
                        <h2 className="text-lg font-bold mb-2">Confirm Delete</h2>
                        <p className="text-gray-600 mb-6">Delete this domain? This cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={()=>setDeleteId(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={()=>router.delete(route("admin.domains.destroy",deleteId),{onSuccess:()=>setDeleteId(null)})} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOSTING TAB
// ══════════════════════════════════════════════════════════════════════════════
function HostingTab({ hostings }) {
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, reset, errors, clearErrors } = useForm({
        site_name:"", provider:"", plan:"", server_ip:"", status:"Active",
        expiration_date:"", auto_renewal:true, price:"", notes:"",
    });

    const open = (h=null) => { reset(); clearErrors(); if(h){setEditing(h);setData({site_name:h.site_name,provider:h.provider,plan:h.plan??"",server_ip:h.server_ip??"",status:h.status,expiration_date:h.expiration_date?.split("T")[0]??"",auto_renewal:!!h.auto_renewal,price:h.price??"",notes:h.notes??""});}else setEditing(null); setShowModal(true); };
    const close = () => { reset(); clearErrors(); setShowModal(false); };
    const submit = (e) => { e.preventDefault(); editing ? put(route("admin.hostings.update",editing.id),{onSuccess:close}) : post(route("admin.hostings.store"),{onSuccess:close}); };

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">{hostings.length} record{hostings.length!==1?"s":""}</p>
                <button onClick={()=>open()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition text-sm">
                    <Plus className="w-4 h-4"/> Add Hosting
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
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
                            {hostings.length>0 ? hostings.map(h=>(
                                <tr key={h.id} className="border-t hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Server className="w-4 h-4 text-blue-500 shrink-0"/>
                                            <div><div className="font-semibold text-gray-900">{h.site_name}</div><div className="text-xs text-gray-500">{h.provider}</div></div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-700">{h.plan||<span className="text-gray-400 italic">—</span>}</td>
                                    <td className="p-4 text-sm font-mono text-gray-700">{h.server_ip||<span className="text-gray-400 italic">—</span>}</td>
                                    <td className="p-4"><StatusBadge status={h.status}/></td>
                                    <ExpiryCell date={h.expiration_date}/>
                                    <td className="p-4"><AutoRenewalBadge enabled={h.auto_renewal}/></td>
                                    <td className="p-4"><div className="flex justify-center gap-2">
                                        <button onClick={()=>open(h)} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Edit"><Edit className="w-4 h-4"/></button>
                                        <button onClick={()=>setDeleteId(h.id)} className="p-1 hover:bg-red-50 rounded text-red-600" title="Delete"><Trash2 className="w-4 h-4"/></button>
                                    </div></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500 italic">No hosting records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">{editing?"Edit Hosting":"Add New Hosting"}</h2>
                            <button onClick={close} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-500"/></button>
                        </div>
                        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Site Name *</label>
                                <input type="text" required value={data.site_name} onChange={e=>setData("site_name",e.target.value)} placeholder="example.com" className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.site_name?"border-red-500":"border-gray-300"}`}/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Provider *</label>
                                    <input type="text" required value={data.provider} onChange={e=>setData("provider",e.target.value)} placeholder="SiteGround, Hostinger…" className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.provider?"border-red-500":"border-gray-300"}`}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Plan</label>
                                    <input type="text" value={data.plan} onChange={e=>setData("plan",e.target.value)} placeholder="Basic, Pro…" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Server IP</label>
                                    <input type="text" value={data.server_ip} onChange={e=>setData("server_ip",e.target.value)} placeholder="192.168.1.1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
                                    <input type="number" min="0" step="0.01" value={data.price} onChange={e=>setData("price",e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                    <select value={data.status} onChange={e=>setData("status",e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option>Active</option><option>Suspended</option><option>Expired</option><option>Transferred</option><option>Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expiration Date *</label>
                                    <input type="date" required value={data.expiration_date} onChange={e=>setData("expiration_date",e.target.value)} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.expiration_date?"border-red-500":"border-gray-300"}`}/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                                <textarea rows={2} value={data.notes} onChange={e=>setData("notes",e.target.value)} placeholder="Any additional info…" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"/>
                            </div>
                            <div className="flex items-center gap-2 py-1">
                                <input type="checkbox" id="h_auto_renewal" checked={data.auto_renewal} onChange={e=>setData("auto_renewal",e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded"/>
                                <label htmlFor="h_auto_renewal" className="text-sm font-medium text-gray-700">Enable Auto-renewal</label>
                            </div>
                            <div className="flex gap-3 pt-4 border-t">
                                <button type="button" onClick={close} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">{editing?"Update Hosting":"Add Hosting"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
                        <h2 className="text-lg font-bold mb-2">Confirm Delete</h2>
                        <p className="text-gray-600 mb-6">Delete this hosting record? This cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={()=>setDeleteId(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={()=>router.delete(route("admin.hostings.destroy",deleteId),{onSuccess:()=>setDeleteId(null)})} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function Index({ domains, hostings, tab: initialTab }) {
    const [activeTab, setActiveTab] = useState(initialTab ?? "domains");

    const tabs = [
        { key: "domains",  label: "Domains",  icon: Globe,  count: domains.length },
        { key: "hosting",  label: "Hosting",  icon: Server, count: hostings.length },
    ];

    return (
        <AdminLayout title="Websites">
            <Head title="Websites" />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Websites</h1>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200 mb-6 gap-6">
                {tabs.map(({ key, label, icon: Icon, count }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 pb-4 border-b-2 font-medium text-sm transition-all relative
                            ${activeTab === key
                                ? "border-blue-600 text-blue-600 font-semibold"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ml-1 transition-colors
                            ${activeTab === key
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                        >
                            {count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-w-0">
                {activeTab === "domains" && <DomainsTab domains={domains}/>}
                {activeTab === "hosting"  && <HostingTab hostings={hostings}/>}
            </div>
        </AdminLayout>
    );
}
