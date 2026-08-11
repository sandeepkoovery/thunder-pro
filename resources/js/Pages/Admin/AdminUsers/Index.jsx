import React, { useMemo, useState } from "react";
import { usePage, router, Link, Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
  ShieldCheck,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Trash2,
  Crown,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users as UsersIcon,
  SlidersHorizontal,
  Building,
  Check,
  Globe,
  Calendar,
  Sparkles
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
  const [expandedAdminId, setExpandedAdminId] = useState(null);

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

  const getAdminUsersUrl = (path = "") => {
    const prefix = window.location.pathname.includes('/erp_pro/public')
      ? '/erp_pro/public/admin/admin-users'
      : '/admin/admin-users';
    return path ? `${prefix}/${path}` : prefix;
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
    router.patch(route("admin.admin-users.approval", id), { approval_status: newStatus }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`Admin approval status updated to ${newStatus}!`);
      },
      onError: (err) => {
        console.error("Approval change error:", err);
        toast.error("Failed to update approval status.");
      },
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

  const totalPages = Math.ceil(filteredAdmins.length / entriesPerPage) || 1;

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

  const toggleExpand = (id) => {
    setExpandedAdminId(expandedAdminId === id ? null : id);
  };

  return (
    <AdminLayout title="Admin Users">
      <Head title="Admin Users - WorkNest Super Admin" />
      <Toaster position="top-right" />

      <div className="p-4 sm:p-8 w-full space-y-6 font-sans bg-[#f4f6fa] min-h-screen">
        
        {/* 1. TOP HEADER & BAR matching FIGMA UI */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* SEARCH BOX & SELECTED COUNT */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search Task, Admin, Company..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border-0 shadow-sm pl-11 pr-10 py-3 rounded-2xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-[#0066fe]/20 placeholder-gray-400"
              />
              <SlidersHorizontal className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600" size={18} />
            </div>

            {/* SELECTED BADGE */}
            {selectedAdmins.length > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#eef2ff] text-[#0066fe] border border-[#c7d2fe] rounded-2xl text-xs font-bold shrink-0 animate-in fade-in">
                <CheckCircle2 size={15} />
                <span>{selectedAdmins.length} Selected</span>
              </div>
            )}
          </div>

          {/* PRIMARY "+ ADD USER / ADMIN" BUTTON matching FIGMA UI */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={() => openModal()}
              className="bg-[#0066fe] hover:bg-[#0052cc] text-white px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-[#0066fe]/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>+ ADD USER</span>
            </button>
          </div>
        </div>

        {/* 2. STATS & TAB FILTERS ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => { setApprovalFilter("all"); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${approvalFilter === "all" ? "bg-[#f4f6fa] text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
            >
              All Admins ({admins.length})
            </button>
            <button
              onClick={() => { setApprovalFilter("pending"); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${approvalFilter === "pending" ? "bg-[#fff8e6] text-[#b45309] border border-[#fef3c7]" : "text-amber-700 hover:bg-amber-50"}`}
            >
              <Clock size={14} />
              <span>Pending ({pendingCount})</span>
            </button>
            <button
              onClick={() => { setApprovalFilter("approved"); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${approvalFilter === "approved" ? "bg-[#e6f9f0] text-[#10b981] border border-[#c6f6d5]" : "text-emerald-700 hover:bg-emerald-50"}`}
            >
              <CheckCircle2 size={14} />
              <span>Approved ({approvedCount})</span>
            </button>
            <button
              onClick={() => { setApprovalFilter("rejected"); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${approvalFilter === "rejected" ? "bg-[#fef2f2] text-[#ef4444] border border-[#fee2e2]" : "text-rose-700 hover:bg-rose-50"}`}
            >
              <XCircle size={14} />
              <span>Disabled / Rejected</span>
            </button>
          </div>

          {/* Plan filter & entries limit */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#f4f6fa] border-0 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-[#0066fe]/20"
            >
              <option value="all">All Plans</option>
              <option value="basic">Basic Plan</option>
              <option value="premium">Premium Plan</option>
            </select>

            <select
              value={entriesPerPage}
              onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-[#f4f6fa] border-0 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-[#0066fe]/20"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* 3. MAIN FIGMA-STYLED DATATABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-gray-100 bg-white">
                  <th className="py-4 px-5 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedAdmins.length > 0 && selectedAdmins.length === paginatedAdmins.length}
                      className="w-4 h-4 rounded border-gray-300 text-[#0066fe] focus:ring-[#0066fe]"
                    />
                  </th>
                  <th className="py-4 px-5 text-[14px] font-bold text-gray-800">Name</th>
                  <th className="py-4 px-5 text-[14px] font-bold text-gray-800">Position / Admin</th>
                  <th className="py-4 px-5 text-[14px] font-bold text-gray-800">Plan &amp; Modules</th>
                  <th className="py-4 px-5 text-[14px] font-bold text-gray-800">Email</th>
                  <th className="py-4 px-5 text-[14px] font-bold text-gray-800">Linked Employees</th>
                  <th className="py-4 px-5 text-[14px] font-bold text-gray-800">Status</th>
                  <th className="py-4 px-5 text-[14px] font-bold text-gray-800 text-center">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {paginatedAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400 font-medium">
                      No admin accounts found matching your query.
                    </td>
                  </tr>
                ) : (
                  paginatedAdmins.map((admin) => {
                    const isExpanded = expandedAdminId === admin.id;
                    const isChecked = selectedAdmins.includes(admin.id);
                    const isPending = admin.approval_status === "pending";
                    const isApproved = admin.approval_status === "approved" && admin.is_active;

                    return (
                      <React.Fragment key={admin.id}>
                        <tr className={`transition-colors hover:bg-gray-50/60 ${isExpanded ? 'bg-[#f4f8ff]' : isChecked ? 'bg-[#f0f5ff]' : 'bg-white'}`}>
                          
                          {/* CHECKBOX & CHEVRON */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSelectAdmin(admin.id)}
                                className="w-4 h-4 rounded border-gray-300 text-[#0066fe] focus:ring-[#0066fe]"
                              />
                              <button
                                onClick={() => toggleExpand(admin.id)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                                title="Expand Details"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          </td>

                          {/* NAME & AVATAR (Company Name & Logo) */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0 uppercase">
                                {admin.company_name ? admin.company_name.charAt(0) : (admin.name ? admin.name.charAt(0) : 'A')}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800 text-[14px]">
                                  {admin.company_name || admin.name}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* POSITION / ADMIN */}
                          <td className="py-4 px-5 text-gray-500 text-[13px] whitespace-nowrap">
                            {admin.name || 'Workspace Admin'}
                          </td>

                          {/* PLAN & MODULES */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {admin.plan === "premium" ? (
                                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#f3e8ff] text-[#7e22ce] border border-[#e9d5ff]">
                                  Premium Plan
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                  Basic Plan
                                </span>
                              )}
                              
                              {Array.isArray(admin.additional_modules) && admin.additional_modules.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                  +{admin.additional_modules.length} Mods
                                </span>
                              )}
                            </div>
                          </td>

                          {/* EMAIL */}
                          <td className="py-4 px-5 text-gray-500 text-[13px] whitespace-nowrap">
                            {admin.email}
                          </td>

                          {/* LINKED EMPLOYEES */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-extrabold text-xs border border-slate-200">
                              <UsersIcon size={13} className="text-slate-500" />
                              {admin.users_count || 0} Users
                            </span>
                          </td>

                          {/* STATUS (PASTEL BADGES MATCHING FIGMA UI) */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            {isApproved ? (
                              <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#e6f9f0] text-[#10b981] border border-[#c6f6d5]/50 inline-block">
                                Approved / Active
                              </span>
                            ) : isPending ? (
                              <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#fff8e6] text-[#b45309] border border-[#fef3c7]/50 inline-block">
                                Pending Approval
                              </span>
                            ) : (
                              <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#fef2f2] text-[#ef4444] border border-[#fee2e2]/50 inline-block">
                                Disabled / Rejected
                              </span>
                            )}
                          </td>

                          {/* ACTION BUTTONS matching FIGMA UI */}
                          <td className="py-4 px-5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openModal(admin)}
                                className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200/60 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
                                title="Edit Admin"
                              >
                                <Edit2 size={14} />
                              </button>
                              
                              <button
                                onClick={() => setDeleteId(admin.id)}
                                className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200/60 flex items-center justify-center text-gray-500 hover:text-rose-600 transition-all cursor-pointer"
                                title="Delete Admin"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* EXPANDED ROW DETAILS DRAWER STYLED LIKE FIGMA */}
                        {isExpanded && (
                          <tr className="bg-[#f4f8ff] border-b border-[#d0e2ff]">
                            <td colSpan={8} className="p-5">
                              <div className="bg-white rounded-2xl p-5 border border-[#d0e2ff] shadow-sm grid grid-cols-2 md:grid-cols-5 gap-6 text-xs">
                                <div>
                                  <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Company Workspace</span>
                                  <span className="font-extrabold text-gray-900 text-sm">{admin.company_name || '-'}</span>
                                </div>

                                <div>
                                  <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Administrator</span>
                                  <span className="font-semibold text-gray-800">{admin.name || '-'}</span>
                                </div>

                                <div>
                                  <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Phone Number</span>
                                  <span className="font-semibold text-gray-800">{admin.phone || '(252) 555-0126'}</span>
                                </div>

                                <div>
                                  <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Enabled Add-ons</span>
                                  <span className="font-medium text-gray-700">
                                    {Array.isArray(admin.additional_modules) && admin.additional_modules.length > 0
                                      ? admin.additional_modules.join(', ')
                                      : 'None'}
                                  </span>
                                </div>

                                <div className="flex items-center justify-end gap-2 col-span-2 md:col-span-1">
                                  {admin.approval_status === "pending" ? (
                                    <button
                                      onClick={() => handleApprovalChange(admin.id, "approved")}
                                      className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs shadow-sm cursor-pointer"
                                    >
                                      Approve Workspace
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleApprovalChange(admin.id, "pending")}
                                      className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs cursor-pointer"
                                    >
                                      Set Pending
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 4. PAGINATION FOOTER matching FIGMA UI */}
          <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
            <div>
              <span>
                {filteredAdmins.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} - {Math.min(currentPage * entriesPerPage, filteredAdmins.length)} of {filteredAdmins.length} admins
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. CREATE / EDIT ADMIN MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {editingAdmin ? "Edit Workspace Admin Account" : "Create New Admin Account"}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Configure workspace admin credentials, subscription plan, and approval status.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Company Name *</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleFormChange}
                    placeholder="Acme Corp"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#0066fe]/20"
                  />
                </div>
                {errors.company_name && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.company_name}</p>}
              </div>

              {/* Admin Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Admin Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Administrator Name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0066fe]/20"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-gray-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="admin@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0066fe]/20"
                  />
                </div>
                {errors.email && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.email}</p>}
              </div>

              {/* Password & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Password {editingAdmin ? "(Leave blank)" : "*"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 text-gray-400" size={18} />
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleFormChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0066fe]/20"
                    />
                  </div>
                  {errors.password && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0066fe]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Subscription Plan *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, plan: "basic" }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${form.plan === "basic" ? "border-[#0066fe] bg-[#eef2ff] text-[#0066fe] ring-2 ring-[#0066fe]/20 font-bold" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="font-bold text-sm">Basic Plan</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 font-medium">Core features</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, plan: "premium" }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${form.plan === "premium" ? "border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20 font-bold" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="font-bold text-sm flex items-center gap-1">
                      <Crown size={14} className="text-purple-600" />
                      Premium Plan
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 font-medium">Full access + add-ons</div>
                  </button>
                </div>
              </div>

              {/* Additional Modules Selection */}
              {form.plan === "premium" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Enabled Additional Modules</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 max-h-36 overflow-y-auto">
                    {availableAdditionalModules.map((mod) => {
                      const isChecked = (form.additional_modules || []).includes(mod.key);
                      return (
                        <label key={mod.key} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleModuleToggle(mod.key)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="truncate uppercase text-[11px]">{mod.name || mod.key}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Approval Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Approval Status *</label>
                <select
                  name="approval_status"
                  value={form.approval_status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066fe]/20 cursor-pointer"
                >
                  <option value="approved">Approved (Active Access)</option>
                  <option value="pending">Pending Approval (Blocked Login)</option>
                  <option value="rejected">Disabled / Rejected</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0066fe] hover:bg-[#0052cc] text-white font-bold text-xs uppercase shadow-md shadow-[#0066fe]/20 transition-all cursor-pointer"
                >
                  {editingAdmin ? "Save Changes" : "Create Admin Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto font-bold">
              <AlertCircle size={24} />
            </div>

            <h4 className="text-lg font-black text-gray-900">Delete Admin Account?</h4>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Are you sure you want to delete this administrator account and all associated employee records? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex-1 shadow-md shadow-rose-500/20 cursor-pointer"
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
