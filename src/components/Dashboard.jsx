import React, { useState, useEffect } from 'react';
import { CreditCard, ShoppingCart, TrendingUp, ChevronRight, Settings, X, Check } from 'lucide-react';

const Dashboard = ({ products, isDarkMode, onSpentClick, onWishlistClick, onCountClick, isPublicView }) => {
    const [monthlyBudget, setMonthlyBudget] = useState(() => {
        const saved = localStorage.getItem('wishlist_monthly_budget');
        return saved ? parseFloat(saved) : 0;
    });
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [tempBudget, setTempBudget] = useState('');

    const activeWishlist = products.filter(p => !p.isPurchased && !p.isArchived);
    const totalWishlistValue = activeWishlist.reduce((sum, p) => sum + Number(p.price), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyPurchases = products.filter(p => {
        if (!p.isPurchased || !p.purchaseDate) return false;
        const pDate = new Date(p.purchaseDate);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });

    const monthlySpent = monthlyPurchases.reduce((sum, p) => sum + Number(p.price), 0);

    // Calculate budget percentage and color
    const budgetPercentage = monthlyBudget > 0 ? Math.min((monthlySpent / monthlyBudget) * 100, 100) : 0;
    const getBudgetColor = () => {
        if (budgetPercentage >= 100) return 'bg-red-500';
        if (budgetPercentage >= 75) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const handleSaveBudget = () => {
        const value = parseFloat(tempBudget) || 0;
        setMonthlyBudget(value);
        localStorage.setItem('wishlist_monthly_budget', value.toString());
        setIsEditingBudget(false);
    };

    const openBudgetEditor = (e) => {
        e.stopPropagation();
        setTempBudget(monthlyBudget > 0 ? monthlyBudget.toString() : '');
        setIsEditingBudget(true);
    };

    const stats = [
        {
            label: 'Totale Desideri',
            value: '€ ' + totalWishlistValue.toFixed(2),
            icon: <ShoppingCart size={20} />,
            color: 'bg-indigo-500',
            bgClass: isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100',
            iconColor: 'text-indigo-500',
            clickable: !isPublicView,
            onClick: onWishlistClick
        },
        ...(!isPublicView ? [{
            label: 'Speso questo Mese',
            value: '€ ' + monthlySpent.toFixed(2),
            icon: <CreditCard size={20} />,
            color: 'bg-emerald-500',
            bgClass: isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100',
            iconColor: 'text-emerald-500',
            clickable: true,
            onClick: onSpentClick,
            hasBudget: true
        }] : []),
        {
            label: 'Oggetti in Lista',
            value: activeWishlist.length,
            icon: <TrendingUp size={20} />,
            color: 'bg-orange-500',
            bgClass: isDarkMode ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-100',
            iconColor: 'text-orange-500',
            clickable: !isPublicView,
            onClick: onCountClick
        },
    ];

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        onClick={!isPublicView ? stat.onClick : undefined}
                        tabIndex={stat.clickable && !isPublicView ? 0 : -1}
                        className={`p-6 rounded-3xl border transition-all duration-300 focus:outline-none focus:ring-0 flex flex-col h-full ${stat.clickable && !isPublicView
                            ? 'cursor-pointer hover:shadow-md'
                            : 'cursor-default'
                            } ${isDarkMode
                                ? 'bg-zinc-900 border-zinc-800 ' + (stat.clickable && !isPublicView ? 'hover:border-zinc-700 hover:bg-zinc-800/80' : '')
                                : 'bg-white border-slate-100 shadow-sm ' + (stat.clickable && !isPublicView ? 'hover:border-slate-200' : '')
                            }`}
                    >
                        {/* Section 1: Header */}
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div className={'p-3 rounded-2xl border ' + stat.bgClass}>
                                    <span className={stat.iconColor}>{stat.icon}</span>
                                </div>
                                <span className={'text-xs font-bold uppercase tracking-widest ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                                    {stat.label}
                                </span>
                            </div>
                            {stat.hasBudget && (
                                <button
                                    onClick={openBudgetEditor}
                                    className={'p-2 rounded-xl transition-all ' + (isDarkMode ? 'hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600')}
                                    title="Imposta budget mensile"
                                >
                                    <Settings size={16} />
                                </button>
                            )}
                        </div>

                        {/* Section 2: Value (Centered vertically in the remaining space) */}
                        <div className="flex-1 flex items-center justify-between gap-2 mb-2">
                            <span className={'text-2xl font-bold tracking-tight ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>{stat.value}</span>
                            {stat.clickable && !isPublicView && (
                                <ChevronRight size={16} className={isDarkMode ? 'text-zinc-700' : 'text-slate-300'} />
                            )}
                        </div>

                        {/* Section 3: Footer (Budget, Info, or Decorative) */}
                        <div className="min-h-[52px] flex flex-col justify-end">
                            {stat.hasBudget && monthlyBudget > 0 ? (
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                            Budget: €{monthlyBudget.toFixed(0)}
                                        </span>
                                        <span className={'text-[10px] font-bold ' + (budgetPercentage >= 100 ? 'text-red-500' : budgetPercentage >= 75 ? 'text-amber-500' : 'text-emerald-500')}>
                                            {budgetPercentage.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className={'h-2 rounded-full overflow-hidden ' + (isDarkMode ? 'bg-zinc-800' : 'bg-slate-100')}>
                                        <div
                                            className={'h-full rounded-full transition-all duration-700 ease-out ' + getBudgetColor()}
                                            style={{ width: budgetPercentage + '%' }}
                                        />
                                    </div>
                                    {budgetPercentage >= 100 && (
                                        <p className="text-[10px] text-red-500 mt-1.5 font-medium">
                                            ⚠️ Budget superato di €{(monthlySpent - monthlyBudget).toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            ) : stat.label === 'Totale Desideri' ? (
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                            Media: €{activeWishlist.length > 0 ? (totalWishlistValue / activeWishlist.length).toFixed(2) : '0.00'} per oggetto
                                        </span>
                                    </div>
                                    <div className={'h-2 rounded-full overflow-hidden ' + (isDarkMode ? 'bg-zinc-800/50' : 'bg-slate-50')}>
                                        <div className={'h-full rounded-full w-0 ' + (isDarkMode ? 'bg-zinc-700' : 'bg-slate-200')} />
                                    </div>
                                </div>
                            ) : stat.label === 'Oggetti in Lista' ? (
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                            {activeWishlist.length} attivi • {products.filter(p => p.isPurchased).length} completati
                                        </span>
                                    </div>
                                    <div className={'h-2 rounded-full overflow-hidden ' + (isDarkMode ? 'bg-zinc-800/50' : 'bg-slate-50')}>
                                        <div className={'h-full rounded-full w-0 ' + (isDarkMode ? 'bg-zinc-700' : 'bg-slate-200')} />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-10 invisible" aria-hidden="true" />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Budget Edit Modal */}
            {isEditingBudget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditingBudget(false)} />
                    <div className={'relative w-full max-w-xs rounded-2xl p-6 shadow-2xl border ' + (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100')}>
                        <button
                            onClick={() => setIsEditingBudget(false)}
                            className={'absolute top-3 right-3 p-1.5 rounded-lg transition-colors ' + (isDarkMode ? 'text-zinc-500 hover:bg-zinc-800' : 'text-slate-400 hover:bg-slate-100')}
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-lg font-bold mb-4">Budget Mensile</h3>
                        <p className={'text-sm mb-4 ' + (isDarkMode ? 'text-zinc-400' : 'text-slate-500')}>
                            Imposta un tetto di spesa per questo mese
                        </p>

                        <div className="relative mb-4">
                            <span className={'absolute left-4 top-1/2 -translate-y-1/2 font-bold ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>€</span>
                            <input
                                type="number"
                                value={tempBudget}
                                onChange={(e) => setTempBudget(e.target.value)}
                                placeholder="0"
                                className={'w-full pl-10 pr-4 py-3 rounded-xl border transition-all text-lg font-bold ' + (isDarkMode
                                    ? 'bg-zinc-800 border-zinc-700 focus:border-emerald-500'
                                    : 'bg-slate-50 border-slate-200 focus:border-emerald-500') + ' focus:outline-none focus:ring-2 focus:ring-emerald-500/20'}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsEditingBudget(false)}
                                className={'flex-1 py-2.5 rounded-xl font-semibold border transition-all ' + (isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleSaveBudget}
                                className="flex-1 py-2.5 rounded-xl font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Check size={16} />
                                Salva
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
