import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { BarChart3 } from 'lucide-react';

export default function Report() {
    return (
        <AdminLayout title="Reports">
            <Head title="Reports" />
            <div className="p-4 sm:p-6 w-full space-y-6 font-sans">
                {/* Elegant Placeholder Screen */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-20">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 shadow-sm">
                        <BarChart3 size={32} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Reports Module Coming Soon</h2>
                    <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                        We are currently polishing the report metrics, analytic charts, and export actions. Please check back soon!
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
