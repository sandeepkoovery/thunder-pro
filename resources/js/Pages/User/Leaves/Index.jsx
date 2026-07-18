import React, { useState, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import UserLayout from "@/Layouts/UserLayout";
import { Eye, Plus, X, Calendar, FileText, Trash2 } from "lucide-react";

export default function UserLeaves() {
  const { props } = usePage();
  const initialLeaves = props.leaves || [];
  const filters = props.filters || {};

  const [leaves, setLeaves] = useState(initialLeaves);
  const [isOpen, setIsOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [year, setYear] = useState(filters.year || new Date().getFullYear());
  const [month, setMonth] = useState(filters.month || '');

  const [form, setForm] = useState({
    leave_type: "",
    day_type: "full",
    from_date: "",
    to_date: "",
    reason: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setLeaves(props.leaves || []);
  }, [props.leaves]);

  const handleFilterChange = (key, value) => {
    const newFilters = {
      year: key === 'year' ? value : year,
      month: key === 'month' ? value : month,
    };

    if (key === 'year') setYear(value);
    if (key === 'month') setMonth(value);

    router.get(route('leave.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const newForm = { ...f, [name]: value };

      // Sync to_date with from_date if half-day is selected
      if (name === "day_type" && value !== "full" && f.from_date) {
        newForm.to_date = f.from_date;
      }
      if (name === "from_date" && f.day_type !== "full") {
        newForm.to_date = value;
      }

      return newForm;
    });
    setErrors((e2) => ({ ...e2, [name]: undefined }));
  };

  const validateForm = () => {
    let temp = {};

    if (!form.leave_type) temp.leave_type = "Leave type is required";
    if (!form.from_date) temp.from_date = "Start date is required";
    if (!form.to_date) temp.to_date = "End date is required";

    if (
      form.from_date &&
      form.to_date &&
      new Date(form.to_date) < new Date(form.from_date)
    ) {
      temp.to_date = "End date cannot be before start date";
    }

    if (!form.reason) temp.reason = "Reason is required";

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    router.post(
      route("leave.store"),
      form,
      {
        onSuccess: () => {
          setIsOpen(false);
          setForm({ leave_type: "", day_type: "full", from_date: "", to_date: "", reason: "" });
        },
        onError: (errs) => {
          setErrors(errs);
        },
      }
    );
  };

  const openView = (leave) => {
    setSelectedLeave(leave);
    setViewOpen(true);
  };

  const handleCancel = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    router.delete(route("leave.destroy", deleteId), {
      preserveScroll: true,
      onSuccess: () => setDeleteId(null),
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved")
      return (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
          Approved
        </span>
      );
    if (s === "rejected")
      return (
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-medium">
          Rejected
        </span>
      );
    return (
      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-sm font-medium">
        Pending
      </span>
    );
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <UserLayout>
      <Head title="Leave Applications" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Leave Applications</h1>

        <div className="flex flex-wrap gap-3">
          {/* Year Filter */}
          <select
            value={year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Month Filter */}
          <select
            value={month}
            onChange={(e) => handleFilterChange('month', e.target.value)}
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm text-sm"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={18} /> Apply Leave
          </button>
        </div>
      </div>

      {/* Leave Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Sick Leave (SL)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-800">{parseFloat(props.stats?.SL?.taken || 0)}</span>
              <span className="text-gray-400 font-bold">/ {props.stats?.SL?.total || 12} Days Taken</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Casual Leave (CL)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-800">{parseFloat(props.stats?.CL?.taken || 0)}</span>
              <span className="text-gray-400 font-bold">/ {props.stats?.CL?.total || 12} Days Taken</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Leave List */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-blue-50 text-gray-700 text-sm uppercase">
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Dates</th>
              <th className="px-4 py-3 text-left">Days</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500 italic">
                  No leave records found.
                </td>
              </tr>
            ) : (
              leaves.map((item) => {
                const days = item.no_of_days;

                return (
                  <tr key={item.id} className="border-t text-gray-700 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 font-medium">
                        <FileText size={14} className="text-gray-400" />
                        {item.leave_type === 'SL' || item.leave_type === 'CL' ? item.leave_type : item.leave_type.charAt(0).toUpperCase() + item.leave_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="text-gray-900 font-medium">
                        {formatDate(item.from_date)} - {formatDate(item.to_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600 text-sm">
                      {item.day_type === 'full'
                        ? `${parseFloat(item.no_of_days)} ${parseFloat(item.no_of_days) > 1 ? 'Days' : 'Day'}`
                        : item.day_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                      }
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm text-gray-600 truncate" title={item.reason}>
                        {item.reason || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openView(item)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </button>
                        {item.status === "pending" && (
                          <button
                            onClick={() => handleCancel(item.id)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Cancel Application"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* APPLY LEAVE POPUP */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-lg relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800">Apply Leave</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Leave Type *</label>
                <select
                  name="leave_type"
                  value={form.leave_type}
                  onChange={handleChange}
                  className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.leave_type ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">--Select--</option>
                  <option value="SL">Sick Leave (SL)</option>
                  <option value="CL">Casual Leave (CL)</option>
                </select>
                {errors.leave_type && (
                  <p className="text-red-600 text-sm mt-1">{errors.leave_type}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">From Date *</label>
                  <input
                    type="date"
                    name="from_date"
                    value={form.from_date}
                    onChange={handleChange}
                    className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.from_date ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.from_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.from_date}</p>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">To Date *</label>
                  <input
                    type="date"
                    name="to_date"
                    value={form.to_date}
                    onChange={handleChange}
                    disabled={form.day_type !== "full"}
                    className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${form.day_type !== "full" ? "bg-gray-50 text-gray-500" : ""} ${errors.to_date ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.to_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.to_date}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-2">Duration Type *</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="day_type"
                      value="full"
                      checked={form.day_type === "full"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Full Day</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="day_type"
                      value="first_half"
                      checked={form.day_type === "first_half"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">First Half</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="day_type"
                      value="second_half"
                      checked={form.day_type === "second_half"}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Second Half</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.reason ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Enter reason for leave..."
                ></textarea>
                {errors.reason && (
                  <p className="text-red-600 text-sm mt-1">{errors.reason}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW POPUP */}
      {viewOpen && selectedLeave && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-lg relative">
            <button
              onClick={() => setViewOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800">Leave Details</h3>

            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Type</span>
                <span className="font-semibold">{selectedLeave.leave_type === 'SL' || selectedLeave.leave_type === 'CL' ? selectedLeave.leave_type : selectedLeave.leave_type.charAt(0).toUpperCase() + selectedLeave.leave_type.slice(1)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Duration</span>
                <span className="font-semibold">
                  {formatDate(selectedLeave.from_date)} - {formatDate(selectedLeave.to_date)}
                  <span className="ml-2 text-xs text-blue-600 uppercase">
                    ({selectedLeave.day_type.replace('_', ' ')})
                  </span>
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Status</span>
                {getStatusBadge(selectedLeave.status)}
              </div>
              <div className="pt-2">
                <span className="text-gray-500 block mb-1">Reason</span>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border">
                  {selectedLeave.reason}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setViewOpen(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Confirm Cancellation</h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to cancel this leave application?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                No, Keep it
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition"
              >
                Yes, Cancel Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
