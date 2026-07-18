// resources/js/Layouts/AppShell.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, router, Head } from "@inertiajs/react";
import { Menu, Search, Moon, ChevronDown, LogOut, Settings, User, CreditCard, DollarSign, HelpCircle, Power, Download } from "lucide-react";
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

export default function AppShell({ children, title = "Dashboard", flash, auth, renderNav }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
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
          <div className="mp-topbar-logo-area" style={{ width: logoWidth, minWidth: logoWidth }}>
            <Link href="/" className="mp-topbar-brand" style={{ display: collapsed && !isMobileOpen ? "none" : "flex" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff" style={{ opacity: 0.95 }}>
                <path d="M13 0L3 14h7l-2 10 10-14h-7l2-10z" />
              </svg>
              <span className="mp-topbar-brand-text">
                THUNDER<span>PRO</span>
              </span>
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

            <button className="mp-nav-btn" title="Dark mode">
              <Moon size={20} />
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

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setCustomizerOpen(true);
                      }}
                      className="mp-profile-dropdown-item w-full text-left"
                    >
                      <Settings size={18} className="mp-profile-dropdown-icon" />
                      <span>Settings</span>
                    </button>

                    <Link
                      href="#"
                      onClick={() => setIsProfileOpen(false)}
                      className="mp-profile-dropdown-item"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <CreditCard size={18} className="mp-profile-dropdown-icon" />
                          <span>Billing Plan</span>
                        </div>
                        <span className="mp-badge-red">4</span>
                      </div>
                    </Link>

                    <Link
                      href="#"
                      onClick={() => setIsProfileOpen(false)}
                      className="mp-profile-dropdown-item"
                    >
                      <DollarSign size={18} className="mp-profile-dropdown-icon" />
                      <span>Pricing</span>
                    </Link>

                    <Link
                      href="#"
                      onClick={() => setIsProfileOpen(false)}
                      className="mp-profile-dropdown-item"
                    >
                      <HelpCircle size={18} className="mp-profile-dropdown-icon" />
                      <span>FAQ</span>
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
          </aside>

          <main className="mp-main mp-fade">{children}</main>
        </div>

        <ThemeCustomizer isOpen={customizerOpen} setIsOpen={setCustomizerOpen} />
      </div>
    </>
  );
}
