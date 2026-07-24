import AdminLayout from '@/Layouts/AdminLayout';
import UserLayout from '@/Layouts/UserLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Camera, User as UserIcon, Mail, Phone, Briefcase,
    CheckCircle, Lock, Shield, Fingerprint, Clock,
    Twitter, Facebook, Instagram, Linkedin, Home, Plus,
    MapPin, CalendarDays, Users, FileText
} from 'lucide-react';
import { useState } from 'react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const [activeTab, setActiveTab] = useState('Overview');

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        if (dateStr.includes('T')) {
            const dateObj = new Date(dateStr);
            return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!match) return dateStr;
        const [_, year, month, day] = match;
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const formatJoinedMonthYear = (dateStr) => {
        if (!dateStr) return 'N/A';
        if (dateStr.includes('T')) {
            const dateObj = new Date(dateStr);
            return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!match) return dateStr;
        const [_, year, month, day] = match;
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const content = (
        <div className="w-full space-y-6 font-sans pb-10">
            <Head title="Profile Details" />

            {/* Profile Header & Identity Card */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden relative">
                {/* Banner with gradient overlay and background ambient shapes */}
                <div 
                    className="h-48 w-full relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%)',
                    }}
                >
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-300 via-pink-500 to-purple-800"></div>
                </div>
                
                {/* Identity Profile Info Overlap */}
                <div className="px-8 pb-6 relative flex flex-col md:flex-row items-center md:items-end gap-6">
                    {/* Avatar overlapping bottom boundary of banner */}
                    <div className="w-32 h-32 -mt-16 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white relative z-10 transition-transform duration-300 hover:scale-[1.02] flex-shrink-0">
                        <img
                            src={user.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f3f4f6&color=444&size=256`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    
                    {/* Name and details placed below the banner in the white area */}
                    <div className="text-center md:text-left mb-2 flex-1 space-y-2.5 relative z-10">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{user.name}</h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100/50 capitalize">
                                <Briefcase className="w-3.5 h-3.5" />
                                {['admin', 'superadmin'].includes(user.role) 
                                    ? (user.role === 'superadmin' ? 'Super Administrator' : 'Administrator') 
                                    : (user.designation || 'Team Member')}
                            </span>
                            {!['admin', 'superadmin'].includes(user.role) && (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-150">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    Joined {formatJoinedMonthYear(user.joining_date || user.created_at || '2026-04-01')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Modern Pill-Style Tab Switcher */}
                <div className="flex p-1.5 bg-slate-50 border border-slate-100 rounded-2xl gap-1 max-w-lg mx-8 mb-6">
                    {[
                        { id: 'Overview', label: 'Profile Overview' },
                        { id: 'Edit Details', label: 'Edit Details' },
                        { id: 'Change Password', label: 'Change Password' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider uppercase text-center transition-all ${
                                    isActive 
                                        ? 'bg-white text-blue-600 shadow-sm border border-slate-100/50' 
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-slate-100/30'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Profile Overview Tab */}
            {activeTab === 'Overview' && (
                <div className={`grid grid-cols-1 gap-6 ${
                    ['admin', 'superadmin'].includes(user.role) ? 'md:grid-cols-2' : 'md:grid-cols-3'
                }`}>
                    {/* Personal Information Card */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                Personal Information
                            </h3>
                        </div>
                        <div className="space-y-5">
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">First Name</span>
                                <span className="font-semibold text-slate-800 text-[15px] mt-0.5">{user.first_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Last Name</span>
                                <span className="font-semibold text-slate-800 text-[15px] mt-0.5">{user.last_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Gender</span>
                                <span className="font-semibold text-slate-800 text-[15px] mt-0.5 capitalize">{user.gender || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Date of Birth</span>
                                <span className="font-semibold text-slate-800 text-[15px] mt-0.5">
                                    {formatDate(user.date_of_birth)}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Blood Group</span>
                                <span className="font-semibold text-slate-800 text-[15px] mt-0.5 uppercase">{user.blood_group || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                                <Phone className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                Contact Information
                            </h3>
                        </div>
                        <div className="space-y-5">
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Mobile Number</span>
                                <span className="font-semibold text-slate-800 text-[15px] mt-0.5">{user.mobile || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Email</span>
                                <span className="font-semibold text-slate-800 text-[15px] mt-0.5">{user.email || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Address</span>
                                <span className="font-semibold text-slate-800 text-[15px] mt-0.5 whitespace-pre-wrap">{user.address || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Emergency Contact</span>
                                <span className="font-semibold text-slate-800 text-[15px] mt-0.5">{user.emergency_contact_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Emergency Contact Number</span>
                                <span className="font-semibold text-slate-800 text-[15px] mt-0.5">{user.emergency_contact_number || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Company Information Card (Hidden for Admin/Superadmin roles) */}
                    {!['admin', 'superadmin'].includes(user.role) && (
                        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                    Company Information
                                </h3>
                            </div>
                            <div className="space-y-5">
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Employee ID</span>
                                    <span className="font-semibold text-slate-800 text-[15px] mt-0.5">{user.employee_id || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Department</span>
                                    <span className="font-semibold text-slate-800 text-[15px] mt-0.5">{user.department?.name || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Designation</span>
                                    <span className="font-semibold text-slate-800 text-[15px] mt-0.5">{user.designation || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Joining Date</span>
                                    <span className="font-semibold text-slate-800 text-[15px] mt-0.5">
                                        {formatDate(user.joining_date)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Employment Type</span>
                                    <span className="font-semibold text-slate-800 text-[15px] mt-0.5 capitalize">{user.employment_type || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Details Tab */}
            {activeTab === 'Edit Details' && (
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'Change Password' && (
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                    <UpdatePasswordForm />
                </div>
            )}
        </div>
    );

    if (user.role === 'admin' || user.role === 'manager') {
        return <AdminLayout>{content}</AdminLayout>;
    }

    return <UserLayout>{content}</UserLayout>;
}
