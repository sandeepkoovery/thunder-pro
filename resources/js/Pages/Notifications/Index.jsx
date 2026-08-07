import React, { useState, useEffect } from 'react';
import { usePage, Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import UserLayout from '@/Layouts/UserLayout';
import { Bell, Clock, MoreVertical, Eye, CheckCircle2, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function NotificationsIndex({ notifications = { data: [], links: [] } }) {
  const { auth } = usePage().props;
  const currentUser = auth.user;

  const notificationsList = Array.isArray(notifications) ? notifications : (notifications?.data || []);
  const paginationLinks = notifications?.links || [];

  const [notificationItems, setNotificationItems] = useState(notificationsList);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    setNotificationItems(Array.isArray(notifications) ? notifications : (notifications?.data || []));
  }, [notifications]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.post(route('notifications.markAsRead', id));
      setNotificationItems(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      toast.success('Notification marked as read');
    } catch (e) {
      console.error(e);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notificationItems.filter(n => !n.is_read);
    if (unread.length === 0) {
      toast.success('All notifications are already read');
      return;
    }

    try {
      await Promise.all(unread.map(n => axios.post(route('notifications.markAsRead', n.id))));
      setNotificationItems(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (e) {
      console.error(e);
      toast.error('Failed to mark some notifications as read');
    }
  };

  // Helper to group notifications into Today, Yesterday, Older
  const groupNotifications = (items) => {
    const todayList = [];
    const yesterdayList = [];
    const olderList = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    items.forEach(item => {
      const dateVal = item.created_at ? new Date(item.created_at) : new Date();
      if (dateVal >= startOfToday) {
        todayList.push(item);
      } else if (dateVal >= startOfYesterday) {
        yesterdayList.push(item);
      } else {
        olderList.push(item);
      }
    });

    return { TODAY: todayList, YESTERDAY: yesterdayList, OLDER: olderList };
  };

  const grouped = groupNotifications(notificationItems);

  const getAvatar = (item) => {
    if (item.sender_avatar) {
      return (
        <img 
          src={item.sender_avatar} 
          alt={item.sender_name || 'User'} 
          className="w-9 h-9 rounded-full object-cover border border-gray-150 shadow-sm"
        />
      );
    }

    if (item.sender_name && item.sender_name !== 'System') {
      const letter = item.sender_name.charAt(0).toUpperCase();
      return (
        <div className="w-9 h-9 rounded-full bg-indigo-500 text-white font-black text-sm flex items-center justify-center shadow-sm uppercase">
          {letter}
        </div>
      );
    }

    return (
      <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shadow-sm">
        <Bell size={16} />
      </div>
    );
  };

  const Layout = ['superadmin', 'admin'].includes(currentUser.role) ? AdminLayout : UserLayout;

  const renderGroup = (title, list) => {
    if (list.length === 0) return null;
    return (
      <div key={title} className="space-y-2">
        <div className="text-[12px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-4 pb-1">{title}</div>
        
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
          {list.map(notif => (
            <div
              key={notif.id}
              className="p-5 flex items-start gap-4 transition-colors relative hover:bg-gray-50/50"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getAvatar(notif)}
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="font-bold text-gray-800 text-[15px] hover:text-[#1e88e5] transition-colors leading-snug">
                  {notif.title}
                </div>
                <p className="text-sm text-gray-400 font-medium mt-0.5 leading-relaxed">{notif.message}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mt-2">
                  <Clock size={14} className="text-gray-300" />
                  <span>{notif.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0 self-center">
                {!notif.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
                )}

                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === notif.id ? null : notif.id);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {activeMenuId === notif.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-150 rounded-xl shadow-lg py-1 z-30 text-left">
                      <Link
                        href={notif.link}
                        onClick={() => {
                          if (!notif.is_read) handleMarkAsRead(notif.id);
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Eye size={12} /> View Details
                      </Link>
                      {!notif.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="flex items-center gap-2 w-full text-left px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <CheckCircle2 size={12} /> Mark Read
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout title="Notifications">
      <Head title="Notifications" />

      <div className="p-4 sm:p-6 w-full space-y-6 font-sans pb-12">
        {/* Header Panel */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Notification Center</div>
            <p className="text-sm text-gray-400 mt-0.5">Manage and track your latest system events and alerts</p>
          </div>
          {notificationItems.some(n => !n.is_read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              style={{ minHeight: '40px' }}
            >
              <CheckCircle2 size={15} />
              Mark all read
            </button>
          )}
        </div>

        {/* Grouped Notifications */}
        <div className="space-y-8">
          {notificationItems.length > 0 ? (
            ['TODAY', 'YESTERDAY', 'OLDER'].map(groupTitle => 
              renderGroup(groupTitle, grouped[groupTitle])
            )
          ) : (
            <div className="py-20 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <Inbox size={28} className="text-gray-300" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">No notifications found</h4>
              <p className="text-xs text-gray-400 max-w-[280px]">Your inbox is currently empty. We will notify you here when you receive new alerts!</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {paginationLinks && paginationLinks.length > 3 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-500">
              Showing <span className="font-bold text-gray-900">{notifications.from || 1}</span> to{' '}
              <span className="font-bold text-gray-900">{notifications.to || notificationItems.length}</span> of{' '}
              <span className="font-bold text-gray-900">{notifications.total || notificationItems.length}</span> notifications
            </div>
            <div className="flex items-center gap-1">
              {paginationLinks.map((link, idx) => {
                const label = link.label.replace('&laquo;', '').replace('&raquo;', '').trim();
                let displayLabel = label;
                if (link.label.includes('&laquo;')) displayLabel = 'Previous';
                if (link.label.includes('&raquo;')) displayLabel = 'Next';

                return link.url ? (
                  <Link
                    key={idx}
                    href={link.url}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      link.active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {displayLabel}
                  </Link>
                ) : (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-300 cursor-not-allowed"
                  >
                    {displayLabel}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
