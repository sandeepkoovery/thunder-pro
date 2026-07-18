import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Play, Square, Coffee, Clock, Loader2 } from 'lucide-react';

import { getFreshLocation, getGeoErrorMessage } from '@/lib/geo';

export default function AttendanceWidget() {
    // Version: 1.2 (Mac Location Fix)
    const [status, setStatus] = useState('loading'); // loading, not_started, punched_in, on_break, punched_out
    const [attendance, setAttendance] = useState(null);
    const [timer, setTimer] = useState(0); // in seconds
    const [breakTimer, setBreakTimer] = useState(0); // in seconds
    const [sessionTimer, setSessionTimer] = useState(0); // seconds strictly in the current active slice
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchStatus();
        // Failsafe: If still loading after 5s, show buttons anyway
        const timeout = setTimeout(() => {
            setStatus(s => s === 'loading' ? 'not_started' : s);
        }, 5000);
        return () => clearTimeout(timeout);
    }, []); // Run only once on mount

    useEffect(() => {
        const interval = setInterval(() => {
            tick();
        }, 1000);
        return () => clearInterval(interval);
    }, [status]); // Re-run effect when status changes to update tick closure with current status

    const fetchStatus = async () => {
        try {
            const response = await axios.get(route('attendance.status'));
            const { status, attendance, now } = response.data;
            setStatus(status);
            setAttendance(attendance);
            calculateTimers(attendance, now);
        } catch (error) {
            console.error("Failed to fetch attendance status", error);
            setStatus('not_started');
        }
    };

    const parseSafariDate = (dateString) => {
        if (!dateString) return new Date();
        // Convert "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SS" for Safari compatibility
        const isoString = dateString.toString().replace(/\s/, 'T');
        return new Date(isoString);
    };

    const calculateTimers = (attendance, nowString) => {
        if (!attendance) {
            setTimer(0);
            return;
        }

        const now = parseSafariDate(nowString).getTime();
        const punchIn = parseSafariDate(attendance.punch_in).getTime();
        const totalWorkedMs = (attendance.total_worked_minutes || 0) * 60 * 1000;

        if (attendance.status === 'punched_in') {
            // Current Session + Previous Sessions
            // Note: total_worked_minutes only stores COMPLETED sessions.
            // So we add (Now - PunchIn) to total_worked_minutes.
            const currentSession = now - punchIn;
            setTimer(Math.floor((totalWorkedMs + currentSession) / 1000));
            setSessionTimer(Math.floor(currentSession / 1000));
        } else if (attendance.status === 'on_break') {
            // Worked time is fixed until break ends
            // But we need to account for the session BEFORE the break started.
            // If we are on break, punch_in is still the start of the CURRENT session.
            // So worked = (BreakStart - PunchIn) + PreviousSessions
            const breakStart = new Date(attendance.break_start).getTime();
            const currentSessionBeforeBreak = breakStart - punchIn;

            setTimer(Math.floor((totalWorkedMs + currentSessionBeforeBreak) / 1000));

            const currentBreakDuration = now - breakStart;
            setBreakTimer(Math.floor(currentBreakDuration / 1000));
        } else if (attendance.status === 'punched_out') {
            // Just show total worked minutes
            setTimer(Math.floor(totalWorkedMs / 1000));
        }
    };

    const tick = () => {
        if (status === 'punched_in') {
            setTimer(prev => prev + 1);
            setSessionTimer(prev => prev + 1);
        } else if (status === 'on_break') {
            setBreakTimer(prev => prev + 1);
        }
    };

    const formatTime = (seconds) => {
        if (seconds < 0) seconds = 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAction = async (action) => {
        if (processing) return;

        let url = '';

        switch (action) {
            case 'punch-in': url = route('attendance.punchIn'); break;
            case 'punch-out': url = route('attendance.punchOut'); break;
            case 'break-start': url = route('attendance.break.start'); break;
            case 'break-end': url = route('attendance.break.end'); break;
        }

        setProcessing(true);

        if (action === 'punch-in' || action === 'punch-out') {
            // Geolocation requires HTTPS
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                alert("Location access requires a secure HTTPS connection.");
                setProcessing(false);
                return;
            }

            try {
                const pos = await getFreshLocation();
                router.post(url, {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: pos.timestamp
                }, {
                    preserveScroll: true,
                    onSuccess: () => fetchStatus(),
                    onFinish: () => setProcessing(false),
                });
            } catch (err) {
                console.error("Geo error", err);
                alert(getGeoErrorMessage(err));
                setProcessing(false);
            }
        } else {
            router.post(url, {}, {
                preserveScroll: true,
                onSuccess: () => fetchStatus(),
                onFinish: () => setProcessing(false),
            });
        }
    };

    if (status === 'loading') return <div className="text-sm text-gray-500">Loading...</div>;

    return (
        <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0 bg-white p-3 sm:p-1.5 px-3 rounded-2xl sm:rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
            {/* Timer Display */}
            <div className="flex flex-col items-center sm:items-end min-w-[100px] sm:min-w-[80px]">
                <div className="flex items-center text-gray-800 font-mono font-bold text-xl sm:text-lg">
                    <Clock className="w-5 h-5 sm:w-4 sm:h-4 mr-2 sm:mr-1 text-blue-600" />
                    {formatTime(timer)}
                </div>
                {status === 'on_break' && (
                    <div className="text-xs text-orange-600 font-bold uppercase tracking-wider">
                        Break: {formatTime(breakTimer)}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center space-x-2 w-full sm:w-auto">
                {status === 'not_started' && (
                    <button
                        onClick={() => handleAction('punch-in')}
                        disabled={processing}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 sm:px-4 sm:py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                        {processing ? '...' : 'Punch In'}
                    </button>
                )}

                {status === 'punched_out' && (
                    <div className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 sm:px-3 sm:py-1.5 bg-gray-100 text-gray-400 text-sm font-bold rounded-lg sm:rounded border border-gray-200 cursor-not-allowed">
                        <Square className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" /> Shift Ended
                    </div>
                )}

                {status === 'punched_in' && (() => {
                    const isEarlySession = sessionTimer < 300;
                    return (
                        <>
                            <button
                                onClick={() => handleAction('break-start')}
                                disabled={processing || isEarlySession}
                                title={isEarlySession ? "You must work at least 5 minutes before taking a break" : ""}
                                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 sm:px-4 sm:py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Coffee className="w-4 h-4 mr-2" />}
                                Break
                            </button>
                            <button
                                onClick={() => handleAction('punch-out')}
                                disabled={processing || isEarlySession}
                                title={isEarlySession ? "You must work at least 5 minutes before punching out" : ""}
                                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 sm:px-4 sm:py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Square className="w-4 h-4 mr-2 fill-current" />}
                                Punch Out
                            </button>
                        </>
                    )
                })()}

                {status === 'on_break' && (
                    <button
                        onClick={() => handleAction('break-end')}
                        disabled={processing}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                        Resume
                    </button>
                )}

            </div>
        </div>
    );
}
