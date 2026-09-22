import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react';

export default function AdminForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Admin Password Reset" />

            <div className="mb-8 text-center">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Reset Admin Password</h2>
                <p className="text-sm text-slate-500 font-light">
                    Enter your administrator email to receive a password reset link
                </p>
            </div>

            <div className="mb-6 p-4 bg-indigo-50/60 rounded-xl text-sm font-normal text-indigo-900 border border-indigo-100/80 leading-relaxed">
                Forgot your administrator password? Enter your verified administrator email address and we'll send you a secure password reset link.
            </div>

            {status && (
                <div className="mb-6 p-4 bg-emerald-50 rounded-xl text-sm font-medium text-emerald-700 border border-emerald-200">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <InputLabel htmlFor="email" value="Administrator Email" className="text-slate-700 font-medium mb-2 ml-1" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-normal text-slate-800"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="admin@company.com"
                    />
                    <InputError message={errors.email} className="mt-2 ml-1" />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white rounded-xl font-semibold text-base transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <Mail className="w-4 h-4 text-indigo-300" />
                    {processing ? 'Sending Reset Link...' : 'Email Reset Link'}
                </button>

                <div className="text-center pt-2">
                    <Link
                        href={route('admin.login')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Admin Portal Sign In
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
