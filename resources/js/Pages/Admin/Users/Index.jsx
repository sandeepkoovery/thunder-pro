import React, { useMemo, useState } from "react";
import { usePage, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  User,
  Crown,
  Clock,
  Monitor,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function Index() {
  const { users, departments = [] } = usePage().props;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "user",
    image: null,
    desktop_only: false,
    employee_id: "",
    department_id: "",
    designation: "",
    joining_date: "",
    employment_type: "",
  });
  const [errors, setErrors] = useState({});
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const getLocalYMD = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.includes("T")) {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return "";
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return dateStr.substring(0, 10);
  };

  // Open modal for create or edit
  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setForm({
        name: user.name || "",
        email: user.email || "",
        password: "",
        password_confirmation: "",
        role: user.role || "user",
        image: null,
        desktop_only: !!user.desktop_only,
        employee_id: user.employee_id || "",
        department_id: user.department_id || "",
        designation: user.designation || "",
        joining_date: getLocalYMD(user.joining_date),
        employment_type: user.employment_type || "",
      });
    } else {
      setEditingUser(null);
      setForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "user",
        image: null,
        desktop_only: false,
        employee_id: "",
        department_id: "",
        designation: "",
        joining_date: "",
        employment_type: "",
      });
    }
    setErrors({});
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    setForm({
      ...form,
      [name]: files ? files[0] : type === 'checkbox' ? (checked ? 1 : 0) : value,
    });
  };

  // Validate inputs
  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!editingUser) {
      if (!form.email.trim()) {
        newErrors.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = "Invalid email address.";
      }
    }

    if (!editingUser && !form.password) {
      newErrors.password = "Password is required.";
    }

    if (form.password && form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (form.password !== form.password_confirmation) {
      newErrors.password_confirmation = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save user (create or update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = new FormData();
    Object.keys(form).forEach((key) => {
      if (form[key] !== null && form[key] !== "") {
        data.append(key, form[key]);
      }
    });

    if (editingUser) {
      router.post(
        route("admin.users.update", editingUser.id),
        { _method: "PUT", ...form },
        { forceFormData: true }
      );
    } else {
      router.post(route("admin.users.store"), form, { forceFormData: true });
    }

    closeModal();
  };

  // Delete user
  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = () => {
    router.post(route("admin.users.destroy", deleteId), { _method: "DELETE" });
    setDeleteId(null);
  };

  // Toggle active/inactive status
  const handleToggle = (id) => {
    const url = route("admin.users.toggle", { user: id });

    axios.patch(url)
      .then(() => {
        router.reload({ only: ['users'] });
        toast.success("User status updated successfully!");
      })
      .catch(error => {
        console.error("Error toggling user status:", error);
        toast.error("Failed to update user status.");
      });
  };

  const roles = useMemo(
    () => [...new Set(users.map((user) => user.role).filter(Boolean))].sort(),
    [users]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchTerm = search.trim().toLowerCase();
      const matchesSearch =
        !searchTerm ||
        [
          user.name,
          user.employee_id,
          user.email,
          user.designation,
          user.mobile,
          user.role,
        ]
          .filter(Boolean)
          .some((value) => value.toString().toLowerCase().includes(searchTerm));

      const matchesRole =
        roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Client-side pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredUsers.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredUsers, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(paginatedUsers.map((u) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
  };

  // Helper to render user avatar with initials styled nicely
  const renderAvatar = (user) => {
    if (user.image_url) {
      return (
        <img
          src={user.image_url}
          alt={user.name}
          className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0"
        />
      );
    }
    const initials = user.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U";

    // Random styling helper for avatar placeholder bg
    const bgColors = [
      "bg-emerald-50 text-emerald-600",
      "bg-sky-50 text-sky-600",
      "bg-rose-50 text-rose-600",
      "bg-amber-50 text-amber-600",
      "bg-indigo-50 text-indigo-600",
    ];
    const charCode = user.name ? user.name.charCodeAt(0) : 0;
    const colorClass = bgColors[charCode % bgColors.length];

    return (
      <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
        {initials}
      </div>
    );
  };

  // Helper for role display with custom icons & colors as seen in the screenshot
  const renderRole = (role) => {
    const formatted = role.charAt(0).toUpperCase() + role.slice(1);
    if (role === "admin" || role === "superadmin") {
      return (
        <span className="inline-flex items-center gap-2 text-[15px] text-gray-700">
          <Monitor size={17} className="text-red-500" strokeWidth={1.8} />
          {formatted}
        </span>
      );
    }
    if (role === "manager") {
      return (
        <span className="inline-flex items-center gap-2 text-[15px] text-gray-700">
          <Crown size={17} className="text-blue-500" strokeWidth={1.8} />
          {formatted}
        </span>
      );
    }
    if (role === "editor") {
      return (
        <span className="inline-flex items-center gap-2 text-[15px] text-gray-700">
          <Clock size={17} className="text-cyan-500" strokeWidth={1.8} />
          {formatted}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 text-[15px] text-gray-700">
        <User size={17} className="text-emerald-500" strokeWidth={1.8} />
        {formatted}
      </span>
    );
  };

  return (
    <AdminLayout title="Employees Management">
      <div className="p-6 w-full space-y-6 font-sans">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Employees List</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Manage employee profiles, view roles, and handle statuses.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-[#1e88e5] text-white rounded-2xl font-bold uppercase tracking-wider text-[11px] hover:bg-[#1565c0] transition-colors shadow-lg shadow-[#1e88e5]/25"
            >
              + Add Employee
            </button>
          </div>
        </div>

        {/* Filter Toolbar exactly styled like the screenshot */}
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

          {/* Search, Role and Status filters */}
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
                placeholder="Search Employee"
              />
              <Search className="absolute left-4 top-3.5 text-gray-400" size={16} />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-44 border border-gray-200 pl-4 pr-10 py-2.5 rounded-2xl bg-white text-[15px] font-medium focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-[size:18px] bg-no-repeat"
            >
              <option value="all">Select Role</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-44 border border-gray-200 pl-4 pr-10 py-2.5 rounded-2xl bg-white text-[15px] font-medium focus:outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-[size:18px] bg-no-repeat"
            >
              <option value="all">Select Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Datatable Wrapper — desktop */}
        <div className="hidden sm:block bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[13px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <th className="py-4 px-6 w-12 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        paginatedUsers.length > 0 &&
                        selectedUsers.length === paginatedUsers.length
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/25"
                    />
                  </th>
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Designation</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/25"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {renderAvatar(user)}
                        <div>
                          <Link
                            href={route("admin.users.show", user.id)}
                            className="font-bold text-gray-800 text-[15px] hover:text-[#1e88e5] transition-colors"
                          >
                            {user.name}
                          </Link>
                          <p className="text-sm text-gray-400 font-medium mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">{renderRole(user.role)}</td>
                    <td className="py-4 px-6 text-[15px] text-gray-700 font-medium">
                      {user.designation || "-"}
                    </td>
                    <td className="py-4 px-6 text-[15px] text-gray-700 font-medium">
                      {user.department?.name || "-"}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggle(user.id)}
                        className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-bold transition-all hover:opacity-80 capitalize ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                            : "bg-gray-100 text-gray-500 border border-gray-200/50"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2.5 text-gray-400">
                        <button
                          onClick={() => confirmDelete(user.id)}
                          className="hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                          title="Delete Employee"
                        >
                          <Trash2 size={16} />
                        </button>
                        <Link
                          href={route("admin.users.show", user.id)}
                          className="hover:text-blue-500 transition-colors p-1.5 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => openModal(user)}
                          className="hover:text-gray-700 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
                          title="Edit Employee"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400 font-medium">
                      No matching employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Datatable Footer exactly matching screen pagination */}
          {filteredUsers.length > 0 && (
            <div className="bg-white px-6 py-5 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-[15px] text-gray-400 font-medium">
                Showing {Math.min((currentPage - 1) * entriesPerPage + 1, filteredUsers.length)} to{" "}
                {Math.min(currentPage * entriesPerPage, filteredUsers.length)} of {filteredUsers.length} entries
              </div>

              {/* Modern Pagination controls */}
              <div className="flex items-center justify-end gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-[15px] font-bold transition-all ${
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
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Employees — mobile card view */}
        <div className="sm:hidden space-y-3">
          {paginatedUsers.length === 0 ? (
            <div className="bg-white rounded-[24px] p-8 text-center text-gray-400 font-medium border border-gray-100 shadow-sm">No matching employees found.</div>
          ) : (
            paginatedUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-4">
                {/* Card header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {renderAvatar(user)}
                    <div>
                      <Link
                        href={route("admin.users.show", user.id)}
                        className="font-bold text-gray-800 text-[15px] hover:text-[#1e88e5] transition-colors"
                      >
                        {user.name}
                      </Link>
                      <div className="text-xs text-gray-400">{user.designation || "No Designation"}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(user.id)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all hover:opacity-80 capitalize ${
                      user.is_active
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                        : "bg-gray-100 text-gray-500 border border-gray-200/50"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
                {/* Details row */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3 bg-gray-50 rounded-xl px-3 py-2 border border-gray-50">
                  <div className="font-semibold text-gray-600">
                    Dept: <span className="font-bold text-gray-800">{user.department?.name || "-"}</span>
                  </div>
                  <div>
                    {renderRole(user.role)}
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex gap-2">
                  <Link
                    href={route("admin.users.show", user.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition"
                    style={{ minHeight: '44px' }}
                  >
                    <Eye size={15} /> Details
                  </Link>
                  <button
                    onClick={() => openModal(user)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition"
                    style={{ minHeight: '44px' }}
                  >
                    <Edit size={15} /> Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(user.id)}
                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                    style={{ minHeight: '44px' }}
                    title="Delete Employee"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Mobile pagination indicators */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 px-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 flex items-center gap-1.5 rounded-xl border border-gray-200 text-gray-600 bg-white text-xs font-bold disabled:opacity-40 transition-colors"
                style={{ minHeight: '40px' }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs text-gray-400 font-bold">Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 flex items-center gap-1.5 rounded-xl border border-gray-200 text-gray-600 bg-white text-xs font-bold disabled:opacity-40 transition-colors"
                style={{ minHeight: '40px' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-start justify-center overflow-y-auto z-50 py-6 sm:py-10 px-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl p-6 sm:p-8 rounded-[28px] shadow-2xl border border-gray-100 space-y-4 my-auto">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? "Edit Employee Details" : "Add New Employee"}
                </h2>
                <p className="text-sm text-gray-400 font-medium mt-0.5">
                  {editingUser ? "Modify employee login information and role permissions" : "Create a new employee with custom dashboard login credentials"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-1">
                
                {/* Account Details Heading */}
                <div className="md:col-span-2 border-b border-gray-100 pb-1.5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Account Information</h3>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`w-full px-5 py-2.5 bg-gray-50/50 border rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800 text-sm ${
                      errors.name ? "border-red-500" : "border-gray-100"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs font-bold ml-1 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={!!editingUser}
                    className={`w-full px-5 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800 text-sm ${
                      errors.email ? "border-red-500" : "border-gray-100"
                    } ${editingUser ? "bg-gray-100 cursor-not-allowed text-gray-400" : "bg-gray-50/50"}`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs font-bold ml-1 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full px-5 py-2.5 bg-gray-50/50 border rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800 text-sm ${
                      errors.password ? "border-red-500" : "border-gray-100"
                    }`}
                    placeholder={editingUser ? "Leave blank to keep" : ""}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs font-bold ml-1 mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={form.password_confirmation}
                    onChange={handleChange}
                    className={`w-full px-5 py-2.5 bg-gray-50/50 border rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800 text-sm ${
                      errors.password_confirmation ? "border-red-500" : "border-gray-100"
                    }`}
                  />
                  {errors.password_confirmation && (
                    <p className="text-red-500 text-xs font-bold ml-1 mt-1">{errors.password_confirmation}</p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full pl-5 pr-10 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl bg-white text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_14px_center] bg-[size:18px] bg-no-repeat"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Desktop Toggle & Profile Image */}
                <div className="space-y-1 flex flex-col justify-end">
                  <div className="flex items-center p-3 bg-gray-50/30 border border-gray-100 rounded-2xl h-[46px]">
                    <input
                      type="checkbox"
                      name="desktop_only"
                      id="desktop_only"
                      checked={!!form.desktop_only}
                      onChange={handleChange}
                      className="w-5 h-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500/25 ml-2"
                    />
                    <label htmlFor="desktop_only" className="ml-3 block text-sm font-bold text-gray-700">
                      Desktop Punch-in Only Restriction
                    </label>
                  </div>
                </div>

                {/* Profile Photo */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Profile Photo</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full px-5 py-2 border border-gray-100 rounded-2xl bg-gray-50/50 text-sm font-medium text-gray-800"
                  />
                </div>

                {/* Company Details Heading */}
                <div className="md:col-span-2 border-b border-gray-100 pb-1.5 pt-1.5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Company Information</h3>
                </div>

                {/* Employee ID */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Employee ID</label>
                  <input
                    type="text"
                    name="employee_id"
                    value={form.employee_id}
                    onChange={handleChange}
                    className="w-full px-5 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800 text-sm"
                    placeholder="Leave blank to auto-generate"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Department</label>
                  <select
                    name="department_id"
                    value={form.department_id}
                    onChange={handleChange}
                    className="w-full pl-5 pr-10 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl bg-white text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_14px_center] bg-[size:18px] bg-no-repeat"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    className="w-full px-5 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800 text-sm"
                    placeholder="Designation"
                  />
                </div>

                {/* Employment Type */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Employment Type</label>
                  <select
                    name="employment_type"
                    value={form.employment_type}
                    onChange={handleChange}
                    className="w-full pl-5 pr-10 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl bg-white text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_14px_center] bg-[size:18px] bg-no-repeat"
                  >
                    <option value="">Select Type</option>
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                {/* Joining Date */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Joining Date</label>
                  <input
                    type="date"
                    name="joining_date"
                    value={form.joining_date}
                    onChange={handleChange}
                    className="w-full px-5 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800 text-sm"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-3 md:col-span-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold uppercase tracking-wider text-[11px] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#1e88e5] hover:bg-[#1565c0] text-white rounded-2xl font-bold uppercase tracking-wider text-[11px] transition-colors shadow-lg shadow-[#1e88e5]/25"
                  >
                    {editingUser ? "Save Changes" : "Create Employee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-[28px] shadow-xl border border-gray-100 w-full max-w-md space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Delete Employee</h2>
                <p className="text-sm text-gray-400 font-medium mt-0.5">Are you sure you want to permanently remove this employee account? This action cannot be undone.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold uppercase tracking-wider text-[11px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold uppercase tracking-wider text-[11px] transition-colors shadow-lg shadow-red-500/25"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
