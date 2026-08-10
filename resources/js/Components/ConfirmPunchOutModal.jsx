import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

export default function ConfirmPunchOutModal({ isOpen, onClose, onConfirm, processing = false }) {
    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="!bg-white rounded-[28px] p-7 sm:p-8 w-full max-w-md shadow-2xl shadow-slate-900/40 transform transition-all animate-in zoom-in-95 duration-200"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 
                    className="text-2xl sm:text-[26px] font-bold tracking-tight !text-slate-900"
                    style={{ color: '#0f172a' }}
                >
                    Punch Out
                </h3>
                <p 
                    className="text-sm font-medium mt-2 leading-relaxed !text-slate-600"
                    style={{ color: '#475569' }}
                >
                    Are you sure you want to punch out for today? Your current shift session will end.
                </p>
                <div className="mt-8 flex items-center justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="px-6 py-3 text-xs font-bold rounded-2xl tracking-wider uppercase transition-all cursor-pointer disabled:opacity-50 hover:bg-slate-200 !bg-slate-100 !text-slate-700"
                        style={{ backgroundColor: '#f1f5f9', color: '#334155' }}
                    >
                        CANCEL
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className="px-6 py-3 text-xs font-bold rounded-2xl tracking-wider uppercase shadow-lg transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 hover:bg-red-700 !bg-red-600 !text-white"
                        style={{ backgroundColor: '#dc2626', color: '#ffffff', boxShadow: '0 10px 15px -3px rgba(220, 38, 38, 0.3)' }}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin !text-white" />
                                PUNCHING OUT...
                            </>
                        ) : (
                            'PUNCH OUT'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
