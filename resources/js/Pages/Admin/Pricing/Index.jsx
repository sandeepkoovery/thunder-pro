import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Settings, CreditCard, Check, X, Save, Users, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
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

export default function Index({ settings, admins, currentPlan }) {
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
    });

    // Core module dropdown addition select state
    const [selectedCoreBasic, setSelectedCoreBasic] = useState('custom');
    const [selectedCorePremium, setSelectedCorePremium] = useState('custom');

    // Admin subscription update form
    const subscriptionForm = useForm({
        plan: currentPlan,
    });

    // Super Admin update admin user's plan form
    const adminPlanForm = useForm({
        plan: 'basic',
    });

    const handleSubscribe = (planName) => {
        if (planName === currentPlan) return;
        
        subscriptionForm.setData('plan', planName);
        subscriptionForm.post(route('admin.pricing.subscribe'), {
            onSuccess: () => toast.success(`Subscribed to ${planName.toUpperCase()} plan successfully.`),
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

    const handleUpdateAdminPlan = (adminId, planName) => {
        adminPlanForm.setData('plan', planName);
        adminPlanForm.post(route('admin.pricing.admin-plan', adminId), {
            onSuccess: () => toast.success("Admin subscription updated successfully"),
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-4xl mx-auto pt-10 pb-6 px-8">
                        
                        {/* BASIC PLAN CARD */}
                        <div className="relative">
                            {/* Teal L-Shape Accent Behind Card */}
                            <div className="absolute left-[-16px] bottom-[-16px] w-[20px] h-[55%] bg-[#00a896] rounded-bl-sm z-0"></div>
                            <div className="absolute left-[-16px] bottom-[-16px] w-[55%] h-[20px] bg-[#00a896] rounded-bl-sm z-0"></div>
                            
                            {/* Main White Card */}
                            <div className="relative z-10 bg-white border border-gray-200 p-10 flex flex-col justify-between h-full shadow-lg">
                                <div>
                                    {/* Title */}
                                    <h3 className="text-3xl font-light text-center text-gray-800 mb-2">Basic</h3>

                                    {/* Price */}
                                    <div className="text-center mb-8">
                                        <span className="text-5xl font-light text-gray-800 tracking-tight">₹{settings.basic_plan_price}</span>
                                        <span className="text-xs font-normal text-gray-400 block mt-1">per month</span>
                                    </div>

                                    {/* Feature list */}
                                    <div className="space-y-4 max-w-xs mx-auto mb-10">
                                        {settingsForm.data.basic_plan_features.map((module) => {
                                            const included = module.included !== false;
                                            return (
                                                <div key={module.key} className="flex items-center gap-4">
                                                    {included ? (
                                                        <Check className="text-emerald-600 flex-shrink-0" size={18} strokeWidth={3} />
                                                    ) : (
                                                        <X className="text-red-500 flex-shrink-0" size={18} strokeWidth={3} />
                                                    )}
                                                    <span className={`text-sm font-normal ${included ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                                                        {module.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    {/* Buy / Subscribe Button */}
                                    <div className="text-center">
                                        {isSuperAdmin ? (
                                            <button 
                                                disabled
                                                className="w-full py-3 bg-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                                            >
                                                Configure
                                            </button>
                                        ) : currentPlan === 'basic' ? (
                                            <button 
                                                disabled
                                                className="w-full py-3 bg-[#00a896] text-white text-xs font-bold uppercase tracking-wider cursor-default shadow-md"
                                            >
                                                ACTIVE PLAN
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSubscribe('basic')}
                                                disabled={subscriptionForm.processing}
                                                className="w-full py-3 bg-[#00a896] hover:bg-[#009282] text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm"
                                            >
                                                {subscriptionForm.processing ? "Processing..." : "SELECT"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PREMIUM PLAN CARD */}
                        <div className="relative">
                            {/* Red L-Shape Accent Behind Card */}
                            <div className="absolute left-[-16px] bottom-[-16px] w-[20px] h-[55%] bg-[#d90429] rounded-bl-sm z-0"></div>
                            <div className="absolute left-[-16px] bottom-[-16px] w-[55%] h-[20px] bg-[#d90429] rounded-bl-sm z-0"></div>
                            
                            {/* Main White Card */}
                            <div className="relative z-10 bg-white border border-gray-200 p-10 flex flex-col justify-between h-full shadow-lg">
                                <div>
                                    {/* Title */}
                                    <h3 className="text-3xl font-light text-center text-gray-800 mb-2">Premium</h3>

                                    {/* Price */}
                                    <div className="text-center mb-8">
                                        <span className="text-5xl font-light text-gray-800 tracking-tight">₹{settings.premium_plan_price}</span>
                                        <span className="text-xs font-normal text-gray-400 block mt-1">per month</span>
                                    </div>

                                    {/* Feature list */}
                                    <div className="space-y-4 max-w-xs mx-auto mb-10">
                                        {settingsForm.data.premium_plan_features.map((module) => {
                                            const included = module.included !== false;
                                            return (
                                                <div key={module.key} className="flex items-center gap-4">
                                                    {included ? (
                                                        <Check className="text-emerald-600 flex-shrink-0" size={18} strokeWidth={3} />
                                                    ) : (
                                                        <X className="text-red-500 flex-shrink-0" size={18} strokeWidth={3} />
                                                    )}
                                                    <span className={`text-sm font-normal ${included ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                                                        {module.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    {/* Buy / Subscribe Button */}
                                    <div className="text-center">
                                        {isSuperAdmin ? (
                                            <button 
                                                disabled
                                                className="w-full py-3 bg-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                                            >
                                                Configure
                                            </button>
                                        ) : currentPlan === 'premium' ? (
                                            <button 
                                                disabled
                                                className="w-full py-3 bg-[#d90429] text-white text-xs font-bold uppercase tracking-wider cursor-default shadow-md"
                                            >
                                                ACTIVE PLAN
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSubscribe('premium')}
                                                disabled={subscriptionForm.processing}
                                                className="w-full py-3 bg-[#d90429] hover:bg-[#bd0320] text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm"
                                            >
                                                {subscriptionForm.processing ? "Processing..." : "SELECT"}
                                            </button>
                                        )}
                                    </div>
                                </div>
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

                        <div className="flex justify-end pt-4 border-t border-gray-100">
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
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Manage Admin User Subscriptions</h2>
                            <p className="text-gray-400 text-sm">Force switch subscriptions or plans for specific company administrators.</p>
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
                                            <th className="pb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Current Plan</th>
                                            <th className="pb-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {admins.map((admin) => (
                                            <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 font-semibold text-gray-900 text-sm">{admin.name}</td>
                                                <td className="py-4 text-gray-500 text-sm">{admin.email}</td>
                                                <td className="py-4">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                        admin.plan === 'premium'
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    }`}>
                                                        {admin.plan || 'basic'}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleUpdateAdminPlan(admin.id, 'basic')}
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
                                                            onClick={() => handleUpdateAdminPlan(admin.id, 'premium')}
                                                            disabled={admin.plan === 'premium' || adminPlanForm.processing}
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                admin.plan === 'premium'
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                                            }`}
                                                        >
                                                            Premium
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
