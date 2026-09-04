import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Settings, CreditCard, Check, X, Save, Users, AlertTriangle, ChevronUp, ChevronDown, Sliders, Sparkles, CheckCircle2, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

const CORE_MODULES = [
    { key: 'projects', label: 'Projects', is_core: true },
    { key: 'users', label: 'Employees', is_core: true },
    { key: 'leaves', label: 'Leaves', is_core: true },
    { key: 'attendance', label: 'Attendance', is_core: true },
    { key: 'calendar', label: 'Calendar', is_core: true },
    { key: 'chat', label: 'Chat', is_core: true },
    { key: 'reports', label: 'Reports', is_core: true },
    { key: 'user_limit_basic', label: 'Max 10 Active Users', is_core: true },
    { key: 'user_limit_premium', label: 'Unlimited Users', is_core: true }
];

export default function Index({ settings, admins = [], currentPlan, currentAdditionalModules = [] }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth?.user?.role === 'superadmin';
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'admins' && isSuperAdmin) {
                return 'admins';
            }
        }
        return 'plans';
    });

    // Super Admin pricing settings form
    const settingsForm = useForm({
        basic_plan_price: settings.basic_plan_price || '999',
        premium_plan_price: settings.premium_plan_price || '2999',
        basic_plan_features: settings.basic_plan_features || [],
        premium_plan_features: settings.premium_plan_features || [],
        additional_modules: settings.additional_modules || [],
        allow_admin_registration: (settings.allow_admin_registration ?? '1') === '1',
    });

    useEffect(() => {
        settingsForm.setData('allow_admin_registration', (settings.allow_admin_registration ?? '1') === '1');
    }, [settings.allow_admin_registration]);

    // Core module dropdown addition select state
    const [selectedCoreBasic, setSelectedCoreBasic] = useState('custom');
    const [selectedCorePremium, setSelectedCorePremium] = useState('custom');

    // Admin subscription update form
    const subscriptionForm = useForm({
        plan: currentPlan,
        additional_modules: [],
    });

    // Super Admin update admin user's plan form
    const adminPlanForm = useForm({
        plan: 'basic',
        additional_modules: [],
    });

    // Handlers for Additional Modules in Super Admin Plan Config
    const handleAddAdditionalModule = () => {
        const newKey = `module_${Date.now()}`;
        const newMod = {
            key: newKey,
            label: 'New Additional Module',
            price: 499,
            description: 'Custom module add-on',
            included: true,
        };
        settingsForm.setData('additional_modules', [...settingsForm.data.additional_modules, newMod]);
    };

    const handleUpdateAdditionalModule = (key, field, value) => {
        const updatedList = settingsForm.data.additional_modules.map((mod) => {
            if (mod.key === key) {
                return { ...mod, [field]: value };
            }
            return mod;
        });
        settingsForm.setData('additional_modules', updatedList);
    };

    const handleDeleteAdditionalModule = (key) => {
        const updatedList = settingsForm.data.additional_modules.filter((mod) => mod.key !== key);
        settingsForm.setData('additional_modules', updatedList);
    };

    // State for standard logged-in tenant Admin add-on module selections
    const [selectedAdminAddOns, setSelectedAdminAddOns] = useState(currentAdditionalModules || []);

    // Calculate Subscription Breakdown for Tenant Admin Billing Summary
    const basePlanPrice = currentPlan === 'basic' 
        ? Number(settings.basic_plan_price || 999) 
        : currentPlan === 'premium' 
        ? Number(settings.premium_plan_price || 2999) 
        : 0;

    const assignedModulesDetails = (settings.additional_modules || []).filter(mod => 
        (currentAdditionalModules || []).includes(mod.key)
    );

    const addOnsTotal = currentPlan === 'premium' 
        ? assignedModulesDetails.reduce((sum, mod) => sum + Number(mod.price || 499), 0)
        : 0;
    const grandTotal = basePlanPrice + addOnsTotal;

    // Super Admin: Module Assignment Modal State
    const [selectedAdminForModules, setSelectedAdminForModules] = useState(null);
    const [tempAdminModules, setTempAdminModules] = useState([]);
    const [moduleSearchQuery, setModuleSearchQuery] = useState('');

    const handleOpenManageModules = (admin) => {
        setSelectedAdminForModules(admin);
        setTempAdminModules(Array.isArray(admin.additional_modules) ? admin.additional_modules : []);
        setModuleSearchQuery('');
    };

    const handleSaveAdminModules = () => {
        if (!selectedAdminForModules) return;
        handleUpdateAdminPlan(selectedAdminForModules.id, selectedAdminForModules.plan || 'basic', tempAdminModules);
        setSelectedAdminForModules(null);
    };

    const handleToggleTempModule = (key) => {
        if (tempAdminModules.includes(key)) {
            setTempAdminModules(tempAdminModules.filter(k => k !== key));
        } else {
            setTempAdminModules([...tempAdminModules, key]);
        }
    };

    const handleToggleAdminAddOn = (key) => {
        if (selectedAdminAddOns.includes(key)) {
            setSelectedAdminAddOns(selectedAdminAddOns.filter(k => k !== key));
        } else {
            setSelectedAdminAddOns([...selectedAdminAddOns, key]);
        }
    };

    const handleSubscribe = (planName) => {
        router.post(route('admin.pricing.subscribe'), {
            plan: planName,
            additional_modules: selectedAdminAddOns,
        }, {
            onSuccess: () => toast.success(`Subscription updated successfully to ${planName.toUpperCase()} plan.`),
            onError: (err) => toast.error(err.error || "Failed to update subscription"),
        });
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        settingsForm.post(route('admin.pricing.settings'), {
            onSuccess: () => toast.success("Pricing configurations saved successfully"),
            onError: () => toast.error("Failed to save configurations"),
        });
    };

    const handleUpdateAdminPlan = (adminId, planName, additionalModules = []) => {
        router.post(route('admin.pricing.admin-plan', adminId), {
            plan: planName,
            additional_modules: additionalModules,
        }, {
            onSuccess: () => toast.success("Admin plan & modules updated successfully"),
            onError: () => toast.error("Failed to update subscription"),
        });
    };

    // Add feature to a specific plan
    const handleAddFeature = (plan) => {
        const fieldName = `${plan}_plan_features`;
        const selectValue = plan === 'basic' ? selectedCoreBasic : selectedCorePremium;
        const currentList = [...settingsForm.data[fieldName]];

        if (selectValue === 'custom') {
            const newKey = `custom_${Date.now()}`;
            const newFeature = {
                key: newKey,
                label: 'New Custom Feature',
                is_core: false,
                included: true
            };
            settingsForm.setData(fieldName, [...currentList, newFeature]);
        } else {
            // Find in core templates
            const template = CORE_MODULES.find(m => m.key === selectValue);
            if (template) {
                // Prevent duplicate keys
                if (currentList.some(item => item.key === selectValue)) {
                    toast.error("This module is already added to the plan.");
                    return;
                }
                settingsForm.setData(fieldName, [...currentList, { ...template, included: true }]);
            }
        }
    };

    // Rename feature in a specific plan
    const handleRenameFeature = (plan, key, newLabel) => {
        const fieldName = `${plan}_plan_features`;
        const currentList = settingsForm.data[fieldName].map(item => {
            if (item.key === key) {
                return { ...item, label: newLabel };
            }
            return item;
        });
        settingsForm.setData(fieldName, currentList);
    };

    // Toggle inclusion (check or cross)
    const handleToggleFeatureInclusion = (plan, key) => {
        const fieldName = `${plan}_plan_features`;
        const currentList = settingsForm.data[fieldName].map(item => {
            if (item.key === key) {
                return { ...item, included: !item.included };
            }
            return item;
        });
        settingsForm.setData(fieldName, currentList);
    };

    // Delete feature in a specific plan
    const handleDeleteFeature = (plan, key) => {
        const fieldName = `${plan}_plan_features`;
        const currentList = settingsForm.data[fieldName].filter(item => item.key !== key);
        settingsForm.setData(fieldName, currentList);
    };

    // Move feature order
    const handleMoveFeature = (plan, index, direction) => {
        const fieldName = `${plan}_plan_features`;
        const currentList = [...settingsForm.data[fieldName]];
        if (direction === 'up' && index > 0) {
            const temp = currentList[index];
            currentList[index] = currentList[index - 1];
            currentList[index - 1] = temp;
        } else if (direction === 'down' && index < currentList.length - 1) {
            const temp = currentList[index];
            currentList[index] = currentList[index + 1];
            currentList[index + 1] = temp;
        }
        settingsForm.setData(fieldName, currentList);
    };

    return (
        <AdminLayout title="Pricing & Subscription">
            <Head title="Pricing Plans" />

            <div className="w-full space-y-6 font-sans pb-10">
                {/* Header Section */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Subscription Plan & Pricing</h1>
                        <p className="text-gray-500 font-medium">
                            {isSuperAdmin 
                                ? "Manage subscription pricing plans and configure features mapping"
                                : `Manage your active workspace plan. Current plan: ${currentPlan.toUpperCase()}`
                            }
                        </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                        <CreditCard size={32} />
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex bg-white p-1.5 rounded-[20px] shadow-sm border border-gray-100 gap-1 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all whitespace-nowrap ${
                            activeTab === 'plans'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-50'
                        }`}
                    >
                        <CreditCard size={16} />
                        Pricing Plans
                    </button>

                    {!isSuperAdmin && (
                        <button
                            onClick={() => setActiveTab('subscription')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all whitespace-nowrap ${
                                activeTab === 'subscription'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-50'
                            }`}
                        >
                            <Receipt size={16} />
                            Subscription Details
                        </button>
                    )}

                    {isSuperAdmin && (
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all whitespace-nowrap ${
                                activeTab === 'config'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-50'
                            }`}
                        >
                            <Settings size={16} />
                            Plan Configuration
                        </button>
                    )}

                    {isSuperAdmin && (
                        <button
                            onClick={() => setActiveTab('admins')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all whitespace-nowrap ${
                                activeTab === 'admins'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-50'
                            }`}
                        >
                            <Users size={16} />
                            Manage Admin Plans ({admins.length})
                        </button>
                    )}
                </div>

                {/* TAB: PRICING PLANS */}
                {activeTab === 'plans' && (
                    <div className="space-y-12 max-w-5xl mx-auto pt-6 pb-6 px-4">
                        
                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* BASIC PLAN CARD */}
                            <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between h-full">
                                <div>
                                    {/* Top Blue Header Banner */}
                                    <div className="bg-[#1e75d8] pt-8 pb-6 px-6 relative flex flex-col items-center">
                                        {/* White Pill Badge */}
                                        <div className="bg-white px-8 py-2 rounded-xl shadow-md border border-white/20 mb-3">
                                            <span className="font-black text-sm uppercase tracking-widest text-[#1e75d8]">BASIC</span>
                                        </div>
                                        
                                        {/* Price Display */}
                                        <div className="text-center text-white">
                                            <span className="text-5xl font-black tracking-tight">₹{settings.basic_plan_price}</span>
                                            <span className="block text-xs font-semibold uppercase tracking-wider text-white/90 mt-1">Per Month</span>
                                        </div>
                                    </div>

                                    {/* Wavy Cutout Bottom Divider */}
                                    <div className="relative w-full overflow-hidden leading-none bg-[#1e75d8] -mt-0.5">
                                        <svg className="relative block w-full h-10 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
                                            <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" fill="#ffffff" fillOpacity="0.3"></path>
                                            <path d="M0,30 C250,100 450,10 700,80 C950,130 1080,25 1200,60 L1200,120 L0,120 Z" fill="#ffffff"></path>
                                        </svg>
                                    </div>

                                    {/* Feature list */}
                                    <div className="divide-y divide-slate-100 px-8 py-2">
                                        {settingsForm.data.basic_plan_features.map((module) => {
                                            const included = module.included !== false;
                                            const catchyLabels = {
                                                'projects': 'Core Project & Task Tracking',
                                                'users': 'Employee Directory & Profiles',
                                                'leaves': 'Automated Leave Requests',
                                                'attendance': 'Real-Time Attendance Logging',
                                                'user_limit_basic': 'Up to 10 Active Team Members',
                                            };
                                            const displayLabel = catchyLabels[module.key] || module.label;
                                            return (
                                                <div key={module.key} className="py-3.5 flex items-center gap-3.5">
                                                    {included ? (
                                                        <Check className="text-[#1e75d8] flex-shrink-0" size={18} strokeWidth={3} />
                                                    ) : (
                                                        <X className="text-red-500 flex-shrink-0" size={18} strokeWidth={3} />
                                                    )}
                                                    <span className={`text-sm font-medium ${included ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                                                        {displayLabel}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-8 pt-2">
                                    <div className="text-center">
                                        {isSuperAdmin ? (
                                            <button 
                                                disabled
                                                className="w-full py-3.5 bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl cursor-not-allowed"
                                            >
                                                System Tier (Super Admin)
                                            </button>
                                        ) : currentPlan === 'basic' ? (
                                            <button 
                                                disabled
                                                className="w-full py-3.5 bg-[#1e75d8] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md opacity-90 cursor-default flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={16} /> ACTIVE PLAN
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSubscribe('basic')}
                                                disabled={subscriptionForm.processing}
                                                className="w-full py-3.5 bg-[#1e75d8] hover:bg-[#165bb0] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all active:scale-98 shadow-md flex items-center justify-center gap-2"
                                            >
                                                {subscriptionForm.processing ? "Processing..." : "SELECT PLAN"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* PREMIUM PLAN CARD */}
                            <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between h-full">
                                <div>
                                    {/* Top Purple Header Banner */}
                                    <div className="bg-[#6b21a8] pt-8 pb-6 px-6 relative flex flex-col items-center">
                                        {/* White Pill Badge */}
                                        <div className="bg-white px-8 py-2 rounded-xl shadow-md border border-white/20 mb-3">
                                            <span className="font-black text-sm uppercase tracking-widest text-[#6b21a8]">PREMIUM</span>
                                        </div>
                                        
                                        {/* Price Display */}
                                        <div className="text-center text-white">
                                            <span className="text-5xl font-black tracking-tight">₹{settings.premium_plan_price}</span>
                                            <span className="block text-xs font-semibold uppercase tracking-wider text-white/90 mt-1">Per Month</span>
                                        </div>
                                    </div>

                                    {/* Wavy Cutout Bottom Divider */}
                                    <div className="relative w-full overflow-hidden leading-none bg-[#6b21a8] -mt-0.5">
                                        <svg className="relative block w-full h-10 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
                                            <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" fill="#ffffff" fillOpacity="0.3"></path>
                                            <path d="M0,30 C250,100 450,10 700,80 C950,130 1080,25 1200,60 L1200,120 L0,120 Z" fill="#ffffff"></path>
                                        </svg>
                                    </div>

                                    {/* Feature list */}
                                    <div className="divide-y divide-slate-100 px-8 py-2">
                                        {settingsForm.data.premium_plan_features.map((module) => {
                                            const included = module.included !== false;
                                            const catchyLabels = {
                                                'projects': 'Advanced Multi-Project Management',
                                                'users': 'Unlimited Employee Management',
                                                'leaves': 'Automated Leave & Approval Workflows',
                                                'attendance': 'Real-Time Biometric & Geo Attendance',
                                                'calendar': 'Interactive Shared Team Calendar',
                                                'chat': 'Instant Workspace Team Messaging',
                                                'reports': 'Executive Analytics & Custom Reports',
                                                'drive': 'Cloud Storage & Drive Integration',
                                                'user_limit_premium': 'Unlimited Active Users & Scale',
                                            };
                                            const displayLabel = catchyLabels[module.key] || module.label;
                                            return (
                                                <div key={module.key} className="py-3.5 flex items-center gap-3.5">
                                                    {included ? (
                                                        <Check className="text-[#6b21a8] flex-shrink-0" size={18} strokeWidth={3} />
                                                    ) : (
                                                        <X className="text-red-500 flex-shrink-0" size={18} strokeWidth={3} />
                                                    )}
                                                    <span className={`text-sm font-medium ${included ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                                                        {displayLabel}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-8 pt-2">
                                    <div className="text-center">
                                        {isSuperAdmin ? (
                                            <button 
                                                disabled
                                                className="w-full py-3.5 bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl cursor-not-allowed"
                                            >
                                                System Tier (Super Admin)
                                            </button>
                                        ) : currentPlan === 'premium' ? (
                                            <button 
                                                disabled
                                                className="w-full py-3.5 bg-[#6b21a8] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md opacity-90 cursor-default flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={16} /> ACTIVE PLAN
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSubscribe('premium')}
                                                disabled={subscriptionForm.processing}
                                                className="w-full py-3.5 bg-[#6b21a8] hover:bg-[#581a87] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all active:scale-98 shadow-md flex items-center justify-center gap-2"
                                            >
                                                {subscriptionForm.processing ? "Processing..." : "SELECT PLAN"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* ADD-ON MODULES BOX (Vibrant Light Colored Gradient Background) */}
                        <div className="bg-white rounded-[32px] border border-purple-200/80 shadow-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-100 via-indigo-100/90 to-purple-200/80 p-8 sm:p-10 relative overflow-hidden border-b border-purple-200">
                                <div className="absolute right-0 top-0 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 text-[#7460ee] text-xs font-black uppercase tracking-wider border border-purple-200/80 mb-3 shadow-xs">
                                        <Sparkles size={14} /> Power-Up Extensions
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                                        Add-On Modules Box
                                    </h2>
                                    <p className="text-slate-700 text-sm mt-1 max-w-xl font-medium">
                                        Specialized workspace extensions including AI Assistant and Catering Module available for tenant environments.
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 sm:p-10 bg-slate-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* AI ASSISTANT CARD */}
                                    <div className="p-6 rounded-2xl border-2 border-purple-200 bg-white shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#7460ee] flex items-center justify-center font-bold text-xl">
                                                    🤖
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900 text-base">AI Voice Assistant</h4>
                                                        <span className="px-2 py-0.5 bg-purple-100 text-[#7460ee] text-[10px] font-extrabold uppercase rounded-md">
                                                            Featured
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold text-emerald-600">₹499 / month</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                                Malayalam & English Voice AI Assistant for database queries & automated insights
                                            </p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-slate-400">Available Extension</span>
                                            <span className="text-xs font-extrabold text-[#7460ee]">Available for Premium</span>
                                        </div>
                                    </div>

                                    {/* CATERING MODULE CARD */}
                                    <div className="p-6 rounded-2xl border-2 border-amber-200 bg-white shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xl">
                                                    🍽️
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900 text-base">Catering Module</h4>
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-extrabold uppercase rounded-md">
                                                            New Add-on
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold text-emerald-600">₹499 / month</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                                Complete catering management, custom menu planning, event order tracking & kitchen workflows
                                            </p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-slate-400">Available Extension</span>
                                            <span className="text-xs font-extrabold text-[#7460ee]">Available for Premium</span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* TAB: SUBSCRIPTION DETAILS (SEPARATE FULL WIDTH TAB FOR TENANT ADMINS) */}
                {activeTab === 'subscription' && !isSuperAdmin && (
                    <div className="w-full space-y-8 pt-4">
                        <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-sm border border-gray-100 space-y-8 w-full">
                            
                            {/* Header & Total Monthly Amount Box */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-wider mb-3 border border-emerald-100">
                                        <CheckCircle2 size={15} className="text-emerald-500" /> Active Subscription
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Subscription & Billing Details</h2>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Full invoice breakdown of your active base plan and assigned additional modules.</p>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-emerald-50/60 rounded-3xl p-6 sm:p-7 border border-indigo-100/80 shadow-sm w-full md:w-auto min-w-[340px] relative overflow-hidden group hover:shadow-md transition-all">
                                    {/* Ambient soft background glow blobs */}
                                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-300/20 rounded-full blur-2xl pointer-events-none"></div>
                                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl pointer-events-none"></div>
                                    
                                    <div className="relative z-10 text-left md:text-right space-y-2">
                                        <div className="flex items-center justify-start md:justify-end gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100/80 text-indigo-700 rounded-full text-[11px] font-black uppercase tracking-wider border border-indigo-200/50">
                                                <Receipt size={13} className="text-indigo-600" /> TOTAL MONTHLY AMOUNT
                                            </span>
                                        </div>
                                        
                                        <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mt-1">
                                            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
                                                ₹{grandTotal.toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-sm font-bold text-slate-500 ml-1.5">/ mo</span>
                                        </div>
                                        
                                        <div className="inline-flex flex-wrap items-center justify-start md:justify-end gap-1.5 text-xs font-semibold text-slate-600 pt-1">
                                            <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/60 text-slate-700 shadow-2xs">
                                                Base: <strong className="text-slate-900 font-extrabold">₹{basePlanPrice.toLocaleString('en-IN')}</strong>
                                            </span>
                                            <span className="text-slate-400 font-bold">+</span>
                                            <span className="bg-purple-100/60 px-2.5 py-1 rounded-lg border border-purple-200/50 text-purple-800 shadow-2xs">
                                                Add-ons: <strong className="text-purple-950 font-extrabold">₹{addOnsTotal.toLocaleString('en-IN')}</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3 KPI Stat Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Base Plan */}
                                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">ACTIVE BASE PLAN</span>
                                    <div className="text-2xl font-black text-slate-900 uppercase">
                                        {currentPlan ? `${currentPlan} Plan` : 'No Active Plan'}
                                    </div>
                                    <div className="text-sm font-bold text-emerald-600">
                                        ₹{basePlanPrice.toLocaleString('en-IN')} / month
                                    </div>
                                </div>

                                {/* Add-ons Subtotal */}
                                <div className="p-6 rounded-3xl bg-purple-50/70 border border-purple-100 space-y-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-purple-600 block">ADD-ON MODULES</span>
                                    <div className="text-2xl font-black text-purple-950">
                                        {assignedModulesDetails.length} {assignedModulesDetails.length === 1 ? 'Module' : 'Modules'}
                                    </div>
                                    <div className="text-sm font-bold text-purple-700">
                                        ₹{addOnsTotal.toLocaleString('en-IN')} / month
                                    </div>
                                </div>

                                {/* Total Billing */}
                                <div className="p-6 rounded-3xl bg-blue-50/70 border border-blue-100 space-y-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-blue-600 block">TOTAL SUBSCRIPTION COST</span>
                                    <div className="text-2xl font-black text-blue-950">
                                        ₹{grandTotal.toLocaleString('en-IN')} / mo
                                    </div>
                                    <div className="text-xs font-bold text-blue-600">
                                        Billed Monthly
                                    </div>
                                </div>
                            </div>

                            {/* Detailed List of Assigned Add-on Modules */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Assigned Add-on Modules Breakdown</h3>
                                    <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-3.5 py-1.5 rounded-full border border-purple-100">
                                        {assignedModulesDetails.length} Assigned by Super Admin
                                    </span>
                                </div>

                                {assignedModulesDetails.length === 0 ? (
                                    <div className="p-10 text-center bg-gray-50/70 rounded-3xl border border-dashed border-gray-200 text-gray-400">
                                        <p className="text-sm font-bold text-gray-600">No additional modules are currently assigned to your workspace.</p>
                                        <p className="text-xs text-gray-400 mt-1">If you require add-on modules (e.g. Content Calendar, Daily Listings, Designers Worklist, Domains), contact your Super Admin.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {assignedModulesDetails.map((mod) => (
                                            <div key={mod.key} className="p-6 rounded-2xl bg-white border border-gray-200/90 shadow-sm flex items-center justify-between gap-4 hover:border-purple-200 transition-all">
                                                <div className="space-y-1">
                                                    <div className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                                                        <Sparkles size={18} className="text-purple-600" />
                                                        {mod.label}
                                                    </div>
                                                    {mod.description && (
                                                        <p className="text-xs text-gray-500 font-medium">{mod.description}</p>
                                                    )}
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-sm font-black text-purple-700 bg-purple-50 px-3.5 py-2 rounded-xl border border-purple-100 whitespace-nowrap">
                                                        + ₹{mod.price || 499} / mo
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: SUPER ADMIN PRICING CONFIGURATION */}
                {activeTab === 'config' && isSuperAdmin && (
                    <form onSubmit={handleSaveSettings} className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Plan Subscription Amounts & Modules</h2>
                            <p className="text-gray-400 text-sm">Update plan pricing, customize module names, and map features to subscription tiers.</p>
                        </div>

                        {/* Prices row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100 pb-8">
                            {/* Basic Price */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Basic Plan Subscription Amount (₹)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold"
                                    value={settingsForm.data.basic_plan_price}
                                    onChange={(e) => settingsForm.setData('basic_plan_price', e.target.value)}
                                />
                                {settingsForm.errors.basic_plan_price && (
                                    <p className="text-red-500 text-xs mt-1">{settingsForm.errors.basic_plan_price}</p>
                                )}
                            </div>

                            {/* Premium Price */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Premium Plan Subscription Amount (₹)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold"
                                    value={settingsForm.data.premium_plan_price}
                                    onChange={(e) => settingsForm.setData('premium_plan_price', e.target.value)}
                                />
                                {settingsForm.errors.premium_plan_price && (
                                    <p className="text-red-500 text-xs mt-1">{settingsForm.errors.premium_plan_price}</p>
                                )}
                            </div>
                        </div>

                        {/* Separate Basic and Premium Features Configuration */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            
                            {/* COLUMN 1: BASIC PLAN FEATURES */}
                            <div className="space-y-6">
                                <div className="border-b border-gray-50 pb-4">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Basic Plan Features</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Configure, rename, order, and toggle bullet points for the Basic Tier.</p>
                                </div>

                                <div className="flex gap-2">
                                    <select
                                        value={selectedCoreBasic}
                                        onChange={(e) => setSelectedCoreBasic(e.target.value)}
                                        className="flex-grow rounded-xl border border-gray-200 text-xs px-3 bg-white text-gray-900"
                                    >
                                        <option value="custom">Custom Text Feature</option>
                                        {CORE_MODULES.filter(m => !m.key.startsWith('user_limit')).map(m => (
                                            <option key={m.key} value={m.key}>{m.label} (Core)</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleAddFeature('basic')}
                                        className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                                    >
                                        + Add Feature
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {settingsForm.data.basic_plan_features.map((mod, index) => (
                                        <div key={mod.key} className="flex items-center justify-between gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-2xl">
                                            <div className="flex-grow flex items-center gap-2">
                                                {/* Reorder Buttons */}
                                                <div className="flex flex-col gap-0.5 mr-1">
                                                    <button
                                                        type="button"
                                                        disabled={index === 0}
                                                        onClick={() => handleMoveFeature('basic', index, 'up')}
                                                        className={`p-0.5 rounded transition-colors ${
                                                            index === 0 
                                                                ? 'text-gray-300 cursor-not-allowed' 
                                                                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                                                        }`}
                                                        title="Move Up"
                                                    >
                                                        <ChevronUp size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={index === settingsForm.data.basic_plan_features.length - 1}
                                                        onClick={() => handleMoveFeature('basic', index, 'down')}
                                                        className={`p-0.5 rounded transition-colors ${
                                                            index === settingsForm.data.basic_plan_features.length - 1 
                                                                ? 'text-gray-300 cursor-not-allowed' 
                                                                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                                                        }`}
                                                        title="Move Down"
                                                    >
                                                        <ChevronDown size={14} />
                                                    </button>
                                                </div>

                                                {/* Inclusion Checkbox */}
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                                                    checked={mod.included !== false}
                                                    onChange={() => handleToggleFeatureInclusion('basic', mod.key)}
                                                    title={mod.included !== false ? "Included (Green check)" : "Not Included (Red cross)"}
                                                />

                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-1 focus:ring-emerald-500 bg-white text-gray-900"
                                                    value={mod.label}
                                                    onChange={(e) => handleRenameFeature('basic', mod.key, e.target.value)}
                                                    placeholder="Feature name"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                    mod.is_core 
                                                        ? 'bg-blue-50 text-blue-600' 
                                                        : 'bg-yellow-50 text-yellow-600'
                                                }`}>
                                                    {mod.is_core ? 'Core' : 'Custom'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteFeature('basic', mod.key)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Delete Feature"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* COLUMN 2: PREMIUM PLAN FEATURES */}
                            <div className="space-y-6">
                                <div className="border-b border-gray-50 pb-4">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Premium Plan Features</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Configure, rename, order, and toggle bullet points for the Premium Tier.</p>
                                </div>

                                <div className="flex gap-2">
                                    <select
                                        value={selectedCorePremium}
                                        onChange={(e) => setSelectedCorePremium(e.target.value)}
                                        className="flex-grow rounded-xl border border-gray-200 text-xs px-3 bg-white text-gray-900"
                                    >
                                        <option value="custom">Custom Text Feature</option>
                                        {CORE_MODULES.filter(m => !m.key.startsWith('user_limit')).map(m => (
                                            <option key={m.key} value={m.key}>{m.label} (Core)</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleAddFeature('premium')}
                                        className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                                    >
                                        + Add Feature
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {settingsForm.data.premium_plan_features.map((mod, index) => (
                                        <div key={mod.key} className="flex items-center justify-between gap-3 p-3 bg-gray-50/50 border border-gray-100 rounded-2xl">
                                            <div className="flex-grow flex items-center gap-2">
                                                {/* Reorder Buttons */}
                                                <div className="flex flex-col gap-0.5 mr-1">
                                                    <button
                                                        type="button"
                                                        disabled={index === 0}
                                                        onClick={() => handleMoveFeature('premium', index, 'up')}
                                                        className={`p-0.5 rounded transition-colors ${
                                                            index === 0 
                                                                ? 'text-gray-300 cursor-not-allowed' 
                                                                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                                                        }`}
                                                        title="Move Up"
                                                    >
                                                        <ChevronUp size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={index === settingsForm.data.premium_plan_features.length - 1}
                                                        onClick={() => handleMoveFeature('premium', index, 'down')}
                                                        className={`p-0.5 rounded transition-colors ${
                                                            index === settingsForm.data.premium_plan_features.length - 1 
                                                                ? 'text-gray-300 cursor-not-allowed' 
                                                                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                                                        }`}
                                                        title="Move Down"
                                                    >
                                                        <ChevronDown size={14} />
                                                    </button>
                                                </div>

                                                {/* Inclusion Checkbox */}
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                                                    checked={mod.included !== false}
                                                    onChange={() => handleToggleFeatureInclusion('premium', mod.key)}
                                                    title={mod.included !== false ? "Included (Green check)" : "Not Included (Red cross)"}
                                                />

                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-1 focus:ring-emerald-500 bg-white text-gray-900"
                                                    value={mod.label}
                                                    onChange={(e) => handleRenameFeature('premium', mod.key, e.target.value)}
                                                    placeholder="Feature name"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                    mod.is_core 
                                                        ? 'bg-blue-50 text-blue-600' 
                                                        : 'bg-yellow-50 text-yellow-600'
                                                }`}>
                                                    {mod.is_core ? 'Core' : 'Custom'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteFeature('premium', mod.key)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Delete Feature"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* SECTION: ADDITIONAL MODULES (ADD-ONS) CONFIGURATION */}
                        <div className="pt-8 border-t border-gray-100 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                                        Add-ons Management
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Additional Modules (Add-ons) & Prices</h3>
                                    <p className="text-xs text-gray-500">Separately marked modules with individual price fields. Clients can add these to Premium plans for an additional cost.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddAdditionalModule}
                                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-purple-600/20 whitespace-nowrap self-start sm:self-auto"
                                >
                                    + Add New Additional Module
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {settingsForm.data.additional_modules.map((mod) => (
                                    <div key={mod.key} className="p-5 bg-purple-50/30 border border-purple-100 rounded-3xl space-y-3 relative">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-grow">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer"
                                                    checked={mod.included !== false}
                                                    onChange={(e) => handleUpdateAdditionalModule(mod.key, 'included', e.target.checked)}
                                                    title="Enable or disable this additional module"
                                                />
                                                <input
                                                    type="text"
                                                    className="font-bold text-gray-900 text-sm px-3 py-1.5 rounded-xl border border-gray-200 focus:ring-1 focus:ring-purple-500 bg-white w-full"
                                                    value={mod.label}
                                                    onChange={(e) => handleUpdateAdditionalModule(mod.key, 'label', e.target.value)}
                                                    placeholder="Module Title (e.g. Content Calendar)"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteAdditionalModule(mod.key)}
                                                className="text-red-400 hover:text-red-600 p-1 transition-colors"
                                                title="Remove additional module"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 items-center">
                                            <div className="col-span-1">
                                                <label className="block text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">Price (₹/mo)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:ring-1 focus:ring-purple-500 bg-white"
                                                        value={mod.price ?? 499}
                                                        onChange={(e) => handleUpdateAdditionalModule(mod.key, 'price', e.target.value)}
                                                        placeholder="499"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:ring-1 focus:ring-purple-500 bg-white"
                                                    value={mod.description || ''}
                                                    onChange={(e) => handleUpdateAdditionalModule(mod.key, 'description', e.target.value)}
                                                    placeholder="Brief description of add-on"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                                <div className="flex justify-end pt-6 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={settingsForm.processing}
                                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[11px] transition-all shadow-md shadow-emerald-600/25"
                                    >
                                        <Save size={16} />
                                        {settingsForm.processing ? "Saving..." : "Save Configuration"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* TAB: SUPER ADMIN ADMINS SUBSCRIPTION MANAGEMENT */}
                        {activeTab === 'admins' && isSuperAdmin && (
                            <div className="space-y-6">
                                {/* Admin Registration Control (Top of Manage Admin Plans tab) */}
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 mb-1">Admin Registration Control</h2>
                                        <p className="text-gray-400 text-sm">Enable or disable new company client admin sign-ups from the public frontend pricing page.</p>
                                    </div>

                                    <form onSubmit={handleSaveSettings} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settingsForm.data.allow_admin_registration}
                                                onChange={(e) => settingsForm.setData('allow_admin_registration', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <div>
                                                <span className="text-sm font-bold text-gray-900 block">Allow New Admin Registrations</span>
                                                <span className="text-xs text-gray-500 block">When unchecked, public sign-ups on the pricing page will be paused.</span>
                                            </div>
                                        </label>

                                        <button
                                            type="submit"
                                            disabled={settingsForm.processing}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] transition-all shadow-sm flex-shrink-0"
                                        >
                                            <Save size={14} />
                                            {settingsForm.processing ? "Saving..." : "Save Setting"}
                                        </button>
                                    </form>
                                </div>

                                {/* Manage Admin Users & Subscriptions Table */}
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 mb-1">Manage Admin Users & Subscriptions</h2>
                                        <p className="text-gray-400 text-sm">Force switch subscriptions or grant additional add-on modules to client administrators.</p>
                                    </div>

                                    {admins.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-[24px]">
                                            <AlertTriangle className="text-gray-300 mb-3" size={48} />
                                            <p className="text-gray-500 font-medium">No admin users found in the system.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-gray-100">
                                                        <th className="pb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Admin Name</th>
                                                        <th className="pb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Email Address</th>
                                                        <th className="pb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Account Status</th>
                                                        <th className="pb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Current Plan</th>
                                                        <th className="pb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Granted Add-on Modules</th>
                                                        <th className="pb-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {admins.map((admin) => {
                                                        const adminMods = Array.isArray(admin.additional_modules) ? admin.additional_modules : [];
                                                        return (
                                                            <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="py-4 font-semibold text-gray-900 text-sm">{admin.name}</td>
                                                                <td className="py-4 text-gray-500 text-sm">{admin.email}</td>
                                                                <td className="py-4">
                                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                                        admin.is_active
                                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                            : 'bg-red-50 text-red-600 border border-red-100'
                                                                    }`}>
                                                                        {admin.is_active ? 'Active' : 'Disabled'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-4">
                                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                                        admin.plan === 'premium'
                                                                            ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                                    }`}>
                                                                        {admin.plan || 'basic'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                                            adminMods.length > 0
                                                                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                                                : 'bg-gray-100 text-gray-500'
                                                                        }`}>
                                                                            {adminMods.length} Active {adminMods.length === 1 ? 'Add-on' : 'Add-ons'}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => handleOpenManageModules(admin)}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                                                        >
                                                                            <Sliders size={13} />
                                                                            Assign Modules
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={() => router.post(route('admin.pricing.admin-status', admin.id))}
                                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                                admin.is_active
                                                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 cursor-pointer'
                                                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer'
                                                                            }`}
                                                                        >
                                                                            {admin.is_active ? 'Disable' : 'Enable'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleUpdateAdminPlan(admin.id, 'basic', adminMods)}
                                                                            disabled={admin.plan === 'basic' || adminPlanForm.processing}
                                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                                admin.plan === 'basic'
                                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                                            }`}
                                                                        >
                                                                            Basic
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleUpdateAdminPlan(admin.id, 'premium', adminMods)}
                                                                            disabled={admin.plan === 'premium' || adminPlanForm.processing}
                                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                                admin.plan === 'premium'
                                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                                                                            }`}
                                                                        >
                                                                            Premium
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

            {/* SUPER ADMIN: ASSIGN MODULES MODAL */}
            {selectedAdminForModules && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Assign Additional Modules
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Manage add-on modules for <span className="font-bold text-gray-800">{selectedAdminForModules.name}</span> ({selectedAdminForModules.email})
                                </p>
                            </div>
                            <button onClick={() => setSelectedAdminForModules(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search & Select All */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <input
                                type="text"
                                placeholder="Search modules..."
                                value={moduleSearchQuery}
                                onChange={(e) => setModuleSearchQuery(e.target.value)}
                                className="w-full sm:w-64 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-purple-500"
                            />
                            <div className="flex items-center gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setTempAdminModules(settingsForm.data.additional_modules.map(m => m.key))}
                                    className="text-purple-600 font-bold hover:underline"
                                >
                                    Select All
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    type="button"
                                    onClick={() => setTempAdminModules([])}
                                    className="text-gray-500 font-bold hover:underline"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Module List */}
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                            {settingsForm.data.additional_modules
                                .filter(m => (m.label || '').toLowerCase().includes(moduleSearchQuery.toLowerCase()))
                                .map((mod) => {
                                    const isChecked = tempAdminModules.includes(mod.key);
                                    return (
                                        <div
                                            key={mod.key}
                                            onClick={() => handleToggleTempModule(mod.key)}
                                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                isChecked
                                                    ? 'bg-purple-50/80 border-purple-300 text-purple-900 shadow-sm'
                                                    : 'bg-gray-50/50 border-gray-100 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {}}
                                                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer"
                                                />
                                                <div>
                                                    <div className="font-bold text-sm text-gray-900">{mod.label}</div>
                                                    {mod.description && (
                                                        <div className="text-xs text-gray-500">{mod.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="font-extrabold text-purple-600 bg-white px-2.5 py-1 rounded-xl border border-purple-100 text-xs">
                                                + ₹{mod.price ?? 499}/mo
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setSelectedAdminForModules(null)}
                                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveAdminModules}
                                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase shadow-md"
                            >
                                Save Assigned Modules ({tempAdminModules.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </AdminLayout>
    );
}
