import React from 'react';
import { X, Trash2 } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, productName, title, message, irreversible, confirmLabel, isDarkMode, t }) => {
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
                        <Trash2 size={24} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{title || t('deleteModal.title')}</h3>
                    <p className={'text-sm ' + (isDarkMode ? 'text-zinc-400' : 'text-slate-500')}>
                        {message || t('deleteModal.message').replace('{product}', productName ? `"${productName}"` : t('deleteModal.thisProduct'))}
                    </p>
                    <p className={'text-xs mt-2 ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                        {irreversible || t('deleteModal.irreversible')}
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
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-all"
                    >
                        {confirmLabel || t('common.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
