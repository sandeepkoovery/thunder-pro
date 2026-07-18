import React from 'react';
import { Loader2, Play, Square, Coffee, Clock } from 'lucide-react';
import useAttendance from '@/hooks/useAttendance';

export default function AttendanceLargeCard() {
    const {
        status,
        attendance,
        timer,
        breakTimer,
        sessionTimer,
        processing,
        handleAction
    } = useAttendance();

    const isEarlySession = status === 'punched_in' && sessionTimer < 300; // 5 mins

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const getPercentage = () => {
        // Assume 9 hours is 100% for the progress bar
        const targetSeconds = 9 * 3600;
        const pct = (timer / targetSeconds) * 100;
        return Math.min(pct, 100);
    };

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (getPercentage() / 100) * circumference;

    const todayDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const punchInTime = attendance?.punch_in
        ? new Date(attendance.punch_in.replace(/\s/, 'T')).toLocaleTimeString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : null;

    if (status === 'loading') {
        return (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-blue-600">Timesheet</h3>
                <span className="text-gray-500 font-medium text-sm">{todayDate}</span>
            </div>

            {/* Info Box */}
            <div className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-4 mb-8">
                <p className="text-sm font-bold text-gray-800">Punch In at</p>
                <p className="text-xs text-gray-500 mt-1">
                    {punchInTime || 'Not started today'}
                </p>
            </div>

            {/* Circular Progress */}
            <div className="relative flex items-center justify-center mb-8">
                <svg className="w-48 h-48 transform -rotate-90">
                    <circle
                        cx="96"
                        cy="96"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-gray-100"
                    />
                    <circle
                        cx="96"
                        cy="96"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="text-blue-500 transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold text-gray-900">{formatTime(timer)}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3 mb-8">
                {status === 'not_started' && (
                    <button
                        onClick={() => handleAction('punch-in')}
                        disabled={processing}
                        className="w-full py-4 bg-emerald-400 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                        Punch In
                    </button>
                )}

                {(status === 'punched_in' || status === 'on_break') && (
                    <div className="flex gap-3">
                        {status === 'punched_in' ? (
                            <button
                                onClick={() => handleAction('break-start')}
                                disabled={processing || isEarlySession}
                                title={isEarlySession ? "You must work at least 5 minutes before taking a break" : ""}
                                className="flex-1 py-4 bg-orange-400 hover:bg-orange-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Coffee className="w-5 h-5" />}
                                Break
                            </button>
                        ) : (
                            <button
                                onClick={() => handleAction('break-end')}
                                disabled={processing}
                                className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                                Resume
                            </button>
                        )}
                        <button
                            onClick={() => handleAction('punch-out')}
                            disabled={processing || isEarlySession}
                            title={isEarlySession ? "You must work at least 5 minutes before punching out" : ""}
                            className="flex-1 py-4 bg-emerald-400 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5 fill-current" />}
                            Punch Out
                        </button>
                    </div>
                )}

                {status === 'punched_out' && (
                    <div className="w-full py-4 bg-gray-100 text-gray-400 font-bold rounded-2xl text-center border border-gray-200">
                        Shift Ended
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            <div className="w-full grid grid-cols-2 border-t border-gray-100 pt-6">
                <div className="text-center border-r border-gray-100">
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">Break</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{formatTime(breakTimer)}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">Overtime</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                        {timer > 9 * 3600 ? formatTime(timer - 9 * 3600) : '0h 0m'}
                    </p>
                </div>
            </div>
        </div>
    );
}
