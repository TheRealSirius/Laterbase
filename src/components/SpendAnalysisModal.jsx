import React from 'react';
import { X, PieChart, TrendingUp, ChevronRight } from 'lucide-react';

const SpendAnalysisModal = ({ onClose, products, categories, isDarkMode }) => {
    // Current month stats
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyPurchases = products.filter(p => {
        if (!p.isPurchased || !p.purchaseDate) return false;
        const pDate = new Date(p.purchaseDate);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });

    const totalSpent = monthlyPurchases.reduce((sum, p) => sum + Number(p.price), 0);

    // Group by category
    const categoryBreakdown = categories.map(cat => {
        const spent = monthlyPurchases
            .filter(p => p.category === cat)
            .reduce((sum, p) => sum + Number(p.price), 0);

        return {
            name: cat,
            amount: spent,
            percentage: totalSpent > 0 ? (spent / totalSpent) * 100 : 0
        };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    return (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300 ${isDarkMode ? 'bg-zinc-950/50' : 'bg-slate-900/30'}`}>
            <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`}>
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                <PieChart size={24} />
                            </div>
                            <div>
                                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Analisi Spese</h2>
                                <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Mese Corrente</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className={`p-6 rounded-2xl mb-8 flex items-center justify-between ${isDarkMode ? 'bg-zinc-950 border border-zinc-800' : 'bg-slate-50 border border-slate-100'}`}>
                        <div>
                            <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Totale Speso</span>
                            <div className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>€ {totalSpent.toFixed(2)}</div>
                        </div>
                        <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
                            <TrendingUp size={24} />
                        </div>
                    </div>

                    <div className="space-y-6 overflow-y-auto pr-2 max-h-[40vh]">
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
                                            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-500 to-teal-400`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <p className={isDarkMode ? 'text-zinc-500' : 'text-slate-400'}>Nessuna spesa registrata questo mese.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-zinc-800/50">
                        <button
                            onClick={onClose}
                            className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-[0.98] ${isDarkMode
                                ? 'bg-white text-zinc-950 hover:bg-zinc-200'
                                : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                            Chiudi Analisi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpendAnalysisModal;
