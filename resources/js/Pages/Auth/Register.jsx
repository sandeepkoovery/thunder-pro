import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="mb-8 text-center">
                <h2 className="text-3xl font-black text-[#2d3436] mb-2">Create Account</h2>
                <p className="text-[#636e72] font-medium">Join Thunder Pro today</p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Full Name" className="text-[#2d3436] font-bold mb-2 ml-1" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#ff4081] transition-all font-medium text-[#2d3436]"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="John Doe"
                    />

                    <InputError message={errors.name} className="mt-2 ml-1" />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email Address" className="text-[#2d3436] font-bold mb-2 ml-1" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#ff4081] transition-all font-medium text-[#2d3436]"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Enter your email address"
                    />

                    <InputError message={errors.email} className="mt-2 ml-1" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" className="text-[#2d3436] font-bold mb-2 ml-1" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#ff4081] transition-all font-medium text-[#2d3436]"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="••••••••"
                    />

                    <InputError message={errors.password} className="mt-2 ml-1" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                        className="text-[#2d3436] font-bold mb-2 ml-1"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#ff4081] transition-all font-medium text-[#2d3436]"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        placeholder="••••••••"
                    />

                    <InputError message={errors.password_confirmation} className="mt-2 ml-1" />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-4 bg-[#ff4081] text-white rounded-2xl font-black text-lg hover:bg-[#e91e63] transition-all shadow-xl shadow-[#ff4081]/20 active:scale-[0.98] disabled:opacity-50"
                >
                    {processing ? 'CREATING ACCOUNT...' : 'REGISTER'}
                </button>

                <div className="text-center pt-4">
                    <p className="text-[#636e72] font-medium">
                        Already have an account?{' '}
                        <Link
                            href={route('login')}
                            className="text-[#ff4081] font-black hover:underline decoration-2 underline-offset-4"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </form>
        </GuestLayout>
    );
}
