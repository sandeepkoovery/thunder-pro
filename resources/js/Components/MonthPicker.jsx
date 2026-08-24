import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

export default function MonthPicker({
    value = '',
    onChange,
    placeholder = 'Select Month',
    className = '',
    inputClassName = '',
    disabled = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef(null);
    const popoverRef = useRef(null);
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

    const parseValue = (valStr) => {
        if (!valStr) return new Date();
        const parts = String(valStr).split('-');
        if (parts.length >= 2) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const d = new Date(year, month, 1);
            if (!isNaN(d.getTime())) return d;
        }
        return new Date();
    };

    const committedDate = value ? parseValue(value) : null;
    const [viewYear, setViewYear] = useState(() => (committedDate ? committedDate.getFullYear() : new Date().getFullYear()));
    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

    useEffect(() => {
        if (value) {
            const d = parseValue(value);
            setViewYear(d.getFullYear());
        }
    }, [value]);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const popoverWidth = 280;
            const popoverHeight = 320;

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

    const monthsShort = [
        'Jan', 'Feb', 'Mar', 'Apr',
        'May', 'Jun', 'Jul', 'Aug',
        'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthsFull = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];

    const emitChange = (valStr) => {
        if (onChange) {
            const eventMock = { target: { name: name || '', value: valStr } };
            onChange(eventMock);
        }
    };

    const handleSelectMonth = (monthIndex) => {
        const m = String(monthIndex + 1).padStart(2, '0');
        const formatted = `${viewYear}-${m}`;
        emitChange(formatted);
        setIsOpen(false);
        setIsYearPickerOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        emitChange('');
        setIsOpen(false);
    };

    const handleThisMonth = (e) => {
        e.stopPropagation();
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        setViewYear(y);
        emitChange(`${y}-${m}`);
        setIsOpen(false);
    };

    const currentYearNum = new Date().getFullYear();
    const yearsList = Array.from({ length: 30 }, (_, i) => currentYearNum - 15 + i);

    const formatTriggerDisplay = () => {
        if (!value) return placeholder;
        const str = typeof value === 'object' && value?.target ? value.target.value : String(value);
        if (!str) return placeholder;
        const parts = str.split('-');
        if (parts.length < 2) return placeholder;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        if (isNaN(year) || isNaN(month) || month < 0 || month > 11) return placeholder;
        return `${monthsFull[month]}, ${year}`;
    };

    return (
        <div className={`relative inline-block w-full ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        if (!isOpen && committedDate) {
                            setViewYear(committedDate.getFullYear());
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
                        onClick={handleClear}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Clear month"
                    >
                        <X size={13} />
                    </span>
                )}
            </button>

            {isOpen && createPortal(
                <div
                    ref={popoverRef}
                    style={{
                        position: 'absolute',
                        top: `${popoverPos.top}px`,
                        left: `${popoverPos.left}px`,
                        zIndex: 999999,
                    }}
                    className="w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 animate-in fade-in zoom-in-95 duration-150 select-none font-sans"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                            className="text-base font-black text-slate-900 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <span>{viewYear}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setViewYear(viewYear - 1)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewYear(viewYear + 1)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Year Picker Grid Overlay */}
                    {isYearPickerOpen ? (
                        <div className="p-1 max-h-56 overflow-y-auto grid grid-cols-3 gap-2 border-t border-gray-100">
                            {yearsList.map((y) => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => {
                                        setViewYear(y);
                                        setIsYearPickerOpen(false);
                                    }}
                                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                        y === viewYear
                                            ? 'bg-[#0f172a] text-white shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Month Grid (4 columns x 3 rows) */
                        <div className="grid grid-cols-4 gap-2.5 my-2">
                            {monthsShort.map((m, idx) => {
                                const isSelected = committedDate && committedDate.getFullYear() === viewYear && committedDate.getMonth() === idx;
                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => handleSelectMonth(idx)}
                                        className={`py-2.5 px-1 text-xs font-bold rounded-2xl transition-all cursor-pointer text-center ${
                                            isSelected
                                                ? 'bg-[#0f172a] text-white font-black shadow-md scale-105'
                                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                        {m}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer Actions: Clear & This Month */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={handleThisMonth}
                            className="font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                            This month
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
