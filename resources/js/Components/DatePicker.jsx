import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

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

    // Helper to parse YYYY-MM-DD or ISO dates reliably
    const parseValue = (valStr) => {
        if (!valStr) return new Date();
        const str = String(valStr).split(' ')[0].split('T')[0];
        const parts = str.split('-');
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
    const [currentViewDate, setCurrentViewDate] = useState(() => committedDateObj || new Date());
    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

    useEffect(() => {
        if (value) {
            const d = parseValue(value);
            setCurrentViewDate(d);
        }
    }, [value]);

    // Position calculation for portal floating popover
    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const popoverWidth = 320; // w-80 = 320px
            const popoverHeight = 360;

            let top = rect.bottom + window.scrollY + 6;
            let left = rect.left + window.scrollX;

            if (left + popoverWidth > window.innerWidth - 16) {
                left = Math.max(16, window.innerWidth - popoverWidth - 16);
            }

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

    const fullMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setCurrentViewDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setCurrentViewDate(new Date(viewYear, viewMonth + 1, 1));
    };

    const commitSelection = (year, month, day) => {
        const d = new Date(year, month, day);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        const formattedDate = `${d.getFullYear()}-${m}-${dayStr}`;

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

    const handleClearDate = (e) => {
        e.stopPropagation();
        if (onChange) {
            const eventMock = { target: { name: name, value: '' } };
            onChange(eventMock);
            if (typeof onChange === 'function' && onChange.length === 1 && !onChange.toString().includes('target')) {
                onChange('');
            }
        }
        setIsOpen(false);
    };

    // Calculate grid days (including prev and next month padding)
    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfWeek = (y, m) => new Date(y, m, 1).getDay();

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth);
    const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

    const calendarGrid = [];

    // Prev month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const d = prevMonthDays - i;
        const m = viewMonth === 0 ? 11 : viewMonth - 1;
        const y = viewMonth === 0 ? viewYear - 1 : viewYear;
        calendarGrid.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarGrid.push({ day, month: viewMonth, year: viewYear, isCurrentMonth: true });
    }

    // Next month padding to reach 35 or 42 cells total (6 full rows)
    const totalTargetCells = calendarGrid.length > 35 ? 42 : 35;
    for (let day = 1; calendarGrid.length < totalTargetCells; day++) {
        const m = viewMonth === 11 ? 0 : viewMonth + 1;
        const y = viewMonth === 11 ? viewYear + 1 : viewYear;
        calendarGrid.push({ day, month: m, year: y, isCurrentMonth: false });
    }

    const isSelected = (y, m, d) => {
        if (!committedDateObj) return false;
        return (
            committedDateObj.getFullYear() === y &&
            committedDateObj.getMonth() === m &&
            committedDateObj.getDate() === d
        );
    };

    const todayObj = new Date();
    const isToday = (y, m, d) => {
        return (
            todayObj.getFullYear() === y &&
            todayObj.getMonth() === m &&
            todayObj.getDate() === d
        );
    };

    const currentYearNum = new Date().getFullYear();
    const yearsList = Array.from({ length: 30 }, (_, i) => currentYearNum - 15 + i);

    const formatTriggerDisplay = () => {
        if (!value) return placeholder;
        const cleanVal = String(value).split(' ')[0].split('T')[0];
        return cleanVal;
    };

    return (
        <div className={`relative inline-block w-full ${className}`}>
            {name && <input type="hidden" name={name} value={value ? String(value).split(' ')[0].split('T')[0] : ''} required={required} />}

            {/* Input Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        if (!isOpen && committedDateObj) {
                            setCurrentViewDate(committedDateObj);
                        }
                        setIsOpen(!isOpen);
                    }
                }}
                className={`w-full flex items-center justify-between gap-2 pl-4 pr-3.5 py-2.5 rounded-2xl border text-[15px] font-medium transition-all cursor-pointer outline-none ${
                    isOpen
                        ? 'border-blue-500 bg-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''} ${inputClassName}`}
            >
                <div className="flex items-center gap-2 overflow-hidden text-left">
                    <CalendarIcon size={16} className={`shrink-0 ${value ? 'text-slate-600' : 'text-gray-400'}`} />
                    <span className={`truncate text-[15px] font-medium ${value ? 'text-slate-800' : 'text-gray-400'}`}>
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

            {/* Custom Popover matching user screenshot */}
            {isOpen && createPortal(
                <div
                    ref={popoverRef}
                    style={{
                        position: 'absolute',
                        top: `${popoverPos.top}px`,
                        left: `${popoverPos.left}px`,
                        zIndex: 999999,
                    }}
                    className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-100/90 p-5 animate-in fade-in zoom-in-95 duration-150 select-none"
                >
                    {/* Header: Month Year + Circle Prev/Next buttons */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                            className="text-[17px] font-normal text-gray-800 hover:text-[#635bfc] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <span>{fullMonths[viewMonth]} {viewYear}</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Previous month"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Next month"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Year Picker Grid Overlay */}
                    {isYearPickerOpen ? (
                        <div className="p-2 max-h-64 overflow-y-auto grid grid-cols-3 gap-2 border-t border-gray-100">
                            {yearsList.map((y) => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => {
                                        setCurrentViewDate(new Date(y, viewMonth, 1));
                                        setIsYearPickerOpen(false);
                                    }}
                                    className={`py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                                        y === viewYear
                                            ? 'bg-[#635bfc] text-white shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Weekday headers: Sun Mon Tue Wed Thu Fri Sat */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-3">
                                {weekDays.map((wd, i) => (
                                    <div key={i} className="text-sm font-medium text-gray-500 py-0.5">
                                        {wd}
                                    </div>
                                ))}
                            </div>

                            {/* Days grid */}
                            <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
                                {calendarGrid.map((item, idx) => {
                                    const isSel = isSelected(item.year, item.month, item.day);
                                    const isTod = isToday(item.year, item.month, item.day);

                                    let btnClasses = "w-9 h-9 mx-auto rounded-full flex items-center justify-center text-sm transition-all cursor-pointer ";

                                    if (isSel) {
                                        btnClasses += "bg-[#635bfc] text-white font-bold shadow-md shadow-indigo-200 scale-105";
                                    } else if (isTod) {
                                        btnClasses += "bg-[#e8e5ff] text-[#635bfc] font-semibold hover:bg-[#dcd6ff]";
                                    } else if (!item.isCurrentMonth) {
                                        btnClasses += "text-gray-400 font-normal hover:bg-gray-100";
                                    } else {
                                        btnClasses += "text-gray-700 font-normal hover:bg-gray-100";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => commitSelection(item.year, item.month, item.day)}
                                            className={btnClasses}
                                        >
                                            {item.day}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
