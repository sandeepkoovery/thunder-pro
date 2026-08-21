import React, { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import {
    Database,
    HardDrive,
    Cloud,
    Play,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    ExternalLink,
    Trash2,
    AlertTriangle,
    Save,
    Check,
    Lock,
    Shield,
    FileSpreadsheet,
    Server,
    FolderKanban
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function DatabaseBackupSettings({
    backupSettings = {},
    gdriveStatus = {},
    backups = { data: [] },
    isProcessing = false
}) {
    const { auth } = usePage().props;

    // --- FORM 1: BACKUP & GOOGLE DRIVE CONFIGURATION ---
    const settingsForm = useForm({
        backup_auto_enabled: backupSettings.backup_auto_enabled ?? false,
        backup_daily_time: backupSettings.backup_daily_time || '23:59',
        backup_google_drive_folder: backupSettings.backup_google_drive_folder || 'WorkNest Backups',
    });

    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState(gdriveStatus);
    const [isBackingUp, setIsBackingUp] = useState(isProcessing);

    const [showParamsModal, setShowParamsModal] = useState(false);
    const [paramsClientId, setParamsClientId] = useState('');
    const [paramsClientSecret, setParamsClientSecret] = useState('');
    const [paramsRefreshToken, setParamsRefreshToken] = useState('');
    const [savingParams, setSavingParams] = useState(false);

    const handleSaveParams = async (e) => {
        e.preventDefault();
        setSavingParams(true);
        try {
            const res = await axios.post(route('google-drive.save-manual'), {
                client_id: paramsClientId,
                client_secret: paramsClientSecret,
                refresh_token: paramsRefreshToken,
            });
            if (res.data.success) {
                toast.success('Google OAuth Client credentials saved to database!');
                setShowParamsModal(false);
                handleTestConnection();
            } else {
                toast.error(res.data.error || 'Failed to save parameters.');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error saving parameters.');
        } finally {
            setSavingParams(false);
        }
    };

    // Save Settings
    const submitSettings = (e) => {
        e.preventDefault();
        settingsForm.post(route('admin.backups.settings.update'), {
            onError: () => toast.error('Failed to update backup settings.'),
        });
    };

    // Test Google Drive Connection
    const handleTestConnection = async () => {
        setTestingConnection(true);
        try {
            const response = await axios.post(route('admin.backups.test-gdrive'));
            setTestResult({
                connected: true,
                email: response.data.email,
                message: response.data.message
            });
            toast.success(response.data.message || 'Google Drive connection test successful!');
        } catch (error) {
            const msg = error.response?.data?.message || 'Google Drive connection test failed.';
            setTestResult({
                connected: false,
                message: msg
            });
            toast.error(msg);
        } finally {
            setTestingConnection(false);
        }
    };

    // Trigger Immediate Manual Backup ("Backup Now")
    const handleRunBackupNow = (e) => {
        e.preventDefault();
        if (isBackingUp) return;

        setIsBackingUp(true);
        toast.loading('Starting database backup process...', { id: 'manual-backup-toast' });

        router.post(route('admin.backups.run'), {}, {
            onSuccess: () => {
                setIsBackingUp(false);
                toast.success('Database backup created and uploaded successfully!', { id: 'manual-backup-toast' });
            },
            onError: (errors) => {
                setIsBackingUp(false);
                const msg = errors?.error || 'Database backup failed. Check server logs.';
                toast.error(msg, { id: 'manual-backup-toast' });
            },
            onFinish: () => {
                setIsBackingUp(false);
            }
        });
    };

    // Delete Backup History Entry
    const handleDeleteHistory = (id) => {
        if (!confirm('Are you sure you want to delete this backup log entry? (File on Google Drive will remain unaffected)')) return;

        router.delete(route('admin.backups.destroy', id), {
            onSuccess: () => toast.success('Backup history entry deleted.'),
            onError: () => toast.error('Failed to delete backup history entry.'),
        });
    };


    // Format 24h time to 12h display
    const formatTimeDisplay = (time24) => {
        if (!time24) return '11:59 PM';
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours, 10);
        if (isNaN(h)) return time24;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes || '00'} ${ampm}`;
    };

    // Disconnect Google Drive
    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect this Google Drive account?')) return;
        try {
            await axios.post(route('google-drive.disconnect'));
            setTestResult({ connected: false, message: 'Google Drive disconnected.' });
            toast.success('Google Drive account disconnected successfully.');
        } catch (err) {
            toast.error('Failed to disconnect Google Drive.');
        }
    };

    return (
        <div className="space-y-8 font-sans animate-in fade-in duration-200">
            {/* Super Admin Notice Banner */}
            <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 border border-indigo-100 rounded-[28px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-200 shrink-0">
                        <Shield size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-700">Super Admin Zone</span>
                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">Encrypted</span>
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mt-1">Automated MySQL Database Backup System</h2>
                        <p className="text-xs text-gray-600 font-semibold mt-0.5">Create full database dumps, upload to Google Drive with automated YYYY/MM/DD folder organization, and monitor backup health.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleRunBackupNow}
                        disabled={isBackingUp}
                        className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {isBackingUp ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Processing Backup...
                            </>
                        ) : (
                            <>
                                <Play size={16} fill="currentColor" />
                                Backup Now
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Grid 1: Google Drive & Automatic Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* CARD 1: GOOGLE DRIVE CONFIGURATION */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <Cloud size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Google Drive Integration</h3>
                                    <p className="text-xs text-gray-500 font-medium">Manage OAuth connection and base backup directory</p>
                                </div>
                            </div>
                            
                            {/* Connection Status Badge */}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                                testResult.connected
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                                {testResult.connected ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                {testResult.connected ? 'Connected' : 'Not Connected'}
                            </span>
                        </div>

                        {/* Connection Details */}
                        <div className="space-y-4 mb-6">
                            {testResult.connected ? (
                                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Authorized Account</p>
                                        <p className="text-sm font-bold text-emerald-950 mt-0.5">{testResult.email || 'Google Drive Connected'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={route('google-drive.connect')}
                                            className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors shadow-xs"
                                        >
                                            Reconnect
                                        </a>
                                        <button
                                            type="button"
                                            onClick={handleDisconnect}
                                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors shadow-xs cursor-pointer"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            ) : (

                                <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Account Action Required</p>
                                        <p className="text-xs text-amber-900 font-medium mt-0.5">{testResult.message || 'No Google Drive account linked.'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowParamsModal(true)}
                                            className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                                        >
                                            <Lock size={14} className="text-amber-700" />
                                            <span>Configure Client ID & Secret</span>
                                        </button>
                                        <a
                                            href={route('google-drive.connect')}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                                        >
                                            <Cloud size={14} />
                                            <span>Connect Drive</span>
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Base Target Folder Name Input */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Base Backup Folder Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <FolderKanban size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={settingsForm.data.backup_google_drive_folder}
                                        onChange={(e) => settingsForm.setData('backup_google_drive_folder', e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="WorkNest Backups"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 font-medium mt-1.5">
                                    Backups will be stored under: <span className="font-bold text-gray-600">{settingsForm.data.backup_google_drive_folder || 'WorkNest Backups'}/YYYY/MM/DD/</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Test Connection Button */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleTestConnection}
                            disabled={testingConnection}
                            className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={testingConnection ? 'animate-spin' : ''} />
                            {testingConnection ? 'Testing...' : 'Test Connection'}
                        </button>
                    </div>
                </div>

                {/* CARD 2: AUTOMATIC BACKUP SETTINGS */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
                    <form onSubmit={submitSettings} className="space-y-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Automatic Backup Schedule</h3>
                                    <p className="text-xs text-gray-500 font-medium">Configure daily backup timing & execution status</p>
                                </div>
                            </div>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <div className="p-4 bg-gray-50/60 border border-gray-100 rounded-2xl flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Automatic Daily Backup</h4>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Enable background database dumps via Laravel Scheduler</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settingsForm.data.backup_auto_enabled}
                                    onChange={(e) => settingsForm.setData('backup_auto_enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>

                        {/* Time Picker & Timezone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Daily Backup Time (24h)
                                </label>
                                <input
                                    type="time"
                                    value={settingsForm.data.backup_daily_time}
                                    onChange={(e) => settingsForm.setData('backup_daily_time', e.target.value)}
                                    className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-extrabold text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Server Timezone
                                </label>
                                <div className="px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 flex items-center justify-between">
                                    <span>{backupSettings.timezone || 'Asia/Kolkata'}</span>
                                    <Lock size={14} className="text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Live Summary Box */}
                        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Active Backup Configuration</p>
                            <div className="flex items-center gap-4 text-xs font-bold text-indigo-950">
                                <span>Status: <strong className={settingsForm.data.backup_auto_enabled ? 'text-emerald-600' : 'text-rose-500'}>
                                    {settingsForm.data.backup_auto_enabled ? 'ENABLED' : 'DISABLED'}
                                </strong></span>
                                <span>•</span>
                                <span>Daily Time: <strong className="text-indigo-900">{formatTimeDisplay(settingsForm.data.backup_daily_time)} ({backupSettings.timezone || 'Asia/Kolkata'})</strong></span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={settingsForm.processing}
                                className="px-8 py-3.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                            >
                                <Save size={16} />
                                {settingsForm.processing ? 'SAVING...' : 'SAVE BACKUP SETTINGS'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* CARD 4: BACKUP HISTORY TABLE */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Backup History Logs</h3>
                        <p className="text-xs text-gray-500 font-medium">Complete record of automated and manual database dumps</p>
                    </div>
                    <span className="px-3.5 py-1.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl">
                        Total Backups: {backups.total || backups.data?.length || 0}
                    </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="py-4 px-4">Date & Time</th>
                                <th className="py-4 px-4">File Name</th>
                                <th className="py-4 px-4">Type</th>
                                <th className="py-4 px-4">File Size</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-4">Google Drive</th>
                                <th className="py-4 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm font-medium">
                            {backups.data && backups.data.length > 0 ? (
                                backups.data.map((backup) => {
                                    const isSuccess = backup.status === 'completed';
                                    const isFailed = backup.status === 'failed';
                                    const isRunning = backup.status === 'processing';
                                    const isAuto = backup.trigger_type === 'automatic';

                                    return (
                                        <tr key={backup.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-4 px-4 text-gray-900 font-bold whitespace-nowrap">
                                                {backup.backup_started_at || backup.created_at}
                                            </td>
                                            <td className="py-4 px-4 font-extrabold text-slate-800 font-mono text-xs">
                                                {backup.file_name}
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                    isAuto
                                                        ? 'bg-purple-50 text-purple-700 border border-purple-200/80'
                                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                                                }`}>
                                                    {isAuto ? 'AUTOMATIC' : 'MANUAL'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-bold text-gray-600 whitespace-nowrap">
                                                {backup.formatted_file_size}
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                                    isSuccess
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : isFailed
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                                }`}>
                                                    {isSuccess && <CheckCircle2 size={13} />}
                                                    {isFailed && <XCircle size={13} />}
                                                    {isRunning && <RefreshCw size={13} className="animate-spin" />}
                                                    {backup.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                {backup.google_drive_link ? (
                                                    <a
                                                        href={backup.google_drive_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors"
                                                    >
                                                        <ExternalLink size={13} />
                                                        View in Drive
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Unavailable</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isFailed && backup.error_message && (
                                                        <button
                                                            type="button"
                                                            onClick={() => alert(`Error details:\n${backup.error_message}`)}
                                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                                            title={backup.error_message}
                                                        >
                                                            <AlertTriangle size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteHistory(backup.id)}
                                                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                        title="Delete log entry"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-400 font-medium">
                                        No database backups found in history. Click <strong>&quot;Backup Now&quot;</strong> above to create your first dump.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination links if available */}
                {backups.links && backups.links.length > 3 && (
                    <div className="mt-6 flex justify-end gap-1">
                        {backups.links.map((link, idx) => (
                            <a
                                key={idx}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                    link.active
                                        ? 'bg-[#0f172a] text-white shadow-xs'
                                        : 'text-gray-500 hover:bg-gray-100'
                                } ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Google OAuth Client Credentials Modal */}
            {showParamsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-2xl">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base text-gray-900">Google OAuth Credentials</h3>
                                    <p className="text-xs text-gray-500 font-medium">Configure Client ID & Secret for Google Drive</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowParamsModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-100 text-xs text-blue-900 font-medium space-y-1">
                            <p className="font-bold text-blue-950">How to get Client ID & Secret:</p>
                            <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-blue-900/90">
                                <li>Create a project in <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="underline font-bold">Google Cloud Console</a>.</li>
                                <li>Enable <strong>Google Drive API</strong> in API Library.</li>
                                <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                                <li>Set Authorized Redirect URI to: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[10px]">{typeof window !== 'undefined' ? `${window.location.origin}/google-drive/callback` : '/google-drive/callback'}</code></li>
                            </ol>
                        </div>

                        <form onSubmit={handleSaveParams} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Google Client ID
                                </label>
                                <input
                                    type="text"
                                    value={paramsClientId}
                                    onChange={(e) => setParamsClientId(e.target.value)}
                                    placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                                    className="w-full text-xs font-mono p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Google Client Secret
                                </label>
                                <input
                                    type="password"
                                    value={paramsClientSecret}
                                    onChange={(e) => setParamsClientSecret(e.target.value)}
                                    placeholder="e.g. GOCSPX-xxxxxxxxxxxxxxxxx"
                                    className="w-full text-xs font-mono p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Refresh Token (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={paramsRefreshToken}
                                    onChange={(e) => setParamsRefreshToken(e.target.value)}
                                    placeholder="Leave empty if using OAuth login flow"
                                    className="w-full text-xs font-mono p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowParamsModal(false)}
                                    className="px-4 py-2.5 text-xs text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingParams}
                                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                >
                                    {savingParams ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                    <span>Save Credentials</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
