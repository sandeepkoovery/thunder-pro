import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { Bell, MessageSquare, FileText, Circle } from 'lucide-react';
import axios from 'axios';

export default function NotificationDropdown({ variant = 'topbar' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const isTopbar = variant === 'topbar';

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(route('notifications'));
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'chat': return <MessageSquare size={18} className="text-primary" />;
            case 'leave':
            case 'leave_update': return <FileText size={18} className="text-mp-purple" />;
            default: return <Bell size={18} className="text-mp-body" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={isTopbar ? 'mp-notif-btn' : 'relative p-2 text-mp-body hover:text-primary hover:bg-blue-50 rounded-full transition-all focus:outline-none'}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className={isTopbar ? 'mp-notif-badge' : 'absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-mp-danger text-[10px] font-bold text-white border-2 border-white'}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={isTopbar ? 'mp-notif-panel' : 'absolute right-0 mt-3 w-80 bg-white rounded-mp shadow-mp overflow-hidden z-[100]'}>
                    <div className="p-4 border-b bg-mp-bg/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-mp-heading">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-blue-100 text-primary px-2 py-0.5 rounded-full text-[10px] font-medium">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>
                        <button className="text-xs text-primary hover:underline font-medium">Clear All</button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <Link
                                    key={notif.id}
                                    href={notif.link}
                                    onClick={async () => {
                                        setIsOpen(false);
                                        try {
                                            await axios.post(route('notifications.markAsRead', notif.id));
                                            setNotifications(prev => prev.filter(n => n.id !== notif.id));
                                            setUnreadCount(prev => Math.max(0, prev - 1));
                                        } catch (e) {
                                            console.error("Error marking as read:", e);
                                        }
                                    }}
                                    className="flex items-start gap-3 p-4 hover:bg-mp-bg border-b border-gray-50 transition-colors group"
                                >
                                    <div className="mt-1 w-10 h-10 rounded-mp-sm bg-mp-bg flex items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <p className="text-sm font-medium text-mp-heading truncate">
                                                {notif.title}
                                            </p>
                                            <Circle className="text-primary mt-1 fill-primary" size={8} />
                                        </div>
                                        <p className="text-xs text-mp-body line-clamp-2 mb-1 leading-relaxed">
                                            {notif.message}
                                        </p>
                                        <span className="text-[10px] text-mp-muted font-medium">
                                            {notif.time}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-mp-muted text-center px-6">
                                <div className="w-16 h-16 bg-mp-bg rounded-full flex items-center justify-center mb-4">
                                    <Bell size={24} className="text-mp-muted" />
                                </div>
                                <p className="text-sm font-medium text-mp-heading mb-1">No new notifications</p>
                                <p className="text-xs">We'll notify you when something new arrives!</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t bg-mp-bg/50 text-center">
                        <Link href={route('notifications.index')} onClick={() => setIsOpen(false)} className="text-xs font-medium text-primary hover:underline">
                            See All Notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
