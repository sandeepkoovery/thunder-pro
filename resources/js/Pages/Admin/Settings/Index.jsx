import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Settings, ClipboardList, Users, Save, ChevronRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index({ settings, users }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth?.user?.role === 'superadmin';
    const [activeTab, setActiveTab] = useState('general');

    const { data, setData, post, processing, errors } = useForm({
        admin_email: settings.admin_email || '',
        monthly_working_days: settings.monthly_working_days || '',
        beta_menu_items: JSON.parse(settings.beta_menu_items || '[]'),
        hidden_modules: JSON.parse(settings.hidden_modules || '[]'),
    });

    const [showMenuSettings, setShowMenuSettings] = useState(false);
    const [showModuleVisibility, setShowModuleVisibility] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'projects', label: 'Projects' },
        { id: 'users', label: 'Users' },
        { id: 'leaves', label: 'Leaves' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'drive', label: 'Drive' },
        { id: 'chat', label: 'Chat' },
        { id: 'websites', label: 'Websites' },
    ];

    const toggleMenuItem = (id) => {
        const current = [...data.beta_menu_items];
        if (current.includes(id)) {
            setData('beta_menu_items', current.filter(item => item !== id));
        } else {
            setData('beta_menu_items', [...current, id]);
        }
    };

    const toggleHiddenModule = (id) => {
        const current = [...data.hidden_modules];
        if (current.includes(id)) {
            setData('hidden_modules', current.filter(item => item !== id));
        } else {
            setData('hidden_modules', [...current, id]);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'), {
            onSuccess: () => toast.success("Settings saved successfully"),
        });
    };

    const tabs = [
        { id: 'general', label: 'General Settings', icon: Settings },
    ];

    return (
        <AdminLayout title="System Settings">
            <Head title="Settings" />

            <div className="w-full space-y-6 font-sans">
                {/* Header Section */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Settings</h1>
                        <p className="text-gray-500 font-medium">Configure global application behavior and module defaults</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                        <Settings size={32} />
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex bg-white p-1.5 rounded-[20px] shadow-sm border border-gray-100 gap-1 overflow-x-auto custom-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                             className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all whitespace-nowrap ${activeTab === tab.id
                                 ? 'bg-[#1e88e5] text-white shadow-lg shadow-[#1e88e5]/25'
                                 : 'text-gray-400 hover:text-[#1e88e5] hover:bg-gray-50'
                                 }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT: General Settings */}
                {activeTab === 'general' && (
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-8 border-b border-gray-50 pb-6">
                            <h2 className="text-xl font-bold text-gray-900">General Configurations</h2>
                            <p className="text-sm text-gray-500 font-medium mt-1">Manage core system variables and menu appearance</p>
                        </div>

                        <form onSubmit={submit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Admin Email Address</label>
                                    <input
                                        type="email"
                                        value={data.admin_email}
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                        onChange={(e) => setData('admin_email', e.target.value)}
                                        placeholder="admin@example.com"
                                    />
                                    {errors.admin_email && <p className="text-xs text-red-500 font-bold ml-1">{errors.admin_email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Monthly Working Days</label>
                                    <input
                                        type="number"
                                        value={data.monthly_working_days}
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                        onChange={(e) => setData('monthly_working_days', e.target.value)}
                                        min="0"
                                        max="31"
                                    />
                                    {errors.monthly_working_days && <p className="text-xs text-red-500 font-bold ml-1">{errors.monthly_working_days}</p>}
                                </div>
                            </div>

                            {isSuperAdmin && (
                                <>
                                    <div className="bg-gray-50/50 rounded-[28px] p-8 border border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setShowMenuSettings(!showMenuSettings)}
                                            className="flex items-center justify-between w-full group"
                                        >
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Menu Beta Labels</h3>
                                                <p className="text-gray-500 font-medium text-sm">Select items to highlight with a "Beta" tag</p>
                                            </div>
                                            <div className={`p-2 bg-white rounded-full shadow-sm border border-gray-100 transition-transform duration-300 ${showMenuSettings ? 'rotate-180' : ''}`}>
                                                <ChevronRight className="rotate-90 text-gray-400" />
                                            </div>
                                        </button>

                                        {showMenuSettings && (
                                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in zoom-in-95 duration-200">
                                                {menuItems.map((item) => (
                                                    <label key={item.id} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.beta_menu_items.includes(item.id)}
                                                            onChange={() => toggleMenuItem(item.id)}
                                                            className="w-5 h-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500/20"
                                                        />
                                                        <span className="font-bold text-gray-700 text-sm">{item.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Module Visibility Section */}
                                    <div className="bg-gray-50/50 rounded-[28px] p-8 border border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setShowModuleVisibility(!showModuleVisibility)}
                                            className="flex items-center justify-between w-full group"
                                        >
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Module Visibility</h3>
                                                <p className="text-gray-500 font-medium text-sm">Select modules to hide globally (Super Admins bypass this)</p>
                                            </div>
                                            <div className={`p-2 bg-white rounded-full shadow-sm border border-gray-100 transition-transform duration-300 ${showModuleVisibility ? 'rotate-180' : ''}`}>
                                                <ChevronRight className="rotate-90 text-gray-400" />
                                            </div>
                                        </button>

                                        {showModuleVisibility && (
                                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in zoom-in-95 duration-200">
                                                {menuItems.map((item) => (
                                                    <label key={item.id} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:border-red-200 hover:shadow-md hover:shadow-red-500/5 transition-all">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.hidden_modules.includes(item.id)}
                                                            onChange={() => toggleHiddenModule(item.id)}
                                                            className="w-5 h-5 rounded-lg border-gray-200 text-red-600 focus:ring-red-500/20"
                                                        />
                                                        <span className="font-bold text-gray-700 text-sm">Hide {item.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end pt-6">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-10 py-4 bg-[#1e88e5] hover:bg-[#1565c0] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-gray-200 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    {processing ? 'SAVING...' : 'SAVE GENERAL SETTINGS'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .font-sans { font-family: 'Poppins', sans-serif !important; }
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            ` }} />
        </AdminLayout>
    );
}

