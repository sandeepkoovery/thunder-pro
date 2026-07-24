import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AdminLayout from '@/Layouts/AdminLayout';
import UserLayout from '@/Layouts/UserLayout';
import { X, ChevronLeft, ChevronRight, Plus, MapPin, Link as LinkIcon, User, Users, CalendarDays, FileText } from "lucide-react";
import { ChevronDownIcon } from '@heroicons/react/24/solid';

const localizer = momentLocalizer(moment);

// Interactive Mini Calendar Widget
const MiniCalendar = ({ value, onChange }) => {
    const [viewDate, setViewDate] = useState(new Date(value.getFullYear(), value.getMonth(), 1));

    useEffect(() => {
        setViewDate(new Date(value.getFullYear(), value.getMonth(), 1));
    }, [value]);

    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Days grid
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDaysInMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Fill previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        days.push({
            date: new Date(year, month - 1, prevDaysInMonth - i),
            isCurrentMonth: false,
        });
    }

    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({
            date: new Date(year, month, i),
            isCurrentMonth: true,
        });
    }

    // Fill next month days
    const totalDays = 42; // 6 rows of 7 days
    const nextDaysCount = totalDays - days.length;
    for (let i = 1; i <= nextDaysCount; i++) {
        days.push({
            date: new Date(year, month + 1, i),
            isCurrentMonth: false,
        });
    }

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    return (
        <div className="w-full text-xs font-sans text-gray-700 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-700">{monthLabel}</span>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-md transition text-gray-500">
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-md transition text-gray-500">
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-y-1 text-center font-medium text-gray-400 mb-1.5">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, index) => (
                    <div key={index} className="w-6 h-6 flex items-center justify-center m-auto">{d}</div>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
                {days.map((dayObj, index) => {
                    const isSelected = isSameDay(dayObj.date, value);
                    const isToday = isSameDay(dayObj.date, new Date());

                    return (
                        <button
                            key={index}
                            onClick={() => onChange(dayObj.date)}
                            className={`w-6 h-6 flex items-center justify-center m-auto rounded-full text-[11px] transition-all
                                ${isSelected ? 'bg-primary-theme text-white font-semibold shadow-sm' : ''}
                                ${!isSelected && isToday ? 'border border-primary-theme text-primary-theme font-medium' : ''}
                                ${!isSelected && !isToday && dayObj.isCurrentMonth ? 'text-gray-700 hover:bg-gray-100' : ''}
                                ${!isSelected && !isToday && !dayObj.isCurrentMonth ? 'text-gray-300 hover:bg-gray-50' : ''}
                            `}
                            style={isSelected ? { backgroundColor: 'var(--theme-primary)' } : isToday ? { borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' } : {}}
                        >
                            {dayObj.date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// Custom Toolbar Component
const CustomToolbar = (toolbar) => {
    const goToBack = () => {
        toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
        toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
        toolbar.onNavigate('TODAY');
    };

    const label = () => {
        const date = moment(toolbar.date);
        return (
            <span className="text-xl font-bold text-gray-700">
                {date.format('MMMM YYYY')}
            </span>
        );
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-gray-100">
            {/* Left Navigations */}
            <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <button
                        onClick={goToBack}
                        className="p-2 text-gray-500 hover:bg-gray-50 transition border-r border-gray-200"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="p-2 text-gray-500 hover:bg-gray-50 transition"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                {label()}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={goToCurrent}
                    className="px-4 py-1.5 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg text-xs transition shadow-sm"
                >
                    Today
                </button>
                <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200/50 shadow-inner">
                    {['month', 'week', 'day'].map((v) => {
                        const isActive = toolbar.view === v;
                        return (
                            <button
                                key={v}
                                onClick={() => toolbar.onView(v)}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all duration-150
                                    ${isActive
                                        ? 'bg-[var(--theme-primary)] text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                            >
                                {v}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default function Index({ events: initialEvents, users }) {
    const { auth } = usePage().props;
    const isUserRole = auth.user.role === 'user';

    const [isOpen, setIsOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Sync views via state
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDefaultCategory = () => {
        const role = auth.user.role;
        if (['admin', 'superadmin', 'editor'].includes(role)) return 'holiday';
        if (role === 'manager') return 'meeting';
        return 'personal';
    };

    // Event filters categories state
    const [selectedCategories, setSelectedCategories] = useState(['holiday', 'leave', 'meeting', 'training', 'project', 'personal', 'company_event']);

    // Filter out superadmin and admin roles from the guests selection
    const guestUsers = useMemo(() => {
        return (users || []).filter(u => u.role !== 'admin' && u.role !== 'superadmin');
    }, [users]);

    // Dropdown state
    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [form, setForm] = useState({
        title: '',
        category: getDefaultCategory(),
        start_date: '',
        end_date: '',
        all_day: false,
        description: '',
        location: '',
        event_url: '',
        guest_ids: []
    });

    const [errors, setErrors] = useState({});

    const categoryColors = {
        holiday: 'bg-green-500',
        leave: 'bg-amber-500',
        meeting: 'bg-blue-500',
        training: 'bg-purple-500',
        project: 'bg-indigo-500',
        personal: 'bg-red-500',
        company_event: 'bg-teal-500'
    };

    // Handle click outside dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsAssigneeDropdownOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const events = useMemo(() => {
        return (initialEvents || []).map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
        }));
    }, [initialEvents]);

    // Filter events based on selected categories
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const category = event.resource?.category || 'personal';
            return selectedCategories.includes(category);
        });
    }, [events, selectedCategories]);

    const handleSelectSlot = ({ start, end }) => {
        setSelectedSlot({ start, end });
        setForm({
            title: '',
            category: getDefaultCategory(),
            start_date: moment(start).format('YYYY-MM-DD 12:00'),
            end_date: moment(end).format('YYYY-MM-DD 12:00'),
            all_day: false,
            description: '',
            location: '',
            event_url: '',
            guest_ids: [],
        });
        setSelectedEvent(null);
        setIsEditing(false);
        setErrors({});
        setIsOpen(true);
        setIsAssigneeDropdownOpen(false);
    };

    const handleAddEventClick = () => {
        setSelectedSlot(null);
        setForm({
            title: '',
            category: getDefaultCategory(),
            start_date: moment(currentDate).format('YYYY-MM-DD 12:00'),
            end_date: moment(currentDate).format('YYYY-MM-DD 12:00'),
            all_day: false,
            description: '',
            location: '',
            event_url: '',
            guest_ids: [],
        });
        setSelectedEvent(null);
        setIsEditing(false);
        setErrors({});
        setIsOpen(true);
        setIsAssigneeDropdownOpen(false);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setIsEditing(false);
        setIsOpen(true);
        setIsAssigneeDropdownOpen(false);
    };

    const handleEditClick = () => {
        if (!selectedEvent) return;

        const event = selectedEvent.resource;

        setForm({
            title: event.title || '',
            category: event.category || 'personal',
            start_date: event.start_date ? moment(event.start_date).format('YYYY-MM-DD HH:mm') : moment(selectedEvent.start).format('YYYY-MM-DD HH:mm'),
            end_date: event.end_date ? moment(event.end_date).format('YYYY-MM-DD HH:mm') : moment(selectedEvent.end).format('YYYY-MM-DD HH:mm'),
            all_day: event.all_day || false,
            description: event.description || '',
            location: event.location || '',
            event_url: event.event_url || '',
            guest_ids: event.guest_ids ? event.guest_ids.map(id => String(id)) : [],
        });

        setIsEditing(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setSelectedSlot(null);
        setSelectedEvent(null);
        setIsEditing(false);
        setIsAssigneeDropdownOpen(false);
        setIsCategoryDropdownOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Format dates correctly back to backend before sending
        const payload = {
            ...form,
            start_date: moment(form.start_date, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DDTHH:mm']).format('YYYY-MM-DD HH:mm:ss'),
            end_date: moment(form.end_date, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DDTHH:mm']).format('YYYY-MM-DD HH:mm:ss'),
        };

        if (isEditing && selectedEvent) {
            router.post(route('calendar.events.update', selectedEvent.id), {
                _method: 'PUT',
                ...payload
            }, {
                onSuccess: () => closeModal(),
                onError: (err) => setErrors(err),
            });
        } else {
            router.post(route('calendar.events.store'), payload, {
                onSuccess: () => closeModal(),
                onError: (err) => setErrors(err),
            });
        }
    };

    const handleDelete = () => {
        if (!selectedEvent) return;
        router.delete(route('calendar.events.destroy', selectedEvent.id), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    const toggleAssigneeDropdown = () => {
        setIsAssigneeDropdownOpen(prev => !prev);
    };

    const handleAssigneeChange = (userId, checked) => {
        setForm((prev) => {
            const guestIds = prev.guest_ids.map(id => String(id));
            const newGuestIds = checked
                ? [...guestIds, String(userId)]
                : guestIds.filter((id) => id !== String(userId));
            return { ...prev, guest_ids: newGuestIds };
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const getSelectedAssigneeNames = () => {
        const selectedUsers = guestUsers?.filter(u => form.guest_ids.map(id => String(id)).includes(String(u.id)));
        if (!selectedUsers || selectedUsers.length === 0) {
            return "Select value";
        }

        const names = selectedUsers.map(u => u.name);

        if (names.length > 2) {
            return `${names[0]}, ${names[1]} (+${names.length - 2} more)`;
        }
        return names.join(', ');
    };

    const getAvatarUrl = (user) => {
        const basePath = import.meta.env.VITE_BASE_URL || '';
        if (user?.image) {
            return user.image.startsWith("http")
                ? user.image
                : `${basePath}/storage/${user.image}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=random&color=fff`;
    };

    const eventStyleGetter = (event) => {
        const category = event.resource?.category || 'personal';
        
        let backgroundColor = 'rgba(239, 83, 80, 0.12)';
        let color = '#c62828';
        let borderLeft = '3px solid #e53935';

        // Categorize based on tag mapping
        if (category === 'holiday') {
            backgroundColor = 'rgba(76, 175, 80, 0.12)';
            color = '#2e7d32';
            borderLeft = '3px solid #4caf50';
        } else if (category === 'leave') {
            backgroundColor = 'rgba(255, 193, 7, 0.12)';
            color = '#b78103';
            borderLeft = '3px solid #ffc107';
        } else if (category === 'meeting') {
            backgroundColor = 'rgba(33, 150, 243, 0.12)';
            color = '#1565c0';
            borderLeft = '3px solid #2196f3';
        } else if (category === 'training') {
            backgroundColor = 'rgba(156, 39, 176, 0.12)';
            color = '#6a1b9a';
            borderLeft = '3px solid #9c27b0';
        } else if (category === 'project') {
            backgroundColor = 'rgba(63, 81, 181, 0.12)';
            color = '#283593';
            borderLeft = '3px solid #3f51b5';
        } else if (category === 'company_event') {
            backgroundColor = 'rgba(0, 150, 136, 0.12)';
            color = '#00695c';
            borderLeft = '3px solid #009688';
        } else {
            // Default personal reminder
            backgroundColor = 'rgba(239, 83, 80, 0.12)';
            color = '#c62828';
            borderLeft = '3px solid #e53935';
        }

        return {
            style: {
                backgroundColor: backgroundColor,
                color: color,
                borderLeft: borderLeft,
                borderRadius: '4px',
                opacity: 0.9,
                borderTop: '0px',
                borderRight: '0px',
                borderBottom: '0px',
                display: 'block',
                padding: '4px 8px',
                fontSize: '13px',
                fontWeight: '500',
            }
        };
    };

    const handleToggleCategory = (category) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleToggleAll = (e) => {
        if (e.target.checked) {
            setSelectedCategories(['holiday', 'leave', 'meeting', 'training', 'project', 'personal', 'company_event']);
        } else {
            setSelectedCategories([]);
        }
    };

    const getFormattedDateRange = () => {
        if (!selectedEvent) return "";
        const start = moment(selectedEvent.start);
        const end = moment(selectedEvent.end);
        
        if (selectedEvent.allDay) {
            if (start.isSame(end, 'day')) {
                return start.format('MMMM Do YYYY');
            }
            return `${start.format('MMMM Do YYYY')} - ${end.format('MMMM Do YYYY')}`;
        } else {
            if (start.isSame(end, 'day')) {
                return `${start.format('MMMM Do YYYY')}, ${start.format('h:mm a')} - ${end.format('h:mm a')}`;
            }
            return `${start.format('MMMM Do YYYY, h:mm a')} - ${end.format('MMMM Do YYYY, h:mm a')}`;
        }
    };

    const getCategoryBadge = (category) => {
        const badges = {
            holiday: 'bg-green-50 text-green-600 border-green-200',
            leave: 'bg-amber-50 text-amber-600 border-amber-200',
            meeting: 'bg-blue-50 text-blue-600 border-blue-200',
            training: 'bg-purple-50 text-purple-600 border-purple-200',
            project: 'bg-indigo-50 text-indigo-600 border-indigo-200',
            personal: 'bg-red-50 text-red-600 border-red-200',
            company_event: 'bg-teal-50 text-teal-600 border-teal-200',
        };
        const labels = {
            holiday: 'Holidays',
            leave: 'Leave',
            meeting: 'Meetings',
            training: 'Training',
            project: 'Projects',
            personal: 'Personal Reminders',
            company_event: 'Company Event',
        };
        return (
            <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md border ${badges[category] || badges.personal}`}>
                {labels[category] || category}
            </span>
        );
    };

    const getGuestChips = () => {
        if (!selectedEvent) return null;
        const guestIds = selectedEvent.resource.guest_ids || [];
        if (guestIds.length === 0) return <p className="text-gray-400 italic text-[13px]">No guests invited</p>;
        
        const selectedGuestUsers = guestUsers.filter(u => guestIds.map(id => String(id)).includes(String(u.id)));
        
        return (
            <div className="flex flex-wrap gap-2 mt-1">
                {selectedGuestUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full py-0.5 pr-3 pl-1.5 shadow-sm">
                        <img
                            src={getAvatarUrl(user)}
                            alt={user.name}
                            className="w-5 h-5 rounded-full object-cover border border-gray-100"
                        />
                        <span className="text-xs font-medium text-gray-700">{user.name}</span>
                    </div>
                ))}
            </div>
        );
    };

    // Custom components for the calendar
    const components = useMemo(() => ({
        toolbar: CustomToolbar,
    }), []);

    // Check if the user has permission to edit/delete the event
    const canManageEvent = (eventObj) => {
        if (!eventObj) return false;
        return !isUserRole || eventObj.resource.user_id === auth.user.id;
    };

    return (
        <>
            <Head title="Task Calendar" />

            <div className="flex flex-col lg:flex-row bg-white rounded-3xl shadow-sm overflow-hidden min-h-[850px] border border-gray-100 font-sans">
                {/* Left Sidebar */}
                <div className="w-full lg:w-[280px] border-r border-gray-100 p-5 flex flex-col gap-6 flex-shrink-0 bg-gray-50/50">
                    {/* Add Event Button */}
                    <button
                        onClick={handleAddEventClick}
                        className="w-full py-2.5 px-4 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-dark)] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-sm transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-4.5 h-4.5" /> Add Event
                    </button>

                    {/* Mini Calendar widget */}
                    <MiniCalendar value={currentDate} onChange={setCurrentDate} />

                    {/* Event Filters */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            Event Filters
                        </h4>
                        <div className="flex flex-col gap-2.5">
                            {/* View All */}
                            <label className="flex items-center gap-3 cursor-pointer text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.length === 7}
                                    onChange={handleToggleAll}
                                    className="rounded border-gray-300 text-[var(--theme-primary)] focus:ring-[var(--theme-primary)] w-4 h-4 cursor-pointer"
                                />
                                View All
                            </label>

                            {/* Holidays */}
                            <label className="flex items-center gap-3 cursor-pointer text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes('holiday')}
                                    onChange={() => handleToggleCategory('holiday')}
                                    className="rounded border-gray-300 text-green-500 focus:ring-green-500 w-4 h-4 cursor-pointer"
                                />
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                Holidays
                            </label>

                            {/* Leave */}
                            <label className="flex items-center gap-3 cursor-pointer text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes('leave')}
                                    onChange={() => handleToggleCategory('leave')}
                                    className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                                />
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                Leave
                            </label>

                            {/* Meetings */}
                            <label className="flex items-center gap-3 cursor-pointer text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes('meeting')}
                                    onChange={() => handleToggleCategory('meeting')}
                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                />
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                Meetings
                            </label>

                            {/* Training */}
                            <label className="flex items-center gap-3 cursor-pointer text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes('training')}
                                    onChange={() => handleToggleCategory('training')}
                                    className="rounded border-gray-300 text-purple-500 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                                />
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                Training
                            </label>

                            {/* Projects */}
                            <label className="flex items-center gap-3 cursor-pointer text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes('project')}
                                    onChange={() => handleToggleCategory('project')}
                                    className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                />
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                                Projects
                            </label>

                            {/* Personal Reminders */}
                            <label className="flex items-center gap-3 cursor-pointer text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes('personal')}
                                    onChange={() => handleToggleCategory('personal')}
                                    className="rounded border-gray-300 text-red-500 focus:ring-red-500 w-4 h-4 cursor-pointer"
                                />
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                Personal Reminders
                            </label>

                            {/* Company Events */}
                            <label className="flex items-center gap-3 cursor-pointer text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes('company_event')}
                                    onChange={() => handleToggleCategory('company_event')}
                                    className="rounded border-gray-300 text-teal-500 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                                />
                                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                                Company Events
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Calendar Panel */}
                <div className="flex-1 p-6 h-[850px] overflow-hidden flex flex-col">
                    <Calendar
                        localizer={localizer}
                        events={filteredEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        date={currentDate}
                        onNavigate={(date) => setCurrentDate(date)}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        selectable={true}
                        eventPropGetter={eventStyleGetter}
                        components={components}
                        views={['month', 'week', 'day']}
                        className="font-sans flex-1"
                    />
                </div>
            </div>

            {/* Modal Dialog */}
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in">
                    <div className="absolute inset-0" onClick={closeModal}></div>
                    
                    <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl flex flex-col p-8 sm:p-10 z-10 font-sans text-sm outline-none overflow-hidden max-h-[90vh]">
                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition p-1.5 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Centered Header */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                                {isEditing ? "Edit Event Details" : (selectedEvent ? "Event Details" : "Create New Event")}
                            </h2>
                            <p className="text-sm text-gray-500 mt-2 font-medium">
                                {isEditing 
                                    ? "Updating event details will sync with all invited guests." 
                                    : (selectedEvent ? "View complete scheduled details for this calendar entry." : "Fill out the fields below to schedule a new event.")
                                }
                            </p>
                        </div>

                        {/* Body content */}
                        <div className="flex-1 overflow-y-auto pr-1">
                            {selectedEvent && !isEditing ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{selectedEvent.title}</h3>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <User className="w-3.5 h-3.5" /> Created by: {selectedEvent.resource.creator}
                                            </p>
                                        </div>
                                        {getCategoryBadge(selectedEvent.resource.category)}
                                    </div>

                                    <div className="space-y-3.5 border-t border-b border-gray-100 py-4">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <CalendarDays className="w-4.5 h-4.5 text-gray-400 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-gray-800">Date & Time</p>
                                                <p className="text-gray-500 mt-0.5">{getFormattedDateRange()}</p>
                                            </div>
                                        </div>

                                        {selectedEvent.resource.location && (
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <MapPin className="w-4.5 h-4.5 text-gray-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-800">Location</p>
                                                    <p className="text-gray-500 mt-0.5">{selectedEvent.resource.location}</p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedEvent.resource.event_url && (
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <LinkIcon className="w-4.5 h-4.5 text-gray-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-800">Event Link</p>
                                                    <a
                                                        href={selectedEvent.resource.event_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline mt-0.5 block"
                                                    >
                                                        {selectedEvent.resource.event_url}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                                            <Users className="w-4 h-4 text-gray-500" /> Invited Guests
                                        </h4>
                                        {getGuestChips()}
                                    </div>

                                    {selectedEvent.resource.description && (
                                        <div>
                                            <h4 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5 mb-1.5">
                                                <FileText className="w-4 h-4 text-gray-500" /> Description
                                            </h4>
                                            <p className="text-gray-600 text-[13px] leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                {selectedEvent.resource.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} id="eventForm" className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 py-1">
                                    {/* Title */}
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-600 font-semibold mb-1.5 text-[13px]">Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={form.title}
                                            onChange={handleChange}
                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm text-gray-800"
                                            placeholder="Event Title"
                                            required
                                        />
                                        {errors.title && (
                                            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                                        )}
                                    </div>

                                    {/* Label (Category with Colored Dot indicator) */}
                                    <div>
                                        <label className="block text-gray-600 font-semibold mb-1.5 text-[13px]">Label</label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                                                className="w-full flex items-center bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-left focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm text-gray-800"
                                            >
                                                <span className={`w-2.5 h-2.5 rounded-full mr-2.5 ${categoryColors[form.category] || 'bg-red-500'}`}></span>
                                                <span className="capitalize">{form.category?.replace('_', ' ')}</span>
                                                <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </button>

                                            {isCategoryDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-[155]" onClick={() => setIsCategoryDropdownOpen(false)}></div>
                                                    <div className="absolute z-[160] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 max-h-60 overflow-y-auto">
                                                        {Object.keys(categoryColors).map((cat) => {
                                                            let isAllowed = false;
                                                            if (['admin', 'superadmin', 'editor'].includes(auth.user.role)) {
                                                                isAllowed = true;
                                                            } else if (auth.user.role === 'manager' && ['meeting', 'project', 'personal'].includes(cat)) {
                                                                isAllowed = true;
                                                            } else if (auth.user.role === 'user' && cat === 'personal') {
                                                                isAllowed = true;
                                                            }

                                                            if (!isAllowed) return null;

                                                            return (
                                                                <button
                                                                    key={cat}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setForm(prev => ({ ...prev, category: cat }));
                                                                        setIsCategoryDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center px-4 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                                                                        form.category === cat 
                                                                            ? 'bg-blue-50/50 text-blue-600 font-semibold' 
                                                                            : 'text-gray-700 font-medium'
                                                                    }`}
                                                                >
                                                                    <span className={`w-2 h-2 rounded-full mr-2.5 ${categoryColors[cat]}`}></span>
                                                                    <span className="capitalize">{cat.replace('_', ' ')}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* All Day Event switch */}
                                    <div className="flex items-center gap-3.5 py-1 px-1 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, all_day: !prev.all_day }))}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.all_day ? 'bg-blue-500' : 'bg-gray-200'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.all_day ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                        <span className="text-[13px] font-semibold text-gray-700 select-none">All Day Event</span>
                                    </div>

                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-gray-600 font-semibold mb-1.5 text-[13px]">Start Date</label>
                                        <input
                                            type={form.all_day ? "date" : "datetime-local"}
                                            name="start_date"
                                            value={form.start_date}
                                            onChange={handleChange}
                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm text-gray-800"
                                            required
                                        />
                                        {errors.start_date && (
                                            <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
                                        )}
                                    </div>

                                    {/* End Date */}
                                    <div>
                                        <label className="block text-gray-600 font-semibold mb-1.5 text-[13px]">End Date</label>
                                        <input
                                            type={form.all_day ? "date" : "datetime-local"}
                                            name="end_date"
                                            value={form.end_date}
                                            onChange={handleChange}
                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm text-gray-800"
                                            required
                                        />
                                        {errors.end_date && (
                                            <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
                                        )}
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label className="block text-gray-600 font-semibold mb-1.5 text-[13px]">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={form.location}
                                            onChange={handleChange}
                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm text-gray-800"
                                            placeholder="Enter Location"
                                        />
                                    </div>

                                    {/* Event URL */}
                                    <div>
                                        <label className="block text-gray-600 font-semibold mb-1.5 text-[13px]">Event URL</label>
                                        <input
                                            type="url"
                                            name="event_url"
                                            value={form.event_url}
                                            onChange={handleChange}
                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm text-gray-800"
                                            placeholder="https://www.google.com"
                                        />
                                        {errors.event_url && (
                                            <p className="text-red-500 text-xs mt-1">{errors.event_url}</p>
                                        )}
                                    </div>

                                    {/* Add Guests */}
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-600 font-semibold mb-1.5 text-[13px]">Add Guests</label>
                                        <div ref={dropdownRef} className="relative">
                                            <button
                                                type="button"
                                                onClick={toggleAssigneeDropdown}
                                                className="w-full flex justify-between items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-left focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm text-gray-800"
                                            >
                                                <span className="truncate pr-4 text-gray-500">
                                                    {getSelectedAssigneeNames()}
                                                </span>
                                                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAssigneeDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                                            </button>

                                            {isAssigneeDropdownOpen && (
                                                <div className="absolute z-[160] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                    {guestUsers?.map((user) => (
                                                        <div
                                                            key={user.id}
                                                            className="flex items-center p-2.5 hover:bg-orange-50 transition cursor-pointer"
                                                            onClick={() => {
                                                                const checked = !form.guest_ids.map(id => String(id)).includes(String(user.id));
                                                                handleAssigneeChange(user.id, checked);
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={form.guest_ids.map(id => String(id)).includes(String(user.id))}
                                                                onChange={() => { }}
                                                                className="w-4 h-4 text-[var(--theme-primary)] border-gray-300 rounded focus:ring-[var(--theme-primary)] cursor-pointer"
                                                            />
                                                            <div className="ml-3 flex items-center">
                                                                <img
                                                                    src={getAvatarUrl(user)}
                                                                    alt="avatar"
                                                                    className="w-6 h-6 rounded-full border border-gray-200 object-cover"
                                                                />
                                                                <span className="ml-2 text-sm text-gray-700">{user.name}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-600 font-semibold mb-1.5 text-[13px]">Description</label>
                                        <textarea
                                            name="description"
                                            value={form.description}
                                            onChange={handleChange}
                                            rows="3"
                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm text-gray-800 resize-none"
                                            placeholder="Description"
                                        ></textarea>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Centered Actions Buttons */}
                        <div className="flex justify-center gap-4 mt-8 pt-4 border-t border-gray-100 bg-white">
                            {selectedEvent && !isEditing ? (
                                <>
                                    {canManageEvent(selectedEvent) && (
                                        <>
                                            <button
                                                onClick={handleEditClick}
                                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 duration-150"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 duration-150"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={closeModal}
                                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 duration-150"
                                    >
                                        Close
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="submit"
                                        form="eventForm"
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 duration-150"
                                    >
                                        Submit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 duration-150"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Index.layout = (page) => {
    const { auth } = page.props;
    const isAdminOrManager = ['admin', 'manager', 'editor'].includes(auth.user.role);
    const Layout = isAdminOrManager ? AdminLayout : UserLayout;
    return <Layout title="Task Calendar">{page}</Layout>;
};
