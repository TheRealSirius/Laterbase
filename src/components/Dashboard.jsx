import React, { useState } from 'react';
import { CreditCard, ShoppingCart, TrendingUp, ChevronRight, Settings, X, Check } from 'lucide-react';

const defaultSettings = {
    monthlyBudget: 0,
    savingsFund: 0,
    extraInfoEnabled: { total: true, spent: true, count: true },
};

const Dashboard = ({ products, isDarkMode, onSpentClick, onWishlistClick, onCountClick, isPublicView, settings = defaultSettings, onSettingsChange, t, formatCurrency, currencyCode }) => {
    const monthlyBudget = Number(settings.monthlyBudget) || 0;
    const savingsFund = Number(settings.savingsFund) || 0;
    const extraInfoEnabled = {
        ...defaultSettings.extraInfoEnabled,
        ...(settings.extraInfoEnabled || {}),
    };
    const [editingCard, setEditingCard] = useState(null); // 'total', 'spent', or 'count'
    const [tempBudget, setTempBudget] = useState('');
    const [tempSavings, setTempSavings] = useState('');

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

    // Calculate Wishlist Completion Percentage
    const purchasedCount = products.filter(p => p.isPurchased).length;
    const totalCount = products.filter(p => !p.isArchived).length;
    const completionPercentage = totalCount > 0 ? Math.min((purchasedCount / totalCount) * 100, 100) : 0;

    const handleSaveSettings = () => {
        if (editingCard === 'spent') {
            const value = parseFloat(tempBudget) || 0;
            onSettingsChange?.({ ...settings, monthlyBudget: value, extraInfoEnabled });
        } else if (editingCard === 'total') {
            const value = parseFloat(tempSavings) || 0;
            onSettingsChange?.({ ...settings, savingsFund: value, extraInfoEnabled });
        }
        setEditingCard(null);
    };

    const toggleExtraInfo = (id) => {
        const newState = { ...extraInfoEnabled, [id]: !extraInfoEnabled[id] };
        onSettingsChange?.({ ...settings, extraInfoEnabled: newState });
    };

    const openSettings = (e, cardId) => {
        e.stopPropagation();
        if (cardId === 'spent') {
            setTempBudget(monthlyBudget > 0 ? monthlyBudget.toString() : '');
        } else if (cardId === 'total') {
            setTempSavings(savingsFund > 0 ? savingsFund.toString() : '');
        }
        setEditingCard(cardId);
    };

    const stats = [
        {
            id: 'total',
            label: t('dashboard.totalWishes'),
            value: formatCurrency(totalWishlistValue),
            icon: <ShoppingCart size={20} />,
            color: 'bg-indigo-500',
            bgClass: isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100',
            iconColor: 'text-indigo-500',
            clickable: !isPublicView,
            onClick: onWishlistClick
        },
        ...(!isPublicView ? [{
            id: 'spent',
            label: t('dashboard.spentThisMonth'),
            value: formatCurrency(monthlySpent),
            icon: <CreditCard size={20} />,
            color: 'bg-emerald-500',
            bgClass: isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100',
            iconColor: 'text-emerald-500',
            clickable: true,
            onClick: onSpentClick,
            hasBudget: true
        }] : []),
        {
            id: 'count',
            label: t('dashboard.itemsInList'),
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
                            {!isPublicView && (
                                <button
                                    onClick={(e) => openSettings(e, stat.id)}
                                    className={'p-2 rounded-xl transition-all ' + (isDarkMode ? 'hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600')}
                                    title={t('dashboard.cardSettings')}
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
                        <div className={(extraInfoEnabled[stat.id] ? "mt-4 " : "") + "flex flex-col justify-end"}>
                            {extraInfoEnabled[stat.id] ? (
                                <>
                                    {stat.hasBudget && monthlyBudget > 0 ? (
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                                    {t('dashboard.budget')}: {formatCurrency(monthlyBudget)}
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
                                                    {t('dashboard.budgetExceeded')} {formatCurrency(monthlySpent - monthlyBudget)}
                                                </p>
                                            )}
                                        </div>
                                    ) : stat.id === 'total' ? (
                                        savingsFund > 0 ? (
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                                        {savingsFund >= totalWishlistValue
                                                            ? t('dashboard.canAffordAll')
                                                            : t('dashboard.canAffordPercent').replace('{percent}', Math.floor((savingsFund / totalWishlistValue) * 100))}
                                                    </span>
                                                    <span className={'text-[10px] font-bold ' + (savingsFund >= totalWishlistValue ? 'text-emerald-500' : isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>
                                                        {formatCurrency(savingsFund)}
                                                    </span>
                                                </div>
                                                <div className={'h-2 rounded-full overflow-hidden ' + (isDarkMode ? 'bg-zinc-800/50' : 'bg-slate-50')}>
                                                    <div
                                                        className={'h-full rounded-full transition-all duration-700 ease-out ' + (savingsFund >= totalWishlistValue ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-indigo-500')}
                                                        style={{ width: Math.min((savingsFund / totalWishlistValue) * 100, 100) + '%' }}
                                                    />
                                                </div>
                                            </div>
                                        ) : null
                                    ) : stat.id === 'count' ? (
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                                    {t('dashboard.activePurchased').replace('{active}', activeWishlist.length).replace('{purchased}', purchasedCount)}
                                                </span>
                                                <span className={'text-[10px] font-bold ' + (isDarkMode ? 'text-orange-500/80' : 'text-orange-600')}>
                                                    {completionPercentage.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className={'h-2 rounded-full overflow-hidden ' + (isDarkMode ? 'bg-zinc-800/50' : 'bg-slate-50')}>
                                                <div
                                                    className={'h-full rounded-full transition-all duration-700 ease-out ' + (isDarkMode ? 'bg-orange-500/40' : 'bg-orange-500/60')}
                                                    style={{ width: completionPercentage + '%' }}
                                                />
                                            </div>
                                        </div>
                                    ) : null}
                                </>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>

            {/* Card Settings Modal */}
            {editingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingCard(null)} />
                    <div className={'relative w-full max-w-xs rounded-2xl p-6 shadow-2xl border ' + (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100')}>
                        <button
                            onClick={() => setEditingCard(null)}
                            className={'absolute top-3 right-3 p-1.5 rounded-lg transition-colors ' + (isDarkMode ? 'text-zinc-500 hover:bg-zinc-800' : 'text-slate-400 hover:bg-slate-100')}
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-lg font-bold mb-4">
                            {t('dashboard.cardSettings')}
                        </h3>

                        <div className="space-y-6">
                            {/* Budget Setting (only for spent card) */}
                            {editingCard === 'spent' && (
                                <div>
                                    <label className={'block text-[10px] font-bold uppercase tracking-wider mb-2 ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                                        {t('dashboard.monthlyBudget')}
                                    </label>
                                    <div className="relative">
                                        <span className={'absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>{currencyCode}</span>
                                        <input
                                            type="number"
                                            value={tempBudget}
                                            onChange={(e) => setTempBudget(e.target.value)}
                                            placeholder="0"
                                            className={'w-full pl-16 pr-4 py-3 rounded-xl border transition-all text-lg font-bold ' + (isDarkMode
                                                ? 'bg-zinc-800 border-zinc-700 focus:border-emerald-500'
                                                : 'bg-slate-50 border-slate-200 focus:border-emerald-500') + ' focus:outline-none focus:ring-2 focus:ring-emerald-500/20'}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Savings Fund Setting (only for total card) */}
                            {editingCard === 'total' && (
                                <div>
                                    <label className={'block text-[10px] font-bold uppercase tracking-wider mb-2 ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                                        {t('dashboard.savingsFund')}
                                    </label>
                                    <div className="relative">
                                        <span className={'absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>{currencyCode}</span>
                                        <input
                                            type="number"
                                            value={tempSavings}
                                            onChange={(e) => setTempSavings(e.target.value)}
                                        placeholder={t('dashboard.savingsPlaceholder')}
                                            className={'w-full pl-16 pr-4 py-3 rounded-xl border transition-all text-lg font-bold ' + (isDarkMode
                                                ? 'bg-zinc-800 border-zinc-700 focus:border-indigo-500'
                                                : 'bg-slate-50 border-slate-200 focus:border-indigo-500') + ' focus:outline-none focus:ring-2 focus:ring-indigo-500/20'}
                                            autoFocus
                                        />
                                    </div>
                                    <p className={'text-[10px] mt-2 ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                        {t('dashboard.savingsHelp')}
                                    </p>
                                </div>
                            )}

                            {/* Extra Info Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm">{t('dashboard.extraInfo')}</p>
                                    <p className={'text-[10px] ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                                        {t('dashboard.showExtraDetails')}
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={extraInfoEnabled[editingCard]}
                                        onChange={() => toggleExtraInfo(editingCard)}
                                    />
                                    <div className={"w-11 h-6 rounded-full peer transition-all " +
                                        (isDarkMode ? "bg-zinc-800" : "bg-slate-200") +
                                        " peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"}>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setEditingCard(null)}
                                className={'flex-1 py-2.5 rounded-xl font-semibold border transition-all ' + (isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="flex-1 py-2.5 rounded-xl font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Check size={16} />
                                {t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
