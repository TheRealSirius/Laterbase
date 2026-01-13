import React from 'react';
import { X, LogOut } from 'lucide-react';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm, isDarkMode }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className={'relative w-full max-w-sm rounded-2xl p-6 shadow-2xl border ' +
                (isDarkMode
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-white border-slate-100')}>

                <button
                    onClick={onClose}
                    className={'absolute top-3 right-3 p-1.5 rounded-lg transition-colors ' +
                        (isDarkMode
                            ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')}
                >
                    <X size={18} />
                </button>

                <div className="text-center mb-6">
                    <div className={'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ' +
                        (isDarkMode ? 'bg-red-500/10' : 'bg-red-50')}>
                        <LogOut size={24} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Logout</h3>
                    <p className={'text-sm ' + (isDarkMode ? 'text-zinc-400' : 'text-slate-500')}>
                        Sei sicuro di voler uscire?
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className={'flex-1 py-2.5 rounded-xl font-semibold transition-all border ' +
                            (isDarkMode
                                ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
                    >
                        Annulla
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-all"
                    >
                        Esci
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutConfirmModal;
