import React from 'react';
import UserLayout from '@/Layouts/UserLayout';
import { Head, router } from '@inertiajs/react';
import MonthPicker from '@/Components/MonthPicker';
import { Clock, Coffee, RotateCcw } from 'lucide-react';

export default function Index({ attendanceData, filters, totalMonthlyMinutes }) {

    const handleMonthChange = (val) => {
        router.get(route('attendance.index'), { month: val }, {
            preserveState: true,
            replace: true
        });
    };

    const handleReset = () => {
        router.get(route('attendance.index'), {}, { replace: true });
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '0h 0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-600';
            case 'Late':
            case 'Early Leave':
            case 'Late & Early Leave': return 'bg-orange-100 text-orange-600';
            case 'Absent': return 'bg-red-100 text-red-600';
            case 'OFF': return 'bg-blue-100 text-blue-600';
            case 'On Leave':
            case 'Leave': return 'bg-purple-100 text-purple-600';
            default: return 'bg-gray-50 text-gray-400';
        }
    };

    const getRowStyle = (status) => {
        if (status === 'OFF') return 'bg-gray-50/50 opacity-80';
        if (status === 'Absent') return 'bg-red-50/30';
        return '';
    };

    return (
        <UserLayout title="Attendance History">
            <Head title="Attendance History" />

            <div className="space-y-4">
                {/* Page Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-800">Attendance History</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Your monthly attendance records</p>
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-bold border border-blue-100 text-xs uppercase tracking-wider self-start sm:self-auto">
                        Total: {formatDuration(totalMonthlyMinutes)}
                    </div>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="mp-filter-bar flex flex-wrap gap-3 items-end">
                        <div className="flex flex-col flex-1" style={{ minWidth: '160px' }}>
                            <label className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Select Month</label>
                            <MonthPicker
                                value={filters.month || ''}
                                onChange={handleMonthChange}
                                className="w-full"
                            />
                        </div>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                            title="Reset Filter"
                            style={{ minHeight: '44px' }}
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>

                {/* Attendance Table — card-view on mobile, table on desktop */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worked</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {attendanceData.length > 0 ? (
                                    attendanceData.map((record) => (
                                        <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${getRowStyle(record.status)}`}>
                                            <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-green-500" />
                                                    {record.check_in || '—'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-red-400" />
                                                    {record.check_out || '—'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">{record.hours}</td>
                                            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Coffee className="w-4 h-4 text-orange-400" />
                                                    {record.break_time}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-10 text-center text-gray-500 text-sm">
                                            No attendance records found for this month.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="sm:hidden p-4 space-y-3">
                        {attendanceData.length > 0 ? (
                            attendanceData.map((record) => (
                                <div
                                    key={record.id}
                                    className={`rounded-xl border border-gray-100 p-4 shadow-sm ${getRowStyle(record.status)}`}
                                >
                                    {/* Card header: date + status */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-gray-800">
                                            {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                            {record.status}
                                        </span>
                                    </div>
                                    {/* Card body: times + hours */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center bg-green-50 rounded-lg py-2 px-1">
                                            <div className="text-xs text-gray-400 mb-1">In</div>
                                            <div className="text-xs font-semibold text-green-700">{record.check_in || '—'}</div>
                                        </div>
                                        <div className="text-center bg-red-50 rounded-lg py-2 px-1">
                                            <div className="text-xs text-gray-400 mb-1">Out</div>
                                            <div className="text-xs font-semibold text-red-600">{record.check_out || '—'}</div>
                                        </div>
                                        <div className="text-center bg-blue-50 rounded-lg py-2 px-1">
                                            <div className="text-xs text-gray-400 mb-1">Hours</div>
                                            <div className="text-xs font-semibold text-blue-700">{record.hours || '—'}</div>
                                        </div>
                                    </div>
                                    {record.break_time && (
                                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                            <Coffee className="w-3.5 h-3.5 text-orange-400" />
                                            Break: {record.break_time}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-gray-500 text-sm">
                                No attendance records found for this month.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
