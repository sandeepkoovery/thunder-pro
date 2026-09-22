import React, { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    ShieldCheck,
    Lock,
    KeyRound,
    Eye,
    EyeOff,
    CheckCircle2,
    Circle,
    ArrowRight,
    LogOut,
    AlertCircle,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePasswordModal({ isOpen = true, user = null }) {
    if (!isOpen) return null;

    const { data, setData, post, processing, errors, reset } = useForm({
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

    // Password strength calculation
    const strengthScore = useMemo(() => {
        let score = 0;
        if (hasMinLength) score++;
        if (hasUppercase) score++;
        if (hasDigit) score++;
        if (hasSpecialChar) score++;
        return score;
    }, [hasMinLength, hasUppercase, hasDigit, hasSpecialChar]);

    const strengthLabel = useMemo(() => {
        if (!data.password) return '';
        if (strengthScore <= 1) return 'Weak';
        if (strengthScore === 2) return 'Fair';
        if (strengthScore === 3) return 'Good';
        return 'Strong';
    }, [data.password, strengthScore]);

    const strengthColor = useMemo(() => {
        if (strengthScore <= 1) return 'bg-rose-500';
        if (strengthScore === 2) return 'bg-amber-500';
        if (strengthScore === 3) return 'bg-blue-500';
        return 'bg-emerald-500';
    }, [strengthScore]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!allRulesSatisfied || processing) return;

        post(route('password.first_change.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Password changed successfully! Welcome to your dashboard.');
            },
            onError: () => {
                reset('password', 'password_confirmation');
            }
        });
    };

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <div
            className="fixed inset-0 z-[999999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-300 relative pointer-events-auto my-auto text-left">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                        <ShieldCheck size={32} />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2">
                        <KeyRound size={12} />
                        <span>First-Time Login Security</span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Create Permanent Password
                    </h2>

                    <p className="text-sm text-slate-600 mt-2 leading-relaxed font-normal">
                        Welcome {user?.name ? <strong className="text-slate-800">{user.name}</strong> : 'back'}! Your account was initialized with a temporary password. You must set a new permanent password to access the dashboard.
                    </p>
                </div>

                {/* Server Error Alert */}
                {Object.keys(errors).length > 0 && (
                    <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-rose-800 font-medium space-y-1">
                            {Object.values(errors).map((err, idx) => (
                                <div key={idx}>{err}</div>
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Create Password Input */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Create Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <KeyRound size={18} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Enter your new password"
                                className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                                autoFocus
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Password Strength Meter Bar */}
                        {data.password.length > 0 && (
                            <div className="mt-2.5">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-slate-500 font-medium">Strength:</span>
                                    <span className="font-bold text-slate-700">{strengthLabel}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1">
                                    {[1, 2, 3, 4].map((step) => (
                                        <div
                                            key={step}
                                            className={`h-full flex-1 transition-all duration-300 rounded-full ${
                                                strengthScore >= step ? strengthColor : 'bg-slate-200'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Re-enter your new password"
                                className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Password Requirements Checklist */}
                    <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 mt-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                            Mandatory Password Requirements:
                        </p>
                        <ul className="space-y-2 text-xs font-medium">
                            <li className={`flex items-center gap-2 transition-colors ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                {hasMinLength ? (
                                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                ) : (
                                    <Circle size={16} className="text-slate-300 shrink-0" />
                                )}
                                <span>At least <strong>8 characters</strong></span>
                            </li>

                            <li className={`flex items-center gap-2 transition-colors ${hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                {hasUppercase ? (
                                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                ) : (
                                    <Circle size={16} className="text-slate-300 shrink-0" />
                                )}
                                <span>At least <strong>1 upper case letter</strong> (A-Z)</span>
                            </li>

                            <li className={`flex items-center gap-2 transition-colors ${hasDigit ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                {hasDigit ? (
                                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                ) : (
                                    <Circle size={16} className="text-slate-300 shrink-0" />
                                )}
                                <span>At least <strong>1 digit / number</strong> (0-9)</span>
                            </li>

                            <li className={`flex items-center gap-2 transition-colors ${hasSpecialChar ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                {hasSpecialChar ? (
                                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                ) : (
                                    <Circle size={16} className="text-slate-300 shrink-0" />
                                )}
                                <span>At least <strong>1 special character</strong> (!@#$%^&*...)</span>
                            </li>

                            <li className={`flex items-center gap-2 transition-colors ${passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                {passwordsMatch ? (
                                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                ) : (
                                    <Circle size={16} className="text-slate-300 shrink-0" />
                                )}
                                <span>Passwords must match</span>
                            </li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!allRulesSatisfied || processing}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                allRulesSatisfied && !processing
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25 hover:shadow-emerald-600/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                }`}
                        >
                            {processing ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Saving New Password...</span>
                                </>
                            ) : (
                                <>
                                    <span>Save Password & Access Dashboard</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Bottom Logout link */}
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                        <LogOut size={14} />
                        <span>Sign out and return to login</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
