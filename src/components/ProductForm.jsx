import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Tag, Link as LinkIcon, Image as ImageIcon, CircleDollarSign, Package, Target, Archive, Plus, WandSparkles, Loader2, Gift, MessageSquare } from 'lucide-react';
import * as productService from '../lib/productService';

const ProductForm = ({ onClose, onSubmit, categories, onAddCategory, onDeleteCategory, initialData, draftData, isDarkMode, t, getCategoryLabel, currencyCode, formatCurrency, onShowToast }) => {
    const sourceData = initialData || draftData || {};
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAutofilling, setIsAutofilling] = useState(false);
    const [autofillMessage, setAutofillMessage] = useState('');
    const [autofillMessageType, setAutofillMessageType] = useState('info');
    const lastAutofillUrl = useRef('');
    const [formData, setFormData] = useState({
        name: sourceData.name || '',
        price: sourceData.price || '',
        url: sourceData.url || '',
        imageUrl: sourceData.imageUrl || '',
        category: sourceData.category || '',
        priority: sourceData.priority || '2', // Default to Medium (2)
        notes: sourceData.notes || '',
        targetPrice: sourceData.targetPrice || '',
        isArchived: sourceData.isArchived || false,
        isGiftIdea: sourceData.isGiftIdea || false,
        publicNote: sourceData.publicNote || '',
    });

    const isHttpUrl = (value) => {
        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const applyPreview = useCallback(async (preview, force = false) => {
        let nextCategory = preview.category || formData.category;
        if (nextCategory && !categories.includes(nextCategory)) {
            nextCategory = await onAddCategory?.(nextCategory) || nextCategory;
        }

        setFormData((current) => ({
            ...current,
            name: preview.name && (force || !current.name) ? preview.name : current.name,
            price: preview.price !== null && preview.price !== undefined && (force || !current.price) ? String(preview.price) : current.price,
            url: preview.url || current.url,
            imageUrl: preview.imageUrl && (force || !current.imageUrl) ? preview.imageUrl : current.imageUrl,
            category: nextCategory && (force || !current.category) ? nextCategory : current.category,
        }));
    }, [categories, formData.category, onAddCategory]);

    const getAutofillFailureMessage = useCallback((error) => {
        const message = String(error?.message || '').toLowerCase();
        if (message.includes('rete privata') || message.includes('private')) return t('form.autofillPrivateNetwork');
        if (message.includes('troppo grande')) return t('form.autofillTooLarge');
        if (message.includes('redirect')) return t('form.autofillRedirect');
        if (message.includes('non ho trovato') || message.includes('leggibili')) return t('form.autofillNoData');
        if (message.includes('non valido') || message.includes('http')) return t('form.autofillInvalid');
        return t('form.autofillBlocked');
    }, [t]);

    const handleAutofill = useCallback(async (force = false) => {
        const url = formData.url.trim();
        if (!isHttpUrl(url) || isAutofilling) return;
        if (!force && lastAutofillUrl.current === url) return;

        lastAutofillUrl.current = url;
        setIsAutofilling(true);
        setAutofillMessage('');
        setAutofillMessageType('info');

        try {
            const preview = await productService.fetchProductPreview(url);
            await applyPreview(preview, force);
            setAutofillMessage(t('form.autofillSuccess'));
            setAutofillMessageType('success');
            onShowToast?.(t('toast.productAutofilled'));
        } catch (error) {
            setAutofillMessage(getAutofillFailureMessage(error));
            setAutofillMessageType('error');
            onShowToast?.(t('toast.productAutofillFailed'), 'error');
        } finally {
            setIsAutofilling(false);
        }
    }, [applyPreview, formData.url, getAutofillFailureMessage, isAutofilling, onShowToast, t]);

    useEffect(() => {
        if (initialData) return undefined;
        const url = formData.url.trim();
        const hasMissingProductData = !formData.name || !formData.price || !formData.imageUrl || !formData.category;
        if (!isHttpUrl(url) || !hasMissingProductData || lastAutofillUrl.current === url) return undefined;

        const timer = window.setTimeout(() => {
            handleAutofill(false);
        }, 850);
        return () => window.clearTimeout(timer);
    }, [formData.category, formData.imageUrl, formData.name, formData.price, formData.url, handleAutofill, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return;
        onSubmit({
            ...formData,
            price: parseFloat(formData.price),
            targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : null,
        });
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const priorityOptions = [
        { value: '3', label: '🔥 ' + t('form.priorityHigh'), color: 'text-orange-500' },
        { value: '2', label: '⏳ ' + t('form.priorityMedium'), color: 'text-blue-500' },
        { value: '1', label: '❄️ ' + t('form.priorityLow'), color: 'text-slate-400' },
    ];

    const handleDeleteCategory = async (category) => {
        const deleted = await onDeleteCategory?.(category);
        if (deleted !== false && formData.category === category) {
            setFormData({ ...formData, category: '' });
        }
    };

    return (
        <div
            className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300 cursor-pointer ${isDarkMode ? 'bg-zinc-950/50' : 'bg-slate-900/30'}`}
            onClick={onClose}
        >
            <div
                className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border cursor-default ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 overflow-y-auto">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{initialData ? t('form.editProduct') : t('form.newWish')}</h2>
                            {initialData?.lastChecked && (
                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                                    {t('product.lastChecked').replace('{date}', `${new Date(initialData.lastChecked).toLocaleDateString()} ${new Date(initialData.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('form.productName')}</label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                        <Package size={18} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        placeholder={t('form.productNamePlaceholder')}
                                        className={`w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium ${isDarkMode
                                            ? 'bg-zinc-950 text-white focus:bg-black focus:ring-zinc-700 placeholder:text-zinc-800'
                                            : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-slate-900 placeholder:text-slate-300'}`}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('form.priority')}</label>
                                <div className="flex gap-2">
                                    {priorityOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, priority: opt.value })}
                                            className={`flex-1 py-3 px-2 rounded-2xl border text-sm font-bold transition-all ${formData.priority === opt.value
                                                ? (isDarkMode ? 'bg-white border-white text-zinc-950 shadow-md' : 'bg-slate-900 border-slate-900 text-white shadow-md')
                                                : (isDarkMode ? 'bg-zinc-950 border-transparent text-zinc-600 hover:bg-zinc-800' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100')
                                                }`}
                                        >
                                            {opt.label.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('form.price')} ({currencyCode})</label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                        <CircleDollarSign size={18} />
                                    </div>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className={`w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium ${isDarkMode
                                            ? 'bg-zinc-950 text-white focus:bg-black focus:ring-zinc-700 placeholder:text-zinc-800'
                                            : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-slate-900 placeholder:text-slate-300'}`}
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                {initialData?.initialPrice && (
                                    <p className={`text-[10px] font-bold uppercase tracking-wider pl-1 mt-1 ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
                                        {t('form.initialPrice')}: <span className={isDarkMode ? 'text-zinc-400' : 'text-slate-500'}>{formatCurrency(initialData.initialPrice)}</span>
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('form.targetPrice')} ({currencyCode})</label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                        <Target size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder={t('form.targetPricePlaceholder')}
                                        className={`w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium ${isDarkMode
                                            ? 'bg-zinc-950 text-white focus:bg-black focus:ring-zinc-700 placeholder:text-zinc-800'
                                            : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-slate-900 placeholder:text-slate-300'}`}
                                        value={formData.targetPrice}
                                        onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {initialData && (
                            <div className="flex items-center justify-between p-4 rounded-2xl border transition-all bg-amber-500/5 border-amber-500/10">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl bg-amber-500/10 text-amber-500`}>
                                        <Archive size={18} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isDarkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{t('archive.title')}</p>
                                        <p className={`text-[10px] font-medium ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('form.archiveHelp')}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isArchived: !formData.isArchived })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isArchived ? 'bg-amber-500' : (isDarkMode ? 'bg-zinc-800' : 'bg-slate-200')}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isArchived ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        )}

                        <div className={`p-4 rounded-2xl border transition-all ${formData.isGiftIdea
                            ? 'bg-rose-500/5 border-rose-500/20'
                            : (isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100')
                            }`}>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${formData.isGiftIdea ? 'bg-rose-500/10 text-rose-500' : (isDarkMode ? 'bg-zinc-900 text-zinc-400' : 'bg-white text-slate-500')}`}>
                                        <Gift size={18} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isDarkMode ? 'text-zinc-200' : 'text-slate-700'}`}>{t('form.giftIdea')}</p>
                                        <p className={`text-[10px] font-medium ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('form.giftIdeaHelp')}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isGiftIdea: !formData.isGiftIdea })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isGiftIdea ? 'bg-rose-500' : (isDarkMode ? 'bg-zinc-800' : 'bg-slate-200')}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isGiftIdea ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('form.category')}</label>

                            {!showNewCategoryInput ? (
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                        <Tag size={18} />
                                    </div>
                                    <select
                                        required
                                        className={`w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium appearance-none ${isDarkMode
                                            ? 'bg-zinc-950 text-white focus:bg-black focus:ring-zinc-700'
                                            : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-slate-900'}`}
                                        value={formData.category}
                                        onChange={(e) => {
                                            if (e.target.value === '__NEW__') {
                                                setShowNewCategoryInput(true);
                                            } else {
                                                setFormData({ ...formData, category: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="" disabled>{t('form.choose')}</option>
                                        {categories.map(c => <option key={c} value={c}>{getCategoryLabel ? getCategoryLabel(c) : c}</option>)}
                                        <option disabled className={isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}>──────────</option>
                                        <option value="__NEW__" className={isDarkMode ? 'text-violet-400' : 'text-violet-600'}>+ {t('newCategory')}</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                            <Plus size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder={t('categoryNameLongPlaceholder')}
                                            className={`w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium ${isDarkMode
                                                ? 'bg-zinc-950 text-white focus:bg-black focus:ring-violet-500 placeholder:text-zinc-700'
                                                : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-violet-500 placeholder:text-slate-400'}`}
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newCategoryName.trim()) {
                                                    e.preventDefault();
                                                    const categoryName = newCategoryName.trim();
                                                    Promise.resolve(onAddCategory?.(categoryName)).then((canonicalCategory) => {
                                                        setFormData({ ...formData, category: canonicalCategory || categoryName });
                                                        setNewCategoryName('');
                                                        setShowNewCategoryInput(false);
                                                    });
                                                } else if (e.key === 'Escape') {
                                                    setShowNewCategoryInput(false);
                                                    setNewCategoryName('');
                                                }
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newCategoryName.trim()) {
                                                const categoryName = newCategoryName.trim();
                                                Promise.resolve(onAddCategory?.(categoryName)).then((canonicalCategory) => {
                                                    setFormData({ ...formData, category: canonicalCategory || categoryName });
                                                    setNewCategoryName('');
                                                    setShowNewCategoryInput(false);
                                                });
                                            }
                                        }}
                                        className={`px-4 py-3.5 rounded-2xl font-bold transition-all ${newCategoryName.trim()
                                            ? 'bg-violet-500 text-white hover:bg-violet-600'
                                            : (isDarkMode ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed')}`}
                                    >
                                        <Plus size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNewCategoryInput(false);
                                            setNewCategoryName('');
                                        }}
                                        className={`px-4 py-3.5 rounded-2xl transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}

                            {!showNewCategoryInput && categories.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {categories.map((category) => {
                                        const label = getCategoryLabel ? getCategoryLabel(category) : category;
                                        const isSelected = formData.category === category;
                                        return (
                                            <div
                                                key={category}
                                                className={`inline-flex items-center overflow-hidden rounded-full border text-xs font-bold transition-all ${isSelected
                                                    ? (isDarkMode ? 'border-white bg-white text-zinc-950' : 'border-slate-900 bg-slate-900 text-white')
                                                    : (isDarkMode ? 'border-zinc-800 bg-zinc-950 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-600')
                                                    }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, category })}
                                                    className="px-3 py-1.5"
                                                >
                                                    {label}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCategory(category)}
                                                    className={`px-2 py-1.5 transition-colors ${isSelected
                                                        ? (isDarkMode ? 'hover:bg-zinc-200' : 'hover:bg-slate-700')
                                                        : (isDarkMode ? 'text-zinc-600 hover:bg-rose-500 hover:text-white' : 'text-slate-400 hover:bg-rose-500 hover:text-white')
                                                        }`}
                                                    title={t('deleteCategory').replace('{category}', label)}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('form.productUrl')}</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                        <LinkIcon size={18} />
                                    </div>
                                    <input
                                        type="url"
                                        placeholder={t('form.productUrlPlaceholder')}
                                        className={`w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium ${isDarkMode
                                            ? 'bg-zinc-950 text-white focus:bg-black focus:ring-zinc-700 placeholder:text-zinc-800'
                                            : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-slate-900 placeholder:text-slate-300'}`}
                                        value={formData.url}
                                        onChange={(e) => {
                                            setFormData({ ...formData, url: e.target.value.trim() });
                                        }}
                                        onBlur={() => handleAutofill(false)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleAutofill(true)}
                                    disabled={!isHttpUrl(formData.url.trim()) || isAutofilling}
                                    title={t('form.autofillFromLink')}
                                    className={`w-12 rounded-2xl flex items-center justify-center transition-all ${isHttpUrl(formData.url.trim()) && !isAutofilling
                                        ? (isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-200' : 'bg-slate-900 text-white hover:bg-slate-800')
                                        : (isDarkMode ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed')
                                        }`}
                                >
                                    {isAutofilling ? <Loader2 size={18} className="animate-spin" /> : <WandSparkles size={18} />}
                                </button>
                            </div>
                            <p className={`text-[11px] font-medium pl-1 ${autofillMessage
                                ? autofillMessageType === 'error'
                                    ? 'text-rose-500'
                                    : autofillMessageType === 'success'
                                        ? 'text-emerald-500'
                                        : (isDarkMode ? 'text-zinc-400' : 'text-slate-500')
                                : (isDarkMode ? 'text-zinc-600' : 'text-slate-400')
                                }`}>
                                {autofillMessage || t('form.autofillHint')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('form.imageUrl')}</label>
                            <div className="relative">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                    <ImageIcon size={18} />
                                </div>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    className={`w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium ${isDarkMode
                                        ? 'bg-zinc-950 text-white focus:bg-black focus:ring-zinc-700 placeholder:text-zinc-800'
                                        : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-slate-900 placeholder:text-slate-300'}`}
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('form.publicNote')}</label>
                            <div className="relative">
                                <div className={`absolute top-4 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                    <MessageSquare size={18} />
                                </div>
                                <textarea
                                    placeholder={t('form.publicNotePlaceholder')}
                                    className={`w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium min-h-[78px] resize-none ${isDarkMode
                                        ? 'bg-zinc-950 text-white focus:bg-black focus:ring-zinc-700 placeholder:text-zinc-800'
                                        : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-slate-900 placeholder:text-slate-300'}`}
                                    value={formData.publicNote}
                                    onChange={(e) => setFormData({ ...formData, publicNote: e.target.value })}
                                />
                            </div>
                        </div>

                        {initialData && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('form.privateNotes')}</label>
                                <textarea
                                    placeholder={t('form.privateNotesPlaceholder')}
                                    className={`w-full px-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium min-h-[100px] resize-none ${isDarkMode
                                        ? 'bg-zinc-950 text-white focus:bg-black focus:ring-zinc-700 placeholder:text-zinc-800'
                                        : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-slate-900 placeholder:text-slate-300'}`}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isDarkMode
                                    ? 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-white/5'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'}`}
                            >
                                <span>{initialData ? t('form.saveChanges') : t('form.addToList')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div >
    );
};

export default ProductForm;
