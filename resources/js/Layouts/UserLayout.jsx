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
  Sparkles,
  List,
  Palette,
} from "lucide-react";
import AppShell, { NavItem } from "@/Layouts/AppShell";
import BottomNav from "@/Components/BottomNav";

export default function UserLayout({ children, title = "Dashboard" }) {
  const { auth, flash, sharedSettings, allowedModules, moduleOrder = {} } = usePage().props;
  const betaMenuItems = Array.isArray(sharedSettings?.beta_menu_items) ? sharedSettings.beta_menu_items : [];
  const hiddenMenuItems = Array.isArray(sharedSettings?.hidden_modules) ? sharedSettings.hidden_modules : [];
  const isSuperAdmin = auth?.user?.role === "superadmin";

  const user = auth?.user;
  const userRole = user?.role?.toLowerCase() || '';
  const userDesignation = user?.designation?.toLowerCase() || '';
  const isDesigner = isSuperAdmin || ['admin', 'designer', 'editor', 'manager'].includes(userRole) || userDesignation.includes('design') || userDesignation.includes('edit');

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

  const getModuleOrder = (key, defaultVal) => {
    if (moduleOrder && moduleOrder[key] !== undefined) return Number(moduleOrder[key]);
    return defaultVal;
  };

  const renderNav = ({ collapsed, isMobileOpen }) => {
    const modulesList = [
      { key: 'attendance', order: getModuleOrder('attendance', 3), element: <NavItem key="attendance" href={route("attendance.index")} icon={Clock} label="Attendance" routeName="attendance" visible={isVisible("attendance")} beta={betaMenuItems.includes("attendance")} collapsed={collapsed} isMobileOpen={isMobileOpen} /> },
      { key: 'projects', order: getModuleOrder('projects', 1), element: <NavItem key="projects" href={route("projects.index")} icon={FolderKanban} label="Projects" routeName="projects" visible={isVisible("projects")} beta={betaMenuItems.includes("projects")} collapsed={collapsed} isMobileOpen={isMobileOpen} /> },
      { key: 'leaves', order: getModuleOrder('leaves', 4), element: <NavItem key="leave" href={route("leave.index")} icon={FileText} label="Leaves" routeName="leave" visible={isVisible("leaves")} beta={betaMenuItems.includes("leaves")} badge={sidebarCounts.pending_leaves} collapsed={collapsed} isMobileOpen={isMobileOpen} /> },
      { key: 'calendar', order: getModuleOrder('calendar', 5), element: <NavItem key="calendar" href={route("calendar.index")} icon={CalendarDays} label="Calendar" routeName="calendar" visible={isVisible("calendar")} beta={betaMenuItems.includes("calendar")} collapsed={collapsed} isMobileOpen={isMobileOpen} /> },
      { key: 'content_calendar', order: getModuleOrder('content_calendar', 6), element: <NavItem key="content_calendar" href={route("content-calendar.index")} icon={Sparkles} label="Content Calendar" routeName="content-calendar" visible={isVisible("content_calendar")} collapsed={collapsed} isMobileOpen={isMobileOpen} /> },
      { key: 'daily_listings', order: getModuleOrder('daily_listings', 7), element: <NavItem key="daily_listings" href={route("daily-listings.index")} icon={List} label="Daily Listings" routeName="daily-listings" visible={isVisible("daily_listings")} collapsed={collapsed} isMobileOpen={isMobileOpen} /> },
      { key: 'designers_worklist', order: getModuleOrder('designers_worklist', 8), element: <NavItem key="designers_worklist" href={route("designers-worklist.index")} icon={Palette} label="Designers Worklist" routeName="designers-worklist" visible={isDesigner && isVisible("designers_worklist")} collapsed={collapsed} isMobileOpen={isMobileOpen} /> },
      { key: 'drive', order: getModuleOrder('drive', 9), element: <NavItem key="drive" href={route("drive.index")} icon={FolderKanban} label="Drive" routeName="drive" visible={!hiddenMenuItems.includes("drive")} beta={false} collapsed={collapsed} isMobileOpen={isMobileOpen} /> },
      { key: 'chat', order: getModuleOrder('chat', 10), element: <NavItem key="chat" href={route("chat.index")} icon={MessageSquare} label="Chat" routeName="chat" visible={isVisible("chat")} beta={betaMenuItems.includes("chat")} badge={sidebarCounts.unread_chats} collapsed={collapsed} isMobileOpen={isMobileOpen} /> },
    ];

    modulesList.sort((a, b) => a.order - b.order);

    return (
      <>
        <NavItem href={route("dashboard")} icon={LayoutDashboard} label="Dashboard" routeName="dashboard" visible={true} beta={betaMenuItems.includes("dashboard")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
        {modulesList.map((m) => m.element)}
        <NavItem href={route("notifications.index")} icon={Bell} label="Notifications" routeName="notifications" visible={true} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      </>
    );
  };

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
