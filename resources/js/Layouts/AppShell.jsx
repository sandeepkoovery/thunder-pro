// resources/js/Layouts/AppShell.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, router, Head } from "@inertiajs/react";
import { Menu, Search, Moon, Sun, ChevronDown, LogOut, Settings, User, CreditCard, DollarSign, HelpCircle, Power, Download } from "lucide-react";
import NotificationDropdown from "@/Components/NotificationDropdown";
import ThemeCustomizer from "@/Components/ThemeCustomizer";
import { Toaster, toast } from "react-hot-toast";

export function NavItem({ href, icon: Icon, label, visible, badge, beta, routeName, collapsed, isMobileOpen }) {
  if (!visible) return null;
  const active = route().current(routeName) || route().current(routeName + ".*");
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

  const profileDropdownRef = useRef(null);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
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

  return (
    <>
      <Head title={title} />
      <Toaster position="top-right" />

      <div className="mp-wrapper">
        {/* Blue topbar — full width */}
        <header className="mp-topbar">
          <div className="mp-topbar-logo-area hidden md:flex" style={{ width: logoWidth, minWidth: logoWidth, paddingLeft: collapsed && !isMobileOpen ? '0px' : '20px' }}>
            <Link href="/" className="mp-topbar-brand flex items-center justify-center w-full">
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
            {deferredPrompt && (
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
                  {auth?.user?.image_url ? (
                    <img src={auth.user.image_url} alt={auth.user.name} className="mp-avatar" />
                  ) : (
                    <div className="mp-avatar-letter">{auth?.user?.name?.charAt(0)}</div>
                  )}
                  <span className="mp-status-indicator" />
                </div>
                <span className="mp-user-chip-name">{auth?.user?.name}</span>
                <ChevronDown size={14} className={`mp-chevron ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="mp-profile-dropdown">
                  <div className="mp-profile-dropdown-header">
                    {auth?.user?.image_url ? (
                      <img src={auth.user.image_url} alt={auth.user.name} className="mp-profile-dropdown-avatar" />
                    ) : (
                      <div className="mp-profile-dropdown-avatar-letter">{auth?.user?.name?.charAt(0)}</div>
                    )}
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
      </div>
    </>
  );
}
