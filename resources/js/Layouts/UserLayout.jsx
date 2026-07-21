// resources/js/Layouts/UserLayout.jsx
import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  FileText,
  Clock,
  MessageSquare,
  Bell,
} from "lucide-react";
import AppShell, { NavItem } from "@/Layouts/AppShell";
import BottomNav from "@/Components/BottomNav";

export default function UserLayout({ children, title = "Dashboard" }) {
  const { auth, flash, sharedSettings } = usePage().props;
  const betaMenuItems = Array.isArray(sharedSettings?.beta_menu_items) ? sharedSettings.beta_menu_items : [];
  const hiddenMenuItems = Array.isArray(sharedSettings?.hidden_modules) ? sharedSettings.hidden_modules : [];
  const isSuperAdmin = auth?.user?.role === "superadmin";

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
      <NavItem href={route("dashboard")} icon={LayoutDashboard} label="Dashboard" routeName="dashboard" visible={isVisible("dashboard")} beta={betaMenuItems.includes("dashboard")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      <NavItem href={route("attendance.index")} icon={Clock} label="Attendance" routeName="attendance" visible={isVisible("attendance")} beta={betaMenuItems.includes("attendance")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      <NavItem href={route("projects.index")} icon={FolderKanban} label="Projects" routeName="projects" visible={isVisible("projects")} beta={betaMenuItems.includes("projects")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      <NavItem href={route("leave.index")} icon={FileText} label="Leaves" routeName="leave" visible={isVisible("leaves")} beta={betaMenuItems.includes("leaves")} badge={sidebarCounts.pending_leaves} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      <NavItem href={route("calendar.index")} icon={CalendarDays} label="Calendar" routeName="calendar" visible={isVisible("calendar")} beta={betaMenuItems.includes("calendar")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      <NavItem href={route("drive.index")} icon={FolderKanban} label="Drive" routeName="drive" visible={isVisible("drive")} beta={betaMenuItems.includes("drive")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      <NavItem href={route("chat.index")} icon={MessageSquare} label="Chat" routeName="chat" visible={isVisible("chat")} beta={betaMenuItems.includes("chat")} badge={sidebarCounts.unread_chats} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      <NavItem href={route("notifications.index")} icon={Bell} label="Notifications" routeName="notifications" visible={true} collapsed={collapsed} isMobileOpen={isMobileOpen} />
    </>
  );

  return (
    <AppShell
      title={title}
      flash={flash}
      auth={auth}
      renderNav={renderNav}
      bottomNav={<BottomNav sidebarCounts={sidebarCounts} />}
    >
      {children}
    </AppShell>
  );
}
