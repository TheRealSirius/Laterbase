import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';

const PriceUpdateModal = ({ isOpen, onClose, onSave, product, isDarkMode }) => {
    const [newPrice, setNewPrice] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setNewPrice(product?.price || '');
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }

        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, product, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newPrice && !isNaN(newPrice)) {
            onSave(product.id, newPrice);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in duration-200 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-zinc-800/50 flex justify-between items-start">
                    <div>
                        <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Aggiorna Prezzo
                        </h3>
                        {product?.lastChecked && (
                            <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                                Controllo: {new Date(product.lastChecked).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'
                            }`}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                            Nuovo Prezzo (€)
                        </label>
                        <input
                            ref={inputRef}
                            type="number"
                            step="0.01"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            placeholder="0.00"
                            className={`w-full px-4 py-3 rounded-xl text-lg font-bold outline-none transition-all border ${isDarkMode
                                ? 'bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20'
                                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20'
                                }`}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <Save size={18} />
                        Salva prezzo
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PriceUpdateModal;
