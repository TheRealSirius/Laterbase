import React, { useEffect } from 'react';
import { X, Tag, ArrowRight, ShoppingBag, Search } from 'lucide-react';

const WishlistRecapModal = ({ onClose, products, isDarkMode, onNavigate }) => {
    const activeItems = products.filter(p => !p.isPurchased);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div
            className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300 cursor-pointer ${isDarkMode ? 'bg-zinc-950/50' : 'bg-slate-900/30'}`}
            onClick={onClose}
        >
            <div
                className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border cursor-default ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                                <Search size={24} />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>I tuoi Desideri</h2>
                                <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Recap veloce oggetti attivi</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-3 custom-scrollbar">
                        {activeItems.length > 0 ? (
                            activeItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group ${isDarkMode
                                        ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                                        : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 overflow-hidden text-left">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-slate-400 shadowed-sm'}`}>
                                            <Tag size={16} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className={`font-bold truncate ${isDarkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{item.name}</h3>
                                            <p className={`text-xs font-medium ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{item.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                        <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>€ {Number(item.price).toFixed(2)}</span>
                                        <ArrowRight size={16} className={`transition-transform group-hover:translate-x-1 ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`} />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-zinc-950 text-zinc-800' : 'bg-slate-50 text-slate-200'}`}>
                                    <ShoppingBag size={40} />
                                </div>
                                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>La tua wishlist è pronta...</h3>
                                <p className={`text-sm ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'} mt-2`}>...per essere riempita di nuovi desideri!</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-zinc-800/50">
                        <button
                            onClick={onClose}
                            className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center ${isDarkMode
                                ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                                : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200'}`}
                        >
                            Ho capito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WishlistRecapModal;
