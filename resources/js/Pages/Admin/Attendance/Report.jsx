import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';

export default function Report({ auth, users, attendances, totalMonthlyMinutes, filters }) {
    const handleUserChange = (e) => {
        router.get(route('admin.attendance.report'), {
            user_id: e.target.value,
            month: filters.month
        }, { preserveState: true });
    };

    const handleMonthChange = (e) => {
        router.get(route('admin.attendance.report'), {
            user_id: filters.user_id,
            month: e.target.value
        }, { preserveState: true });
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <AdminLayout
            title="Attendance Report"
        >
            <Head title="Attendance Report" />

            <div className="py-12">
                <div className="w-full">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">

                            {/* Filters */}
                            <div className="flex gap-4 mb-6 items-center flex-wrap">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                                    <select
                                        value={filters.user_id || ''}
                                        onChange={handleUserChange}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Select a user...</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
                                    <input
                                        type="month"
                                        value={filters.month}
                                        onChange={handleMonthChange}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>

                                {filters.user_id && (
                                    <div className="ml-auto bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                                        <span className="text-sm text-indigo-600 font-medium">Monthly Total Hours:</span>
                                        <span className="ml-2 text-xl font-bold text-indigo-800">{formatDuration(totalMonthlyMinutes)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Report Table */}
                            {filters.user_id ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch In</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch Out</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break Time</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Duration</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {attendances.length > 0 ? (
                                                attendances.map((day, dayIndex) => (
                                                    day.sessions.map((session, sessionIndex) => (
                                                        <tr key={session.id} className={sessionIndex === 0 ? "bg-gray-50" : ""}>
                                                            {/* Date and Daily Total only on first row of the day */}
                                                            {sessionIndex === 0 && (
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" rowSpan={day.sessions.length}>
                                                                    {format(new Date(day.date), 'EEE, MMM d, yyyy')}
                                                                </td>
                                                            )}

                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {session.punch_in ? format(new Date(session.punch_in), 'h:mm a') : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {session.punch_out ? format(new Date(session.punch_out), 'h:mm a') : (session.status === 'punched_in' ? <span className="text-green-600">Active</span> : '-')}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {session.total_break_minutes > 0 ? `${session.total_break_minutes}m` : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatDuration(session.total_worked_minutes)}
                                                            </td>

                                                            {/* Daily Total only on first row of the day */}
                                                            {sessionIndex === 0 && (
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900" rowSpan={day.sessions.length}>
                                                                    {formatDuration(day.total_minutes)}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                                        No attendance records found for this month.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    Please select a user to view their attendance report.
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
