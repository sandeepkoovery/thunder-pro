import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { 
    ArrowLeft, Edit2, MessageSquare, Mail, Phone, MapPin, Building2,
    FileText, ChevronRight, KeyRound
} from "lucide-react";

export default function Show() {
  const { user } = usePage().props;

  const formatDateShort = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr.toString().replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const DetailItem = ({ label, value, isBlue = false }) => (
    <div className="flex flex-col space-y-1">
      <span className="text-[12px] font-medium text-slate-400">{label}</span>
      <span className={`text-[13px] font-semibold ${isBlue ? 'text-[#0099ff] font-bold' : 'text-slate-800'}`}>
        {value || '—'}
      </span>
    </div>
  );

  return (
    <AdminLayout title={`Employee Details — ${user.name}`}>
      <Head title={`Employee Profile — ${user.name}`} />
      <div className="p-6 space-y-6 font-sans">
        
        {/* 2-Column Grid Layout matching screenshot */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          
          {/* LEFT COLUMN: Identity Card + Contact Card */}
          <div className="space-y-6">
            {/* Identity Card */}
            <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-6 flex flex-col items-center text-center">
              <img
                src={user.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1e293b&color=fff&size=256`}
                alt={user.name}
                className="w-28 h-28 rounded-full object-cover border-2 border-gray-100 shadow-2xs"
              />
              <h2 className="text-base font-bold text-slate-900 tracking-tight mt-4">{user.name}</h2>
              <p className="text-xs font-semibold text-[#7066e0] mt-0.5">
                {user.designation || 'Frontend Developer'}
              </p>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-3 border ${
                user.is_active !== false 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100/60' 
                  : 'bg-rose-50 text-rose-600 border-rose-100/60'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user.is_active !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                {user.is_active !== false ? 'Active' : 'Inactive'}
              </span>

              {/* Action Buttons: Edit + Message */}
              <div className="w-full flex gap-3 mt-6">
                <Link
                  href={route('admin.users.edit', user.id)}
                  className="flex-1 py-2.5 rounded-full bg-[#0099ff] hover:bg-[#0088ee] !text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
                  style={{ color: '#ffffff' }}
                >
                  <Edit2 size={13} className="!text-white" style={{ color: '#ffffff' }} />
                  <span className="!text-white" style={{ color: '#ffffff' }}>Edit</span>
                </Link>
                <a
                  href={route('chat.index')}
                  className="flex-1 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare size={13} className="text-slate-400" />
                  <span>Message</span>
                </a>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-5">Contact</h3>
              
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</span>
                    <span className="text-xs font-semibold text-slate-700 truncate">{user.email || 'anwar.hussain@gmail.com'}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Phone size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone</span>
                    <span className="text-xs font-semibold text-slate-700">{user.mobile || '+1 555 0198'}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Location</span>
                    <span className="text-xs font-semibold text-slate-700">{user.address || 'San Francisco, CA'}</span>
                  </div>
                </div>

                {/* Department */}
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Building2 size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Department</span>
                    <span className="text-xs font-semibold text-slate-700">{user.department?.name || 'Development'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Personal Info + Work Info + Documents */}
          <div className="space-y-6">
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-5">Personal Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                <DetailItem 
                  label="Full Name" 
                  value={user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Anwar Hussain'} 
                />
                <DetailItem 
                  label="Date of Birth" 
                  value={formatDateShort(user.date_of_birth) || 'Aug 24, 1994'} 
                />
                <DetailItem 
                  label="Gender" 
                  value={user.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : 'Male'} 
                />
                <DetailItem 
                  label="Marital Status" 
                  value={user.marital_status || 'Single'} 
                />
                <DetailItem 
                  label="Nationality" 
                  value={user.nationality || 'American'} 
                />
                <DetailItem 
                  label="Address" 
                  value={user.address || '1024 Market St, San Francisco'} 
                />
              </div>
            </div>

            {/* Work Information Card */}
            <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-5">Work Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                <DetailItem 
                  label="Employee ID" 
                  value={user.employee_id ? `#${user.employee_id.replace(/^#/, '')}` : '#EMP-002'} 
                  isBlue={true}
                />
                <DetailItem 
                  label="Department" 
                  value={user.department?.name || 'Development'} 
                />
                <DetailItem 
                  label="Designation" 
                  value={user.designation || 'Frontend Developer'} 
                />
                <DetailItem 
                  label="Join Date" 
                  value={formatDateShort(user.joining_date || user.created_at) || 'Feb 03, 2024'} 
                />
                <DetailItem 
                  label="Employment Type" 
                  value={user.employment_type || 'Full Time'} 
                />
                <DetailItem 
                  label="Reporting To" 
                  value={user.reporting_manager?.name || 'Jenson Roy'} 
                />
                <DetailItem 
                  label="Work Location" 
                  value={user.branch ? `HQ — ${user.branch}` : 'HQ — San Francisco'} 
                />
                <DetailItem 
                  label="Shift" 
                  value={user.shift || '9:00 AM – 6:00 PM'} 
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
