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
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        password: '',
        company_name: currentUser?.address || '',
        phone: currentUser?.phone || '',
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadRazorpayScript();
    }, []);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
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
        if (!formData.name) errs.name = 'Full name is required';
        if (!formData.email) errs.email = 'Email address is required';
        if (!formData.password) errs.password = 'Password is required';
        if (formData.password && formData.password.length < 6) errs.password = 'Password must be at least 6 characters';

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
            const errMsg = err.response?.data?.message || 'Setup failed. Please try again.';
            toast.error(errMsg);
            setLoading(false);
            if (errMsg.toLowerCase().includes('already registered')) {
                setErrors(prev => ({ ...prev, email: errMsg }));
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

                    {/* Pricing Cards Grid (Matches Admin Pricing Style Exactly) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-4xl mx-auto pt-6 pb-6 px-4">
                        
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
                                        {settings.basic_plan_features.map((feat) => {
                                            const included = feat.included !== false;
                                            return (
                                                <div key={feat.key} className="flex items-center gap-4">
                                                    {included ? (
                                                        <Check className="text-emerald-600 flex-shrink-0" size={18} strokeWidth={3} />
                                                    ) : (
                                                        <X className="text-red-500 flex-shrink-0" size={18} strokeWidth={3} />
                                                    )}
                                                    <span className={`text-sm font-normal ${included ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                                                        {feat.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {!isRegularUser && (
                                    <div>
                                        {currentPlan === 'basic' ? (
                                            <button 
                                                disabled
                                                className="w-full py-3 bg-[#00a896] text-white text-xs font-bold uppercase tracking-wider cursor-default shadow-md opacity-90 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={16} /> ACTIVE PLAN
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSelectPlan('basic')}
                                                disabled={loading}
                                                className="w-full py-3 bg-[#00a896] hover:bg-[#009282] text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm flex items-center justify-center gap-2"
                                            >
                                                {isAdmin ? 'SELECT BASIC' : 'SELECT'}
                                            </button>
                                        )}
                                    </div>
                                )}
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
                                    <div className="text-center mb-6">
                                        <span className="text-5xl font-light text-gray-800 tracking-tight">
                                            ₹{isAdmin ? computeTotalPrice('premium') : settings.premium_plan_price}
                                        </span>
                                        <span className="text-xs font-normal text-gray-400 block mt-1">per month</span>
                                        {isAdmin && selectedAdditionalModules.length > 0 && (
                                            <span className="inline-block mt-1 px-2.5 py-0.5 bg-purple-50 text-purple-600 font-bold text-[11px] rounded-full">
                                                Base ₹{settings.premium_plan_price} + {selectedAdditionalModules.length} Add-on(s)
                                            </span>
                                        )}
                                    </div>

                                    {/* Feature list */}
                                    <div className="space-y-4 max-w-xs mx-auto mb-10">
                                        {settings.premium_plan_features.map((feat) => {
                                            const included = feat.included !== false;
                                            return (
                                                <div key={feat.key} className="flex items-center gap-4">
                                                    {included ? (
                                                        <Check className="text-emerald-600 flex-shrink-0" size={18} strokeWidth={3} />
                                                    ) : (
                                                        <X className="text-red-500 flex-shrink-0" size={18} strokeWidth={3} />
                                                    )}
                                                    <span className={`text-sm font-normal ${included ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                                                        {feat.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {!isRegularUser && (
                                    <div>
                                        {currentPlan === 'premium' ? (
                                            <button 
                                                disabled
                                                className="w-full py-3 bg-[#d90429] text-white text-xs font-bold uppercase tracking-wider cursor-default shadow-md opacity-90 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={16} /> ACTIVE PLAN
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSelectPlan('premium')}
                                                disabled={loading}
                                                className="w-full py-3 bg-[#d90429] hover:bg-[#b80322] text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm flex items-center justify-center gap-2"
                                            >
                                                {isAdmin ? 'UPGRADE TO PREMIUM' : 'SELECT'}
                                            </button>
                                        )}
                                    </div>
                                )}
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
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            placeholder="John Doe"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7460ee] focus:border-transparent font-medium"
                                        />
                                    </div>
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Company Name</label>
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
                                    </div>
                                </div>

                                <div className="pt-4">
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
