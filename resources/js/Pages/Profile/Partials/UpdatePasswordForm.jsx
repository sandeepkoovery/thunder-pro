import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Lock, Shield, CheckCircle, Fingerprint, Eye, EyeOff } from 'lucide-react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <form onSubmit={updatePassword} className="space-y-8">
                <div className="grid grid-cols-1 gap-8">
                    {/* Current Password */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Current Password</label>
                        <div className="relative">
                            <input
                                id="current_password"
                                ref={currentPasswordInput}
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                type={showCurrent ? 'text' : 'password'}
                                autoComplete="current-password"
                                className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 pr-11 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all placeholder:text-gray-400 ${errors.current_password ? "border-red-400 ring-red-50" : ""}`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent((v) => !v)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-[#7e89ca] transition-colors"
                                tabIndex={-1}
                                aria-label={showCurrent ? 'Hide password' : 'Show password'}
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.current_password && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.current_password}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* New Password */}
                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    type={showNew ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 pr-11 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all placeholder:text-gray-400 ${errors.password ? "border-red-400 ring-red-50" : ""}`}
                                    placeholder="Min 8 Characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew((v) => !v)}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-[#7e89ca] transition-colors"
                                    tabIndex={-1}
                                    aria-label={showNew ? 'Hide password' : 'Show password'}
                                >
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Confirm Password</label>
                            <div className="relative">
                                <input
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 pr-11 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all placeholder:text-gray-400 ${errors.password_confirmation ? "border-red-400 ring-red-50" : ""}`}
                                    placeholder="Repeat Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-[#7e89ca] transition-colors"
                                    tabIndex={-1}
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password_confirmation && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.password_confirmation}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 pt-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-10 py-3 bg-[#7e89ca] text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg shadow-indigo-100 hover:bg-[#6c78bc] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        Update Key
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-out duration-300"
                        enterFrom="opacity-0 translate-x-4"
                        enterTo="opacity-100 translate-x-0"
                        leave="transition ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="flex items-center gap-2 text-emerald-500">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Sync Successful</span>
                        </div>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
