import React, { useState, useEffect } from 'react';
import { X, PieChart, TrendingUp, ShoppingBag, Target, Wallet } from 'lucide-react';

const BudgetAnalysisModal = ({ onClose, products, categories, isDarkMode, initialMode = 'spent' }) => {
    const [mode, setMode] = useState(initialMode); // 'spent' or 'wishlist'

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const filteredItems = products.filter(p => {
        if (mode === 'spent') {
            if (!p.isPurchased || !p.purchaseDate) return false;
            const pDate = new Date(p.purchaseDate);
            return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        } else {
            return !p.isPurchased;
        }
    });

    const totalAmount = filteredItems.reduce((sum, p) => sum + Number(p.price), 0);

    const categoryBreakdown = categories.map(cat => {
        const amount = filteredItems
            .filter(p => p.category === cat)
            .reduce((sum, p) => sum + Number(p.price), 0);

        return {
            name: cat,
            amount: amount,
            percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    const barColors = [
        'from-emerald-500 to-teal-400',
        'from-blue-500 to-indigo-400',
        'from-violet-500 to-purple-400',
        'from-rose-500 to-pink-400',
        'from-orange-500 to-amber-400',
        'from-cyan-500 to-blue-400'
    ];

    return (
        <div
            className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300 cursor-pointer ${isDarkMode ? 'bg-zinc-950/50' : 'bg-slate-900/30'}`}
            onClick={onClose}
        >
            <div
                className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border cursor-default ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <PieChart size={24} />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Analisi Budget</h2>
                                <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                                    {mode === 'spent' ? 'Spese Mese Corrente' : 'Breakdown Wishlist Attiva'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Mode Toggle */}
                    <div className={`flex p-1 rounded-2xl mb-8 border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                        <button
                            onClick={() => setMode('spent')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'spent'
                                ? (isDarkMode ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-slate-900 shadow-sm border border-slate-200/50')
                                : (isDarkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-slate-400 hover:text-slate-600')
                                }`}
                        >
                            <Wallet size={14} />
                            <span>Speso</span>
                        </button>
                        <button
                            onClick={() => setMode('wishlist')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${mode === 'wishlist'
                                ? (isDarkMode ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-slate-900 shadow-sm border border-slate-200/50')
                                : (isDarkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-slate-400 hover:text-slate-600')
                                }`}
                        >
                            <Target size={14} />
                            <span>Desideri</span>
                        </button>
                    </div>

                    <div className={`p-6 rounded-2xl mb-8 flex items-center justify-between ${isDarkMode ? 'bg-indigo-500/5 border border-indigo-500/10' : 'bg-indigo-50 border border-indigo-100'}`}>
                        <div className="flex-1">
                            <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                                {mode === 'spent' ? 'Totale Speso' : 'Valore Wishlist'}
                            </span>
                            <div className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>€ {totalAmount.toFixed(2)}</div>

                            {mode === 'wishlist' && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-emerald-500/80' : 'text-emerald-600'}`}>Risparmio Potenziale:</span>
                                    <span className={`text-xs font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                        € {products
                                            .filter(p => !p.isPurchased && p.targetPrice && Number(p.price) > Number(p.targetPrice))
                                            .reduce((sum, p) => sum + (Number(p.price) - Number(p.targetPrice)), 0)
                                            .toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-500/10 text-indigo-500' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}`}>
                            {mode === 'spent' ? <TrendingUp size={24} /> : <ShoppingBag size={24} />}
                        </div>
                    </div>

                    <div className="space-y-6 overflow-y-auto pr-2 max-h-[35vh] scroll-smooth">
                        {categoryBreakdown.length > 0 ? (
                            categoryBreakdown.map((item, idx) => (
                                <div key={idx} className="space-y-2 group">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold transition-colors ${isDarkMode ? 'text-zinc-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>{item.name}</span>
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-200 text-slate-500'}`}>{item.percentage.toFixed(0)}%</span>
                                        </div>
                                        <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>€ {item.amount.toFixed(2)}</span>
                                    </div>
                                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${barColors[idx % barColors.length]}`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 space-y-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDarkMode ? 'bg-zinc-950 text-zinc-800' : 'bg-slate-50 text-slate-200'}`}>
                                    <Target size={32} />
                                </div>
                                <div>
                                    <p className={`font-bold ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                                        {mode === 'spent' ? 'Nessuna spesa registrata, ottimo lavoro!' : 'La tua wishlist è vuota, aggiungi qualcosa!'}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'} mt-1`}>Mantieni il controllo del tuo budget.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-zinc-800/50">
                        <button
                            onClick={onClose}
                            className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-[0.98] flex items-center justify-center ${isDarkMode
                                ? 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-white/5'
                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'}`}
                        >
                            <span>Ho capito</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetAnalysisModal;
