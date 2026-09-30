import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Fingerprint, ShieldAlert } from 'lucide-react';
import { startPasskeyLogin, isWebAuthnSupported } from '@/Utils/webauthn';
import toast from 'react-hot-toast';

export default function Login({ status, canResetPassword }) {
    const isPwa = typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        window.location.search.includes('source=pwa') ||
        window.location.search.includes('pwa=1')
    );

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        is_pwa: isPwa,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [passkeyError, setPasskeyError] = useState('');
    const isSupported = isWebAuthnSupported();

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const handlePasskeyLogin = async () => {
        setPasskeyError('');

        if (!data.email || !data.email.trim()) {
            setPasskeyError('Please enter your Email Address above to sign in with Passkey.');
            return;
        }

        if (!isSupported) {
            setPasskeyError('WebAuthn / Windows Hello is not supported in this browser.');
            return;
        }

        try {
            setPasskeyLoading(true);
            const res = await startPasskeyLogin(data.email.trim());
            if (res.success && res.redirect) {
                toast.success('Logged in with Windows Hello!');
                window.location.href = res.redirect;
            }
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message || 'Windows Hello sign in failed.';
            setPasskeyError(errMsg);
        } finally {
            setPasskeyLoading(false);
        }
    };

    return (
        <GuestLayout isAdmin={false}>
            <Head title="Log in" />

            <div className="mb-7">
                <h1 className="text-3xl sm:text-[34px] font-normal text-slate-800 tracking-tight mb-1.5">
                    Welcome Back
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-normal">
                    Please enter your details to sign in
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

            {passkeyError && (
                <div className="mb-5 p-3.5 bg-rose-50 rounded-2xl text-xs font-medium text-rose-600 border border-rose-100">
                    {passkeyError}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                {/* Email Field with User Icon */}
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
                            placeholder="Designer"
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
                            Remember me
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-slate-400 hover:text-[#674ab0] transition-colors whitespace-nowrap"
                        >
                            Forgot Password?
                        </Link>
                    )}
                </div>

                {/* Action Button: Purple Pill Button */}
                <div className="pt-2 flex items-center">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-11 py-3 rounded-full bg-[#674ab0] hover:bg-[#583ca0] text-white font-medium text-sm transition-all shadow-[0_8px_20px_rgba(103,74,176,0.35)] hover:shadow-[0_10px_25px_rgba(103,74,176,0.45)] active:scale-[0.98] disabled:opacity-50"
                    >
                        {processing ? 'Logging in...' : 'Login'}
                    </button>
                </div>



                {/* Windows Hello / Passkey Login option kept intact */}
                <div className="pt-3">
                    <button
                        type="button"
                        onClick={handlePasskeyLogin}
                        disabled={passkeyLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all shadow-xs disabled:opacity-50"
                    >
                        <Fingerprint className="w-3.5 h-3.5 text-[#674ab0]" />
                        <span>{passkeyLoading ? 'Windows Hello Active...' : 'Sign in with Passkey'}</span>
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
