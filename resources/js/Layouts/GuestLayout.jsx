import { Link } from '@inertiajs/react';

const getAssetUrl = (path) => {
    try {
        let base = "";
        if (window.Ziggy && window.Ziggy.url) {
            base = window.Ziggy.url;
        } else {
            const origin = window.location.origin;
            if (window.location.pathname.includes('/erp_pro/public')) {
                base = origin + '/erp_pro/public';
            } else {
                base = origin;
            }
        }
        const baseSlash = base.endsWith('/') ? base : base + '/';
        return baseSlash + (path.startsWith('/') ? path.substring(1) : path);
    } catch (e) {
        return '/' + path;
    }
};

export default function GuestLayout({ children, isAdmin = false }) {
    const logoUrl = getAssetUrl('images/worknest_logo.png?v=23');

    return (
        <div className="min-h-screen w-full bg-[#530773] lg:bg-white flex flex-col lg:flex-row overflow-x-hidden font-sans selection:bg-[#680b8e] selection:text-white">
            {/* Left Column: Rich Purple (#680b8e) Welcome Section */}
            <div className="w-full lg:w-[50%] xl:w-[54%] bg-gradient-to-br from-[#530773] via-[#680b8e] to-[#3e0356] relative flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 select-none overflow-hidden shrink-0">
                {/* Floating Translucent Squares / Diamonds */}
                <div className="absolute top-12 left-1/4 w-28 sm:w-36 h-28 sm:h-36 rounded-3xl rotate-12 bg-white/[0.04] border border-white/[0.06] pointer-events-none"></div>
                <div className="absolute top-1/3 right-8 sm:right-12 w-36 sm:w-48 h-36 sm:h-48 rounded-3xl -rotate-12 bg-white/[0.05] border border-white/[0.08] pointer-events-none"></div>
                <div className="absolute bottom-16 left-8 sm:left-12 w-40 sm:w-56 h-40 sm:h-56 rounded-3xl rotate-45 bg-white/[0.03] border border-white/[0.06] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-24 sm:w-32 h-24 sm:h-32 rounded-2xl rotate-6 bg-white/[0.04] pointer-events-none"></div>

                {/* Subtle Floating Orbs */}
                <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-white/50 absolute top-1/2 left-8 sm:left-16 pointer-events-none"></div>
                <div className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full bg-white/30 absolute bottom-1/3 right-8 sm:right-16 pointer-events-none"></div>

                {/* Top: WorkNest Logo & Brand Text */}
                <div className="relative z-20 flex items-center justify-center lg:justify-start">
                    <Link href="/" className="inline-flex items-center gap-3 sm:gap-3.5 group">
                        <img
                            src={logoUrl}
                            alt="WorkNest"
                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm group-hover:scale-105 transition-transform shrink-0"
                        />
                        <span style={{ color: '#ffffff', fontWeight: 800 }} className="text-xl sm:text-2xl lg:text-3xl tracking-tight drop-shadow-sm">
                            Work<span style={{ color: '#e9d5ff' }}>Nest</span>
                            {isAdmin && (
                                <span className="ml-2.5 sm:ml-3 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                                    Admin
                                </span>
                            )}
                        </span>
                    </Link>
                </div>

                {/* Center Content: WORK SMARTER. TOGETHER. */}
                <div className="relative z-20 my-auto py-8 sm:py-12 lg:py-0 text-center">
                    <h1
                        className="auth-hero-title !text-white text-3xl sm:text-4xl lg:text-5xl xl:text-6xl !font-black tracking-tight uppercase leading-tight mb-3 sm:mb-4 max-w-xl mx-auto"
                    >
                        WORK SMARTER. TOGETHER.
                    </h1>
                    <p
                        className="auth-hero-subtitle !text-purple-100 text-base sm:text-lg lg:text-xl max-w-md mx-auto leading-relaxed"
                    >
                        Manage your work, people, and business in one place.
                    </p>
                </div>

                {/* Desktop Bottom Footer Accent */}
                <div className="relative z-20 text-xs text-white/50 text-center lg:text-left hidden lg:block">
                    &copy; {new Date().getFullYear()} WorkNest ERP. All rights reserved.
                </div>
            </div>

            {/* Right Column: Clean White with Login Form */}
            <div className="w-full lg:w-[50%] xl:w-[46%] flex-1 bg-white rounded-t-3xl sm:rounded-t-[36px] lg:rounded-none -mt-4 lg:mt-0 shadow-2xl lg:shadow-none relative flex flex-col justify-center items-center px-5 sm:px-10 lg:px-14 xl:px-16 py-8 sm:py-12 z-20 overflow-hidden min-h-[460px] lg:min-h-screen">
                {/* Top-Right Soft Lavender/Purple Layered Shapes (visible on desktop) */}
                <div className="hidden lg:block absolute -top-12 -right-12 pointer-events-none select-none z-0">
                    <div className="w-40 h-40 rounded-3xl rotate-45 bg-[#680b8e]/10 -translate-y-4 translate-x-4"></div>
                    <div className="w-44 h-44 rounded-3xl rotate-45 bg-[#680b8e]/10 -translate-y-8 translate-x-8"></div>
                    <div className="w-32 h-32 rounded-3xl rotate-45 bg-[#680b8e]/15 -translate-y-2 translate-x-2"></div>
                </div>

                {/* Bottom-Right Soft Lavender/Purple Layered Shapes (visible on desktop) */}
                <div className="hidden lg:block absolute -bottom-16 -right-16 pointer-events-none select-none z-0">
                    <div className="w-44 h-44 rounded-3xl rotate-45 bg-[#680b8e]/10 translate-y-6 -translate-x-2"></div>
                    <div className="w-48 h-48 rounded-3xl rotate-45 bg-[#680b8e]/10 translate-y-10 -translate-x-6"></div>
                    <div className="w-36 h-36 rounded-3xl rotate-45 bg-[#680b8e]/15 translate-y-2 -translate-x-4"></div>
                </div>

                {/* Centered Login Card Form */}
                <main className="w-full max-w-[340px] sm:max-w-[370px] mx-auto z-10 flex flex-col justify-center">
                    {children}
                </main>

                {/* Mobile Bottom Footer */}
                <div className="lg:hidden text-center text-[11px] text-slate-400 mt-6 select-none">
                    &copy; {new Date().getFullYear()} WorkNest ERP. All rights reserved.
                </div>
            </div>
        </div>
    );
}




