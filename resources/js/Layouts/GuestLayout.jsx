import { Link } from '@inertiajs/react';

const getAssetUrl = (path) => {
    try {
        const base = route('/');
        const baseSlash = base.endsWith('/') ? base : base + '/';
        return baseSlash + (path.startsWith('/') ? path.substring(1) : path);
    } catch (e) {
        return path;
    }
};

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-mp-bg relative overflow-hidden font-sans flex flex-col items-center justify-center p-6">
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-cyan-100 rounded-full blur-[120px] opacity-60"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex flex-col items-center gap-3 group">
                        <img src={getAssetUrl('images/worknest_logo.png?v=3')} alt="WorkNest Logo" className="w-20 h-20 rounded-2xl shadow-md object-contain" />
                        <span className="text-2xl font-bold tracking-tight text-mp-heading">
                            Work<span className="text-emerald-600">Nest</span>
                        </span>
                    </Link>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-mp shadow-mp border border-white/80">
                    {children}
                </div>
            </div>
        </div>
    );
}
