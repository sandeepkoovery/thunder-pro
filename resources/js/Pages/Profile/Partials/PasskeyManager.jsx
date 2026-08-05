import React, { useState, useEffect } from 'react';
import { Fingerprint, ShieldCheck, Trash2, Plus, AlertCircle, Laptop, KeyRound } from 'lucide-react';
import { startPasskeyRegistration, isWebAuthnSupported } from '@/Utils/webauthn';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function PasskeyManager() {
    const [passkeys, setPasskeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const isSupported = isWebAuthnSupported();

    const fetchPasskeys = async () => {
        try {
            setLoading(true);
            const url = typeof route === 'function' ? route('passkeys.index') : '/passkeys';
            const res = await axios.get(url);
            setPasskeys(res.data.passkeys || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPasskeys();
    }, []);

    const handleEnablePasskey = async () => {
        if (!isSupported) {
            toast.error('Windows Hello / WebAuthn is not supported in this browser.');
            return;
        }

        try {
            setRegistering(true);
            const res = await startPasskeyRegistration('Windows Hello Passkey');
            toast.success(res.message || 'Passkey enabled successfully!');
            fetchPasskeys();
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || err.message || 'Failed to enable Windows Hello passkey.';
            if (!errMsg.includes('cancelled')) {
                toast.error(errMsg);
            }
        } finally {
            setRegistering(false);
        }
    };

    const handleDeletePasskey = async (id) => {
        if (!confirm('Are you sure you want to remove this passkey? You will no longer be able to log in with this Windows Hello credential.')) {
            return;
        }

        try {
            setDeletingId(id);
            const url = typeof route === 'function' ? route('passkeys.destroy', id) : `/passkeys/${id}`;
            const res = await axios.delete(url);
            toast.success(res.data.message || 'Passkey removed.');
            fetchPasskeys();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove passkey.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                        <Fingerprint className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Windows Hello & Passkeys
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Passwordless
                            </span>
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Log in instantly using your fingerprint, face recognition, or Windows PIN.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleEnablePasskey}
                    disabled={registering || !isSupported}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                    {registering ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Follow Windows Hello prompt...
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            Enable Passkey
                        </>
                    )}
                </button>
            </div>

            {!isSupported && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3 text-amber-800 text-xs sm:text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <strong>WebAuthn Not Supported:</strong> Your browser or device does not support WebAuthn passkeys. Please use Chrome or Edge on Windows 10/11.
                    </div>
                </div>
            )}

            {/* List of enrolled passkeys */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Your Saved Credentials ({passkeys.length})
                </h4>

                {loading ? (
                    <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                        Loading passkeys...
                    </div>
                ) : passkeys.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <KeyRound className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-600">No Passkey Enrolled</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                            Click <strong>"Enable Passkey"</strong> above to link your Windows Hello PIN, fingerprint, or face recognition for fast passwordless sign-in.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
                        {passkeys.map((pk) => (
                            <div key={pk.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-3.5">
                                    <div className="p-2.5 bg-white text-slate-700 rounded-xl shadow-xs border border-slate-100">
                                        <Laptop className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            {pk.device_name}
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 inline" />
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Created: {pk.created_at} • Last used: {pk.last_used_at}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleDeletePasskey(pk.id)}
                                    disabled={deletingId === pk.id}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Remove passkey"
                                >
                                    <Trash2 className="w-4.5 h-4.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
