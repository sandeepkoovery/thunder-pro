import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { User, Lock, Eye, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function AdminLogin({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.login.store'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout isAdmin={true}>
            <Head title="Admin Portal Sign In" />

            <div className="mb-7">
                <h1 className="text-3xl sm:text-[34px] font-normal text-slate-800 tracking-tight mb-1.5">
                    Welcome Back
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-normal">
                    Please enter your details to sign in to Admin Portal
                </p>
            </div>

            {status && (
                <div className="mb-5 p-3.5 bg-green-50 rounded-2xl text-xs font-medium text-green-600 border border-green-100">
                    {status}
                </div>
            )}

            {errors.email && errors.email.includes('Too many failed login attempts') && (
                <div className="mb-5 p-3.5 bg-rose-50 rounded-2xl text-xs font-medium text-rose-700 border border-rose-200 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-rose-800">Account Temporarily Locked</p>
                        <p className="mt-0.5 text-xs text-rose-600 leading-relaxed">
                            {errors.email}
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                {/* Administrator Email with User Icon */}
                <div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none text-slate-400">
                            <User className="w-4 h-4" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="w-full pl-11 sm:pl-12 pr-5 py-3.5 bg-white border border-slate-100/90 rounded-full focus:ring-2 focus:ring-[#674ab0]/20 focus:border-[#674ab0]/30 transition-all shadow-[0_4px_18px_rgba(0,0,0,0.05)] text-slate-800 placeholder:text-slate-400 text-sm outline-none"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="admin@company.com"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5 ml-4" />
                </div>

                {/* Password Field with Lock Icon and Eye Toggle */}
                <div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                        </div>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="w-full pl-11 sm:pl-12 pr-11 py-3.5 bg-white border border-slate-100/90 rounded-full focus:ring-2 focus:ring-[#674ab0]/20 focus:border-[#674ab0]/30 transition-all shadow-[0_4px_18px_rgba(0,0,0,0.05)] text-slate-800 placeholder:text-slate-400 text-sm outline-none"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 sm:pr-5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-1.5 ml-4" />
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-0.5">
                    <label className="flex items-center cursor-pointer select-none group shrink-0">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-slate-300 text-[#674ab0] focus:ring-[#674ab0] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="ms-1.5 text-slate-400 group-hover:text-slate-600 transition-colors">
                            Remember session
                        </span>
                    </label>

                    <Link
                        href={route('admin.password.request')}
                        className="text-slate-400 hover:text-[#674ab0] transition-colors whitespace-nowrap"
                    >
                        Forgot Password?
                    </Link>
                </div>

                {/* Action Button: Purple Pill Login */}
                <div className="pt-2 flex items-center">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-11 py-3 rounded-full bg-[#674ab0] hover:bg-[#583ca0] text-white font-medium text-sm transition-all shadow-[0_8px_20px_rgba(103,74,176,0.35)] hover:shadow-[0_10px_25px_rgba(103,74,176,0.45)] active:scale-[0.98] disabled:opacity-50"
                    >
                        {processing ? 'Logging in...' : 'Login'}
                    </button>
                </div>

                {/* Security Note */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-400 text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#674ab0]" />
                    <span>Authorized Administrative Personnel Only</span>
                </div>
            </form>
        </GuestLayout>
    );
}
