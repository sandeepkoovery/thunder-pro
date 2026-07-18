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
} from "lucide-react";
import AppShell, { NavItem } from "@/Layouts/AppShell";

export default function AdminLayout({ children, title = "Dashboard" }) {
  const { auth, flash, sharedSettings, expiringWebsitesCount } = usePage().props;
  const betaMenuItems = Array.isArray(sharedSettings?.beta_menu_items) ? sharedSettings.beta_menu_items : [];
  const hiddenMenuItems = Array.isArray(sharedSettings?.hidden_modules) ? sharedSettings.hidden_modules : [];
  const isSuperAdmin = auth?.user?.role === "superadmin";
  const isAdmin = auth?.user?.role === "admin" || isSuperAdmin;

  const isVisible = (module) => isSuperAdmin || !hiddenMenuItems.includes(module);
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
              <NavItem href={route("admin.leaves.index")} icon={FileText} label="Leaves" routeName="admin.leaves" visible={isVisible("leaves")} beta={betaMenuItems.includes("leaves")} badge={sidebarCounts.pending_leaves} collapsed={collapsed} isMobileOpen={isMobileOpen} />
              <NavItem href={route("admin.attendance.index")} icon={Clock} label="Attendance" routeName="admin.attendance" visible={isVisible("attendance")} beta={betaMenuItems.includes("attendance")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
            </>
          )}
          <NavItem href={route("calendar.index")} icon={CalendarDays} label="Calendar" routeName="calendar" visible={isVisible("calendar")} beta={betaMenuItems.includes("calendar")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          <NavItem href={route("admin.drive.index")} icon={FolderKanban} label="Drive" routeName="admin.drive" visible={isVisible("drive")} beta={betaMenuItems.includes("drive")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          <NavItem href={route("chat.index")} icon={MessageSquare} label="Chat" routeName="chat" visible={isVisible("chat")} beta={betaMenuItems.includes("chat")} badge={sidebarCounts.unread_chats} collapsed={collapsed} isMobileOpen={isMobileOpen} />
          {isAdmin && <NavItem href={route("admin.websites.index")} icon={Globe} label="Websites" routeName="admin.websites" visible={isVisible("websites")} badge={expiringWebsitesCount} collapsed={collapsed} isMobileOpen={isMobileOpen} />}
        </>
      )}
      {isAdmin && <NavItem href={route("admin.settings.index")} icon={SettingsIcon} label="Settings" routeName="admin.settings" visible={true} collapsed={collapsed} isMobileOpen={isMobileOpen} />}
    </>
  );

  return (
    <AppShell title={title} flash={flash} auth={auth} renderNav={renderNav}>
      {children}
    </AppShell>
  );
}
