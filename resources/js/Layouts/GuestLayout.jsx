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
    const logoUrl = getAssetUrl('images/worknest_logo.png?v=17');
    const waveUrl = getAssetUrl('images/auth_wave.png?v=4');

    return (
        <div className="min-h-screen bg-white relative overflow-hidden font-sans flex flex-col justify-between selection:bg-[#674ab0] selection:text-white">
            {/* Top-Left Header: Brand Logo with comfortable spacing */}
            <header className="absolute top-0 left-0 p-8 sm:p-10 lg:px-16 lg:pt-12 z-30 flex items-center">
                <Link href="/" className="inline-flex items-center gap-3 group">
                    <img
                        src={logoUrl}
                        alt="WorkNest Logo"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#2d264b]">
                        Work<span className="text-[#674ab0]">Nest</span>
                        {isAdmin && (
                            <span className="ml-2.5 text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-[#674ab0]">
                                Admin
                            </span>
                        )}
                    </span>
                </Link>
            </header>

            {/* Form Section: Perfectly Centered Horizontally & Vertically in the 60% white area */}
            <div className="w-full lg:w-[60%] min-h-screen flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 z-20 pt-24 pb-10 lg:py-0">
                <main className="w-full max-w-[320px] sm:max-w-[370px] flex flex-col justify-center">
                    {children}
                </main>
            </div>

            {/* Right-Side Purple Wave Matching Exact Reference Screenshot Curve */}
            <div className="hidden lg:block absolute top-0 right-0 bottom-0 w-[55%] xl:w-[50%] 2xl:w-[48%] pointer-events-none overflow-hidden select-none bg-[#674ab0]">
                <img
                    src={waveUrl}
                    alt=""
                    className="w-full h-full object-cover object-left"
                />
            </div>

            {/* Mobile / Tablet subtle bottom accent */}
            <div className="lg:hidden absolute -bottom-36 -right-36 w-80 h-80 rounded-full bg-[#674ab0]/15 blur-3xl pointer-events-none"></div>
        </div>
    );
}
