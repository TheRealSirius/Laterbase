import React, { useMemo, useState } from 'react';
import { Check, ImageOff, Link as LinkIcon, Loader2, ShoppingBag, Upload, X } from 'lucide-react';
import * as productService from '../lib/productService';

const normalizeImportedProduct = (product) => ({
    ...product,
    selected: product.selected !== false,
    price: product.price ?? '',
    category: product.category || 'Altro',
    priority: product.priority || '2',
});

const toImportPayload = (item) => {
    const product = { ...item };
    delete product.selected;
    delete product.duplicate;
    delete product.externalId;
    delete product.source;
    return product;
};

const ImportWishlistModal = ({
    isOpen,
    onClose,
    onImport,
    categories,
    existingProducts,
    isDarkMode,
    allowExternalImages,
    t,
    getCategoryLabel,
    formatCurrency,
}) => {
    const [url, setUrl] = useState('');
    const [items, setItems] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const existingKeys = useMemo(() => new Set(existingProducts.flatMap((product) => [
        product.url,
        product.name?.toLocaleLowerCase(),
    ]).filter(Boolean)), [existingProducts]);

    if (!isOpen) return null;

    const selectedItems = items.filter((item) => item.selected && item.name);

    const handleAnalyze = async () => {
        if (!url.trim() || isLoading) return;
        setIsLoading(true);
        setError('');
        setItems([]);

        try {
            const result = await productService.importAmazonWishlist(url.trim());
            const imported = (result.products || []).map((product) => {
                const normalized = normalizeImportedProduct(product);
                const duplicate = existingKeys.has(normalized.url) || existingKeys.has(normalized.name?.toLocaleLowerCase());
                return { ...normalized, duplicate, selected: !duplicate };
            });
            setItems(imported);
            if (!imported.length) setError(t('importList.noProducts'));
        } catch (err) {
            setError(err.message?.includes('No readable products') ? t('importList.noProducts') : t('importList.failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const updateItem = (index, patch) => {
        setItems((current) => current.map((item, itemIndex) => (
            itemIndex === index ? { ...item, ...patch } : item
        )));
    };

    const handleImport = () => {
        if (!selectedItems.length) return;
        onImport(selectedItems.map((item) => ({
            ...toImportPayload(item),
            price: Number(item.price) || 0,
            targetPrice: item.targetPrice || null,
            isGiftIdea: false,
            isArchived: false,
        })));
        onClose();
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300 ${isDarkMode ? 'bg-zinc-950/60' : 'bg-slate-900/30'}`}
            onClick={onClose}
        >
            <div
                className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-100 text-slate-950'}`}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={`flex items-start justify-between gap-4 border-b p-6 ${isDarkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
                    <div>
                        <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-emerald-50 text-emerald-700'}`}>
                            <Upload size={14} />
                            {t('importList.badge')}
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">{t('importList.title')}</h2>
                        <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                            {t('importList.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`rounded-full p-2 transition-all ${isDarkMode ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
                    <div className={`rounded-3xl border p-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-950/70' : 'border-slate-100 bg-slate-50'}`}>
                        <label className={`mb-2 block text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {t('importList.linkLabel')}
                        </label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <LinkIcon className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`} size={18} />
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(event) => setUrl(event.target.value)}
                                    placeholder="https://www.amazon.it/hz/wishlist/ls/..."
                                    className={`w-full rounded-2xl border-transparent py-3.5 pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:ring-2 ${isDarkMode ? 'bg-black text-white placeholder:text-zinc-800 focus:ring-zinc-700' : 'bg-white text-slate-950 placeholder:text-slate-300 focus:ring-slate-900'}`}
                                />
                            </div>
                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading || !url.trim()}
                                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black transition-all ${url.trim() && !isLoading
                                    ? (isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-200' : 'bg-slate-900 text-white hover:bg-slate-800')
                                    : (isDarkMode ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed')
                                    }`}
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />}
                                {isLoading ? t('importList.loading') : t('importList.analyze')}
                            </button>
                        </div>
                        <p className={`mt-3 text-xs leading-relaxed ${isDarkMode ? 'text-zinc-600' : 'text-slate-500'}`}>
                            {t('importList.privacyNote')}
                        </p>
                    </div>

                    {error && (
                        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${isDarkMode ? 'border-rose-500/20 bg-rose-500/10 text-rose-300' : 'border-rose-100 bg-rose-50 text-rose-600'}`}>
                            {error}
                        </div>
                    )}

                    {items.length > 0 && (
                        <div className="mt-6 space-y-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-black">{t('importList.reviewTitle')}</h3>
                                    <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                                        {t('importList.reviewSubtitle')
                                            .replace('{count}', String(items.length))
                                            .replace('{selected}', String(selectedItems.length))}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setItems((current) => current.map((item) => ({ ...item, selected: !item.duplicate })))}
                                    className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {t('importList.resetSelection')}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div
                                        key={`${item.externalId || item.url || item.name}-${index}`}
                                        className={`grid grid-cols-[auto_1fr] gap-4 rounded-3xl border p-4 transition-all lg:grid-cols-[auto_88px_1fr] ${item.selected
                                            ? (isDarkMode ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-100 bg-emerald-50/40')
                                            : (isDarkMode ? 'border-zinc-800 bg-zinc-950/70 opacity-75' : 'border-slate-100 bg-white opacity-75')
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => updateItem(index, { selected: !item.selected })}
                                            className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full border transition-all ${item.selected
                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                : (isDarkMode ? 'border-zinc-700 text-zinc-600' : 'border-slate-300 text-slate-300')
                                                }`}
                                            title={item.selected ? t('importList.deselect') : t('importList.select')}
                                        >
                                            {item.selected && <Check size={16} />}
                                        </button>

                                        <div className={`hidden h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border lg:flex ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-slate-100 bg-slate-50'}`}>
                                            {allowExternalImages && item.imageUrl ? (
                                                <img src={item.imageUrl} alt="" className="h-full w-full object-contain" loading="lazy" referrerPolicy="no-referrer" />
                                            ) : (
                                                <ImageOff size={22} className={isDarkMode ? 'text-zinc-700' : 'text-slate-300'} />
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="grid gap-3 md:grid-cols-[1fr_120px_160px]">
                                                <input
                                                    value={item.name}
                                                    onChange={(event) => updateItem(index, { name: event.target.value })}
                                                    className={`rounded-2xl border-transparent px-4 py-3 text-sm font-black outline-none focus:ring-2 ${isDarkMode ? 'bg-black text-white focus:ring-zinc-700' : 'bg-white text-slate-950 focus:ring-slate-900'}`}
                                                />
                                                <input
                                                    value={item.price}
                                                    onChange={(event) => updateItem(index, { price: event.target.value })}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className={`rounded-2xl border-transparent px-4 py-3 text-sm font-black outline-none focus:ring-2 ${isDarkMode ? 'bg-black text-white focus:ring-zinc-700' : 'bg-white text-slate-950 focus:ring-slate-900'}`}
                                                />
                                                <select
                                                    value={item.category}
                                                    onChange={(event) => updateItem(index, { category: event.target.value })}
                                                    className={`rounded-2xl border-transparent px-4 py-3 text-sm font-black outline-none focus:ring-2 ${isDarkMode ? 'bg-black text-white focus:ring-zinc-700' : 'bg-white text-slate-950 focus:ring-slate-900'}`}
                                                >
                                                    {[...new Set([...categories, item.category].filter(Boolean))].map((category) => (
                                                        <option key={category} value={category}>{getCategoryLabel(category)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className={`flex flex-wrap items-center gap-2 text-xs font-bold ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                                                {item.duplicate && <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-500">{t('importList.duplicate')}</span>}
                                                {item.url && <span>{new URL(item.url).hostname.replace(/^www\./, '')}</span>}
                                                {item.imageUrl && <span>{t('importList.imageFound')}</span>}
                                                {item.price !== '' && <span>{formatCurrency(item.price)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={`flex flex-col gap-3 border-t p-6 sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                        {t('importList.externalImageNote')}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className={`rounded-2xl px-5 py-3 text-sm font-black transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!selectedItems.length}
                            className={`rounded-2xl px-5 py-3 text-sm font-black transition-all ${selectedItems.length
                                ? (isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-200' : 'bg-slate-900 text-white hover:bg-slate-800')
                                : (isDarkMode ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed')
                                }`}
                        >
                            {t('importList.importSelected').replace('{count}', String(selectedItems.length))}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportWishlistModal;
