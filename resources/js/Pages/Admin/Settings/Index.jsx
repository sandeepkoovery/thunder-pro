import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { 
    Settings, 
    Users, 
    ClipboardList, 
    Save, 
    ChevronRight, 
    CheckCircle, 
    ArrowLeft, 
    Check,
    LayoutDashboard,
    FolderKanban,
    Calendar,
    Clock,
    HardDrive,
    MessageSquare,
    Globe,
    Bot,
    Eye,
    EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Index({ settings = {}, users = [], worksheetSettings = {} }) {
    const { auth, allowedModules = [] } = usePage().props;
    const isSuperAdmin = auth?.user?.role === 'superadmin';
    const [activeTab, setActiveTab] = useState('general');

    // Module access checks
    const hasWorksheetAccess = !isSuperAdmin && allowedModules.includes('daily_listings');
    const hasDesignersAccess = !isSuperAdmin && allowedModules.includes('designers_worklist');

    const tabs = [
        { id: 'general', label: 'GENERAL SETTINGS', icon: Settings, show: true },
        { id: 'worksheet', label: 'WORKSHEET CONFIGURATION', icon: Users, show: hasWorksheetAccess },
        { id: 'designers', label: 'DESIGNERS WORKLIST', icon: ClipboardList, show: hasDesignersAccess },
    ].filter(tab => tab.show);

    // Selected user for Worksheet Configuration detail view
    const [selectedUser, setSelectedUser] = useState(null);

    // --- FORM 1: GENERAL SETTINGS ---
    const generalForm = useForm({
        admin_email: settings.admin_email || auth?.user?.email || '',
        monthly_working_days: settings.monthly_working_days || '',
        month_start_day: settings.month_start_day ?? 25,
        month_end_day: settings.month_end_day ?? 24,
        beta_menu_items: JSON.parse(settings.beta_menu_items || '[]'),
        hidden_modules: JSON.parse(settings.hidden_modules || '[]'),
    });

    const [showModuleVisibility, setShowModuleVisibility] = useState(true);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'leaves', label: 'Leaves', icon: Calendar },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'drive', label: 'Drive', icon: HardDrive },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'websites', label: 'Websites', icon: Globe },
        { id: 'ai_assistant', label: 'AI Voice Assistant', icon: Bot },
    ];

    const toggleHiddenModule = (id) => {
        const current = [...generalForm.data.hidden_modules];
        if (current.includes(id)) {
            generalForm.setData('hidden_modules', current.filter(item => item !== id));
        } else {
            generalForm.setData('hidden_modules', [...current, id]);
        }
    };

    const submitGeneral = (e) => {
        e.preventDefault();
        generalForm.post(route('admin.settings.update'), {
            onSuccess: () => toast.success("General settings saved successfully"),
        });
    };

    // --- FORM 2: WORKSHEET SETTINGS (per user) ---
    const worksheetForm = useForm({
        user_id: '',
        client_name_enabled: true,
        task_type_enabled: true,
        status_enabled: true,
        file_name_enabled: true,
        drive_link_enabled: true,
        project_enabled: true,
        task_type_freetext: false,
        task_type_options: 'DONE,NOT DONE,IN PROGRESS',
    });

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        const userSetting = worksheetSettings[user.id] || {};
        worksheetForm.setData({
            user_id: user.id,
            client_name_enabled: userSetting.client_name_enabled ?? true,
            task_type_enabled: userSetting.task_type_enabled ?? true,
            status_enabled: userSetting.status_enabled ?? true,
            file_name_enabled: userSetting.file_name_enabled ?? true,
            drive_link_enabled: userSetting.drive_link_enabled ?? true,
            project_enabled: userSetting.project_enabled ?? true,
            task_type_freetext: userSetting.task_type_freetext ?? false,
            task_type_options: userSetting.task_type_options ?? 'DONE,NOT DONE,IN PROGRESS',
        });
    };

    const submitWorksheet = (e) => {
        e.preventDefault();
        worksheetForm.post(route('admin.settings.worksheet.update'), {
            onSuccess: () => toast.success(`Worksheet settings for ${selectedUser?.name} saved`),
        });
    };

    // --- FORM 3: DESIGNERS WORKLIST SETTINGS ---
    const designersForm = useForm({
        designers_task_type_options: settings.designers_task_type_options || 'Poster, Thumbnail, Story, Carousel, Grid, Other',
    });

    const submitDesigners = (e) => {
        e.preventDefault();
        designersForm.post(route('admin.settings.designers.update'), {
            onSuccess: () => toast.success("Designers worklist settings saved successfully"),
        });
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

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

                {/* Tabs Navigation (Pill Header Style matching screenshots) */}
                <div className="flex bg-white p-1.5 rounded-[20px] shadow-sm border border-gray-100 gap-1.5 overflow-x-auto custom-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id !== 'worksheet') setSelectedUser(null);
                                }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold uppercase tracking-wider text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-[#0f172a] text-white shadow-md'
                                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: GENERAL SETTINGS */}
                {activeTab === 'general' && (
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 animate-in fade-in duration-200">
                        <div className="mb-8 border-b border-gray-50 pb-6">
                            <h2 className="text-xl font-bold text-gray-900">General Configurations</h2>
                            <p className="text-sm text-gray-500 font-medium mt-1">Manage core system variables and menu appearance</p>
                        </div>

                        <form onSubmit={submitGeneral} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className={`space-y-2 ${isSuperAdmin ? 'md:col-span-2' : ''}`}>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Admin Email Address</label>
                                    <input
                                        type="email"
                                        value={generalForm.data.admin_email}
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                        onChange={(e) => generalForm.setData('admin_email', e.target.value)}
                                        placeholder="admin@example.com"
                                    />
                                    {generalForm.errors.admin_email && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.admin_email}</p>}
                                </div>

                                {!isSuperAdmin && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Monthly Working Days</label>
                                            <input
                                                type="number"
                                                value={generalForm.data.monthly_working_days}
                                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                                onChange={(e) => generalForm.setData('monthly_working_days', e.target.value)}
                                                min="0"
                                                max="31"
                                            />
                                            {generalForm.errors.monthly_working_days && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.monthly_working_days}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Monthly Cycle Start Day</label>
                                            <input
                                                type="number"
                                                value={generalForm.data.month_start_day}
                                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                                onChange={(e) => generalForm.setData('month_start_day', e.target.value)}
                                                min="1"
                                                max="31"
                                            />
                                            {generalForm.errors.month_start_day && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.month_start_day}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Monthly Cycle End Day</label>
                                            <input
                                                type="number"
                                                value={generalForm.data.month_end_day}
                                                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                                                onChange={(e) => generalForm.setData('month_end_day', e.target.value)}
                                                min="1"
                                                max="31"
                                            />
                                            {generalForm.errors.month_end_day && <p className="text-xs text-red-500 font-bold ml-1">{generalForm.errors.month_end_day}</p>}
                                        </div>
                                    </>
                                )}
                            </div>

                            {isSuperAdmin && (
                                <div className="bg-gray-50/50 rounded-[28px] p-8 border border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowModuleVisibility(!showModuleVisibility)}
                                        className="flex items-center justify-between w-full group cursor-pointer"
                                    >
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Module Visibility</h3>
                                            <p className="text-gray-500 font-medium text-sm">Control module access globally across the system (Super Admins bypass these restrictions)</p>
                                        </div>
                                        <div className={`p-2 bg-white rounded-full shadow-sm border border-gray-100 transition-transform duration-300 ${showModuleVisibility ? 'rotate-180' : ''}`}>
                                            <ChevronRight className="rotate-90 text-gray-400" />
                                        </div>
                                    </button>

                                    {showModuleVisibility && (
                                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-200">
                                            {menuItems.map((item) => {
                                                const ItemIcon = item.icon;
                                                const isHidden = generalForm.data.hidden_modules.includes(item.id);
                                                const isVisible = !isHidden;

                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => toggleHiddenModule(item.id)}
                                                        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                                                            isVisible
                                                                ? 'bg-white border-gray-100 hover:border-emerald-300 hover:shadow-md'
                                                                : 'bg-gray-50/70 border-gray-200/80 opacity-80 hover:opacity-100 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3.5">
                                                            <div className={`p-2.5 rounded-xl transition-colors ${
                                                                isVisible ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-gray-100 text-gray-400'
                                                            }`}>
                                                                <ItemIcon size={20} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-sm tracking-tight">{item.label}</h4>
                                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold mt-0.5 ${
                                                                    isVisible ? 'text-emerald-600' : 'text-rose-500'
                                                                }`}>
                                                                    {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                                                                    {isVisible ? 'Visible' : 'Hidden'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Toggle Switch */}
                                                        <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                                                            isVisible ? 'bg-emerald-500' : 'bg-gray-300'
                                                        }`}>
                                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                                                isVisible ? 'translate-x-5' : 'translate-x-0'
                                                            }`} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end pt-6">
                                <button
                                    type="submit"
                                    disabled={generalForm.processing}
                                    className="px-10 py-4 bg-[#1e88e5] hover:bg-[#1565c0] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                >
                                    <Save size={18} />
                                    {generalForm.processing ? 'SAVING...' : 'SAVE GENERAL SETTINGS'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 2: WORKSHEET CONFIGURATION */}
                {activeTab === 'worksheet' && (
                    <>
                        {!selectedUser ? (
                            /* User Selection Cards Grid (Screenshot 2) */
                            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 animate-in fade-in duration-200">
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900">Worksheet Configuration</h2>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Select a user to customize their daily worksheet field visibility</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleSelectUser(user)}
                                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex items-center justify-between cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                                    {getInitials(user.name)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">{user.name}</h3>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">{user.email}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" size={20} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Individual User Worksheet Configuration (Screenshot 3) */
                            <div className="space-y-4 animate-in fade-in duration-200">
                                {/* Top bar breadcrumb / sub-header */}
                                <div className="flex items-center gap-3 px-2 text-gray-600 font-bold text-sm">
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5 text-gray-500 hover:text-gray-900 cursor-pointer"
                                    >
                                        <ArrowLeft size={18} />
                                        <span>Back</span>
                                    </button>
                                    <span className="text-gray-300">/</span>
                                    <span className="text-gray-900">Worksheet Settings - {selectedUser.name}</span>
                                </div>

                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-bold text-gray-900">Worksheet Settings</h2>
                                        <p className="text-sm text-gray-500 font-medium mt-1">
                                            Select which fields should be visible for {selectedUser.name}&apos;s daily worksheet.
                                        </p>
                                    </div>

                                    <form onSubmit={submitWorksheet} className="space-y-8">
                                        {/* Field Toggles Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { key: 'client_name_enabled', label: 'Client Name' },
                                                { key: 'task_type_enabled', label: 'Task Type' },
                                                { key: 'status_enabled', label: 'Status' },
                                                { key: 'file_name_enabled', label: 'File Name' },
                                                { key: 'drive_link_enabled', label: 'Drive Link' },
                                                { key: 'project_enabled', label: 'Project' },
                                                { key: 'task_type_freetext', label: 'Task Type Free Text' },
                                            ].map((field) => {
                                                const checked = worksheetForm.data[field.key];
                                                return (
                                                    <label
                                                        key={field.key}
                                                        className={`p-4 border rounded-2xl flex items-center gap-3.5 cursor-pointer transition-all ${
                                                            checked
                                                                ? 'border-blue-500 bg-blue-50/20 shadow-sm'
                                                                : 'border-gray-100 bg-white hover:border-gray-200'
                                                        }`}
                                                    >
                                                        <div
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                worksheetForm.setData(field.key, !checked);
                                                            }}
                                                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                                                checked ? 'bg-blue-600 text-white shadow-sm' : 'border-2 border-gray-300 bg-white'
                                                            }`}
                                                        >
                                                            {checked && <Check size={14} strokeWidth={3} />}
                                                        </div>
                                                        <span className="font-bold text-gray-800 text-sm">{field.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        <div className="border-t border-gray-100 pt-8">
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                Task Type Options (Comma Separated)
                                            </label>
                                            <textarea
                                                rows="3"
                                                value={worksheetForm.data.task_type_options}
                                                onChange={(e) => worksheetForm.setData('task_type_options', e.target.value)}
                                                className="w-full p-4 border border-gray-200 rounded-2xl font-extrabold text-gray-900 uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm tracking-wide"
                                                placeholder="DONE,NOT DONE,IN PROGRESS"
                                            />
                                            <p className="text-xs text-gray-400 italic mt-2">
                                                Enter the options that will appear in the Task Type dropdown for this user.
                                            </p>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <button
                                                type="submit"
                                                disabled={worksheetForm.processing}
                                                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                            >
                                                {worksheetForm.processing ? 'SAVING...' : 'Save Settings'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* TAB 3: DESIGNERS WORKLIST (Screenshot 4) */}
                {activeTab === 'designers' && (
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 animate-in fade-in duration-200">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900">Designers Worklist Defaults</h2>
                            <p className="text-sm text-gray-500 font-medium mt-1">Configure global default values for the designers module</p>
                        </div>

                        <form onSubmit={submitDesigners} className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                    TASK TYPE OPTIONS (COMMA SEPARATED)
                                </label>
                                <textarea
                                    rows="4"
                                    value={designersForm.data.designers_task_type_options}
                                    onChange={(e) => designersForm.setData('designers_task_type_options', e.target.value)}
                                    className="w-full p-5 bg-gray-50/40 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    placeholder="Poster, Thumbnail, Story, Carousel, Grid, Other"
                                />
                            </div>

                            {/* Info Banner Alert */}
                            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center gap-3 text-blue-600">
                                <CheckCircle size={20} className="shrink-0 text-blue-500" />
                                <span className="text-[11px] font-black uppercase tracking-wider">
                                    THESE OPTIONS WILL APPEAR IN THE &quot;TASK TYPE&quot; DROPDOWN FOR ALL DESIGNERS TASKS.
                                </span>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={designersForm.processing}
                                    className="px-8 py-4 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                >
                                    <Save size={18} />
                                    {designersForm.processing ? 'SAVING...' : 'SAVE DESIGNERS SETTINGS'}
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
            ` }} />
        </AdminLayout>
    );
}
