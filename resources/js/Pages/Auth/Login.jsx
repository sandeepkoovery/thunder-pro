import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Fingerprint } from 'lucide-react';
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
        <GuestLayout>
            <Head title="Log in" />

            <div className="mb-8 text-center">
                <h2 className="text-2xl font-medium text-mp-heading mb-2">Welcome Back</h2>
                <p className="text-mp-body font-light">Please enter your details to sign in</p>
            </div>

            {status && (
                <div className="mb-6 p-4 bg-green-50 rounded-mp-sm text-sm font-medium text-green-600 border border-green-100">
                    {status}
                </div>
            )}

            {passkeyError && (
                <div className="mb-6 p-4 bg-rose-50 rounded-mp-sm text-sm font-medium text-rose-600 border border-rose-100">
                    {passkeyError}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <InputLabel htmlFor="email" value="Email Address" className="text-mp-heading font-medium mb-2 ml-1" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="w-full px-5 py-3.5 bg-mp-bg border-none rounded-mp-sm focus:ring-2 focus:ring-primary transition-all font-light text-mp-heading"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Enter your email address"
                    />
                    <InputError message={errors.email} className="mt-2 ml-1" />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                        <InputLabel htmlFor="password" value="Password" className="text-mp-heading font-medium" />
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                            >
                                Forgot?
                            </Link>
                        )}
                    </div>
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="w-full px-5 py-3.5 bg-mp-bg border-none rounded-mp-sm focus:ring-2 focus:ring-primary transition-all font-light text-mp-heading"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password} className="mt-2 ml-1" />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer group">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded-mp-sm border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="ms-3 text-sm font-light text-mp-body group-hover:text-mp-heading transition-colors">
                            Remember me
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-3.5 bg-primary text-white rounded-mp-sm font-medium text-base hover:bg-primary-dark transition-all shadow-mp active:scale-[0.98] disabled:opacity-50"
                >
                    {processing ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-xs font-semibold uppercase tracking-wider text-gray-400">or sign in with</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={passkeyLoading}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-mp-sm font-medium text-base transition-all shadow-sm flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50"
                >
                    {passkeyLoading ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Windows Hello Active...
                        </>
                    ) : (
                        <>
                            <Fingerprint className="w-5 h-5 text-indigo-400" />
                            Sign in with Passkey
                        </>
                    )}
                </button>
            </form>
        </GuestLayout>
    );
}
