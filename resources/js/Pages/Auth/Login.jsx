import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
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

                <div className="text-center pt-4">
                    <p className="text-mp-body font-light">
                        Don't have an account?{' '}
                        <Link href={route('register')} className="text-primary font-medium hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </form>
        </GuestLayout>
    );
}
