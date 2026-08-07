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
  Layers,
} from "lucide-react";
import AppShell, { NavItem } from "@/Layouts/AppShell";

export default function AdminLayout({ children, title = "Dashboard" }) {
  const { auth, flash, sharedSettings, expiringWebsitesCount, allowedModules, moduleOrder = {} } = usePage().props;
  const isSuperAdmin = auth?.user?.role === "superadmin";
  const betaMenuItems = isSuperAdmin ? [] : (Array.isArray(sharedSettings?.beta_menu_items) ? sharedSettings.beta_menu_items : []);
  const hiddenMenuItems = Array.isArray(sharedSettings?.hidden_modules) ? sharedSettings.hidden_modules : [];
  const isAdmin = ['admin', 'superadmin', 'manager', 'editor'].includes(auth?.user?.role);

  const isVisible = (module) => {
    if (isSuperAdmin || auth?.user?.role === 'admin') return true;
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
      {
        key: 'dashboard',
        order: getModuleOrder('dashboard', 1),
        element: <NavItem key="dashboard" href={route("dashboard")} icon={LayoutDashboard} label="Dashboard" routeName="dashboard" visible={isVisible("dashboard")} beta={betaMenuItems.includes("dashboard")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'projects',
        order: getModuleOrder('projects', 2),
        element: <NavItem key="projects" href={route("admin.projects.index")} icon={FolderKanban} label="Projects" routeName="admin.projects" visible={isVisible("projects")} beta={betaMenuItems.includes("projects")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'users',
        order: getModuleOrder('users', 3),
        element: <NavItem key="users" href={route("admin.users.index")} icon={UsersIcon} label="Employees" routeName="admin.users" visible={isVisible("users")} beta={betaMenuItems.includes("users")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'departments',
        order: getModuleOrder('departments', 4),
        element: <NavItem key="departments" href={route("admin.departments.index")} icon={Building2} label="Departments" routeName="admin.departments" visible={isVisible("departments")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'attendance',
        order: getModuleOrder('attendance', 5),
        element: <NavItem key="attendance" href={route(isAdmin ? "admin.attendance.index" : "attendance.index")} icon={Clock} label="Attendance" routeName={isAdmin ? "admin.attendance" : "attendance"} visible={isVisible("attendance")} beta={betaMenuItems.includes("attendance")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'leaves',
        order: getModuleOrder('leaves', 6),
        element: <NavItem key="leaves" href={route(isAdmin ? "admin.leaves.index" : "leave.index")} icon={FileText} label="Leaves" routeName={isAdmin ? "admin.leaves" : "leave"} visible={isVisible("leaves")} beta={betaMenuItems.includes("leaves")} badge={sidebarCounts.pending_leaves} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'calendar',
        order: getModuleOrder('calendar', 7),
        element: <NavItem key="calendar" href={route("calendar.index")} icon={CalendarDays} label="Calendar" routeName="calendar" visible={isVisible("calendar")} beta={betaMenuItems.includes("calendar")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'content_calendar',
        order: getModuleOrder('content_calendar', 8),
        element: <NavItem key="content_calendar" href={route("content-calendar.index")} icon={Sparkles} label="Content Calendar" routeName="content-calendar" visible={isVisible("content_calendar")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'daily_listings',
        order: getModuleOrder('daily_listings', 9),
        element: <NavItem key="daily_listings" href={route("daily-listings.index")} icon={List} label="Daily Listings" routeName="daily-listings" visible={isVisible("daily_listings")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'designers_worklist',
        order: getModuleOrder('designers_worklist', 10),
        element: <NavItem key="designers_worklist" href={route("designers-worklist.index")} icon={Palette} label="Designers Worklist" routeName="designers-worklist" visible={isVisible("designers_worklist")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'drive',
        order: getModuleOrder('drive', 11),
        element: <NavItem key="drive" href={route("admin.drive.index")} icon={FolderKanban} label="Drive" routeName="admin.drive" visible={isVisible("drive") && !hiddenMenuItems.includes("drive")} beta={false} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'chat',
        order: getModuleOrder('chat', 12),
        element: <NavItem key="chat" href={route("chat.index")} icon={MessageSquare} label="Chat" routeName="chat" visible={isVisible("chat")} beta={betaMenuItems.includes("chat")} badge={sidebarCounts.unread_chats} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'websites',
        order: getModuleOrder('websites', 13),
        element: <NavItem key="websites" href={route("admin.websites.index")} icon={Globe} label="Websites & Domains" routeName="admin.websites" visible={isVisible("websites") || isVisible("domains")} badge={expiringWebsitesCount} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'reports',
        order: getModuleOrder('reports', 14),
        element: <NavItem key="reports" href={route("admin.attendance.report")} icon={BarChart3} label="Reports" routeName="admin.attendance.report" visible={isVisible("reports")} beta={betaMenuItems.includes("attendance")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'notifications',
        order: getModuleOrder('notifications', 15),
        element: <NavItem key="notifications" href={route("notifications.index")} icon={Bell} label="Notifications" routeName="notifications" visible={isVisible("notifications")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'modules',
        order: getModuleOrder('modules', 16),
        element: <NavItem key="modules" href={route("admin.modules.index")} icon={Layers} label="Modules List" routeName="admin.modules" visible={isVisible("modules")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'pricing',
        order: getModuleOrder('pricing', 17),
        element: <NavItem key="pricing" href={route("admin.pricing.index")} icon={CreditCard} label="Pricing" routeName="admin.pricing" visible={isVisible("pricing")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
      {
        key: 'settings',
        order: getModuleOrder('settings', 18),
        element: <NavItem key="settings" href={route("admin.settings.index")} icon={SettingsIcon} label="Settings" routeName="admin.settings" visible={isVisible("settings")} collapsed={collapsed} isMobileOpen={isMobileOpen} />
      },
    ];

    modulesList.sort((a, b) => a.order - b.order);

    return (
      <>
        {modulesList.map((m) => m.element)}
      </>
    );
  };

  return (
    <AppShell title={title} flash={flash} auth={auth} renderNav={renderNav}>
      {children}
    </AppShell>
  );
}
