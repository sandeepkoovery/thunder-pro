import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { ChevronLeft } from "lucide-react";

export default function Show() {
  const { user } = usePage().props;

  return (
    <AdminLayout title={`Employee: ${user.name}`}>
      <Head title={`Employee Profile — ${user.name}`} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Employee Profile</h1>
            <p className="text-sm text-gray-500 mt-1">View detailed employee information and login settings.</p>
          </div>
          <Link
            href={route('admin.users.index')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded"
          >
            <ChevronLeft size={18} /> Back to list
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              {user.image_url ? (
                <img src={user.image_url} alt={user.name} className="w-28 h-28 rounded-full object-cover" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-600">
                  {user.name?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.designation || 'Employee'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Employee ID" value={user.employee_id || 'Auto Generated'} />
                <Detail label="First Name" value={user.first_name || '—'} />
                <Detail label="Last Name" value={user.last_name || '—'} />
                <Detail label="Gender" value={user.gender || '—'} />
                <Detail label="Date of Birth" value={user.date_of_birth || '—'} />
                <Detail label="Blood Group" value={user.blood_group || '—'} />
                <Detail label="Marital Status" value={user.marital_status || '—'} />
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Mobile Number" value={user.mobile || '—'} />
                <Detail label="Email" value={user.email || '—'} />
                <Detail label="Address" value={user.address || '—'} />
                <Detail label="Emergency Contact" value={user.emergency_contact_name ? `${user.emergency_contact_name} (${user.emergency_contact_number || '—'})` : '—'} />
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4">Company Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Department" value={user.department?.name || '—'} />
                <Detail label="Designation" value={user.designation || '—'} />
                <Detail label="Reporting Manager" value={user.reporting_manager?.name || '—'} />
                <Detail label="Joining Date" value={user.joining_date || '—'} />
                <Detail label="Employment Type" value={user.employment_type || '—'} />
                <Detail label="Branch/Office" value={user.branch || '—'} />
                <Detail label="Shift" value={user.shift || '—'} />
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4">Login Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Username" value={user.name || '—'} />
                <Detail label="Email" value={user.email || '—'} />
                <Detail label="Role" value={user.role || '—'} />
                <Detail label="Status" value={user.is_active ? 'Active' : 'Inactive'} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</div>
      <div className="text-sm text-gray-700">{value}</div>
    </div>
  );
}
