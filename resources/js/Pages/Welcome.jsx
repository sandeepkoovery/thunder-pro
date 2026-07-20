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
        const base = route('/');
        const baseSlash = base.endsWith('/') ? base : base + '/';
        return baseSlash + (path.startsWith('/') ? path.substring(1) : path);
    } catch (e) {
        return path;
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
            highlights: ["Kanban Boards", "Milestones", "Deadlines"]
        },
        {
            icon: CheckSquare,
            title: "Task Management",
            highlights: ["Assignments", "Priorities", "Comments"]
        },
        {
            icon: Users2,
            title: "Employee Management",
            highlights: ["Profiles", "Departments", "Roles"]
        },
        {
            icon: Clock,
            title: "Attendance Management",
            highlights: ["Daily Attendance", "Late Reports", "Working Hours"]
        },
        {
            icon: FileText,
            title: "Leave Management",
            highlights: ["Leave Requests", "Approvals", "Balance"]
        },
        {
            icon: Calendar,
            title: "Event Calendar",
            highlights: ["Meetings", "Company Events", "Deadlines"]
        },
        {
            icon: MessageSquare,
            title: "Team Chat",
            highlights: ["Real-time Messaging", "Announcements"]
        },
        {
            icon: BarChart3,
            title: "Reports",
            highlights: ["Charts", "Analytics", "Exports"]
        },
        {
            icon: Bell,
            title: "Notifications",
            highlights: ["Instant Alerts", "Reminders"]
        },
        {
            icon: Download,
            title: "Progressive Web App",
            highlights: ["Install on Desktop", "Android", "iPhone"]
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
                        <div className="flex items-center gap-3">
                            <img src={getAssetUrl('images/worknest_logo.png?v=3')} alt="WorkNest" className="w-14 h-14 rounded-2xl object-contain" />
                            <span className="text-2xl font-black tracking-wider text-[#00A8FF] uppercase">
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

                        {/* Right Side CTA */}
                        <div className="flex items-center gap-4">
                            <Link 
                                href={route('login')} 
                                className="px-5 py-2.5 text-[15px] font-semibold text-slate-700 hover:text-[#00A8FF] transition-all"
                                style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
                            >
                                Login
                            </Link>
                            {canRegister && (
                                <Link 
                                    href={route('register')} 
                                    className="px-6 py-2.5 text-[15px] font-bold text-white bg-[#00A8FF] hover:bg-[#0097e6] rounded-xl hover:shadow-lg transition-all flex items-center justify-center"
                                    style={{ minHeight: '44px' }}
                                >
                                    Get Started
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section - Full Width layout container */}
                <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-40 pb-24">
                    
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-28">
                        
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

                            {/* Get Started Button */}
                            <div className="pt-4">
                                <Link
                                    href={auth?.user ? "/dashboard" : route('login')}
                                    className="inline-flex items-center justify-center px-9 py-4 bg-[#00A8FF] hover:bg-[#0097e6] text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                                    style={{ minHeight: '44px' }}
                                >
                                    Get Started
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
                    <div id="features" className="pt-20 border-t border-slate-100 mb-20">
                        
                        <div className="text-center max-w-xl mx-auto mb-20">
                            <span className="inline-flex items-center gap-1 bg-[#00A8FF]/5 text-[#00A8FF] px-4.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-[#00A8FF]/10 mb-4">
                                ✦ WorkNest Modules
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] tracking-tight leading-[1.1] mb-5">Everything You Need to Run Your Business</h2>
                            <p className="text-base text-slate-500 font-medium leading-relaxed">Integrated corporate spaces tailored for robust operations.</p>
                        </div>

                        {/* Features Responsive Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {modules.map((m, i) => {
                                const Icon = m.icon;
                                return (
                                    <div key={i} className="bg-white rounded-[28px] p-8 border border-slate-100 hover:border-[#00A8FF]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="w-12 h-12 rounded-2xl bg-[#00A8FF]/5 text-[#00A8FF] flex items-center justify-center shadow-sm mb-6">
                                                <Icon size={22} />
                                            </div>
                                            <h3 className="text-[20px] font-bold text-[#0B132B] mb-3">{m.title}</h3>
                                            
                                            {/* Sub-highlights bullet details */}
                                            <ul className="space-y-1.5 pt-2">
                                                {m.highlights.map((h, hi) => (
                                                    <li key={hi} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#00A8FF]"></span>
                                                        {h}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </main>

                {/* Footer Section */}
                <footer className="border-t border-slate-100 bg-white py-16 relative z-50 text-slate-500">
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
