import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react';

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
            <Head title="Admin Log in" />

            {/* Header matching screenshot: "Log in" in purple */}
            <h1
                style={{ color: '#1b1442', fontWeight: 700 }}
                className="text-3xl sm:text-4xl text-center mb-8 tracking-tight"
            >
                Admin Log in
            </h1>

            {status && (
                <div className="mb-4 p-3 bg-green-50 rounded-xl text-xs font-medium text-green-600 border border-green-100 text-center">
                    {status}
                </div>
            )}

            {errors.email && errors.email.includes('Too many failed login attempts') && (
                <div className="mb-4 p-3 bg-rose-50 rounded-xl text-xs font-medium text-rose-700 border border-rose-200 flex items-start gap-2.5">
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
                {/* Admin Username Input matching screenshot with placeholder "username" */}
                <div>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="w-full px-4 py-3 sm:py-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#680b8e]/20 focus:border-[#680b8e] text-slate-800 text-base sm:text-sm shadow-xs outline-none transition-all placeholder:text-slate-400"
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="username"
                    />
                    <InputError message={errors.email} className="mt-1.5 ml-1" />
                </div>

                {/* Password Input matching screenshot with placeholder "password" & eye toggle */}
                <div>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="w-full pl-4 pr-11 py-3 sm:py-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#680b8e]/20 focus:border-[#680b8e] text-slate-800 text-base sm:text-sm shadow-xs outline-none transition-all placeholder:text-slate-400"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-1.5 ml-1" />

                    {/* Right-aligned "Forgot your password?" matching screenshot */}
                    <div className="text-right mt-2">
                        <Link
                            href={route('admin.password.request')}
                            className="text-xs sm:text-[13px] text-[#680b8e] hover:text-[#52076a] font-medium transition-colors py-0.5 inline-block"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center text-xs sm:text-sm text-slate-500 pt-1">
                    <label className="flex items-center cursor-pointer select-none group">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-slate-300 text-[#680b8e] focus:ring-[#680b8e] w-4 h-4 mr-2.5 cursor-pointer"
                        />
                        <span className="group-hover:text-slate-700 transition-colors">
                            Remember session
                        </span>
                    </label>
                </div>

                {/* Action Button: Responsive Purple Rounded Rectangle Button */}
                <div className="pt-4 flex justify-center">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full sm:w-56 py-3 rounded-xl bg-[#680b8e] hover:bg-[#52076a] text-white font-bold text-base tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {processing ? 'Logging in...' : 'Log in'}
                    </button>
                </div>

                {/* Security Note */}
                <div className="pt-4 flex items-center justify-center gap-1.5 text-slate-400 text-xs text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#680b8e]" />
                    <span>Authorized Administrative Personnel Only</span>
                </div>
            </form>
        </GuestLayout>
    );
}
