import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, CheckCircle, Trash2, ShoppingBag, FileText, Share2, GripVertical, RefreshCw, Eye, Archive, Link, ClipboardList, BadgeCheck, Clock, PauseCircle, Gift } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPriceSparkline, getPriceStats, getWishScore } from '../lib/wishlistInsights';

const ProductCard = ({ product, onTogglePurchase, onToggleArchive, onDelete, onEdit, onShowToast, onCheckPrice, isDarkMode, isPublicView, isPurchasing, allowExternalImages, t, getCategoryLabel, formatCurrency, settings }) => {
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const shareMenuRef = useRef(null);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: product.id, disabled: product.isPurchased || isPublicView });

    // Combine drag transform with purchase animation
    const baseTransform = CSS.Transform.toString(transform);
    const purchaseTransform = isPurchasing ? 'scale(0.85) translateX(50px) translateY(-30px)' : '';

    const style = {
        transform: isPurchasing ? purchaseTransform : baseTransform,
        transition: isPurchasing ? 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)' : transition,
        opacity: isPurchasing ? 0 : 1,
    };

    const priorityEmojis = {
        '3': '🔥',
        '2': '⏳',
        '1': '❄️',
    };

    const priceStats = getPriceStats(product);
    const wishScore = getWishScore(product, settings);
    const currentPrice = priceStats.current;
    const initialPrice = priceStats.initial;
    const sparklinePath = createPriceSparkline(priceStats.history);
    const decisionMeta = {
        buy: { icon: BadgeCheck, color: 'text-emerald-500', bg: isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50' },
        wait: { icon: Clock, color: 'text-amber-500', bg: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50' },
        park: { icon: PauseCircle, color: 'text-slate-500', bg: isDarkMode ? 'bg-zinc-800' : 'bg-slate-100' },
    }[wishScore.decision];
    const DecisionIcon = decisionMeta.icon;

    // Calculate price change percentage
    let priceChangePercent = 0;
    let priceChangeType = null; // 'discount' | 'increase' | null

    if (initialPrice > 0 && currentPrice !== initialPrice) {
        priceChangePercent = Math.round(Math.abs((currentPrice - initialPrice) / initialPrice) * 100);
        priceChangeType = currentPrice < initialPrice ? 'discount' : 'increase';
    }

    const isTargetReached = priceStats.targetReached;

    useEffect(() => {
        if (!isShareMenuOpen) return undefined;

        const handlePointerDown = (event) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
                setIsShareMenuOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setIsShareMenuOpen(false);
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isShareMenuOpen]);

    const copyToClipboard = async (text) => {
        await navigator.clipboard.writeText(text);
    };

    const handleShareMenuToggle = (e) => {
        e.stopPropagation();
        setIsShareMenuOpen((isOpen) => !isOpen);
    };

    const handleCopyLink = async (e) => {
        e.stopPropagation();
        if (!product.url) {
            onShowToast(t('toast.noProductLink'), 'error');
            setIsShareMenuOpen(false);
            return;
        }

        await copyToClipboard(product.url);
        setIsShareMenuOpen(false);
        onShowToast(t('toast.productLinkCopied'));
    };

    const handleCopyDetails = async (e) => {
        e.stopPropagation();
        const text = t('product.shareText')
            .replace('{name}', product.name)
            .replace('{price}', formatCurrency(currentPrice))
            .replace('{link}', product.url || t('product.notAvailable'));
        await copyToClipboard(text);
        setIsShareMenuOpen(false);
        onShowToast(t('toast.detailsCopied'));
    };

    const handleCheckPrice = (e) => {
        e.stopPropagation();
        if (product.url) {
            window.open(product.url, '_blank', 'noopener,noreferrer');
        }
        onCheckPrice(product);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            id={product.id}
            onClick={() => !isPublicView && onEdit(product)}
            className={`group rounded-2xl border overflow-hidden ${!isPublicView ? 'cursor-pointer' : 'cursor-default'} flex flex-col ${isDarkMode
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1'
                } ${product.isPurchased ? 'opacity-75' : ''} ${isDragging ? 'z-50 shadow-2xl scale-[1.02] opacity-80' : ''} ${isTargetReached && !product.isPurchased
                    ? (isDarkMode
                        ? 'ring-1 ring-emerald-500/50 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]'
                        : 'ring-1 ring-emerald-500/30 border-emerald-200 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)] bg-emerald-50/10')
                    : ''
                } ${!isPurchasing ? 'transition-all duration-300' : ''}`}
        >
            <div className={`relative h-56 flex items-center justify-center p-4 overflow-hidden ${isDarkMode ? 'bg-zinc-950' : 'bg-slate-50/50'}`}>
                {product.imageUrl && allowExternalImages ? (
                    <div className="w-full h-full flex items-center justify-center bg-white rounded-2xl p-3">
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                ) : product.imageUrl ? (
                    <div className={`w-full h-full rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 px-5 text-center ${isDarkMode ? 'border-zinc-800 text-zinc-600' : 'border-slate-200 text-slate-400'}`}>
                        <Eye size={34} strokeWidth={1.5} />
                        <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">
                            {t('product.externalImageDisabled')}
                        </p>
                    </div>
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'text-zinc-800' : 'text-slate-100'}`}>
                        <ShoppingBag size={56} strokeWidth={1.5} />
                    </div>
                )}

                {!product.isPurchased && !isPublicView && (
                    <div
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute top-3 right-3 p-1.5 rounded-lg backdrop-blur-md transition-opacity md:opacity-0 md:group-hover:opacity-100 cursor-grab active:cursor-grabbing z-10 ${isDarkMode ? 'bg-zinc-900/80 text-zinc-500 hover:text-white' : 'bg-white/80 text-slate-400 hover:text-slate-600 shadow-sm'
                            }`}
                        title={t('product.dragToReorder')}
                    >
                        <GripVertical size={18} />
                    </div>
                )}

                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className={`backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border w-fit ${isDarkMode ? 'bg-zinc-900/90 text-zinc-300 border-zinc-700' : 'bg-white/90 text-slate-900 border-slate-100'
                        }`}>
                        {getCategoryLabel ? getCategoryLabel(product.category) : product.category}
                    </span>
                    {priceChangeType === 'discount' && priceChangePercent > 0 && !product.isPurchased && (
                        <span className={`backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm border w-fit ${isDarkMode ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50/90 text-emerald-600 border-emerald-100'
                            }`}>
                            -{priceChangePercent}% {t('product.saving')}
                        </span>
                    )}
                    {priceChangeType === 'increase' && priceChangePercent > 0 && !product.isPurchased && (
                        <span className={`backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm border w-fit ${isDarkMode ? 'bg-red-950/50 text-red-400 border-red-900/50' : 'bg-red-50/90 text-red-600 border-red-100'
                            }`}>
                            +{priceChangePercent}% {t('product.increase')}
                        </span>
                    )}
                    {isTargetReached && !product.isPurchased && (
                        <span className={`backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm border w-fit ${isDarkMode ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-200'
                            }`}>
                            {t('product.targetReached')}
                        </span>
                    )}
                    {priceStats.isBestPrice && priceStats.history.length > 1 && !product.isPurchased && (
                        <span className={`backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm border w-fit ${isDarkMode ? 'bg-blue-500/15 text-blue-300 border-blue-500/20' : 'bg-blue-50/90 text-blue-600 border-blue-100'
                            }`}>
                            {t('product.bestPrice')}
                        </span>
                    )}
                    {product.isGiftIdea && (
                        <span className={`backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm border w-fit flex items-center gap-1 ${isDarkMode ? 'bg-rose-500/15 text-rose-300 border-rose-500/20' : 'bg-rose-50/90 text-rose-600 border-rose-100'
                            }`}>
                            <Gift size={11} />
                            {t('product.giftIdea')}
                        </span>
                    )}
                </div>

                {/* Priority Badge */}
                <div className={`absolute top-3 right-3 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center shadow-sm border text-sm ${isDarkMode ? 'bg-zinc-900/90 border-zinc-700 text-white' : 'bg-white/90 border-slate-100 text-slate-900'
                    }`}>
                    {priorityEmojis[product.priority] || '⏳'}
                </div>

                {product.isPurchased && (
                    <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-[2px] ${isDarkMode ? 'bg-zinc-950/60' : 'bg-slate-900/40'}`}>
                        <div className={`px-4 py-2 rounded-full flex items-center gap-2 shadow-lg scale-110 animate-in fade-in zoom-in duration-300 ${isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white text-slate-900'
                            }`}>
                            <CheckCircle size={18} className="text-emerald-500" />
                            <span className="font-semibold text-sm">{t('product.purchased')}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col gap-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                            <h4 className={`font-semibold truncate text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{product.name}</h4>
                            {product.notes && product.notes.trim() !== '' && (
                                <FileText size={14} className={`${isDarkMode ? 'text-zinc-600' : 'text-slate-400'} flex-shrink-0`} title={t('product.hasNotes')} />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            {!product.isPurchased && !isPublicView && (
                                <button
                                    onClick={handleCheckPrice}
                                    className={`p-1 rounded-md transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}
                                    title={product.lastChecked ? t('product.lastChecked').replace('{date}', new Date(product.lastChecked).toLocaleDateString()) : t('product.checkPrice')}
                                >
                                    <RefreshCw size={14} />
                                </button>
                            )}
                            <span className={`font-bold flex-shrink-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(currentPrice)}</span>
                        </div>
                        {product.targetPrice ? (
                            <span className={`text-[10px] font-medium leading-tight ${isTargetReached ? 'text-emerald-500' : (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}`}>
                                {t('product.target')}: {formatCurrency(product.targetPrice)}
                            </span>
                        ) : (
                            priceChangeType && priceChangePercent > 0 && (
                                <span className={`text-[10px] line-through ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`}>{formatCurrency(initialPrice)}</span>
                            )
                        )}
                    </div>
                </div>

                <div className={`mb-4 rounded-2xl border p-3 ${isDarkMode ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className={`rounded-xl p-2 ${decisionMeta.bg} ${decisionMeta.color}`}>
                                <DecisionIcon size={15} />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-xs font-black uppercase tracking-wider ${decisionMeta.color}`}>{t(`wishScore.${wishScore.decision}`)}</p>
                                <p className={`text-[11px] truncate ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                                    {wishScore.monthsToBuy ? t('wishScore.monthsToBuy').replace('{months}', wishScore.monthsToBuy) : t('wishScore.scoreLabel').replace('{score}', wishScore.score)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{wishScore.score}</div>
                            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`}>{t('wishScore.score')}</div>
                        </div>
                    </div>
                    {priceStats.history.length > 1 && (
                        <svg viewBox="0 0 120 34" className="mt-3 h-8 w-full overflow-visible" aria-label={t('product.priceHistory')}>
                            <path d={sparklinePath} fill="none" stroke={isTargetReached ? '#10b981' : '#64748b'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-auto">
                    {(() => {
                        const url = product.url || '';
                        let domain = t('product.notAvailable');
                        let Icon = ExternalLink;

                        try {
                            if (url) {
                                const urlObj = new URL(url);
                                domain = urlObj.hostname.replace('www.', '');

                                if (domain.includes('amazon')) {
                                    Icon = ShoppingBag;
                                } else if (domain.includes('apple')) {
                                    Icon = ExternalLink; // Avoiding Package which might be undefined
                                }
                            }
                        } catch {
                            // Invalid URL
                        }

                        if (!url) {
                            return (
                                <button
                                    type="button"
                                    disabled
                                    onClick={(e) => e.stopPropagation()}
                                    className={`p-2.5 rounded-xl transition-all shadow-sm cursor-not-allowed ${isDarkMode ? 'bg-zinc-900 text-zinc-700 border border-zinc-800' : 'bg-slate-100 text-slate-300'
                                        }`}
                                    title={t('product.notAvailable')}
                                >
                                    <Icon size={16} />
                                </button>
                            );
                        }

                        return (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`p-2.5 rounded-xl transition-all shadow-sm ${isDarkMode ? 'bg-zinc-950 text-white hover:bg-black border border-zinc-800' : 'bg-slate-900 text-white hover:bg-black'
                                    }`}
                                title={t('product.goTo').replace('{domain}', domain)}
                            >
                                <Icon size={16} />
                            </a>
                        );
                    })()}

                    <div className="relative" ref={shareMenuRef}>
                        <button
                            onClick={handleShareMenuToggle}
                            className={`p-2.5 rounded-xl transition-all ${isShareMenuOpen
                                ? (isDarkMode ? 'bg-zinc-700 text-white' : 'bg-slate-900 text-white')
                                : (isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700' : 'bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200')
                                }`}
                            title={t('product.shareOptions')}
                            aria-haspopup="menu"
                            aria-expanded={isShareMenuOpen}
                        >
                            <Share2 size={16} />
                        </button>

                        {isShareMenuOpen && (
                            <div
                                role="menu"
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute bottom-full left-0 mb-2 w-52 rounded-xl border p-1.5 shadow-xl z-30 ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-slate-100 text-slate-900'
                                    }`}
                            >
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleCopyLink}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-left transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                                        }`}
                                >
                                    <Link size={15} />
                                    <span>{t('product.copyLink')}</span>
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleCopyDetails}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-left transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                                        }`}
                                >
                                    <ClipboardList size={15} />
                                    <span>{t('product.copyProductCard')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                    {!isPublicView && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onTogglePurchase(product.id); }}
                                className={`p-2.5 rounded-xl transition-all ${product.isPurchased
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : (isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-emerald-400' : 'bg-slate-100 text-slate-400 hover:text-emerald-500 hover:bg-slate-200')
                                    }`}
                                title={product.isPurchased ? t('product.removeFromHistory') : t('product.markPurchased')}
                            >
                                <CheckCircle size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleArchive(product.id); }}
                                className={`p-2.5 rounded-xl transition-all ${product.isArchived
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                    : (isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-amber-400' : 'bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-slate-200')
                                    }`}
                                title={product.isArchived ? t('product.restoreToList') : t('product.moveToArchive')}
                            >
                                <Archive size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                                className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-rose-400' : 'bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-slate-200'
                                    }`}
                                title={t('common.delete')}
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
