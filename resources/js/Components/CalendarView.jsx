import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarView = ({ attendanceData, leaves, filters, onFilterChange, settings }) => {
    const monthDate = useMemo(() => {
        return filters.month ? new Date(filters.month + '-01') : new Date();
    }, [filters.month]);

    const daysInMonth = useMemo(() => {
        return new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    }, [monthDate]);

    const firstDayOfMonth = useMemo(() => {
        return new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
    }, [monthDate]);

    const calendarDays = useMemo(() => {
        const days = [];
        const prevMonthLastDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 0).getDate();

        // Padding days from previous month
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                currentMonth: false,
                date: null
            });
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            // Find attendance record
            const attendance = attendanceData.find(a => {
                const aDate = new Date(a.date);
                return aDate.getFullYear() === monthDate.getFullYear() &&
                    aDate.getMonth() === monthDate.getMonth() &&
                    aDate.getDate() === i;
            });

            // Find leave record
            const leave = leaves?.find(l => {
                const start = l.from_date;
                const end = l.to_date;
                return dateStr >= start && dateStr <= end;
            });

            // Determine if it's a weekend
            const dateObj = new Date(dateStr);
            const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Determine if it's a future date
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const isFuture = dateStr > todayStr;

            let status = 'Absent';
            let isLate = false;
            let lateMinutes = 0;
            let lateHours = 0;

            if (attendance) {
                // Check if user was late
                if (attendance.status === 'Late' || attendance.status === 'Late & Early Leave') {
                    isLate = true;
                    // Calculate late minutes if punch_in_raw is available
                    if (attendance.punch_in_raw) {
                        const punchInTime = new Date(attendance.punch_in_raw);
                        const scheduledTime = new Date(attendance.punch_in_raw);
                        scheduledTime.setHours(9, 30, 0, 0); // 9:30 AM
                        if (punchInTime > scheduledTime) {
                            const totalLateMinutes = Math.floor((punchInTime - scheduledTime) / (1000 * 60));
                            lateHours = Math.floor(totalLateMinutes / 60);
                            lateMinutes = totalLateMinutes % 60;
                        }
                    }
                }

                // User requested: "when anybody punched in show present"
                // We'll map 'Late' and other active statuses to 'Present' for the calendar view
                if (attendance.status === 'Late' || attendance.status === 'Early Leave' || attendance.status === 'Late & Early Leave') {
                    status = 'Present';
                } else {
                    status = attendance.status;
                }
            } else if (leave) {
                if (leave.day_type === 'first_half' || leave.day_type === 'second_half') {
                    status = 'Half Day';
                } else {
                    status = 'On Leave';
                }
            } else if (isWeekend) {
                status = 'Off';
            } else if (isFuture) {
                status = '-';
            }

            days.push({
                day: i,
                currentMonth: true,
                date: dateStr,
                attendance,
                leave,
                status,
                isLate,
                lateHours,
                lateMinutes
            });
        }

        // Padding days for next month to complete the grid (6 rows * 7 days = 42)
        const totalCells = 42;
        const remainingCells = totalCells - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                day: i,
                currentMonth: false,
                date: null
            });
        }

        return days;
    }, [monthDate, daysInMonth, firstDayOfMonth, attendanceData, leaves]);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Present': return 'bg-green-50 text-green-700';
            case 'Half Day': return 'bg-blue-50 text-blue-700';
            case 'Absent': return 'bg-red-50 text-red-700';
            case 'On Leave': return 'bg-purple-50 text-purple-700';
            case 'Off': return 'bg-gray-50 text-gray-500';
            default: return 'bg-gray-50 text-gray-400';
        }
    };

    const handlePrevMonth = () => {
        const prev = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
        onFilterChange('month', `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
    };

    const handleNextMonth = () => {
        const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
        onFilterChange('month', `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
    };

    const stats = useMemo(() => {
        let present = 0;
        let absent = 0;
        let halfDay = 0;
        let onLeave = 0;
        let lateDays = 0;
        let totalMinutes = 0;
        let totalBreakMinutes = 0;

        calendarDays.forEach(day => {
            if (!day.currentMonth) return;

            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            if (day.date > todayStr) return;

            if (day.status === 'Present') present++;
            else if (day.status === 'Absent') absent++;
            else if (day.status === 'Half Day') halfDay++;
            else if (day.status === 'On Leave' || day.status === 'Leave') onLeave++;

            if (day.isLate) lateDays++;

            if (day.attendance) {
                totalMinutes += day.attendance.total_worked_minutes || 0;
                totalBreakMinutes += day.attendance.total_break_minutes || 0;
            }
        });

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        let breakHours = Math.floor(totalBreakMinutes / 60);
        let breakMins = Math.round(totalBreakMinutes % 60);

        // Handle edge case where rounding pushes to 60 minutes
        if (breakMins === 60) {
            breakHours += 1;
            breakMins = 0;
        }

        return {
            present,
            absent,
            halfDay,
            onLeave,
            lateDays,
            totalWorked: `${hours}h ${minutes}m`,
            totalBreak: `${breakHours}h ${breakMins}m`
        };
    }, [calendarDays]);

    const monthName = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
            {/* Calendar Section */}
            <div className="flex-1 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-extrabold text-[#2d3436]">Attendance Calendar</h3>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="px-5 py-2 bg-gray-50 rounded-xl text-sm font-bold text-[#2d3436] min-w-[120px] text-center border border-gray-100">
                            {monthName}
                        </div>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 mb-4">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                        <div key={day} className="text-center text-[11px] font-black text-gray-400 tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-3">
                    {calendarDays.map((item, idx) => (
                        <div
                            key={idx}
                            className={`aspect-square rounded-2xl border p-2 flex flex-col transition-all ${!item.currentMonth ? 'bg-gray-50/30 border-transparent' : 'bg-white border-gray-100'
                                } ${item.date === today ? 'border-[#ff4081] ring-2 ring-[#ff4081]/10' : ''}`}
                        >
                            <span className={`text-sm font-black ${!item.currentMonth ? 'text-gray-200' : 'text-[#2d3436]'}`}>
                                {item.day}
                            </span>

                            {item.currentMonth && item.status !== '-' && (
                                <div className="mt-auto space-y-1">
                                    <div className={`px-1 py-1 rounded-lg text-[10px] font-black text-center uppercase tracking-normal ${getStatusStyles(item.status)}`}>
                                        {item.status}
                                    </div>
                                    {item.isLate && (item.lateHours > 0 || item.lateMinutes > 0) && (
                                        <div className="px-1 py-0.5 rounded-md text-[9px] font-bold text-center bg-orange-100 text-orange-700 border border-orange-200">
                                            {item.lateHours > 0 ? `+${item.lateHours}h ${item.lateMinutes}m` : `+${item.lateMinutes}m`}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                        <span className="text-xs text-[#636e72] font-bold uppercase tracking-wider">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                        <span className="text-xs text-[#636e72] font-bold uppercase tracking-wider">Half Day</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200"></div>
                        <span className="text-xs text-[#636e72] font-bold uppercase tracking-wider">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400 shadow-sm shadow-gray-200"></div>
                        <span className="text-xs text-[#636e72] font-bold uppercase tracking-wider">Off</span>
                    </div>
                </div>
            </div>

            {/* Statistics Sidebar */}
            <div className="lg:w-80 space-y-4">
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Monthly Stats</h4>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-100/50">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="text-[10px] font-bold text-green-800/60 uppercase tracking-wider">Present</p>
                            <p className="text-2xl font-black text-green-700">{stats.present}</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-100/50">
                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </div>
                            <p className="text-[10px] font-bold text-red-800/60 uppercase tracking-wider">Absent</p>
                            <p className="text-2xl font-black text-red-700">{stats.absent}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-normal">Worked Hours</p>
                            </div>
                            <p className="text-sm font-black text-[#2d3436]">{stats.totalWorked}</p>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-normal">Break Hours</p>
                            </div>
                            <p className="text-sm font-black text-[#2d3436]">{stats.totalBreak}</p>
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 rounded-xl bg-gray-50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Half Days</p>
                                <p className="text-sm font-black text-[#2d3436]">{stats.halfDay}</p>
                            </div>
                            <div className="text-center p-2 rounded-xl bg-gray-50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">On Leave</p>
                                <p className="text-sm font-black text-[#2d3436]">{stats.onLeave}</p>
                            </div>
                            <div className="text-center p-2 rounded-xl bg-orange-50/50">
                                <p className="text-[10px] font-bold text-orange-400 uppercase mb-1">Late</p>
                                <p className="text-sm font-black text-orange-600">{stats.lateDays}</p>
                            </div>
                        </div>
                    </div>

                    {settings?.monthly_working_days && (
                        <div className="pt-4 mt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between px-2">
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Target Work Days</p>
                                <div className="px-2 py-1 bg-pink-100 text-pink-600 rounded-md text-xs font-black">
                                    {settings.monthly_working_days}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-[#ff4081] to-[#7c4dff] rounded-[32px] p-6 text-white shadow-xl shadow-[#ff4081]/20">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Office Hours</p>
                    <p className="text-2xl font-black mb-4">09:00 AM - 06:00 PM</p>
                    <div className="h-1 w-12 bg-white/30 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
