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
        <UserLayout
            title="Attendance History"
        >
            <Head title="Attendance History" />

            <div className="py-6">
                <div className="w-full">
                    <div className="bg-white overflow-hidden shadow-sm">
                        <div className="p-6 text-gray-900 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h3 className="text-lg font-bold text-gray-800">Your Records</h3>
                            <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full font-bold border border-blue-100 text-xs uppercase tracking-wider">
                                Monthly Total: {formatDuration(totalMonthlyMinutes)}
                            </div>
                        </div>

                        <div className="p-6 text-gray-900">

                            {/* Filter Section */}
                            <div className="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-lg items-end">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-1">Select Month</label>
                                    <MonthPicker
                                        value={filters.month || ''}
                                        onChange={handleMonthChange}
                                        className="min-w-[200px]"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                                        title="Reset Filter"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Reset
                                    </button>
                                </div>
                            </div>

                            {/* Attendance List Table */}
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worked Hours</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {attendanceData.length > 0 ? (
                                            attendanceData.map((record) => (
                                                <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${getRowStyle(record.status)}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {new Date(record.date).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        <div className="flex items-center">
                                                            <Clock className="w-4 h-4 mr-2 text-green-500" />
                                                            {record.check_in}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        <div className="flex items-center">
                                                            <Clock className="w-4 h-4 mr-2 text-red-400" />
                                                            {record.check_out}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                        {record.hours}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                            <Coffee className="w-4 h-4 mr-2 text-orange-400" />
                                                            {record.break_time}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                                    No attendance records found for this month.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
