import { Head, Link } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";

export default function Welcome({ canLogin, canRegister }) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Task Manager - Thunder Pro" />

            <div className="min-h-screen bg-[#fff5f8] relative overflow-hidden font-sans">
                {/* Decorative Background Blobs */}
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#fce4ec] rounded-full blur-[100px] opacity-60 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-[#e3f2fd] rounded-full blur-[120px] opacity-70"></div>
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#f3e5f5] rounded-full blur-[100px] opacity-50"></div>

                {/* Header */}
                <header className="relative z-50">
                    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                        <div className="flex justify-between items-center py-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#ff4081] to-[#7c4dff] rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
                                    <span className="text-white font-black text-2xl -rotate-12">T</span>
                                </div>
                                <span className="text-2xl font-black tracking-tight text-[#2d3436]">
                                    THUNDER <span className="text-[#ff4081]">PRO</span>
                                </span>
                            </div>

                            <nav className="hidden md:flex items-center gap-10">
                                <Link href="/" className="text-[#2d3436] font-bold hover:text-[#ff4081] transition-colors">Home</Link>
                                {auth?.user && (
                                    <Link href="/dashboard" className="text-[#636e72] font-bold hover:text-[#ff4081] transition-colors">Dashboard</Link>
                                )}
                            </nav>

                            <div className="flex items-center gap-4">
                                {auth?.user ? (
                                    <Link
                                        href="/dashboard"
                                        className="px-8 py-3 bg-[#2d3436] text-white rounded-full font-bold hover:bg-[#ff4081] transition-all shadow-lg hover:shadow-[#ff4081]/20"
                                    >
                                        DASHBOARD
                                    </Link>
                                ) : (
                                    <Link
                                        href={route('login')}
                                        className="px-8 py-3 bg-[#ff4081] text-white rounded-full font-bold hover:bg-[#e91e63] transition-all shadow-lg hover:shadow-[#ff4081]/30 flex items-center gap-2 group"
                                    >
                                        LOGIN <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12 pb-24">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div className="order-2 lg:order-1">
                            <h1 className="text-[64px] md:text-[84px] font-black leading-[0.9] text-[#2d3436] mb-8">
                                TASK<br />
                                <span className="text-[#ff4081]">MANAGER</span>
                            </h1>
                            <p className="text-xl text-[#636e72] mb-12 max-w-lg leading-relaxed font-medium">
                                Streamline your workflow with our creative CRM. Manage projects, track time, and collaborate with your team in a beautiful, intuitive environment.
                            </p>

                            <div className="flex items-center gap-6">
                                <Link
                                    href={auth?.user ? "/dashboard" : route('login')}
                                    className="px-10 py-4 bg-[#ff4081] text-white rounded-full font-black text-lg hover:bg-[#e91e63] transition-all shadow-xl hover:shadow-[#ff4081]/40 flex items-center gap-3 group"
                                >
                                    {auth?.user ? 'DASHBOARD' : 'GET STARTED'} <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </Link>

                                {!auth?.user && canRegister && (
                                    <Link
                                        href={route('register')}
                                        className="text-[#2d3436] font-extrabold text-lg hover:text-[#ff4081] transition-colors underline decoration-4 decoration-[#ff4081]/20 underline-offset-8"
                                    >
                                        Create Account
                                    </Link>
                                )}
                            </div>

                            {/* Decorative Leaf Shape */}
                            <div className="mt-20 opacity-20 hidden md:block">
                                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 110C10 110 10 10 110 10C110 10 110 110 10 110Z" fill="#ff4081" />
                                    <path d="M10 110C10 110 60 110 60 60C60 10 10 10 10 10V110Z" fill="#7c4dff" />
                                </svg>
                            </div>
                        </div>

                        {/* Right Illustration */}
                        <div className="order-1 lg:order-2 relative">
                            <div className="relative z-20 transform hover:scale-105 transition-transform duration-700">
                                <img
                                    src="images/task_manager_hero.png"
                                    alt="Task Manager Illustration"
                                    className="w-full h-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.1)]"
                                />
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#fff176] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#81d4fa] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                        </div>
                    </div>
                </main>

                {/* Bottom Decorative Bar */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl h-3 bg-gradient-to-r from-[#ff4081] via-[#7c4dff] to-[#ff4081] rounded-full opacity-20"></div>

                {/* Floating Leaf Shapes */}
                <div className="absolute bottom-10 left-10 w-24 h-24 text-[#ff4081] opacity-10 rotate-45">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8.13,20C11,20 13.85,18.08 15,15.5C15.91,13.5 15.61,11.5 15,9.5C14.34,7.5 13,5.5 12,3.5C11,1.5 10,0 10,0C10,0 10,1.5 10.5,3.5C11,5.5 12.34,7.5 13,9.5C13.61,11.5 13.91,13.5 13,15.5C11.85,18.08 9,20 6.13,20C5.64,20 5.14,19.87 4.66,19.7L17,8Z" /></svg>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}} />
        </>
    );
}
