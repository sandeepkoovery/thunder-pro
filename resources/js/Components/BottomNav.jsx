// resources/js/Components/BottomNav.jsx
import React from "react";
import { Link } from "@inertiajs/react";
import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  FileText,
  MessageSquare,
} from "lucide-react";

export default function BottomNav({ sidebarCounts = {} }) {
  const items = [
    {
      href: route("dashboard"),
      icon: LayoutDashboard,
      label: "Home",
      routeName: "dashboard",
    },
    {
      href: route("attendance.index"),
      icon: Clock,
      label: "Attend.",
      routeName: "attendance",
    },
    {
      href: route("projects.index"),
      icon: FolderKanban,
      label: "Projects",
      routeName: "projects",
    },
    {
      href: route("leave.index"),
      icon: FileText,
      label: "Leaves",
      routeName: "leave",
      badge: sidebarCounts.pending_leaves,
    },
    {
      href: route("chat.index"),
      icon: MessageSquare,
      label: "Chat",
      routeName: "chat",
      badge: sidebarCounts.unread_chats,
    },
  ];

  return (
    <nav className="mp-bottom-nav">
      <div className="mp-bottom-nav-inner">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            route().current(item.routeName) ||
            route().current(item.routeName + ".*");
          return (
            <Link
              key={item.routeName}
              href={item.href}
              className={`mp-bottom-nav-item${isActive ? " active" : ""}`}
            >
              <span className="mp-bottom-nav-icon">
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                {item.badge > 0 && (
                  <span className="mp-bottom-nav-badge">{item.badge}</span>
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
