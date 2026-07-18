import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function MonthPicker({ value, onChange, className = "" }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Parse initial value (YYYY-MM)
    const initialDate = value ? new Date(value + '-01') : new Date();
    const [viewYear, setViewYear] = useState(initialDate.getFullYear());

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const currentMonth = value ? parseInt(value.split('-')[1]) - 1 : -1;
    const currentYear = value ? parseInt(value.split('-')[0]) : -1;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMonthClick = (monthIndex) => {
        const formattedMonth = String(monthIndex + 1).padStart(2, '0');
        onChange(`${viewYear}-${formattedMonth}`);
        setIsOpen(false);
    };

    const displayValue = value ? new Date(value + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Select Month';

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 h-11 bg-gray-50/50 border border-gray-200 rounded-xl shadow-sm text-[14px] font-semibold text-gray-800 hover:bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
            >
                <span className={value ? 'text-gray-900' : 'text-gray-400'}>{displayValue}</span>
                <Calendar className="w-4 h-4 text-blue-500" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={() => setViewYear(viewYear - 1)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="text-lg font-bold text-gray-800">{viewYear}</span>
                        <button
                            type="button"
                            onClick={() => setViewYear(viewYear + 1)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {months.map((month, index) => {
                            const isSelected = currentYear === viewYear && currentMonth === index;
                            return (
                                <button
                                    key={month}
                                    type="button"
                                    onClick={() => handleMonthClick(index)}
                                    className={`py-3 text-sm font-medium rounded-lg transition-all ${isSelected
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    {month}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
