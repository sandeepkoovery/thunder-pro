// resources/js/Layouts/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import {
  LayoutDashboard,
  FolderKanban,
  Users as UsersIcon,
  CalendarDays,
  FileText,
  Clock,
  Settings as SettingsIcon,
  MessageSquare,
  Globe,
  BarChart3,
  Bell,
  CreditCard,
  Palette,
  List,
  Sparkles,
  Building2,
} from "lucide-react";
import AppShell, { NavItem } from "@/Layouts/AppShell";

export default function AdminLayout({ children, title = "Dashboard" }) {
  const { auth, flash, sharedSettings, expiringWebsitesCount, allowedModules } = usePage().props;
  const isSuperAdmin = auth?.user?.role === "superadmin";
  const betaMenuItems = isSuperAdmin ? [] : (Array.isArray(sharedSettings?.beta_menu_items) ? sharedSettings.beta_menu_items : []);
  const hiddenMenuItems = Array.isArray(sharedSettings?.hidden_modules) ? sharedSettings.hidden_modules : [];
  const isAdmin = ['admin', 'superadmin', 'manager'].includes(auth?.user?.role);

  const isVisible = (module) => {
    if (isSuperAdmin) return true;
    if (hiddenMenuItems.includes(module)) return false;
    return Array.isArray(allowedModules) && allowedModules.includes(module);
  };
  const [sidebarCounts, setSidebarCounts] = useState({ unread_chats: 0, pending_leaves: 0 });

  const fetchSidebarCounts = async () => {
    try {
      const response = await axios.get(route("notifications.counts"));
      setSidebarCounts(response.data);
    } catch (error) {
      console.error("Error fetching sidebar counts:", error);
    }
  };

  useEffect(() => {
    fetchSidebarCounts();
    const interval = setInterval(fetchSidebarCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderNav = ({ collapsed, isMobileOpen }) => (
    <>
      <NavItem href={route("dashboard")} icon={LayoutDashboard} label="Dashboard" routeName="dashboard" visible={true} beta={betaMenuItems.includes("dashboard")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      {!isSuperAdmin && (
        <>
          <NavItem href={route("admin.projects.index")} icon={FolderKanban} label="Projects" routeName="admin.projects" visible={isVisible("projects")} beta={betaMenuItems.includes("projects")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          {isAdmin && (
            <>
              <NavItem href={route("admin.users.index")} icon={UsersIcon} label="Employees" routeName="admin.users" visible={isVisible("users")} beta={betaMenuItems.includes("users")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
              <NavItem href={route("admin.departments.index")} icon={Building2} label="Departments" routeName="admin.departments" visible={true} collapsed={collapsed} isMobileOpen={isMobileOpen} />
            </>
          )}
          <NavItem href={route(isAdmin ? "admin.attendance.index" : "attendance.index")} icon={Clock} label="Attendance" routeName={isAdmin ? "admin.attendance" : "attendance"} visible={isVisible("attendance")} beta={betaMenuItems.includes("attendance")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          <NavItem href={route(isAdmin ? "admin.leaves.index" : "leave.index")} icon={FileText} label="Leaves" routeName={isAdmin ? "admin.leaves" : "leave"} visible={isVisible("leaves")} beta={betaMenuItems.includes("leaves")} badge={sidebarCounts.pending_leaves} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          <NavItem href={route("calendar.index")} icon={CalendarDays} label="Calendar" routeName="calendar" visible={isVisible("calendar")} beta={betaMenuItems.includes("calendar")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          <NavItem href={route("content-calendar.index")} icon={Sparkles} label="Content Calendar" routeName="content-calendar" visible={isVisible("content_calendar")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          <NavItem href={route("daily-listings.index")} icon={List} label="Daily Listings" routeName="daily-listings" visible={isVisible("daily_listings")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          <NavItem href={route("designers-worklist.index")} icon={Palette} label="Designers Worklist" routeName="designers-worklist" visible={isVisible("designers_worklist")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          <NavItem href={route("admin.drive.index")} icon={FolderKanban} label="Drive" routeName="admin.drive" visible={!hiddenMenuItems.includes("drive")} beta={false} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          <NavItem href={route("chat.index")} icon={MessageSquare} label="Chat" routeName="chat" visible={isVisible("chat")} beta={betaMenuItems.includes("chat")} badge={sidebarCounts.unread_chats} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          <NavItem href={route("notifications.index")} icon={Bell} label="Notifications" routeName="notifications" visible={true} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          {isAdmin && <NavItem href={route("admin.websites.index")} icon={Globe} label="Websites & Domains" routeName="admin.websites" visible={isVisible("websites") || isVisible("domains")} badge={expiringWebsitesCount} collapsed={collapsed} isMobileOpen={isMobileOpen} />}
          {isAdmin && <NavItem href={route("admin.attendance.report")} icon={BarChart3} label="Reports" routeName="admin.attendance.report" visible={isVisible("reports")} beta={betaMenuItems.includes("attendance")} collapsed={collapsed} isMobileOpen={isMobileOpen} />}
        </>
      )}
      {isAdmin && <NavItem href={route("admin.pricing.index")} icon={CreditCard} label="Pricing" routeName="admin.pricing" visible={true} collapsed={collapsed} isMobileOpen={isMobileOpen} />}
      {isAdmin && <NavItem href={route("admin.settings.index")} icon={SettingsIcon} label="Settings" routeName="admin.settings" visible={true} collapsed={collapsed} isMobileOpen={isMobileOpen} />}
    </>
  );

  return (
    <AppShell title={title} flash={flash} auth={auth} renderNav={renderNav}>
      {children}
    </AppShell>
  );
}
