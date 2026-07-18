import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="mb-8 text-center">
                <h2 className="text-3xl font-black text-[#2d3436] mb-2">Reset Password</h2>
                <p className="text-[#636e72] font-medium">We'll email you a reset link</p>
            </div>

            <div className="mb-8 p-4 bg-blue-50 rounded-2xl text-sm font-medium text-blue-700 border border-blue-100 leading-relaxed">
                Forgot your password? No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.
            </div>

            {status && (
                <div className="mb-6 p-4 bg-green-50 rounded-2xl text-sm font-bold text-green-600 border border-green-100">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#ff4081] transition-all font-medium text-[#2d3436]"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Enter your email address"
                    />

                    <InputError message={errors.email} className="mt-2 ml-1" />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-4 bg-[#ff4081] text-white rounded-2xl font-black text-lg hover:bg-[#e91e63] transition-all shadow-xl shadow-[#ff4081]/20 active:scale-[0.98] disabled:opacity-50"
                >
                    {processing ? 'SENDING LINK...' : 'EMAIL RESET LINK'}
                </button>
            </form>
        </GuestLayout>
    );
}
