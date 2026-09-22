import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ShieldCheck, KeyRound, ArrowLeft, Check, X, Eye, EyeOff } from 'lucide-react';

export default function AdminResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validation rules checks
    const hasMinLength = data.password.length >= 8;
    const hasUppercase = /[A-Z]/.test(data.password);
    const hasDigit = /[0-9]/.test(data.password);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(data.password);
    const passwordsMatch = data.password.length > 0 && data.password === data.password_confirmation;

    const allRulesSatisfied =
        hasMinLength &&
        hasUppercase &&
        hasDigit &&
        hasSpecialChar &&
        passwordsMatch;

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Set New Admin Password" />

            <div className="mb-8 text-center">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Set New Admin Password</h2>
                <p className="text-sm text-slate-500 font-light">
                    Create a strong password for your administrator account
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <InputLabel htmlFor="email" value="Administrator Email" className="text-slate-700 font-medium mb-1.5 ml-1" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        readOnly={true}
                        className="w-full px-4 py-3 bg-slate-100/90 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed select-none focus:ring-0 focus:border-slate-200"
                        autoComplete="username"
                        placeholder="admin@company.com"
                    />
                    <InputError message={errors.email} className="mt-1.5 ml-1" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" className="text-slate-700 font-medium mb-1.5 ml-1" />
                    <div className="relative">
                        <TextInput
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-slate-800"
                            autoComplete="new-password"
                            isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-1.5 ml-1" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm New Password"
                        className="text-slate-700 font-medium mb-1.5 ml-1"
                    />
                    <div className="relative">
                        <TextInput
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="password_confirmation"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-slate-800"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password_confirmation} className="mt-1.5 ml-1" />
                </div>

                {/* Password Requirements Checklist */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <p className="font-semibold text-slate-700">Password requirements:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                            {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                            <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                            {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                            <span>At least 1 uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                            {hasDigit ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                            <span>At least 1 digit (0-9)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                            {hasSpecialChar ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                            <span>At least 1 special character</span>
                        </div>
                    </div>
                    {data.password_confirmation.length > 0 && (
                        <div className={`pt-1 border-t border-slate-200/60 flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600 font-medium' : 'text-rose-600'}`}>
                            {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                            <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing || !allRulesSatisfied}
                    className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white rounded-xl font-semibold text-base transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <KeyRound className="w-4 h-4 text-indigo-300" />
                    {processing ? 'Resetting Password...' : 'Reset Admin Password'}
                </button>

                <div className="text-center pt-2">
                    <Link
                        href={route('admin.login')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Cancel and return to Admin Portal Sign In
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
