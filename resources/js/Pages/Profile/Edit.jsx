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
        <div className="bg-[#f4f7f6] min-h-screen -m-6 p-6 space-y-6">
            <Head title="Profile" />

            {/* Profile Header & Identity Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                {/* Banner with stripes */}
                <div 
                    className="h-40 w-full"
                    style={{
                        background: 'linear-gradient(135deg, #009688 0%, #009688 35%, #80cbdc 35%, #80cbdc 60%, #ffc5bf 60%, #ffc5bf 100%)',
                    }}
                />
                
                {/* Identity Profile Info Overlap */}
                <div className="px-8 pb-6 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
                    <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gray-50 relative z-10">
                        <img
                            src={user.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f3f4f6&color=444&size=256`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    
                    <div className="text-center md:text-left mb-2 flex-1">
                        <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                        <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-gray-500 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4 text-gray-400" />
                                {user.designation || 'Developer'}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="w-4 h-4 text-gray-400" />
                                Joined {formatJoinedMonthYear(user.joining_date || user.created_at || '2026-04-01')}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Tab Switcher */}
                <div className="flex border-b border-gray-100 px-8 gap-4 bg-gray-50/50">
                    {[
                        { id: 'Overview', label: 'Profile Overview' },
                        { id: 'Edit Details', label: 'Edit Details' },
                        { id: 'Change Password', label: 'Change Password' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4.5 px-2 text-sm font-semibold transition-all relative ${
                                activeTab === tab.id 
                                    ? 'text-[var(--theme-primary)]' 
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--theme-primary)]"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Profile Overview Tab */}
            {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Personal Information Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                            <UserIcon className="w-4.5 h-4.5 text-[var(--theme-primary)]" />
                            Personal Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">First Name</span>
                                <span className="font-semibold text-gray-800">{user.first_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Last Name</span>
                                <span className="font-semibold text-gray-800">{user.last_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Gender</span>
                                <span className="font-semibold text-gray-800 capitalize">{user.gender || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Date of Birth</span>
                                <span className="font-semibold text-gray-800">
                                    {formatDate(user.date_of_birth)}
                                </span>
                            </div>
                            <div className="flex flex-col text-sm pb-1">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Blood Group</span>
                                <span className="font-semibold text-gray-800 uppercase">{user.blood_group || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                            <Phone className="w-4.5 h-4.5 text-[var(--theme-primary)]" />
                            Contact Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Mobile Number</span>
                                <span className="font-semibold text-gray-800">{user.mobile || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Email</span>
                                <span className="font-semibold text-gray-800">{user.email || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Address</span>
                                <span className="font-semibold text-gray-800 whitespace-pre-wrap">{user.address || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Emergency Contact Name</span>
                                <span className="font-semibold text-gray-800">{user.emergency_contact_name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-sm pb-1">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Emergency Contact Number</span>
                                <span className="font-semibold text-gray-800">{user.emergency_contact_number || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Company Information Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                            <Briefcase className="w-4.5 h-4.5 text-[var(--theme-primary)]" />
                            Company Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Employee ID</span>
                                <span className="font-semibold text-gray-800">{user.employee_id || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Department</span>
                                <span className="font-semibold text-gray-800">{user.department?.name || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Designation</span>
                                <span className="font-semibold text-gray-800">{user.designation || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Joining Date</span>
                                <span className="font-semibold text-gray-800">
                                    {formatDate(user.joining_date)}
                                </span>
                            </div>
                            <div className="flex flex-col text-sm pb-1">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-0.5">Employment Type</span>
                                <span className="font-semibold text-gray-800 capitalize">{user.employment_type || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Details Tab */}
            {activeTab === 'Edit Details' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                    />
                </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'Change Password' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
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
