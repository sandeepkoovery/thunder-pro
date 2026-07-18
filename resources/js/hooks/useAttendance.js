import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

import { getFreshLocation, getGeoErrorMessage } from '@/lib/geo';

export default function useAttendance() {
    const [status, setStatus] = useState('loading'); // loading, not_started, punched_in, on_break, punched_out
    const [attendance, setAttendance] = useState(null);
    const [timer, setTimer] = useState(0); // in seconds
    const [breakTimer, setBreakTimer] = useState(0); // in seconds
    const [sessionTimer, setSessionTimer] = useState(0); // seconds strictly in current active slice
    const [processing, setProcessing] = useState(false);

    const parseSafariDate = (dateString) => {
        if (!dateString) return new Date();
        const isoString = dateString.toString().replace(/\s/, 'T');
        return new Date(isoString);
    };

    const calculateTimers = useCallback((attendanceData, nowString) => {
        if (!attendanceData) {
            setTimer(0);
            return;
        }

        const now = parseSafariDate(nowString).getTime();
        const punchIn = parseSafariDate(attendanceData.punch_in).getTime();
        const totalWorkedMs = (attendanceData.total_worked_minutes || 0) * 60 * 1000;

        if (attendanceData.status === 'punched_in') {
            const currentSession = now - punchIn;
            setTimer(Math.floor((totalWorkedMs + currentSession) / 1000));
            setSessionTimer(Math.floor(currentSession / 1000));
            const totalBreakMs = (attendanceData.total_break_minutes || 0) * 60 * 1000;
            setBreakTimer(Math.floor(totalBreakMs / 1000));
        } else if (attendanceData.status === 'on_break') {
            const activeBreak = (attendanceData.breaks || []).find(b => !b.end_time);
            const breakStart = activeBreak ? parseSafariDate(activeBreak.start_time).getTime() : now;

            const currentSessionBeforeBreak = breakStart - punchIn;
            setTimer(Math.floor((totalWorkedMs + currentSessionBeforeBreak) / 1000));

            const currentBreakDuration = now - breakStart;
            const previousBreaksMs = (attendanceData.total_break_minutes || 0) * 60 * 1000;
            setBreakTimer(Math.floor((previousBreaksMs + currentBreakDuration) / 1000));
        } else if (attendanceData.status === 'punched_out') {
            setTimer(Math.floor(totalWorkedMs / 1000));
            const totalBreakMs = (attendanceData.total_break_minutes || 0) * 60 * 1000;
            setBreakTimer(Math.floor(totalBreakMs / 1000));
        }
    }, []);

    const fetchStatus = useCallback(async () => {
        try {
            const response = await axios.get(route('attendance.status'));
            const { status: currentStatus, attendance: currentAttendance, now } = response.data;
            setStatus(currentStatus);
            setAttendance(currentAttendance);
            calculateTimers(currentAttendance, now);
        } catch (error) {
            console.error("Failed to fetch attendance status", error);
            setStatus('not_started');
        }
    }, [calculateTimers]);

    useEffect(() => {
        fetchStatus();
        const timeout = setTimeout(() => {
            setStatus(s => s === 'loading' ? 'not_started' : s);
        }, 5000);
        return () => clearTimeout(timeout);
    }, [fetchStatus]);

    // Background Sync & Keep-alive (Every 1 minute)
    useEffect(() => {
        const syncInterval = setInterval(() => {
            if (status !== 'loading') {
                fetchStatus();
            }
        }, 60000);
        return () => clearInterval(syncInterval);
    }, [fetchStatus, status]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (status === 'punched_in') {
                setTimer(prev => prev + 1);
                setSessionTimer(prev => prev + 1);
            } else if (status === 'on_break') {
                setBreakTimer(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [status]);

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

        const executeRequest = (data = {}) => {
            router.post(url, data, {
                preserveScroll: true,
                onSuccess: () => fetchStatus(),
                onError: (errors) => {
                    console.error("Action failed", errors);
                },
                onFinish: () => setProcessing(false),
            });
        };

        const handlePageExpired = (error) => {
            if (error.response?.status === 419) {
                if (confirm("Your session has expired or the page is out of date. Would you like to refresh?")) {
                    window.location.reload();
                }
            } else {
                alert("Something went wrong. Please try again.");
            }
            setProcessing(false);
        };

        if (action === 'punch-in' || action === 'punch-out') {
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                alert("Location access requires a secure HTTPS connection.");
                setProcessing(false);
                return;
            }

            try {
                const pos = await getFreshLocation();
                executeRequest({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: pos.timestamp
                });
            } catch (err) {
                console.error("Geo error", err);
                alert(getGeoErrorMessage(err));
                setProcessing(false);
            }
        } else {
            // For simple actions (break), use axios first to check session if needed, 
            // but router.post is standard for Inertia.
            // If it fails with 419, Inertia usually handles it, but we can be explicit.
            executeRequest();
        }
    };

    return {
        status,
        attendance,
        timer,
        breakTimer,
        sessionTimer,
        processing,
        handleAction,
        fetchStatus
    };
}
