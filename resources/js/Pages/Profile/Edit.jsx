import AdminLayout from '@/Layouts/AdminLayout';
import UserLayout from '@/Layouts/UserLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft, Edit2, MessageSquare, Mail, Phone, MapPin, Building2,
    Lock, Shield, KeyRound, FileText, CheckCircle2, ChevronRight,
    ShieldCheck, CreditCard, Calendar
} from 'lucide-react';
import { useState } from 'react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import PasskeyManager from './Partials/PasskeyManager';

export default function Edit({ mustVerifyEmail, status, isCompanyAdmin = false, companyDetails = null }) {
    const { auth, userPlan, subscriptionStatus } = usePage().props;
    const user = auth.user;
    const isCompany = isCompanyAdmin || ['admin', 'superadmin'].includes(user?.role);
    const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Edit Details' | 'Change Password' | 'Passkeys'

    const formatDateShort = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr.toString().replace(' ', 'T'));
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    const DetailItem = ({ label, value, isBlue = false, colSpan = 1 }) => (
        <div className={`flex flex-col space-y-1 ${colSpan > 1 ? `sm:col-span-${colSpan}` : ''}`}>
            <span className="text-[12px] font-medium text-slate-400">{label}</span>
            <span className={`text-[13px] font-semibold ${isBlue ? 'text-[#0099ff] font-bold' : 'text-slate-800'}`}>
                {value || '—'}
            </span>
        </div>
    );

    const content = (
        <div className="w-full space-y-6 font-sans pb-10">
            <Head title={isCompany ? `Company Profile — ${user?.company_name || user?.name || 'Admin'}` : `Employee Profile — ${user?.name}`} />

            {/* Sub-tab Navigation Pills */}
            <div className="flex items-center justify-end gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold w-fit ml-auto">
                <button
                    onClick={() => setActiveTab('Overview')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeTab === 'Overview' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('Edit Details')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeTab === 'Edit Details' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    {isCompany ? 'Edit Company Details' : 'Edit Information'}
                </button>
                <button
                    onClick={() => setActiveTab('Change Password')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeTab === 'Change Password' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Security & Password
                </button>
                {!['admin', 'superadmin'].includes(user?.role) && (
                    <button
                        onClick={() => setActiveTab('Passkeys')}
                        className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                            activeTab === 'Passkeys' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Windows Hello
                    </button>
                )}
            </div>

            {/* Overview Layout */}
            {activeTab === 'Overview' && (
                isCompany ? (
                    /* COMPANY ADMIN OVERVIEW */
                    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
                        {/* LEFT COLUMN: Company Identity Card + Contact Card */}
                        <div className="space-y-6">
                            {/* Company Identity Card */}
                            <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-6 flex flex-col items-center text-center">
                                <img
                                    src={user?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.company_name || user?.name || 'Company')}&background=0099ff&color=fff&size=256`}
                                    alt={user?.company_name || user?.name}
                                    className="w-28 h-28 rounded-2xl object-cover border-2 border-gray-100 shadow-2xs"
                                />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight mt-4">
                                    {user?.company_name || user?.name}
                                </h2>
                                <p className="text-xs font-semibold text-[#0099ff] mt-0.5">
                                    {user?.company_name ? `Admin: ${user?.name}` : 'Company Account'}
                                </p>

                                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100/60">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Active
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100/60 uppercase tracking-wider">
                                        <Building2 size={12} />
                                        Company Admin
                                    </span>
                                </div>

                                {/* Action Buttons: Edit */}
                                <div className="w-full flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('Edit Details')}
                                        className="w-full py-2.5 rounded-xl bg-[#0099ff] hover:bg-[#0088ee] !text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
                                        style={{ color: '#ffffff' }}
                                    >
                                        <Edit2 size={13} className="!text-white" style={{ color: '#ffffff' }} />
                                        <span className="!text-white" style={{ color: '#ffffff' }}>Edit Company Details</span>
                                    </button>
                                </div>
                            </div>

                            {/* Company Contact Card */}
                            <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-6">
                                <h3 className="text-sm font-bold text-slate-900 mb-5">Quick Contact</h3>
                                
                                <div className="space-y-4">
                                    {/* Mail ID */}
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                            <Mail size={16} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mail ID</span>
                                            <span className="text-xs font-semibold text-slate-700 truncate">{user?.email || '—'}</span>
                                        </div>
                                    </div>

                                    {/* Contact Number */}
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                            <Phone size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact No</span>
                                            <span className="text-xs font-semibold text-slate-700">{user?.mobile || user?.phone || '—'}</span>
                                        </div>
                                    </div>

                                    {/* GST No */}
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                            <FileText size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">GST Number</span>
                                            <span className="text-xs font-semibold text-slate-700">{user?.gst_no || 'Not Registered'}</span>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                            <MapPin size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Address</span>
                                            <span className="text-xs font-semibold text-slate-700">{user?.address || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Company Details + Plan & Account Details */}
                        <div className="space-y-6">
                            {/* Company Information Card */}
                            <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-[#0099ff]" />
                                        <h3 className="text-sm font-bold text-slate-900">Company & Tax Details</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('Edit Details')}
                                        className="text-xs font-semibold text-[#0099ff] hover:underline cursor-pointer"
                                    >
                                        Edit Details
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                                    <DetailItem 
                                        label="Company Name" 
                                        value={user?.company_name || user?.name || '—'} 
                                        isBlue={true}
                                    />
                                    <DetailItem 
                                        label="GST Number (GSTIN)" 
                                        value={user?.gst_no || 'Not Registered'} 
                                    />
                                    <DetailItem 
                                        label="Official Mail ID" 
                                        value={user?.email || '—'} 
                                    />
                                    <DetailItem 
                                        label="Contact Number" 
                                        value={user?.mobile || user?.phone || '—'} 
                                    />
                                    <DetailItem 
                                        label="Authorized Administrator" 
                                        value={user?.name || '—'} 
                                    />
                                    <DetailItem 
                                        label="Account Role" 
                                        value={user?.role === 'superadmin' ? 'Super Administrator' : 'Company Administrator'} 
                                    />
                                    <div className="sm:col-span-2 flex flex-col space-y-1">
                                        <span className="text-[12px] font-medium text-slate-400">Registered Office Address</span>
                                        <span className="text-[13px] font-semibold text-slate-800 leading-relaxed">
                                            {user?.address || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Plan & Subscription Card */}
                            <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <CreditCard className="w-4 h-4 text-[#0099ff]" />
                                    <h3 className="text-sm font-bold text-slate-900">Subscription & Account Overview</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                                    <DetailItem 
                                        label="Current Plan" 
                                        value={userPlan ? (userPlan.charAt(0).toUpperCase() + userPlan.slice(1) + ' Plan') : 'Basic Plan'} 
                                        isBlue={true}
                                    />
                                    <DetailItem 
                                        label="Subscription Status" 
                                        value={subscriptionStatus ? (subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)) : 'Active'} 
                                    />
                                    <DetailItem 
                                        label="Member Since" 
                                        value={formatDateShort(user?.created_at) || '—'} 
                                    />
                                    <DetailItem 
                                        label="Account Security" 
                                        value="Password Protected" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* REGULAR EMPLOYEE OVERVIEW */
                    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
                        {/* LEFT COLUMN: Identity Card + Contact Card */}
                        <div className="space-y-6">
                            {/* Profile Identity Card */}
                            <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-6 flex flex-col items-center text-center">
                                <img
                                    src={user?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name)}&background=1e293b&color=fff&size=256`}
                                    alt={user?.name}
                                    className="w-28 h-28 rounded-full object-cover border-2 border-gray-100 shadow-2xs"
                                />
                                <h2 className="text-base font-bold text-slate-900 tracking-tight mt-4">{user?.name}</h2>
                                <p className="text-xs font-semibold text-[#7066e0] mt-0.5">
                                    {user?.designation || 'Team Member'}
                                </p>

                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 mt-3 border border-emerald-100/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Active
                                </span>

                                {/* Action Buttons: Edit + Message */}
                                <div className="w-full flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('Edit Details')}
                                        className="flex-1 py-2.5 rounded-full bg-[#0099ff] hover:bg-[#0088ee] !text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
                                        style={{ color: '#ffffff' }}
                                    >
                                        <Edit2 size={13} className="!text-white" style={{ color: '#ffffff' }} />
                                        <span className="!text-white" style={{ color: '#ffffff' }}>Edit</span>
                                    </button>
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
                                            <span className="text-xs font-semibold text-slate-700 truncate">{user?.email || '—'}</span>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                            <Phone size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone</span>
                                            <span className="text-xs font-semibold text-slate-700">{user?.mobile || '—'}</span>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                            <MapPin size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Location</span>
                                            <span className="text-xs font-semibold text-slate-700">{user?.address || '—'}</span>
                                        </div>
                                    </div>

                                    {/* Department */}
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                            <Building2 size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Department</span>
                                            <span className="text-xs font-semibold text-slate-700">{user?.department?.name || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Personal Info + Work Info */}
                        <div className="space-y-6">
                            {/* Personal Information Card */}
                            <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-6">
                                <h3 className="text-sm font-bold text-slate-900 mb-5">Personal Information</h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                                    <DetailItem 
                                        label="Full Name" 
                                        value={user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || '—'} 
                                    />
                                    <DetailItem 
                                        label="Date of Birth" 
                                        value={formatDateShort(user?.date_of_birth) || '—'} 
                                    />
                                    <DetailItem 
                                        label="Gender" 
                                        value={user?.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : '—'} 
                                    />
                                    <DetailItem 
                                        label="Blood Group" 
                                        value={user?.blood_group || '—'} 
                                    />
                                    <DetailItem 
                                        label="Address" 
                                        value={user?.address || '—'} 
                                    />
                                </div>
                            </div>

                            {/* Work Information Card */}
                            <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs p-6">
                                <h3 className="text-sm font-bold text-slate-900 mb-5">Work Information</h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                                    <DetailItem 
                                        label="Employee ID" 
                                        value={user?.employee_id ? `#${user.employee_id.replace(/^#/, '')}` : '—'} 
                                        isBlue={true}
                                    />
                                    <DetailItem 
                                        label="Department" 
                                        value={user?.department?.name || '—'} 
                                    />
                                    <DetailItem 
                                        label="Designation" 
                                        value={user?.designation || '—'} 
                                    />
                                    <DetailItem 
                                        label="Join Date" 
                                        value={formatDateShort(user?.joining_date || user?.created_at) || '—'} 
                                    />
                                    <DetailItem 
                                        label="Employment Type" 
                                        value={user?.employment_type || 'Full Time'} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* Edit Details Tab */}
            {activeTab === 'Edit Details' && (
                <div className="bg-white rounded-2xl shadow-2xs border border-gray-100/90 p-8">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        isCompanyAdmin={isCompany}
                        companyDetails={companyDetails}
                    />
                </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'Change Password' && (
                <div className="bg-white rounded-2xl shadow-2xs border border-gray-100/90 p-8">
                    <UpdatePasswordForm />
                </div>
            )}

            {/* Passkeys Tab */}
            {activeTab === 'Passkeys' && !['admin', 'superadmin'].includes(user?.role) && (
                <PasskeyManager />
            )}
        </div>
    );

    if (['superadmin', 'admin', 'manager'].includes(user?.role)) {
        return <AdminLayout>{content}</AdminLayout>;
    }

    return <UserLayout>{content}</UserLayout>;
}
