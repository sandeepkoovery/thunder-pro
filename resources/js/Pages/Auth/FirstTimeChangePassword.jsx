import React from 'react';
import { Head } from '@inertiajs/react';
import ChangePasswordModal from '@/Components/ChangePasswordModal';

export default function FirstTimeChangePassword({ user }) {
    return (
        <div className="min-h-screen bg-slate-900 relative overflow-hidden font-sans flex flex-col items-center justify-center p-4 sm:p-6">
            <Head title="Create Permanent Password" />
            <ChangePasswordModal isOpen={true} user={user} />
        </div>
    );
}
