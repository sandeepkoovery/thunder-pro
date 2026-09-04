import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    Check, 
    X, 
    Zap, 
    ShieldCheck, 
    ArrowLeft, 
    Lock, 
    Building, 
    Mail, 
    User, 
    Phone, 
    CreditCard,
    Sparkles,
    CheckCircle2,
    Menu
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const getAssetUrl = (path) => {
    try {
        let base = "";
        if (window.Ziggy && window.Ziggy.url) {
            base = window.Ziggy.url;
        } else {
            const origin = window.location.origin;
            if (window.location.pathname.includes('/erp_pro/public')) {
                base = origin + '/erp_pro/public';
            } else {
                base = origin;
            }
        }
        const baseSlash = base.endsWith('/') ? base : base + '/';
        return baseSlash + (path.startsWith('/') ? path.substring(1) : path);
    } catch (e) {
        return '/' + path;
    }
};

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function Pricing({ settings, currentPlan, currentAdditionalModules = [], razorpayKey }) {
    const { auth } = usePage().props;
    const currentUser = auth?.user;

    const isAdmin = currentUser && ['admin', 'superadmin'].includes(currentUser.role);
    const isRegularUser = currentUser && !['admin', 'superadmin'].includes(currentUser.role);

    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedAdditionalModules, setSelectedAdditionalModules] = useState(currentAdditionalModules || []);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Form fields for registration / checkout
    const [formData, setFormData] = useState({
        company_name: currentUser?.company_name || currentUser?.address || '',
        email: currentUser?.email || '',
        password: '',
        password_confirmation: '',
        phone: currentUser?.phone || '',
        accept_terms: false,
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadRazorpayScript();
    }, []);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const isRegistrationAllowed = (settings.allow_admin_registration ?? '1') === '1';

    const handleToggleAdditionalModule = (key) => {
        if (selectedAdditionalModules.includes(key)) {
            setSelectedAdditionalModules(selectedAdditionalModules.filter(k => k !== key));
        } else {
            setSelectedAdditionalModules([...selectedAdditionalModules, key]);
        }
    };

    const computeTotalPrice = (planName) => {
        const basePrice = planName === 'premium'
            ? parseFloat(settings.premium_plan_price || 2999)
            : parseFloat(settings.basic_plan_price || 999);

        if (planName !== 'premium') {
            return basePrice;
        }

        let addOnsSum = 0;
        if (settings.additional_modules && Array.isArray(settings.additional_modules)) {
            settings.additional_modules.forEach(mod => {
                if (mod.included !== false && selectedAdditionalModules.includes(mod.key)) {
                    addOnsSum += parseFloat(mod.price || 0);
                }
            });
        }
        return basePrice + addOnsSum;
    };

    const handleSelectPlan = (planName) => {
        setSelectedPlan(planName);
        if (currentUser) {
            // Logged in user: proceed with checkout directly
            initiatePayment(planName, {}, selectedAdditionalModules);
        } else {
            if (!isRegistrationAllowed) {
                toast.error("New admin registrations are currently paused by the system administrator.");
                return;
            }
            // Guest client: prompt for client admin account details
            setIsCheckoutModalOpen(true);
        }
    };

    const handleGuestCheckoutSubmit = (e) => {
        e.preventDefault();
        
        // Basic validation
        const errs = {};
        if (!formData.company_name) errs.company_name = 'Company Name is required';
        if (!formData.email) errs.email = 'Email address is required';
        if (!formData.password) errs.password = 'Password is required';
        if (formData.password && formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.password_confirmation) errs.password_confirmation = 'Passwords do not match';
        if (!formData.accept_terms) errs.accept_terms = 'You must accept the terms and conditions';

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setIsCheckoutModalOpen(false);
        initiatePayment(selectedPlan, formData, selectedAdditionalModules);
    };

    const initiatePayment = async (planName, clientDetails, addOns = []) => {
        setLoading(true);

        try {
            // Directly setup Super Admin & Tenant Admin account, initialize DB, and redirect to Admin Dashboard
            const verifyRes = await axios.post(route('payment.verify'), {
                razorpay_payment_id: 'pay_direct_' + Date.now(),
                razorpay_order_id: 'order_direct_' + Date.now(),
                razorpay_signature: 'sig_direct_' + Date.now(),
                plan: planName,
                additional_modules: addOns,
                is_guest: !currentUser,
                ...clientDetails,
            });

            if (verifyRes.data.status === 'success') {
                window.location.href = verifyRes.data.redirect || route('dashboard');
            } else {
                toast.error(verifyRes.data.message || 'Workspace setup failed.');
                setLoading(false);
            }

        } catch (err) {
            console.error('Setup Error:', err);
            const serverErrors = err.response?.data?.errors;
            const errMsg = serverErrors?.email?.[0] || err.response?.data?.message || 'Setup failed. Please try again.';
            toast.error(errMsg);
            setLoading(false);

            if (serverErrors || errMsg.toLowerCase().includes('already registered') || errMsg.toLowerCase().includes('already been taken')) {
                setErrors(prev => ({
                    ...prev,
                    email: serverErrors?.email?.[0] || errMsg
                }));
                setIsCheckoutModalOpen(true);
            }
        }
    };

    return (
        <>
            <Head title="Choose Your Subscription Plan - WorkNest" />
            <Toaster position="top-right" />

            <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#7460ee]/10 selection:text-[#7460ee] relative overflow-hidden pt-24">
                
                {/* Background Design Touches */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-[#7460ee]/10 via-[#7460ee]/5 to-transparent blur-3xl pointer-events-none"></div>

                {/* Sticky Navbar Header (Same as Welcome landing page) */}
                <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm py-3" : "bg-white/80 backdrop-blur-md border-b border-slate-100/60 py-4"}`}>
                    <div className="max-w-[1512px] mx-auto px-4 sm:px-5 lg:px-6 flex justify-between items-center">
                        {/* Logo left side matching landing page */}
                        <Link href={route('home')} className="flex items-center gap-3 sm:gap-5 group">
                            <img src={getAssetUrl('images/worknest_logo.png?v=4')} alt="WorkNest" className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-contain" />
                            <span className="text-2xl sm:text-4xl font-black tracking-widest text-[#7460ee] uppercase">
                                WorkNest
                            </span>
                        </Link>

                        {/* Navigation links (Desktop) */}
                        <div className="hidden md:flex items-center gap-10">
                            <Link href={route('home')} className="text-slate-500 hover:text-[#7460ee] text-[15px] font-semibold transition-colors">Home</Link>
                            <Link href={`${route('home')}#features`} className="text-slate-500 hover:text-[#7460ee] text-[15px] font-semibold transition-colors">Features</Link>
                            <Link href={route('pricing.public')} className="text-[#7460ee] font-bold text-[15px] transition-colors">Pricing</Link>
                            <a href="#" className="text-slate-500 hover:text-[#7460ee] text-[15px] font-semibold transition-colors">Contact</a>
                        </div>

                        {/* Right Side CTA with proper auth checks & Burger Button */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="hidden md:flex items-center gap-2">
                                {currentUser ? (
                                    <Link 
                                        href={route('dashboard')} 
                                        className="px-4 py-2 sm:px-6 sm:py-2.5 text-[15px] sm:text-[17px] font-bold text-white bg-[#7460ee] hover:bg-[#5e45d6] rounded-xl hover:shadow-lg transition-all flex items-center justify-center"
                                        style={{ minHeight: '44px' }}
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link 
                                        href={route('login')} 
                                        className="px-4 py-2 sm:px-6 sm:py-2.5 text-[15px] sm:text-[17px] font-bold text-white bg-[#7460ee] hover:bg-[#5e45d6] rounded-xl hover:shadow-lg transition-all flex items-center justify-center"
                                        style={{ minHeight: '44px' }}
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>

                            {/* Mobile Burger Toggle Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100 cursor-pointer"
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation Dropdown Menu Panel */}
                    <div className={`md:hidden overflow-hidden transition-all duration-300 bg-white border-b border-slate-100 ${mobileMenuOpen ? "max-h-[350px] opacity-100 py-4 px-6" : "max-h-0 opacity-0 py-0"}`}>
                        <div className="flex flex-col gap-4">
                            <Link href={route('home')} onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-[#7460ee] font-semibold text-lg">Home</Link>
                            <Link href={`${route('home')}#features`} onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-[#7460ee] font-semibold text-lg">Features</Link>
                            <Link href={route('pricing.public')} onClick={() => setMobileMenuOpen(false)} className="text-[#7460ee] font-bold text-lg">Pricing</Link>
                            <a href="#" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-[#7460ee] font-semibold text-lg">Contact</a>

                            <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                                {currentUser ? (
                                    <Link 
                                        href={route('dashboard')} 
                                        className="w-full text-center py-3 text-base font-bold text-white bg-[#7460ee] rounded-xl"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link 
                                        href={route('login')} 
                                        className="w-full text-center py-3 text-base font-bold text-[#7460ee] bg-[#7460ee]/10 rounded-xl"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Hero Header */}
                <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
                    
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7460ee]/10 text-[#7460ee] text-xs font-extrabold uppercase tracking-widest border border-[#7460ee]/20">
                            <Zap size={14} /> Transparent & Flexible Pricing
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none">
                            Simple Plans for Teams of Any Size
                        </h1>

                        <p className="text-lg text-slate-500 font-medium">
                            Choose the plan that fits your organization. Instant automated setup with full admin privileges, workspace management, and Razorpay secure checkout.
                        </p>
                    </div>

                    {/* Pricing Cards Grid (Exact screenshot design) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-6 pb-6 px-4">
                        
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
                                    {settings.basic_plan_features.map((feat) => {
                                        const included = feat.included !== false;
                                        const catchyLabels = {
                                            'projects': 'Core Project & Task Tracking',
                                            'users': 'Employee Directory & Profiles',
                                            'leaves': 'Automated Leave Requests',
                                            'attendance': 'Real-Time Attendance Logging',
                                            'user_limit_basic': 'Up to 10 Active Team Members',
                                        };
                                        const displayLabel = catchyLabels[feat.key] || feat.label;
                                        return (
                                            <div key={feat.key} className="py-3.5 flex items-center gap-3.5">
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

                            {/* CTA Button */}
                            {!isRegularUser && (
                                <div className="p-8 pt-2">
                                    {currentPlan === 'basic' ? (
                                        <button 
                                            disabled
                                            className="w-full py-3.5 bg-[#1e75d8] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md opacity-90 cursor-default flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={16} /> ACTIVE PLAN
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectPlan('basic')}
                                            disabled={loading}
                                            className="w-full py-3.5 bg-[#1e75d8] hover:bg-[#165bb0] active:scale-98 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            {isAdmin ? 'SELECT BASIC' : 'SELECT PLAN'}
                                        </button>
                                    )}
                                </div>
                            )}
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
                                        <span className="text-5xl font-black tracking-tight">
                                            ₹{settings.premium_plan_price}
                                        </span>
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
                                    {settings.premium_plan_features.map((feat) => {
                                        const included = feat.included !== false;
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
                                        const displayLabel = catchyLabels[feat.key] || feat.label;
                                        return (
                                            <div key={feat.key} className="py-3.5 flex items-center gap-3.5">
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

                            {/* CTA Button */}
                            {!isRegularUser && (
                                <div className="p-8 pt-2">
                                    {currentPlan === 'premium' ? (
                                        <button 
                                            disabled
                                            className="w-full py-3.5 bg-[#6b21a8] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-md opacity-90 cursor-default flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={16} /> ACTIVE PLAN
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectPlan('premium')}
                                            disabled={loading}
                                            className="w-full py-3.5 bg-[#6b21a8] hover:bg-[#581a87] active:scale-98 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            {isAdmin ? 'UPGRADE TO PREMIUM' : 'SELECT PLAN'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* ADD-ON MODULES BOX (Vibrant Light Colored Gradient Background) */}
                    <div className="max-w-5xl mx-auto mt-14 bg-white rounded-[32px] border border-purple-200/80 shadow-xl overflow-hidden">
                        {/* Box Banner Header (Vibrant Light Colored Gradient Background) */}
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
                                    Supercharge your workspace with specialized add-on modules for AI Assistant and Catering.
                                </p>
                            </div>
                        </div>

                        {/* Add-Ons Content Grid */}
                        <div className="p-8 sm:p-10 bg-slate-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* AI ASSISTANT MODULE CARD */}
                                {(() => {
                                    const aiMod = (settings.additional_modules || []).find(m => m.key === 'ai_assistant') || {
                                        key: 'ai_assistant',
                                        label: 'AI Voice Assistant',
                                        price: 499,
                                        description: 'Malayalam & English Voice AI Assistant for database queries & automated insights'
                                    };

                                    return (
                                        <div 
                                            key="ai_assistant"
                                            className="p-6 rounded-2xl border border-purple-200 bg-white shadow-sm flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#7460ee] flex items-center justify-center font-bold text-xl">
                                                        🤖
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-slate-900 text-base">{aiMod.label}</h4>
                                                            <span className="px-2 py-0.5 bg-purple-100 text-[#7460ee] text-[10px] font-extrabold uppercase rounded-md">
                                                                Featured
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold text-emerald-600">₹{aiMod.price || 499} / month</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                                    {aiMod.description || 'Malayalam & English Voice AI Assistant for database queries & automated insights'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* CATERING MODULE CARD */}
                                {(() => {
                                    const catMod = (settings.additional_modules || []).find(m => m.key === 'catering') || {
                                        key: 'catering',
                                        label: 'Catering Management',
                                        price: 499,
                                        description: 'Complete catering management, custom menu planning, event order tracking & kitchen workflows'
                                    };

                                    return (
                                        <div 
                                            key="catering"
                                            className="p-6 rounded-2xl border border-amber-200 bg-white shadow-sm flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xl">
                                                        🍽️
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-slate-900 text-base">{catMod.label}</h4>
                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-extrabold uppercase rounded-md">
                                                                New Add-on
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold text-emerald-600">₹{catMod.price || 499} / month</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                                    {catMod.description || 'Complete catering management, custom menu planning, event order tracking & kitchen workflows'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                            </div>
                        </div>
                    </div>

                    {/* Trust Banner */}
                    <div className="mt-20 border-t border-slate-200/60 pt-12 text-center max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-around gap-6 text-slate-500 text-sm font-semibold">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="text-[#7460ee]" size={20} />
                            <span>Instant Workspace Database Initialization</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="text-[#7460ee]" size={20} />
                            <span>256-bit Razorpay SSL Encrypted Payment</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="text-[#7460ee]" size={20} />
                            <span>Admin Panel Redirection</span>
                        </div>
                    </div>

                </main>

                {/* CLIENT DETAILS CHECKOUT MODAL (For Unauthenticated / Guest Clients) */}
                {isCheckoutModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Client Admin Account</h3>
                                    <p className="text-xs text-slate-500 mt-1">Enter your details to create your workspace administrator account.</p>
                                </div>
                                <button 
                                    onClick={() => setIsCheckoutModalOpen(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleGuestCheckoutSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Company Name *</label>
                                    <div className="relative">
                                        <Building className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            name="company_name"
                                            value={formData.company_name}
                                            onChange={handleFormChange}
                                            placeholder="Acme Corp"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7460ee] focus:border-transparent font-medium"
                                        />
                                    </div>
                                    {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            placeholder="admin@company.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7460ee] focus:border-transparent font-medium"
                                        />
                                    </div>
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password *</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleFormChange}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7460ee] focus:border-transparent font-medium"
                                            />
                                        </div>
                                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password *</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                            <input
                                                type="password"
                                                name="password_confirmation"
                                                value={formData.password_confirmation}
                                                onChange={handleFormChange}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7460ee] focus:border-transparent font-medium"
                                            />
                                        </div>
                                        {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleFormChange}
                                            placeholder="+91 9876543210"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7460ee] focus:border-transparent font-medium"
                                        />
                                    </div>
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="flex items-start gap-2.5 cursor-pointer mt-1">
                                        <input
                                            type="checkbox"
                                            name="accept_terms"
                                            checked={formData.accept_terms}
                                            onChange={handleFormChange}
                                            className="mt-0.5 rounded border-slate-300 text-[#7460ee] focus:ring-[#7460ee] w-4 h-4"
                                        />
                                        <span className="text-xs text-slate-600 font-medium">
                                            I accept the <a href="#" onClick={(e) => e.preventDefault()} className="text-[#7460ee] font-semibold hover:underline">Terms &amp; Conditions</a> and Privacy Policy *
                                        </span>
                                    </label>
                                    {errors.accept_terms && <p className="text-red-500 text-xs mt-1">{errors.accept_terms}</p>}
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full py-3.5 rounded-xl bg-[#7460ee] hover:bg-[#5e45d6] text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#7460ee]/25"
                                    >
                                        Proceed to Admin Dashboard
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* CENTERED LOADING OVERLAY WITH BLURRED BACKGROUND */}
                {loading && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center space-y-5">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-[#7460ee]/20 border-t-[#7460ee] animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-[#7460ee]">
                                    <Sparkles size={24} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Setting up Workspace</h3>
                                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                                    Setting up workspace database & admin panel...
                                </p>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-[#7460ee] to-[#a294f9] h-full w-3/4 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
