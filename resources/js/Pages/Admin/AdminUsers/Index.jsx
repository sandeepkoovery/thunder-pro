import React, { useMemo, useState } from "react";
import { usePage, router, Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
  Edit,
  Trash2,
  User,
  Crown,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Building,
  CheckCircle2,
  Ban,
  Users as UsersIcon,
  Mail,
  Phone,
  Lock,
  AlertCircle,
  Check,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const avatarColor = (name = "") => {
  const colors = [
    "bg-indigo-600 text-white",
    "bg-purple-600 text-white",
    "bg-emerald-600 text-white",
    "bg-blue-600 text-white",
    "bg-rose-600 text-white",
    "bg-amber-600 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return colors[Math.abs(hash) % colors.length];
};

const formatTime12 = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m < 10 ? "0" + m : m} ${ampm}`;
};

const calculateLateCutoff = (startTime, bufferMins) => {
  if (!startTime) return "";
  const [h, m] = startTime.split(":").map(Number);
  const totalMinutes = h * 60 + m + (parseInt(bufferMins, 10) || 0);
  const cutoffH = Math.floor(totalMinutes / 60) % 24;
  const cutoffM = totalMinutes % 60;
  const ampm = cutoffH >= 12 ? "PM" : "AM";
  const h12 = cutoffH % 12 || 12;
  return `${h12}:${cutoffM < 10 ? "0" + cutoffM : cutoffM} ${ampm}`;
};

export default function Index() {
  const { admins = [], availableAdditionalModules = [] } = usePage().props;

  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [isOpen, setIsOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState({
    company_name: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    plan: "basic",
    subscription_status: "trial",
    trial_days: 30,
    additional_modules: [],
    approval_status: "approved",
    casual_leaves: 12,
    sick_leaves: 12,
    office_start_time: "09:00",
    office_end_time: "18:00",
    login_buffer_minutes: 30,
  });
  const [errors, setErrors] = useState({});
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
        subscription_status: admin.is_trial ? "trial" : (admin.subscription_status || "trial"),
        trial_days: (admin.days_left_in_trial && admin.days_left_in_trial > 0) ? admin.days_left_in_trial : 30,
        additional_modules: Array.isArray(admin.additional_modules) ? admin.additional_modules : [],
        approval_status: admin.approval_status || "approved",
        casual_leaves: admin.casual_leaves ?? 12,
        sick_leaves: admin.sick_leaves ?? 12,
        office_start_time: admin.office_start_time || "09:00",
        office_end_time: admin.office_end_time || "18:00",
        login_buffer_minutes: admin.login_buffer_minutes ?? 30,
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
        subscription_status: "trial",
        trial_days: 30,
        additional_modules: [],
        approval_status: "approved",
        casual_leaves: 12,
        sick_leaves: 12,
        office_start_time: "09:00",
        office_end_time: "18:00",
        login_buffer_minutes: 30,
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

  // Change approval status inline
  const handleApprovalChange = (id, newStatus) => {
    router.patch(route("admin.admin-users.approval", id), { approval_status: newStatus }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`Approval status updated to ${newStatus}!`);
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

  // Avatar renderer matching exact employee list avatar style
  const renderAvatar = (admin) => {
    const letter = admin.company_name ? admin.company_name.charAt(0) : (admin.name ? admin.name.charAt(0) : 'A');
    return (
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 uppercase ${avatarColor(admin.company_name || admin.name)}`}>
        {letter}
      </div>
    );
  };

  return (
    <AdminLayout title="Admin Users Management">
      <Head title="Admin Users - WorkNest Super Admin" />
      <Toaster position="top-right" />

      <div className="p-6 w-full space-y-6 font-sans">
        
        {/* Top Header Section matching Employee listing */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Users List</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Manage workspace administrators, view plans, handle approvals, and module access.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-[#1e88e5] hover:bg-[#1565c0] text-white rounded-full font-semibold uppercase tracking-wider text-xs shadow-lg shadow-[#1e88e5]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              + Add Admin User
            </button>
          </div>
        </div>

        {/* Filter Toolbar matching exact Employee listing style */}
        <div className="bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Entries selector */}
          <div className="flex items-center gap-2.5">
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-200 pl-4 pr-10 py-2.5 rounded-2xl bg-white text-[15px] font-medium focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-[size:18px] bg-no-repeat"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Search, Status & Plan filters */}
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto justify-end">
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-200 pl-11 pr-4 py-2.5 rounded-2xl text-[15px] font-medium focus:outline-none focus:border-blue-500"
                placeholder="Search Admin User"
              />
              <Search className="absolute left-4 top-3.5 text-gray-400" size={16} />
            </div>

            <select
              value={approvalFilter}
              onChange={(e) => {
                setApprovalFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-44 border border-gray-200 pl-4 pr-10 py-2.5 rounded-2xl bg-white text-[15px] font-medium focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-[size:18px] bg-no-repeat"
            >
              <option value="all">Select Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Disabled</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-44 border border-gray-200 pl-4 pr-10 py-2.5 rounded-2xl bg-white text-[15px] font-medium focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-[size:18px] bg-no-repeat"
            >
              <option value="all">Select Plan</option>
              <option value="basic">Basic Plan</option>
              <option value="premium">Premium Plan</option>
            </select>
          </div>
        </div>

        {/* Datatable Wrapper — desktop matching exact Employee listing style */}
        <div className="hidden sm:block bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[13px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <th className="py-4 px-6">Workspace / Admin</th>
                  <th className="py-4 px-6">Contact Details</th>
                  <th className="py-4 px-6">Plan &amp; Modules</th>
                  <th className="py-4 px-6 text-center">Employees</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedAdmins.map((admin) => {
                  const isPending = admin.approval_status === "pending";
                  const isApproved = admin.approval_status === "approved" && (admin.is_active ?? true);

                  return (
                    <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {renderAvatar(admin)}
                          <div>
                            <div className="font-bold text-gray-800 text-[15px]">
                              {admin.company_name || admin.name}
                            </div>
                            <p className="text-sm text-gray-400 font-medium mt-0.5">
                              {admin.name || "Main Admin"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="text-[15px] text-gray-700 font-medium">
                            {admin.email}
                          </div>
                          <p className="text-sm text-gray-400 font-medium mt-0.5">
                            {admin.phone || "No phone linked"}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-semibold mt-1 bg-gray-50 px-2 py-0.5 rounded-md w-fit border border-gray-100">
                            <Clock size={11} className="text-[#1e88e5]" />
                            <span>{formatTime12(admin.office_start_time || '09:00')} - {formatTime12(admin.office_end_time || '18:00')}</span>
                            <span className="text-blue-600 font-bold">(+{admin.login_buffer_minutes ?? 30}m)</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {admin.plan === "premium" ? (
                              <span className="inline-flex items-center gap-1 text-[15px] text-purple-700 font-bold">
                                <Crown size={16} className="text-purple-600" />
                                Premium Plan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[15px] text-gray-700 font-medium">
                                <User size={16} className="text-emerald-500" />
                                Basic Plan
                              </span>
                            )}

                            {admin.plan === "premium" && (admin.is_trial || admin.subscription_status === "trial") && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80">
                                🎁 Trial ({admin.days_left_in_trial ?? 30}d left)
                              </span>
                            )}

                            {admin.plan === "premium" && (admin.is_trial_expired || admin.subscription_status === "expired") && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-50 text-red-700 border border-red-200/80">
                                ⚠️ Expired
                              </span>
                            )}
                          </div>

                          {Array.isArray(admin.additional_modules) && admin.additional_modules.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap text-xs text-gray-500 font-medium mt-0.5">
                              {admin.additional_modules.map((m) => (
                                <span key={m} className="bg-gray-100 border border-gray-200/60 px-2 py-0.5 rounded-md uppercase text-[10px] font-bold text-gray-600">
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-[14px] text-gray-600 font-mono font-semibold">
                        <span className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg text-gray-600 text-[13px] inline-flex items-center gap-1">
                          <UsersIcon size={13} className="text-gray-400" />
                          {admin.users_count || 0}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {isApproved ? (
                          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-bold transition-all bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                            Approved
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-bold transition-all bg-amber-50 text-amber-600 border border-amber-100/50">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-bold transition-all bg-gray-100 text-gray-500 border border-gray-200/50">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2.5 text-gray-400">
                          {/* Approval status toggle button */}
                          {admin.approval_status === "pending" ? (
                            <button
                              onClick={() => handleApprovalChange(admin.id, "approved")}
                              className="hover:text-emerald-600 transition-colors p-1.5 hover:bg-emerald-50 rounded-lg"
                              title="Approve Workspace"
                            >
                              <Check size={16} />
                            </button>
                          ) : admin.approval_status === "approved" ? (
                            <button
                              onClick={() => handleApprovalChange(admin.id, "rejected")}
                              className="hover:text-amber-600 transition-colors p-1.5 hover:bg-amber-50 rounded-lg"
                              title="Disable Workspace"
                            >
                              <Ban size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprovalChange(admin.id, "approved")}
                              className="hover:text-emerald-600 transition-colors p-1.5 hover:bg-emerald-50 rounded-lg"
                              title="Enable Workspace"
                            >
                              <Check size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => openModal(admin)}
                            className="hover:text-gray-700 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
                            title="Edit Admin"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => setDeleteId(admin.id)}
                            className="hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                            title="Delete Admin"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400 font-medium">
                      No matching admin accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Datatable Footer matching exact Employee listing pagination style */}
          {filteredAdmins.length > 0 && (
            <div className="bg-white px-6 py-5 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-[15px] text-gray-400 font-medium">
                Showing {Math.min((currentPage - 1) * entriesPerPage + 1, filteredAdmins.length)} to{" "}
                {Math.min(currentPage * entriesPerPage, filteredAdmins.length)} of {filteredAdmins.length} entries
              </div>

              {/* Modern Pagination controls matching Employee list */}
              <div className="flex items-center justify-end gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-[15px] font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-[#1e88e5] text-white shadow-md shadow-[#1e88e5]/25"
                          : "border border-gray-100 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile card view matching Employee listing */}
        <div className="sm:hidden space-y-3">
          {paginatedAdmins.length === 0 ? (
            <div className="bg-white rounded-[24px] p-8 text-center text-gray-400 font-medium border border-gray-100 shadow-sm">
              No matching admin accounts found.
            </div>
          ) : (
            paginatedAdmins.map((admin) => (
              <div key={admin.id} className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {renderAvatar(admin)}
                    <div>
                      <div className="font-bold text-gray-800 text-[15px]">
                        {admin.company_name || admin.name}
                      </div>
                      <div className="text-xs text-gray-400">{admin.email}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    admin.approval_status === "approved"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                      : admin.approval_status === "pending"
                      ? "bg-amber-50 text-amber-600 border border-amber-100/50"
                      : "bg-gray-100 text-gray-500 border border-gray-200/50"
                  }`}>
                    {admin.approval_status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-50">
                  <div className="font-semibold text-gray-600">
                    Plan: <span className="font-bold text-gray-800 uppercase">{admin.plan}</span>
                  </div>
                  <div>
                    Employees: <span className="font-bold text-gray-800">{admin.users_count || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3 bg-gray-50/70 rounded-xl px-3 py-1.5 border border-gray-100">
                  <div className="flex items-center gap-1 font-semibold text-gray-600">
                    <Clock size={12} className="text-[#1e88e5]" />
                    <span>{formatTime12(admin.office_start_time || '09:00')} - {formatTime12(admin.office_end_time || '18:00')}</span>
                  </div>
                  <div className="text-[11px] font-bold text-blue-600">
                    +{admin.login_buffer_minutes ?? 30}m buffer
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(admin)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition"
                    style={{ minHeight: '44px' }}
                  >
                    <Edit size={15} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(admin.id)}
                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                    style={{ minHeight: '44px' }}
                    title="Delete Admin"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE / EDIT ADMIN MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {editingAdmin ? "Edit Admin Account" : "Create New Admin Account"}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Configure company details, plan, and approval status.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Company Workspace Name *</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleFormChange}
                    placeholder="Acme Corp"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>
                {errors.company_name && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.company_name}</p>}
              </div>

              {/* Admin Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Admin Contact Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-blue-500"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-blue-500"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-blue-500"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Annual Leave Quotas for this Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50/70 border border-gray-200 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Annual Casual Leaves (CL)
                  </label>
                  <input
                    type="number"
                    name="casual_leaves"
                    min="0"
                    max="365"
                    value={form.casual_leaves}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Days / year per employee</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Annual Sick Leaves (SL)
                  </label>
                  <input
                    type="number"
                    name="sick_leaves"
                    min="0"
                    max="365"
                    value={form.sick_leaves}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-bold bg-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Days / year per employee</p>
                </div>
              </div>

              {/* Office Hours & Login Buffer */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#1e88e5]" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Office Hours &amp; Buffer</span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                    Late Cutoff: {calculateLateCutoff(form.office_start_time, form.login_buffer_minutes)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="office_start_time"
                      value={form.office_start_time}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold bg-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">e.g. 09:00 AM</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      name="office_end_time"
                      value={form.office_end_time}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold bg-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">e.g. 06:00 PM</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Buffer (Minutes)
                    </label>
                    <input
                      type="number"
                      name="login_buffer_minutes"
                      min="0"
                      max="180"
                      value={form.login_buffer_minutes}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold bg-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">Grace period in mins</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-blue-100 text-[11px] text-gray-600 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓ On-Time:</span>
                  <span>
                    Punch-in before or at <strong className="text-gray-900">{calculateLateCutoff(form.office_start_time, form.login_buffer_minutes)}</strong> is marked on-time. After that is marked <strong className="text-amber-600">Late Punch</strong>.
                  </span>
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Subscription Plan *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, plan: "basic" }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      form.plan === "basic"
                        ? "border-[#1e88e5] bg-blue-50/60 text-[#1e88e5] ring-2 ring-[#1e88e5]/20 font-bold"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-bold text-sm">Basic Plan</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 font-medium">Core HR features</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, plan: "premium" }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      form.plan === "premium"
                        ? "border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20 font-bold"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-bold text-sm flex items-center gap-1">
                      <Crown size={14} className="text-purple-600" />
                      Premium Plan
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 font-medium">Full modules &amp; add-ons</div>
                  </button>
                </div>
              </div>

              {/* Additional Modules Selection */}
              {form.plan === "premium" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Enabled Additional Modules</label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 max-h-36 overflow-y-auto">
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

              {/* Premium Subscription & Trial Status */}
              {form.plan === "premium" && (
                <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Premium Subscription &amp; Trial</span>
                    {form.subscription_status === "trial" ? (
                      <span className="text-[11px] font-extrabold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                        🎁 Free Trial ({form.trial_days || 30} days)
                      </span>
                    ) : (
                      <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ✓ Active Paid
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, subscription_status: "trial" }))}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        form.subscription_status === "trial"
                          ? "border-amber-500 bg-amber-50/80 text-amber-900 font-bold ring-2 ring-amber-400/30"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>🎁 30-Day Free Trial</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">Trial period before paid</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, subscription_status: "active" }))}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        form.subscription_status === "active"
                          ? "border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold ring-2 ring-emerald-400/30"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>✓ Active Paid</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">Paid subscription</p>
                    </button>
                  </div>

                  {form.subscription_status === "trial" && (
                    <div className="bg-white p-2.5 rounded-xl border border-purple-100 flex items-center justify-between gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                          Trial Duration / Days Remaining
                        </label>
                        <p className="text-[10px] text-gray-400">Number of days workspace access is granted under trial</p>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          name="trial_days"
                          min="1"
                          max="365"
                          value={form.trial_days}
                          onChange={handleFormChange}
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold text-center bg-gray-50 focus:bg-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Approval Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Approval Status *</label>
                <select
                  name="approval_status"
                  value={form.approval_status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
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
                  className="px-6 py-2.5 rounded-xl bg-[#1e88e5] hover:bg-[#1565c0] text-white font-semibold text-xs uppercase tracking-wider shadow-md shadow-[#1e88e5]/20 transition-all cursor-pointer"
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
