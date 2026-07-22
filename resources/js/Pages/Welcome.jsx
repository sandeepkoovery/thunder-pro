// resources/js/Pages/Welcome.jsx
import { Head, Link } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { 
  FolderKanban, 
  Clock, 
  FileText, 
  MessageSquare, 
  ArrowRight, 
  Users2,
  Calendar,
  CheckSquare,
  Bell,
  Download,
  BarChart3,
  Play,
  Check
} from "lucide-react";

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

export default function Welcome({ canLogin, canRegister }) {
    const { auth } = usePage().props;
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const modules = [
        {
            icon: FolderKanban,
            title: "Project Management",
            description: "Organize tasks, track progress on interactive project logs, set milestones, and meet project deadlines effortlessly."
        },
        {
            icon: CheckSquare,
            title: "Task Management",
            description: "Assign tasks to team members, set priorities, add checklist items, and collaborate directly with inline task comments."
        },
        {
            icon: Users2,
            title: "Employee Management",
            description: "Maintain comprehensive worker profiles, manage internal departments, and assign specific access roles and permissions."
        },
        {
            icon: Clock,
            title: "Attendance Management",
            description: "Monitor daily attendance logs in real time, generate late reports, and track working hours and shifts automatically."
        },
        {
            icon: FileText,
            title: "Leave Management",
            description: "Submit leave requests, track approvals through manager hierarchies, and check individual balances instantly."
        },
        {
            icon: BarChart3,
            title: "Reports & Analytics",
            description: "Generate deep analytic charts on task output, worker efficiency, shifts, and export raw data summaries to CSV/PDF."
        }
    ];

    return (
        <>
            <Head title="WorkNest - Unified Project & Workforce Management" />

            <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-[#7460ee]/10 selection:text-[#7460ee]">
                
                {/* Background Grid Pattern & Radial Gradients */}
                <div className="absolute inset-0 grid-lines-bg z-0 pointer-events-none opacity-[0.4]"></div>
                <div className="absolute top-[-10%] left-[20%] w-[55%] h-[55%] bg-[#7460ee]/5 rounded-full blur-[140px] opacity-70 pointer-events-none"></div>
                {/* Wavy background organic curve behind text similar to screenshot */}
                <div className="absolute top-0 left-0 w-[55%] h-[780px] bg-gradient-to-br from-[#7460ee]/8 via-[#7460ee]/3 to-transparent rounded-br-[250px] lg:rounded-br-[450px] pointer-events-none z-0"></div>

                {/* Sticky Header Navbar */}
                <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm py-4" : "bg-transparent py-6"}`}>
                    <div className="max-w-[1512px] mx-auto px-4 sm:px-5 lg:px-6 flex justify-between items-center">
                        {/* Logo left side styled in violet/purple */}
                        <div className="flex items-center gap-3 sm:gap-5">
                            <img src={getAssetUrl('images/worknest_logo.png?v=4')} alt="WorkNest" className="w-16 h-16 sm:w-32 sm:h-32 rounded-3xl object-contain" />
                            <span className="text-2xl sm:text-4xl font-black tracking-widest text-[#7460ee] uppercase">
                                WorkNest
                            </span>
                        </div>

                        {/* Navigation links */}
                        <div className="hidden md:flex items-center gap-10">
                            <a href="#" className="text-slate-500 hover:text-[#7460ee] text-[15px] font-semibold transition-colors">Home</a>
                            <a href="#features" className="text-slate-500 hover:text-[#7460ee] text-[15px] font-semibold transition-colors">Features</a>
                            <a href="#" className="text-slate-500 hover:text-[#7460ee] text-[15px] font-semibold transition-colors">Pricing</a>
                            <a href="#" className="text-slate-500 hover:text-[#7460ee] text-[15px] font-semibold transition-colors">Contact</a>
                        </div>

                        {/* Right Side CTA with proper auth checks */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {auth?.user ? (
                                <Link 
                                    href="/dashboard" 
                                    className="px-4 py-2 sm:px-6 sm:py-2.5 text-[15px] sm:text-[17px] font-bold text-white bg-[#7460ee] hover:bg-[#5e45d6] rounded-xl hover:shadow-lg transition-all flex items-center justify-center"
                                    style={{ minHeight: '44px' }}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link 
                                    href={route('login')} 
                                    className="px-4 py-2 sm:px-6 sm:py-2.5 text-[15px] sm:text-[17px] font-bold text-white bg-[#7460ee] hover:bg-[#5e45d6] rounded-xl hover:shadow-lg transition-all flex items-center justify-center"
                                    style={{ minHeight: '44px' }}
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>
 
                {/* Hero Section - Full Width layout container */}
                <main className="relative z-10 max-w-[1512px] mx-auto px-4 sm:px-5 lg:px-6 pt-[180px] pb-0">
                    
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-20">
                        
                        {/* Hero Left Content Column */}
                        <div className="lg:col-span-7 flex flex-col justify-center space-y-7">
                            <h1 className="text-4xl sm:text-5xl md:text-[62px] lg:text-[56px] xl:text-[68px] font-black text-[#2b1440] leading-[1.08] tracking-tight lg:whitespace-nowrap">
                                Modern Workspace & Project Logger
                            </h1>
                            
                            <p className="text-base text-slate-500 font-medium leading-relaxed">
                                Take control of your organization with WorkNest ERP. Our all-in-one platform connects task assignments, worker schedules, visual project boards, multi-level leave approvals, and live attendance metrics into a unified, responsive interface designed for growth. Boost your team's productivity, automate repetitive approval flows, and track real-time analytics from any desktop or mobile device seamlessly. Empower managers with visual timeline projections and interactive employee scheduling tools that keep project delivery aligned with company objectives.
                            </p>
 
                            {/* Bullet points styled as responsive cards with check icons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="flex items-center gap-3 text-[14px] font-bold text-slate-700 bg-slate-50/50 hover:bg-white hover:border-[#7460ee]/30 hover:shadow-sm p-3 rounded-2xl border border-slate-100/60 transition-all">
                                    <span className="w-8 h-8 rounded-lg bg-[#7460ee]/10 text-[#7460ee] flex items-center justify-center flex-shrink-0">
                                        <Check size={16} />
                                    </span>
                                    <span>Project logs & task timelines</span>
                                </div>
                                <div className="flex items-center gap-3 text-[14px] font-bold text-slate-700 bg-slate-50/50 hover:bg-white hover:border-[#7460ee]/30 hover:shadow-sm p-3 rounded-2xl border border-slate-100/60 transition-all">
                                    <span className="w-8 h-8 rounded-lg bg-[#7460ee]/10 text-[#7460ee] flex items-center justify-center flex-shrink-0">
                                        <Check size={16} />
                                    </span>
                                    <span>Employee schedules & shifts</span>
                                </div>
                                <div className="flex items-center gap-3 text-[14px] font-bold text-slate-700 bg-slate-50/50 hover:bg-white hover:border-[#7460ee]/30 hover:shadow-sm p-3 rounded-2xl border border-slate-100/60 transition-all">
                                    <span className="w-8 h-8 rounded-lg bg-[#7460ee]/10 text-[#7460ee] flex items-center justify-center flex-shrink-0">
                                        <Check size={16} />
                                    </span>
                                    <span>Daily attendance logger</span>
                                </div>
                                <div className="flex items-center gap-3 text-[14px] font-bold text-slate-700 bg-slate-50/50 hover:bg-white hover:border-[#7460ee]/30 hover:shadow-sm p-3 rounded-2xl border border-slate-100/60 transition-all">
                                    <span className="w-8 h-8 rounded-lg bg-[#7460ee]/10 text-[#7460ee] flex items-center justify-center flex-shrink-0">
                                        <Check size={16} />
                                    </span>
                                    <span>Leave approvals & balance sheets</span>
                                </div>
                                <div className="flex items-center gap-3 text-[14px] font-bold text-slate-700 bg-slate-50/50 hover:bg-white hover:border-[#7460ee]/30 hover:shadow-sm p-3 rounded-2xl border border-slate-100/60 transition-all sm:col-span-2">
                                    <span className="w-8 h-8 rounded-lg bg-[#7460ee]/10 text-[#7460ee] flex items-center justify-center flex-shrink-0">
                                        <Check size={16} />
                                    </span>
                                    <span>Deep analytics on workforce output & project completion</span>
                                </div>
                            </div>
 
                            {/* Hero Signup Button */}
                             <div className="pt-4">
                                 <a
                                     href="#features"
                                     onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                                     }}
                                     className="inline-flex items-center justify-center px-9 py-4 bg-[#7460ee] hover:bg-[#5e45d6] text-white font-extrabold rounded-2xl text-[14px] sm:text-[15px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                                     style={{ minHeight: '44px' }}
                                 >
                                     Know More
                                 </a>
                             </div>
                        </div>

                        {/* Hero Right Illustration Column */}
                        <div className="lg:col-span-5 flex justify-center items-center">
                            <img 
                                src={getAssetUrl('images/framer_hero.png')} 
                                alt="Project Management Rocket Launch Illustration" 
                                className="w-full max-w-[620px] h-auto object-contain"
                            />
                        </div>

                    </div>
                </main>

                {/* Features Section - STYLED EXACTLY LIKE THE GRADIENT DARK VIOLET SYSTEM SCREENSHOT */}
                <div id="features" className="bg-gradient-to-br from-[#1d0d2b] via-[#2b1440] to-[#150a20] py-24 relative overflow-hidden">
                    {/* Background Grid Pattern inside gradient */}
                    <div className="absolute inset-0 grid-lines-bg z-0 pointer-events-none opacity-[0.06]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-[#7460ee]/10 rounded-full blur-[160px] opacity-60 pointer-events-none"></div>

                    <div className="relative z-10 max-w-[1512px] mx-auto px-4 sm:px-5 lg:px-6">
                        
                        <div className="text-center max-w-5xl mx-auto mb-16">
                            <h1 className="text-5xl sm:text-6xl md:text-[80px] lg:text-[96px] font-black text-white tracking-tight leading-[0.98] mb-6" style={{ color: '#ffffff' }}>
                                Everything You Need to Succeed
                            </h1>
                            <p className="text-base sm:text-[18px] text-purple-200/70 font-medium leading-relaxed max-w-3xl mx-auto">
                                From custom workflows to deep employee metrics, WorkNest gives you everything you need to run your workforce.
                            </p>
                        </div>

                        {/* Glassmorphic 3-Column Grid exactly like screenshot */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1240px] mx-auto">
                            {modules.map((m, i) => {
                                const Icon = m.icon;
                                return (
                                    <div key={i} className="bg-black/35 backdrop-blur-md rounded-[24px] p-7 border border-white/10 hover:border-white/20 hover:bg-black/45 transition-all duration-300 shadow-2xl flex flex-col justify-between">
                                        <div>
                                            {/* Glowing soft icon badge */}
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-[0_4px_14px_rgba(255,255,255,0.08)] mb-5">
                                                <Icon size={20} className="text-purple-300" />
                                            </div>
                                            <h3 className="text-[19px] font-black text-white mb-3 tracking-tight" style={{ color: '#ffffff' }}>
                                                {m.title}
                                            </h3>
                                            <p className="text-[13.5px] text-purple-200/70 leading-relaxed font-medium">
                                                {m.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <footer className="border-t border-slate-100 bg-white py-10 relative z-50 text-slate-500">
                    <div className="max-w-[1512px] mx-auto px-4 sm:px-5 lg:px-6 grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                        {/* Box */}
                        <div className="space-y-4 col-span-2 md:col-span-1">
                            <div className="flex items-center gap-3">
                                <img src={getAssetUrl('images/worknest_logo.png?v=4')} alt="WorkNest" className="w-10 h-10 rounded-xl object-contain" />
                                <span className="text-lg font-black tracking-tight text-[#2b1440]">
                                    WorkNest
                                </span>
                            </div>
                            <p className="text-xs text-[#6B7280] leading-relaxed">One workspace for your entire team. Organize projects, employee logs, shifts, leaves and task items seamlessly.</p>
                        </div>

                        {/* Box */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-[#2b1440] uppercase tracking-wider">Quick Links</h4>
                            <ul className="space-y-2.5 text-xs text-[#6B7280]">
                                <li><a href="#" className="hover:text-[#7460ee] transition-colors">Home</a></li>
                                <li><a href="#features" className="hover:text-[#7460ee] transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-[#7460ee] transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-[#7460ee] transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        {/* Box */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-[#2b1440] uppercase tracking-wider">Resources</h4>
                            <ul className="space-y-2.5 text-xs text-[#6B7280]">
                                <li><a href="#" className="hover:text-[#7460ee] transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-[#7460ee] transition-colors">Security</a></li>
                                <li><a href="#" className="hover:text-[#7460ee] transition-colors">API Docs</a></li>
                            </ul>
                        </div>

                        {/* Box */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-[#2b1440] uppercase tracking-wider">Legal</h4>
                            <ul className="space-y-2.5 text-xs text-[#6B7280]">
                                <li><a href="#" className="hover:text-[#7460ee] transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-[#7460ee] transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>

                    </div>

                    <div className="max-w-[1512px] mx-auto px-4 sm:px-5 lg:px-6 border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-[#6B7280]">© {new Date().getFullYear()} WorkNest. All rights reserved.</p>
                        <div className="flex items-center gap-5 text-xs font-semibold">
                            <a href="#" className="hover:text-[#7460ee]">Twitter</a>
                            <a href="#" className="hover:text-[#7460ee]">LinkedIn</a>
                            <a href="#" className="hover:text-[#7460ee]">GitHub</a>
                        </div>
                    </div>
                </footer>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .grid-lines-bg {
                    background-image: 
                        radial-gradient(rgba(116, 96, 238, 0.06) 1.25px, transparent 1.25px);
                    background-size: 28px 28px;
                }
                #features h1 {
                    font-size: 50px !important;
                    font-weight: 900 !important;
                    color: #ffffff !important;
                    line-height: 1.1 !important;
                }
                #features h3 {
                    font-size: 19px !important;
                    font-weight: 900 !important;
                    color: #ffffff !important;
                }
                @media (min-width: 1024px) {
                    #features h1 {
                        font-size: 50px !important;
                        white-space: nowrap !important;
                    }
                }
                @media (max-width: 768px) {
                    #features h1 {
                        font-size: 36px !important;
                    }
                }
                @media (max-width: 640px) {
                    #features h1 {
                        font-size: 28px !important;
                    }
                }
            `}} />
        </>
    );
}
