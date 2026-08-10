// resources/js/Layouts/AppShell.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, router, Head, usePage } from "@inertiajs/react";
import { Menu, Search, Moon, Sun, ChevronDown, LogOut, Settings, User, CreditCard, DollarSign, HelpCircle, Power, Download, Clock, ShieldAlert } from "lucide-react";
import NotificationDropdown from "@/Components/NotificationDropdown";
import ThemeCustomizer from "@/Components/ThemeCustomizer";
import AskWorkNestVoiceAssistant from "@/Components/AskWorkNestVoiceAssistant";
import { Toaster, toast } from "react-hot-toast";

export function NavItem({ href, icon: Icon, label, visible, badge, beta, routeName, collapsed, isMobileOpen }) {
  if (!visible) return null;
  let active = route().current(routeName) || route().current(routeName + ".*");
  if (routeName === "admin.attendance" && route().current("admin.attendance.report")) {
    active = false;
  }
  return (
    <Link href={href} className={`mp-nav-link${active ? " active" : ""}`} title={collapsed && !isMobileOpen ? label : undefined}>
      <span className="mp-nav-icon">
        <Icon size={21} strokeWidth={1.5} />
      </span>
      {(!collapsed || isMobileOpen) && <span className="mp-nav-text">{label}</span>}
      {beta && (!collapsed || isMobileOpen) && <span className="mp-badge mp-badge-beta">Beta</span>}
      {badge > 0 && (!collapsed || isMobileOpen) && <span className="mp-badge">{badge}</span>}
    </Link>
  );
}

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

export default function AppShell({ children, title = "Dashboard", flash, auth, renderNav, bottomNav }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const profileDropdownRef = useRef(null);
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tp-theme-mode") || "light";
    }
    return "light";
  });

  const toggleDarkMode = () => {
    const nextMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextMode);
    localStorage.setItem("tp-theme-mode", nextMode);
    
    const root = document.documentElement;
    if (nextMode === "dark") {
      root.classList.add("dark-theme");
    } else {
      root.classList.remove("dark-theme");
    }
  };

  const pageProps = usePage().props;
  const isSuperAdmin = (auth?.user || pageProps.auth?.user)?.role === 'superadmin';
  const isPremiumPlan = pageProps.userPlan === 'premium' || isSuperAdmin;

  useEffect(() => {
    if (!isPremiumPlan) {
      setDeferredPrompt(null);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [isPremiumPlan]);

  const handleInstallClick = async () => {
    if (!deferredPrompt || !isPremiumPlan) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    setCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash, flash?.timestamp]);

  const toggleSidebar = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const handleLogout = () => {
    router.post(route("logout"));
  };

  const logoWidth = collapsed && !isMobileOpen ? 70 : 240;

  const isPendingApproval = Boolean(auth?.user?.is_pending_approval || pageProps.auth?.user?.is_pending_approval);

  return (
    <>
      <Head title={title} />
      <Toaster position="top-right" />

      <div className={`mp-wrapper relative ${isPendingApproval ? 'filter blur-md pointer-events-none select-none overflow-hidden max-h-screen' : ''}`}>
        {/* Blue topbar — full width */}
        <header className="mp-topbar">
          <div className="mp-topbar-logo-area hidden md:flex" style={{ width: logoWidth, minWidth: logoWidth, paddingLeft: collapsed && !isMobileOpen ? '0px' : '20px' }}>
            <Link href={route('home')} className="mp-topbar-brand flex items-center justify-center w-full">
              <img src={getAssetUrl('images/worknest_logo.png?v=4')} alt="WorkNest Logo" className="w-10 h-10 rounded-lg object-contain" />
              {(!collapsed || isMobileOpen) && (
                <span className="mp-topbar-brand-text ml-2">
                  Work<span>Nest</span>
                </span>
              )}
            </Link>
          </div>

          <div className="mp-topbar-center">
            <button
              className="mp-nav-btn"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileOpen(!isMobileOpen);
                } else {
                  toggleSidebar();
                }
              }}
              aria-label="Toggle menu"
            >
              <Menu size={22} />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <img src={getAssetUrl('images/worknest_logo.png?v=4')} alt="WorkNest" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-white font-black text-sm tracking-wider uppercase">WorkNest</span>
            </div>
            <div className="mp-topbar-search-wrap">
              <Search size={16} color="rgba(255,255,255,0.7)" style={{ marginRight: 8, flexShrink: 0 }} />
              <input type="text" placeholder="Search..." />
            </div>
          </div>

          <div className="mp-topbar-right">

            {isPremiumPlan && deferredPrompt && (
              <button
                className="mp-nav-btn install-btn bg-blue-50 text-blue-600 px-3 rounded-lg flex items-center gap-1.5 transition-all duration-300 hover:bg-blue-100 mr-2"
                onClick={handleInstallClick}
                title="Install App"
                style={{
                  border: "1px solid rgba(37, 99, 235, 0.15)",
                  padding: "0 12px",
                  height: "38px"
                }}
              >
                <Download size={18} className="animate-bounce" />
                <span className="hidden sm:inline text-xs font-semibold">Install App</span>
              </button>
            )}

            <button className="mp-nav-btn" onClick={toggleDarkMode} title={themeMode === "dark" ? "Light mode" : "Dark mode"}>
              {themeMode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <NotificationDropdown variant="topbar" />

            <button className="mp-nav-btn" onClick={() => setCustomizerOpen(true)} title="Customize Theme">
              <Settings size={20} />
            </button>

            <div className="mp-divider-v" />

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="mp-user-chip-btn"
                aria-haspopup="true"
                aria-expanded={isProfileOpen}
              >
                <div className="relative">
                  <img 
                    src={auth?.user?.image_url || getAssetUrl('images/default-avatar.jpg')} 
                    alt={auth?.user?.name || 'User'} 
                    className="mp-avatar object-cover" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getAssetUrl('images/default-avatar.jpg');
                    }}
                  />
                  <span className="mp-status-indicator" />
                </div>
                <span className="mp-user-chip-name">{auth?.user?.name}</span>
                <ChevronDown size={14} className={`mp-chevron ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="mp-profile-dropdown">
                  <div className="mp-profile-dropdown-header">
                    <img 
                      src={auth?.user?.image_url || getAssetUrl('images/default-avatar.jpg')} 
                      alt={auth?.user?.name || 'User'} 
                      className="mp-profile-dropdown-avatar object-cover" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getAssetUrl('images/default-avatar.jpg');
                      }}
                    />
                    <div className="mp-profile-dropdown-info">
                      <h4 className="mp-profile-dropdown-name">{auth?.user?.name}</h4>
                      <p className="mp-profile-dropdown-role">{auth?.user?.role || 'Admin'}</p>
                    </div>
                  </div>
                  
                  <div className="mp-profile-dropdown-divider" />
                  
                  <div className="mp-profile-dropdown-body">
                    <Link
                      href={route("profile.edit")}
                      onClick={() => setIsProfileOpen(false)}
                      className="mp-profile-dropdown-item"
                    >
                      <User size={18} className="mp-profile-dropdown-icon" />
                      <span>My Profile</span>
                    </Link>


                  </div>

                  <div className="mp-profile-dropdown-divider" />

                  <div className="mp-profile-dropdown-footer">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="mp-profile-dropdown-item mp-profile-dropdown-logout w-full text-left"
                    >
                      <Power size={18} className="mp-profile-dropdown-icon" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mp-body-row">
          {isMobileOpen && <div className="mp-mobile-overlay" onClick={() => setIsMobileOpen(false)} />}

          <aside className={`mp-sidebar${collapsed ? " collapsed" : ""}${isMobileOpen ? " mobile-open" : ""}`}>
            <nav className="mp-sidebar-nav">{renderNav({ collapsed, isMobileOpen })}</nav>

            {/* Logout button — visible only on mobile inside sidebar */}
            <button
              className="mp-sidebar-logout"
              onClick={() => {
                setIsMobileOpen(false);
                handleLogout();
              }}
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </aside>

          <main className="mp-main mp-fade">{children}</main>
        </div>

        {/* Bottom nav for employees on mobile */}
        {bottomNav}

        <ThemeCustomizer isOpen={customizerOpen} setIsOpen={setCustomizerOpen} />
        <AskWorkNestVoiceAssistant />
      </div>

      {/* FULL-SCREEN BLUR PENDING APPROVAL OVERLAY */}
      {isPendingApproval && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-300 relative pointer-events-auto my-auto">
            {/* Clock Icon */}
            <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-5 border border-amber-200 shadow-inner">
              <Clock size={40} className="animate-pulse" />
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 mb-4 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>Pending Super Admin Approval</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Account Pending Approval</h2>

            {/* Description */}
            <p className="text-slate-600 text-sm mt-3 leading-relaxed font-medium">
              Your workspace administrator account is currently pending approval by the Super Administrator.
            </p>

            <div className="mt-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs font-semibold text-amber-900 text-left">
              <div className="flex items-start gap-2">
                <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  After approval of the Super Administrator, you will be able to access your dashboard, projects, employees, and all system features.
                </span>
              </div>
            </div>

            {/* Logout Action */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-3">
              <button
                onClick={handleLogout}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
