import React, { useMemo, useState } from "react";
import { usePage, router, Link, Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
  ShieldCheck,
  Building,
  User,
  Mail,
  Phone,
  Lock,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Edit,
  Trash2,
  Crown,
  Sparkles,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function Index() {
  const { admins = [], availableAdditionalModules = [] } = usePage().props;

  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all"); // 'all', 'pending', 'approved', 'rejected'
  const [planFilter, setPlanFilter] = useState("all"); // 'all', 'basic', 'premium'
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState({
    company_name: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    plan: "basic",
    additional_modules: [],
    approval_status: "approved",
  });
  const [errors, setErrors] = useState({});
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  // Open modal for Create / Edit
  const openModal = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setForm({
        company_name: admin.company_name || "",
        name: admin.name || "",
        email: admin.email || "",
        password: "",
        phone: admin.phone || "",
        plan: admin.plan || "basic",
        additional_modules: Array.isArray(admin.additional_modules) ? admin.additional_modules : [],
        approval_status: admin.approval_status || "approved",
      });
    } else {
      setEditingAdmin(null);
      setForm({
        company_name: "",
        name: "",
        email: "",
        password: "",
        phone: "",
        plan: "basic",
        additional_modules: [],
        approval_status: "approved",
      });
    }
    setErrors({});
    setIsOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleModuleToggle = (moduleKey) => {
    setForm((prev) => {
      const current = prev.additional_modules || [];
      const updated = current.includes(moduleKey)
        ? current.filter((k) => k !== moduleKey)
        : [...current, moduleKey];
      return { ...prev, additional_modules: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    if (editingAdmin) {
      router.put(route("admin.admin-users.update", editingAdmin.id), form, {
        onSuccess: () => {
          setIsOpen(false);
          toast.success("Admin account updated successfully!");
        },
        onError: (err) => {
          setErrors(err);
        },
      });
    } else {
      router.post(route("admin.admin-users.store"), form, {
        onSuccess: () => {
          setIsOpen(false);
          toast.success("New Admin account created successfully!");
        },
        onError: (err) => {
          setErrors(err);
        },
      });
    }
  };

  // Change approval status
  const handleApprovalChange = (id, newStatus) => {
    axios
      .patch(route("admin.admin-users.approval", id), { approval_status: newStatus })
      .then(() => {
        router.reload({ only: ["admins"] });
        toast.success(`Admin approval status updated to ${newStatus}!`);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to update approval status.");
      });
  };

  // Toggle active status
  const handleToggleActive = (id) => {
    axios
      .patch(route("admin.admin-users.toggle", id))
      .then(() => {
        router.reload({ only: ["admins"] });
        toast.success("Admin active status toggled!");
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to toggle admin status.");
      });
  };

  // Delete handler
  const handleConfirmDelete = () => {
    if (!deleteId) return;
    router.delete(route("admin.admin-users.destroy", deleteId), {
      onSuccess: () => {
        setDeleteId(null);
        toast.success("Admin account deleted successfully.");
      },
      onError: () => {
        toast.error("Failed to delete admin account.");
      },
    });
  };

  // Filtering & Search
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const searchTerm = search.trim().toLowerCase();
      const matchesSearch =
        !searchTerm ||
        [
          admin.name,
          admin.company_name,
          admin.email,
          admin.phone,
          admin.plan,
        ]
          .filter(Boolean)
          .some((val) => val.toString().toLowerCase().includes(searchTerm));

      const matchesApproval =
        approvalFilter === "all" || admin.approval_status === approvalFilter;

      const matchesPlan =
        planFilter === "all" || admin.plan === planFilter;

      return matchesSearch && matchesApproval && matchesPlan;
    });
  }, [admins, search, approvalFilter, planFilter]);

  // Client-side pagination
  const paginatedAdmins = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredAdmins.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredAdmins, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredAdmins.length / entriesPerPage);

  const pendingCount = useMemo(
    () => admins.filter((a) => a.approval_status === "pending").length,
    [admins]
  );

  const approvedCount = useMemo(
    () => admins.filter((a) => a.approval_status === "approved" && a.is_active).length,
    [admins]
  );

  const premiumCount = useMemo(
    () => admins.filter((a) => a.plan === "premium").length,
    [admins]
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAdmins(paginatedAdmins.map((a) => a.id));
    } else {
      setSelectedAdmins([]);
    }
  };

  const handleSelectAdmin = (id) => {
    setSelectedAdmins((prev) =>
      prev.includes(id) ? prev.filter((aId) => aId !== id) : [...prev, id]
    );
  };

  const getDefaultAvatarUrl = () => {
    if (window.location.pathname.includes('/erp_pro/public')) {
      return window.location.origin + '/erp_pro/public/images/default-avatar.jpg';
    }
    return '/images/default-avatar.jpg';
  };

  return (
    <AdminLayout title="Admin Users">
      <Head title="Admin Users - WorkNest Super Admin" />
      <Toaster position="top-right" />

      <div className="space-y-6">
        {/* LIGHT HEADER & ACTION CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-800 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100 mb-3">
                <ShieldCheck size={14} className="text-purple-600" />
                <span>Super Admin Control Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Admin Users</h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Manage workspace administrator accounts, approve newly registered client admins, and configure subscription plans.
              </p>
            </div>

            <button
              onClick={() => openModal()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#7460ee] hover:bg-[#5e45d6] text-white font-bold text-sm shadow-lg shadow-[#7460ee]/25 transition-all active:scale-95 shrink-0"
            >
              <Plus size={18} />
              <span>Create Admin Account</span>
            </button>
          </div>

          {/* LIGHT STATS STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Admins</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{admins.length}</div>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active &amp; Approved</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</div>
            </div>

            <div className={`rounded-2xl p-4 border transition-all ${pendingCount > 0 ? 'border-amber-300 bg-amber-50/80' : 'bg-slate-50/80 border-slate-100'}`}>
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Pending Approval</span>
                {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
              </div>
              <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Premium Subscriptions</div>
              <div className="text-2xl font-black text-purple-600 mt-1">{premiumCount}</div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Approval Status Tab Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl overflow-x-auto">
            <button
              onClick={() => { setApprovalFilter("all"); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${approvalFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              All ({admins.length})
            </button>
            <button
              onClick={() => { setApprovalFilter("pending"); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${approvalFilter === "pending" ? "bg-amber-500 text-white shadow-sm" : "text-amber-600 hover:bg-amber-50"}`}
            >
              <Clock size={14} />
              <span>Pending ({pendingCount})</span>
            </button>
            <button
              onClick={() => { setApprovalFilter("approved"); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${approvalFilter === "approved" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-600 hover:bg-emerald-50"}`}
            >
              <CheckCircle2 size={14} />
              <span>Approved ({approvedCount})</span>
            </button>
            <button
              onClick={() => { setApprovalFilter("rejected"); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${approvalFilter === "rejected" ? "bg-rose-600 text-white shadow-sm" : "text-rose-600 hover:bg-rose-50"}`}
            >
              <XCircle size={14} />
              <span>Disabled / Rejected</span>
            </button>
          </div>

          {/* Search Input & Plan Filter */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search admin, company, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#7460ee]"
              />
            </div>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#7460ee]"
            >
              <option value="all">All Plans</option>
              <option value="basic">Basic Plan</option>
              <option value="premium">Premium Plan</option>
            </select>
          </div>
        </div>

        {/* ADMIN USERS TABLE (Styled like Users Index) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedAdmins.length > 0 && selectedAdmins.length === paginatedAdmins.length}
                      className="rounded border-slate-300 text-[#7460ee] focus:ring-[#7460ee]"
                    />
                  </th>
                  <th className="py-4 px-5">Admin / Company</th>
                  <th className="py-4 px-5">Contact Details</th>
                  <th className="py-4 px-5">Subscription Plan</th>
                  <th className="py-4 px-5 text-center">Employees</th>
                  <th className="py-4 px-5">Approval &amp; Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedAdmins.length > 0 ? (
                  paginatedAdmins.map((admin) => {
                    const isPending = admin.approval_status === "pending";
                    const isApproved = admin.approval_status === "approved" && admin.is_active;

                    return (
                      <tr
                        key={admin.id}
                        className={`hover:bg-slate-50/60 transition-colors ${isPending ? 'bg-amber-50/30' : ''}`}
                      >
                        <td className="py-4 px-5">
                          <input
                            type="checkbox"
                            checked={selectedAdmins.includes(admin.id)}
                            onChange={() => handleSelectAdmin(admin.id)}
                            className="rounded border-slate-300 text-[#7460ee] focus:ring-[#7460ee]"
                          />
                        </td>

                        {/* Admin / Company Info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                              {admin.company_name ? admin.company_name.charAt(0).toUpperCase() : (admin.name ? admin.name.charAt(0).toUpperCase() : 'A')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                <span>{admin.company_name || admin.name}</span>
                              </div>
                              <div className="text-xs text-slate-400 font-medium">
                                Admin: <strong className="text-slate-600">{admin.name}</strong>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td className="py-4 px-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                              <Mail size={13} className="text-slate-400 shrink-0" />
                              <span>{admin.email}</span>
                            </div>
                            {admin.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Phone size={13} className="text-slate-400 shrink-0" />
                                <span>{admin.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Plan & Modules */}
                        <td className="py-4 px-5">
                          <div className="space-y-1">
                            {admin.plan === "premium" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm">
                                <Crown size={13} />
                                PREMIUM
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                BASIC
                              </span>
                            )}

                            {/* Modules tags */}
                            {Array.isArray(admin.additional_modules) && admin.additional_modules.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 max-w-xs">
                                {admin.additional_modules.map((modKey) => (
                                  <span key={modKey} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                                    {modKey}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Employee Users Count */}
                        <td className="py-4 px-5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
                            <User size={13} className="text-slate-400" />
                            {admin.users_count} Users
                          </span>
                        </td>

                        {/* Approval Status Badge */}
                        <td className="py-4 px-5">
                          {admin.approval_status === "approved" && admin.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 size={14} className="text-emerald-600" />
                              Approved
                            </span>
                          ) : admin.approval_status === "pending" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              <Clock size={14} className="text-amber-600" />
                              Pending Approval
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle size={14} className="text-rose-600" />
                              Disabled / Rejected
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* APPROVAL ACTION BUTTONS */}
                            {admin.approval_status === "pending" ? (
                              <button
                                onClick={() => handleApprovalChange(admin.id, "approved")}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                                title="Approve Admin Account"
                              >
                                <CheckCircle2 size={14} />
                                <span>Approve</span>
                              </button>
                            ) : admin.approval_status === "approved" ? (
                              <button
                                onClick={() => handleApprovalChange(admin.id, "pending")}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                                title="Set to Pending"
                              >
                                Set Pending
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApprovalChange(admin.id, "approved")}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                title="Re-approve Admin"
                              >
                                Approve
                              </button>
                            )}

                            {/* EDIT BUTTON */}
                            <button
                              onClick={() => openModal(admin)}
                              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Edit Admin Account & Subscription"
                            >
                              <Edit size={16} />
                            </button>

                            {/* DELETE BUTTON */}
                            <button
                              onClick={() => setDeleteId(admin.id)}
                              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Delete Admin Account"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No admin accounts found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium text-slate-500">
            <div>
              Showing {filteredAdmins.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to{" "}
              {Math.min(currentPage * entriesPerPage, filteredAdmins.length)} of {filteredAdmins.length} admins
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                Page <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong>
              </span>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT ADMIN MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingAdmin ? "Edit Admin & Subscription" : "Create New Admin Account"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure administrator credentials, plan tiers, and approval status.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Company Name *</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleFormChange}
                    placeholder="Acme Corp"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7460ee]"
                  />
                </div>
                {errors.company_name && <p className="text-rose-500 text-xs mt-1">{errors.company_name}</p>}
              </div>

              {/* Admin Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Admin Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Administrator Name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7460ee]"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="admin@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7460ee]"
                  />
                </div>
                {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password {editingAdmin ? "(Leave blank to keep)" : "*"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleFormChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7460ee]"
                    />
                  </div>
                  {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7460ee]"
                    />
                  </div>
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subscription Plan *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, plan: "basic" }))}
                    className={`p-3 rounded-2xl border text-left transition-all ${form.plan === "basic" ? "border-[#7460ee] bg-purple-50/50 text-[#7460ee] ring-2 ring-[#7460ee]/20" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="font-bold text-sm">Basic Plan</div>
                    <div className="text-xs text-slate-500 mt-0.5">Core features, max 10 active users</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, plan: "premium" }))}
                    className={`p-3 rounded-2xl border text-left transition-all ${form.plan === "premium" ? "border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="font-bold text-sm flex items-center gap-1">
                      <Crown size={14} className="text-purple-600" />
                      Premium Plan
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Unlimited users + optional modules</div>
                  </button>
                </div>
              </div>

              {/* Additional Modules Selection (if Premium) */}
              {form.plan === "premium" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Enabled Additional Modules</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 max-h-36 overflow-y-auto">
                    {availableAdditionalModules.map((mod) => {
                      const isChecked = (form.additional_modules || []).includes(mod.key);
                      return (
                        <label key={mod.key} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleModuleToggle(mod.key)}
                            className="rounded border-slate-300 text-[#7460ee] focus:ring-[#7460ee]"
                          />
                          <span className="truncate">{mod.name || mod.key}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Approval Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Approval Status *</label>
                <select
                  name="approval_status"
                  value={form.approval_status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#7460ee]"
                >
                  <option value="approved">Approved (Active Access)</option>
                  <option value="pending">Pending Approval (Blocked Login)</option>
                  <option value="rejected">Rejected / Disabled</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#7460ee] hover:bg-[#5e45d6] text-white font-bold text-xs shadow-lg shadow-[#7460ee]/25 transition-all"
                >
                  {editingAdmin ? "Save Changes" : "Create Admin Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
              <AlertCircle size={24} />
            </div>

            <h4 className="text-lg font-bold text-slate-900 text-center">Delete Admin Account?</h4>
            <p className="text-xs text-slate-500 text-center mt-1">
              Are you sure you want to delete this administrator account and all associated employee records? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex-1 shadow-lg shadow-rose-500/25"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
