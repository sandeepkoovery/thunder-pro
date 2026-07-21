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
            description: "Organize tasks, track progress on interactive Kanban boards, set milestones, and meet project deadlines effortlessly."
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
            icon: Calendar,
            title: "Event Calendar",
            description: "Schedule company meetings, coordinate major events, set visual deadline reminders, and sync with external tools."
        },
        {
            icon: MessageSquare,
            title: "Team Chat",
            description: "Foster seamless collaboration with instant messaging channels, group chats, notifications, and company announcements."
        },
        {
            icon: BarChart3,
            title: "Reports",
            description: "Generate deep analytic charts on task output, worker efficiency, shifts, and export raw data summaries to CSV/PDF."
        },
        {
            icon: Bell,
            title: "Notifications",
            description: "Receive instant push alerts and customizable email reminders for task updates, shift changes, and approvals."
        },
        {
            icon: Download,
            title: "Progressive Web App",
            description: "Install the dashboard on your desktop or mobile device (Android/iOS) for a native app experience with offline capability."
        }
    ];

    return (
        <>
            <Head title="WorkNest - Unified Project & Workforce Management" />

            <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-[#00A8FF]/10 selection:text-[#00A8FF]">
                
                {/* Background Grid Pattern & Radial Gradients */}
                <div className="absolute inset-0 grid-lines-bg z-0 pointer-events-none opacity-[0.4]"></div>
                <div className="absolute top-[-10%] left-[20%] w-[55%] h-[55%] bg-[#00A8FF]/5 rounded-full blur-[140px] opacity-70 pointer-events-none"></div>

                {/* Sticky Header Navbar */}
                <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm py-4" : "bg-transparent py-6"}`}>
                    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex justify-between items-center">
                        {/* Logo left side styled in sky-blue */}
                        <div className="flex items-center gap-3 sm:gap-5">
                            <img src={getAssetUrl('images/worknest_logo.png?v=3')} alt="WorkNest" className="w-16 h-16 sm:w-32 sm:h-32 rounded-3xl object-contain" />
                            <span className="text-2xl sm:text-4xl font-black tracking-widest text-[#00A8FF] uppercase">
                                WorkNest
                            </span>
                        </div>

                        {/* Navigation links */}
                        <div className="hidden md:flex items-center gap-10">
                            <a href="#" className="text-slate-500 hover:text-[#00A8FF] text-[15px] font-semibold transition-colors">Home</a>
                            <a href="#features" className="text-slate-500 hover:text-[#00A8FF] text-[15px] font-semibold transition-colors">Features</a>
                            <a href="#" className="text-slate-500 hover:text-[#00A8FF] text-[15px] font-semibold transition-colors">Pricing</a>
                            <a href="#" className="text-slate-500 hover:text-[#00A8FF] text-[15px] font-semibold transition-colors">Contact</a>
                        </div>

                        {/* Right Side CTA with proper auth checks */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {auth?.user ? (
                                <Link 
                                    href="/dashboard" 
                                    className="px-4 py-2 sm:px-6 sm:py-2.5 text-[15px] sm:text-[17px] font-bold text-white bg-[#00A8FF] hover:bg-[#0097e6] rounded-xl hover:shadow-lg transition-all flex items-center justify-center"
                                    style={{ minHeight: '44px' }}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link 
                                    href={route('login')} 
                                    className="px-4 py-2 sm:px-6 sm:py-2.5 text-[15px] sm:text-[17px] font-bold text-white bg-[#00A8FF] hover:bg-[#0097e6] rounded-xl hover:shadow-lg transition-all flex items-center justify-center"
                                    style={{ minHeight: '44px' }}
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>
 
                {/* Hero Section - Full Width layout container */}
                <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-12">
                    
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-12">
                        
                        {/* Hero Left Content Column */}
                        <div className="lg:col-span-5 flex flex-col justify-center space-y-7">
                            <h1 className="text-4xl sm:text-5xl md:text-[62px] font-black text-[#0B132B] leading-[1.08] tracking-tight">
                                Workforce & Project Management
                            </h1>
                            
                            <p className="text-base text-slate-500 font-medium leading-relaxed">
                                Streamline your operations with a unified workspace. Manage projects, tasks, attendance tracking, leave requests, employee profiles, and team collaboration in one secure system.
                            </p>
 
                            {/* Bullet points with blue dots exactly like screenshot */}
                            <div className="space-y-3.5 pt-2">
                                <div className="flex items-center gap-3.5 text-[15px] font-bold text-slate-600">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#00A8FF] flex-shrink-0"></span>
                                    Track daily attendance logs and shift schedules.
                                </div>
                                <div className="flex items-center gap-3.5 text-[15px] font-bold text-slate-600">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#00A8FF] flex-shrink-0"></span>
                                    Manage projects, tasks, and leave requests effortlessly.
                                </div>
                            </div>
 
                            {/* Hero Signup Button */}
                            <div className="pt-4">
                                <Link
                                    href={auth?.user ? "/dashboard" : route('login')}
                                    className="inline-flex items-center justify-center px-9 py-4 bg-[#00A8FF] hover:bg-[#0097e6] text-white font-extrabold rounded-2xl text-[14px] sm:text-[15px] uppercase tracking-wider transition-colors shadow-sm"
                                    style={{ minHeight: '44px' }}
                                >
                                    {auth?.user ? "Dashboard" : "Get Started"}
                                </Link>
                            </div>
                        </div>

                        {/* Hero Right Illustration Column */}
                        <div className="lg:col-span-7 flex justify-center items-center">
                            <div className="w-full max-w-[620px] p-2">
                                <img 
                                    src={getAssetUrl('images/framer_hero.png')} 
                                    alt="Project Management Rocket Launch Illustration" 
                                    className="w-full h-auto rounded-3xl"
                                />
                            </div>
                        </div>

                    </div>


                    {/* Features Section (10 Modules responsive cards grid styled for this theme) */}
                    <div id="features" className="pt-12 border-t border-slate-100 mb-12">
                        
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="inline-flex items-center gap-1 bg-[#00A8FF]/5 text-[#00A8FF] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#00A8FF]/10 mb-4">
                                + WorkNest Modules
                            </span>
                            <h2 className="text-3xl sm:text-[42px] font-black text-[#0B132B] tracking-tight leading-[1.1] mb-5">
                                Everything You Need to Succeed with WorkNest
                            </h2>
                            <p className="text-base sm:text-[17px] text-slate-500 font-medium leading-relaxed">
                                From custom workflows to deep employee metrics, WorkNest gives you everything you need to run your workforce.
                            </p>
                        </div>

                        {/* Features Responsive 4-Column Grid with reduced spacing gap */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
                            {modules.map((m, i) => {
                                const Icon = m.icon;
                                return (
                                    <div key={i} className="bg-white rounded-[24px] p-7 border border-slate-100/80 hover:border-[#00A8FF]/30 hover:shadow-[0_12px_40px_rgba(59,130,246,0.08)] hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex flex-col justify-between">
                                        <div>
                                            {/* Glowing soft icon badge */}
                                            <div className="w-12 h-12 rounded-2xl bg-[#00A8FF]/10 text-[#00A8FF] flex items-center justify-center shadow-[0_4px_14px_rgba(0,168,255,0.15)] mb-5">
                                                <Icon size={20} />
                                            </div>
                                            <h3 className="text-[18px] font-extrabold text-[#0B132B] mb-3 tracking-tight">
                                                {m.title}
                                            </h3>
                                            <p className="text-[13.5px] text-slate-500 leading-relaxed font-medium">
                                                {m.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </main>

                {/* Footer Section */}
                <footer className="border-t border-slate-100 bg-white py-10 relative z-50 text-slate-500">
                    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                        {/* Box */}
                        <div className="space-y-4 col-span-2 md:col-span-1">
                            <div className="flex items-center gap-3">
                                <img src={getAssetUrl('images/worknest_logo.png?v=3')} alt="WorkNest" className="w-10 h-10 rounded-xl object-contain" />
                                <span className="text-lg font-black tracking-tight text-[#0B132B]">
                                    WorkNest
                                </span>
                            </div>
                            <p className="text-xs text-[#6B7280] leading-relaxed">One workspace for your entire team. Organize projects, employee logs, shifts, leaves and task items seamlessly.</p>
                        </div>

                        {/* Box */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-[#0B132B] uppercase tracking-wider">Quick Links</h4>
                            <ul className="space-y-2.5 text-xs text-[#6B7280]">
                                <li><a href="#" className="hover:text-[#00A8FF] transition-colors">Home</a></li>
                                <li><a href="#features" className="hover:text-[#00A8FF] transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-[#00A8FF] transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-[#00A8FF] transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        {/* Box */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-[#0B132B] uppercase tracking-wider">Resources</h4>
                            <ul className="space-y-2.5 text-xs text-[#6B7280]">
                                <li><a href="#" className="hover:text-[#00A8FF] transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-[#00A8FF] transition-colors">Security</a></li>
                                <li><a href="#" className="hover:text-[#00A8FF] transition-colors">API Docs</a></li>
                            </ul>
                        </div>

                        {/* Box */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-[#0B132B] uppercase tracking-wider">Legal</h4>
                            <ul className="space-y-2.5 text-xs text-[#6B7280]">
                                <li><a href="#" className="hover:text-[#00A8FF] transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-[#00A8FF] transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>

                    </div>

                    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-[#6B7280]">© {new Date().getFullYear()} WorkNest. All rights reserved.</p>
                        <div className="flex items-center gap-5 text-xs font-semibold">
                            <a href="#" className="hover:text-[#00A8FF]">Twitter</a>
                            <a href="#" className="hover:text-[#00A8FF]">LinkedIn</a>
                            <a href="#" className="hover:text-[#00A8FF]">GitHub</a>
                        </div>
                    </div>
                </footer>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .grid-lines-bg {
                    background-image: 
                        radial-gradient(rgba(0, 168, 255, 0.06) 1.25px, transparent 1.25px);
                    background-size: 28px 28px;
                }
            `}} />
        </>
    );
}
