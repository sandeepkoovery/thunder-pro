import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';

export default function AdminResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email || '',
        password: '',
        password_confirmation: '',
    });

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
                    <InputLabel htmlFor="email" value="Administrator Email" className="text-slate-700 font-medium mb-2 ml-1" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-normal text-slate-800"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="admin@company.com"
                    />
                    <InputError message={errors.email} className="mt-2 ml-1" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" className="text-slate-700 font-medium mb-2 ml-1" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-normal text-slate-800"
                        autoComplete="new-password"
                        isFocused={true}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password} className="mt-2 ml-1" />
                    <p className="mt-1.5 ml-1 text-xs text-slate-500">
                        Must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.
                    </p>
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm New Password"
                        className="text-slate-700 font-medium mb-2 ml-1"
                    />
                    <TextInput
                        type="password"
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-normal text-slate-800"
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password_confirmation} className="mt-2 ml-1" />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white rounded-xl font-semibold text-base transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
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
