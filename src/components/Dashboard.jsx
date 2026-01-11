import React from 'react';
import { CreditCard, ShoppingCart, TrendingUp, Calendar, ChevronRight } from 'lucide-react';

const Dashboard = ({ products, isDarkMode, onSpentClick, onWishlistClick, onCountClick, isPublicView }) => {
    const activeWishlist = products.filter(p => !p.isPurchased);
    const totalWishlistValue = activeWishlist.reduce((sum, p) => sum + Number(p.price), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyPurchases = products.filter(p => {
        if (!p.isPurchased || !p.purchaseDate) return false;
        const pDate = new Date(p.purchaseDate);
        return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    });

    const monthlySpent = monthlyPurchases.reduce((sum, p) => sum + Number(p.price), 0);

    const stats = [
        {
            label: 'Totale Desideri',
            value: `€ ${totalWishlistValue.toFixed(2)}`,
            icon: <ShoppingCart size={20} />,
            color: 'bg-indigo-500',
            bgClass: isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100',
            iconColor: 'text-indigo-500',
            clickable: !isPublicView,
            onClick: onWishlistClick
        },
        ...(!isPublicView ? [{
            label: 'Speso questo Mese',
            value: `€ ${monthlySpent.toFixed(2)}`,
            icon: <CreditCard size={20} />,
            color: 'bg-emerald-500',
            bgClass: isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100',
            iconColor: 'text-emerald-500',
            clickable: true,
            onClick: onSpentClick
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    onClick={!isPublicView ? stat.onClick : undefined}
                    tabIndex={stat.clickable && !isPublicView ? 0 : -1}
                    className={`p-6 rounded-3xl border transition-all duration-300 focus:outline-none focus:ring-0 ${stat.clickable && !isPublicView
                        ? 'cursor-pointer hover:shadow-md'
                        : 'cursor-default'
                        } ${isDarkMode
                            ? `bg-zinc-900 border-zinc-800 ${stat.clickable && !isPublicView ? 'hover:border-zinc-700 hover:bg-zinc-800/80' : ''}`
                            : `bg-white border-slate-100 shadow-sm ${stat.clickable && !isPublicView ? 'hover:border-slate-200' : ''}`
                        }`}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-2xl ${stat.bgClass} border`}>
                            <span className={stat.iconColor}>{stat.icon}</span>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {stat.label}
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                        <span className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stat.value}</span>
                        {stat.clickable && !isPublicView && (
                            <ChevronRight size={16} className={isDarkMode ? 'text-zinc-700' : 'text-slate-300'} />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Dashboard;
