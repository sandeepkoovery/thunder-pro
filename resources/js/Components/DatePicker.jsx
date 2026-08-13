import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Edit2 } from 'lucide-react';

export default function DatePicker({
    value = '',
    onChange,
    name,
    placeholder = 'Select date',
    className = '',
    inputClassName = '',
    required = false,
    disabled = false,
    minDate,
    maxDate,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef(null);
    const popoverRef = useRef(null);
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

    // Helper to parse YYYY-MM-DD reliably
    const parseValue = (valStr) => {
        if (!valStr) return new Date();
        const parts = valStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const d = new Date(year, month, day);
            if (!isNaN(d.getTime())) return d;
        }
        const d = new Date(valStr);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    const committedDateObj = value ? parseValue(value) : null;

    // Transient date state while popover is open
    const [tempDate, setTempDate] = useState(() => committedDateObj || new Date());
    const [currentViewDate, setCurrentViewDate] = useState(() => committedDateObj || new Date());
    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

    useEffect(() => {
        if (value) {
            const d = parseValue(value);
            setTempDate(d);
            setCurrentViewDate(d);
        }
    }, [value]);

    // Position calculation for portal floating popover
    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const popoverWidth = 288; // w-72 = 288px
            const popoverHeight = 390; // approximate height

            let top = rect.bottom + window.scrollY + 6;
            let left = rect.left + window.scrollX;

            // Prevent right overflow
            if (left + popoverWidth > window.innerWidth - 16) {
                left = Math.max(16, window.innerWidth - popoverWidth - 16);
            }

            // Flip to top if overflowing bottom of screen and space available above
            if (rect.bottom + popoverHeight > window.innerHeight && rect.top > popoverHeight) {
                top = rect.top + window.scrollY - popoverHeight - 6;
            }

            setPopoverPos({ top, left });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition, true);
            };
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                triggerRef.current && !triggerRef.current.contains(event.target) &&
                popoverRef.current && !popoverRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setIsYearPickerOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const viewYear = currentViewDate.getFullYear();
    const viewMonth = currentViewDate.getMonth();

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setCurrentViewDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setCurrentViewDate(new Date(viewYear, viewMonth + 1, 1));
    };

    const handleDayClick = (year, month, day) => {
        const d = new Date(year, month, day);
        setTempDate(d);
    };

    const commitSelection = (dToCommit) => {
        const d = dToCommit || tempDate;
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const formattedDate = `${d.getFullYear()}-${m}-${day}`;

        if (onChange) {
            const eventMock = {
                target: {
                    name: name,
                    value: formattedDate
                }
            };
            onChange(eventMock);
            if (typeof onChange === 'function' && onChange.length === 1 && !onChange.toString().includes('target')) {
                onChange(formattedDate);
            }
        }
        setIsOpen(false);
        setIsYearPickerOpen(false);
    };

    const handleOk = () => {
        commitSelection(tempDate);
    };

    const handleCancel = () => {
        if (committedDateObj) {
            setTempDate(committedDateObj);
            setCurrentViewDate(committedDateObj);
        }
        setIsOpen(false);
        setIsYearPickerOpen(false);
    };

    const handleClearDate = (e) => {
        e.stopPropagation();
        if (onChange) {
            onChange({ target: { name: name, value: '' } });
        }
        setIsOpen(false);
    };

    // Calculate grid days
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfWeek = (year, month) => new Date(year, month, 1).getDay();

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);
    const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

    const calendarGrid = [];

    // Prev month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        calendarGrid.push({
            day: prevMonthDays - i,
            month: viewMonth - 1,
            year: viewMonth === 0 ? viewYear - 1 : viewYear,
            isCurrentMonth: false
        });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarGrid.push({
            day,
            month: viewMonth,
            year: viewYear,
            isCurrentMonth: true
        });
    }

    // Next month padding
    const totalCells = Math.ceil(calendarGrid.length / 7) * 7;
    const remainingCells = totalCells - calendarGrid.length;
    for (let day = 1; day <= remainingCells; day++) {
        calendarGrid.push({
            day,
            month: viewMonth + 1,
            year: viewMonth === 11 ? viewYear + 1 : viewYear,
            isCurrentMonth: false
        });
    }

    // Format Trigger Button Display Text
    const formatTriggerDisplay = () => {
        if (!value) return placeholder;
        const d = parseValue(value);
        if (isNaN(d.getTime())) return value;
        const dayStr = String(d.getDate()).padStart(2, '0');
        const monthShort = months[d.getMonth()].substring(0, 3);
        const yearNum = d.getFullYear();
        return `${dayStr} ${monthShort} ${yearNum}`;
    };

    // Format Header Bar Display Text e.g. "Mon, Apr 18"
    const formatHeaderDisplay = () => {
        if (!tempDate || isNaN(tempDate.getTime())) return 'Select Date';
        const dayName = tempDate.toLocaleDateString('en-US', { weekday: 'short' });
        const monthName = tempDate.toLocaleDateString('en-US', { month: 'short' });
        const dateNum = tempDate.getDate();
        return `${dayName}, ${monthName} ${dateNum}`;
    };

    const isTempSelected = (year, month, day) => {
        if (!tempDate) return false;
        return (
            tempDate.getFullYear() === year &&
            tempDate.getMonth() === month &&
            tempDate.getDate() === day
        );
    };

    const todayObj = new Date();
    const isToday = (year, month, day) => {
        return (
            todayObj.getFullYear() === year &&
            todayObj.getMonth() === month &&
            todayObj.getDate() === day
        );
    };

    const currentYearNum = new Date().getFullYear();
    const yearsList = Array.from({ length: 30 }, (_, i) => currentYearNum - 15 + i);

    return (
        <div className={`relative inline-block w-full ${className}`}>
            {name && <input type="hidden" name={name} value={value || ''} required={required} />}

            {/* Input Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        if (!isOpen && committedDateObj) {
                            setTempDate(committedDateObj);
                            setCurrentViewDate(committedDateObj);
                        }
                        setIsOpen(!isOpen);
                    }
                }}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer outline-none ${
                    isOpen
                        ? 'border-[#6200ee] ring-4 ring-[#6200ee]/15 bg-white shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''} ${inputClassName}`}
            >
                <div className="flex items-center gap-2 overflow-hidden text-left">
                    <CalendarIcon size={16} className={`shrink-0 ${value ? 'text-[#6200ee]' : 'text-gray-400'}`} />
                    <span className={`truncate text-sm font-semibold ${value ? 'text-gray-800 font-bold' : 'text-gray-400'}`}>
                        {formatTriggerDisplay()}
                    </span>
                </div>

                {value && !disabled && (
                    <span
                        onClick={handleClearDate}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Clear date"
                    >
                        <X size={13} />
                    </span>
                )}
            </button>

            {/* Material Design DatePicker Floating Portal Popover */}
            {isOpen && createPortal(
                <div
                    ref={popoverRef}
                    style={{
                        position: 'absolute',
                        top: `${popoverPos.top}px`,
                        left: `${popoverPos.left}px`,
                        zIndex: 999999,
                    }}
                    className="w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none"
                >
                    {/* 1. VIBRANT PURPLE MATERIAL HEADER BAR (#6200ee) */}
                    <div className="bg-[#6200ee] p-5 flex items-start justify-between relative shadow-sm">
                        <div>
                            <div
                                style={{ color: '#e1bee7', WebkitTextFillColor: '#e1bee7' }}
                                className="text-[10px] font-bold uppercase tracking-widest block mb-1 text-[#e1bee7]"
                            >
                                SELECT DATE
                            </div>
                            <div
                                style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                                className="text-2xl font-normal tracking-tight leading-none font-sans text-white"
                            >
                                {formatHeaderDisplay()}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                            style={{ color: '#ffffff' }}
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
                            title="Select Year"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>

                    {/* 2. SUB-HEADER MONTH & YEAR CONTROLS */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                        <button
                            type="button"
                            onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                            className="text-sm font-bold text-[#3c4043] hover:text-[#6200ee] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <span style={{ color: '#3c4043' }}>{months[viewMonth]} {viewYear}</span>
                            <span className="text-[10px] text-[#5f6368]">▼</span>
                        </button>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* YEAR PICKER OVERLAY */}
                    {isYearPickerOpen ? (
                        <div className="p-4 max-h-64 overflow-y-auto grid grid-cols-3 gap-2 border-t border-gray-100">
                            {yearsList.map((y) => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => {
                                        setCurrentViewDate(new Date(y, viewMonth, 1));
                                        setIsYearPickerOpen(false);
                                    }}
                                    style={y === viewYear ? { color: '#ffffff', WebkitTextFillColor: '#ffffff' } : { color: '#3c4043' }}
                                    className={`py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                                        y === viewYear
                                            ? 'bg-[#6200ee] text-white shadow-sm'
                                            : 'text-[#3c4043] hover:bg-gray-100'
                                    }`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* 3. WEEKDAY HEADERS (S M T W T F S) */}
                            <div className="grid grid-cols-7 gap-1 px-4 text-center my-1">
                                {weekDays.map((wd, i) => (
                                    <div key={i} style={{ color: '#70757a' }} className="text-xs font-semibold py-1">
                                        {wd}
                                    </div>
                                ))}
                            </div>

                            {/* 4. DAYS GRID */}
                            <div className="grid grid-cols-7 gap-1 px-4 pb-2">
                                {calendarGrid.map((item, idx) => {
                                    const isCurr = item.isCurrentMonth;
                                    const isSelectedDay = isTempSelected(item.year, item.month, item.day);
                                    const isTodayDay = isToday(item.year, item.month, item.day);

                                    if (!isCurr) {
                                        return <div key={idx} className="w-8 h-8 mx-auto" />;
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleDayClick(item.year, item.month, item.day)}
                                            style={isSelectedDay ? { color: '#ffffff', WebkitTextFillColor: '#ffffff' } : { color: '#3c4043' }}
                                            className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs transition-all ${
                                                isSelectedDay
                                                    ? 'bg-[#6200ee] text-white font-bold shadow-md scale-105'
                                                    : isTodayDay
                                                    ? 'border border-[#3c4043] font-medium hover:bg-purple-50'
                                                    : 'font-normal hover:bg-purple-50 hover:text-[#6200ee] cursor-pointer'
                                            }`}
                                        >
                                            {item.day}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* 5. FOOTER CANCEL / OK BUTTONS MATCHING SCREENSHOT */}
                    <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                        <button
                            type="button"
                            onClick={handleCancel}
                            style={{ color: '#6200ee' }}
                            className="text-xs font-bold uppercase tracking-wider hover:bg-purple-50 px-3.5 py-1.5 rounded-md transition-colors cursor-pointer"
                        >
                            CANCEL
                        </button>
                        <button
                            type="button"
                            onClick={handleOk}
                            style={{ color: '#6200ee' }}
                            className="text-xs font-bold uppercase tracking-wider hover:bg-purple-50 px-3.5 py-1.5 rounded-md transition-colors cursor-pointer"
                        >
                            OK
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
