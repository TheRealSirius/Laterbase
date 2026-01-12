import React, { useEffect } from 'react';
import { X, Archive, RotateCcw, ShoppingBag, Tag } from 'lucide-react';

const ArchiveModal = ({ onClose, products, isDarkMode, onToggleArchive }) => {
    const archivedItems = products.filter(p => !p.isPurchased && p.isArchived);
    const totalArchivedValue = archivedItems.reduce((sum, p) => sum + Number(p.price), 0);

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
                className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border cursor-default ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                                <Archive size={28} />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sogni nel Cassetto</h2>
                                <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Oggetti archiviati fuori budget</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className={`mb-6 p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-center">
                            <span className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Valore Sogni nel Cassetto</span>
                            <span className={`text-2xl font-black ${isDarkMode ? 'text-amber-500' : 'text-amber-600'}`}>€ {totalArchivedValue.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-3 custom-scrollbar">
                        {archivedItems.length > 0 ? (
                            archivedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isDarkMode
                                        ? 'bg-zinc-950 border-zinc-800'
                                        : 'bg-white border-slate-100 shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 overflow-hidden text-left">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-50 text-slate-400'}`}>
                                            <Tag size={16} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className={`font-bold truncate ${isDarkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{item.name}</h3>
                                            <p className={`text-xs font-medium ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{item.category} • € {Number(item.price).toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onToggleArchive(item.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isDarkMode
                                            ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white'}`}
                                    >
                                        <RotateCcw size={14} />
                                        <span className="hidden sm:inline">Riporta in lista</span>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-zinc-950 text-zinc-800' : 'bg-slate-50 text-slate-200'}`}>
                                    <ShoppingBag size={40} />
                                </div>
                                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Cassetto vuoto</h3>
                                <p className={`text-sm ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'} mt-2`}>Non hai ancora archiviato nessun desiderio costoso.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArchiveModal;
