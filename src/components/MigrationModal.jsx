import React, { useState } from 'react';
import { X, Upload, Trash2, CloudOff, Check } from 'lucide-react';

const MigrationModal = ({ isOpen, onClose, onMigrate, onSkip, localProductCount, isDarkMode }) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleMigrate = async () => {
        setLoading(true);
        try {
            await onMigrate();
            onClose();
        } catch (err) {
            console.error('Migration error:', err);
            setLoading(false);
        }
    };

    const handleSkip = () => {
        onSkip();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className={'relative w-full max-w-md rounded-3xl p-8 shadow-2xl border ' +
                (isDarkMode
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-white border-slate-100')}>

                <button
                    onClick={onClose}
                    className={'absolute top-4 right-4 p-2 rounded-xl transition-colors ' +
                        (isDarkMode
                            ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')}
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-8">
                    <div className={'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ' +
                        (isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50')}>
                        <Upload size={28} className="text-indigo-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Dati Locali Trovati</h2>
                    <p className={'text-sm ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-500')}>
                        Hai <strong>{localProductCount}</strong> prodotti salvati localmente. Vuoi caricarli nel cloud?
                    </p>
                </div>

                <div className={'p-4 rounded-2xl mb-6 ' +
                    (isDarkMode ? 'bg-zinc-800/50' : 'bg-slate-50')}>
                    <div className="flex items-start gap-3">
                        <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className={'text-sm ' + (isDarkMode ? 'text-zinc-400' : 'text-slate-600')}>
                            Caricando i dati, potrai accedervi da qualsiasi dispositivo e non perderai nulla.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleMigrate}
                        disabled={loading}
                        className={'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ' +
                            (isDarkMode
                                ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                                : 'bg-slate-900 text-white hover:bg-slate-800')}
                    >
                        <Upload size={18} />
                        {loading ? 'Caricamento...' : 'Carica nel Cloud'}
                    </button>

                    <button
                        onClick={handleSkip}
                        disabled={loading}
                        className={'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border disabled:opacity-50 ' +
                            (isDarkMode
                                ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
                    >
                        <CloudOff size={18} />
                        Inizia da Zero
                    </button>
                </div>

                <p className={'text-center text-xs mt-6 ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                    I dati locali rimarranno sul dispositivo in entrambi i casi
                </p>
            </div>
        </div>
    );
};

export default MigrationModal;
