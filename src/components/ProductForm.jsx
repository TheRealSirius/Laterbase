import React, { useState, useEffect } from 'react';
import { X, Tag, Link as LinkIcon, Image as ImageIcon, Euro, Package, Target } from 'lucide-react';

const ProductForm = ({ onClose, onSubmit, categories, initialData, isDarkMode }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        price: initialData?.price || '',
        url: initialData?.url || '',
        imageUrl: initialData?.imageUrl || '',
        category: initialData?.category || '',
        priority: initialData?.priority || '2', // Default to Medium (2)
        notes: initialData?.notes || '',
        targetPrice: initialData?.targetPrice || '',
    });

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
        { value: '3', label: '🔥 Alta', color: 'text-orange-500' },
        { value: '2', label: '⏳ Media', color: 'text-blue-500' },
        { value: '1', label: '❄️ Bassa', color: 'text-slate-400' },
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
                <div className="p-8 overflow-y-auto">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{initialData ? 'Modifica Prodotto' : 'Nuovo Desiderio'}</h2>
                            {initialData?.lastChecked && (
                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                                    Ultimo controllo: <span className={isDarkMode ? 'text-zinc-400' : 'text-slate-500'}>{new Date(initialData.lastChecked).toLocaleDateString()} {new Date(initialData.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                                <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Nome Prodotto</label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                        <Package size={18} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Es. iPhone 15 Pro"
                                        className={`w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium ${isDarkMode
                                            ? 'bg-zinc-950 text-white focus:bg-black focus:ring-zinc-700 placeholder:text-zinc-800'
                                            : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-slate-900 placeholder:text-slate-300'}`}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Priorità</label>
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
                                <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Prezzo (€)</label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                        <Euro size={18} />
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
                                        Prezzo Iniziale: <span className={isDarkMode ? 'text-zinc-400' : 'text-slate-500'}>€ {Number(initialData.initialPrice).toFixed(2)}</span>
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Prezzo Target (€)</label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                        <Target size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Prezzo Desiderato"
                                        className={`w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium ${isDarkMode
                                            ? 'bg-zinc-950 text-white focus:bg-black focus:ring-zinc-700 placeholder:text-zinc-800'
                                            : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-slate-900 placeholder:text-slate-300'}`}
                                        value={formData.targetPrice}
                                        onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Categoria</label>
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
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="" disabled>Scegli...</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>URL Prodotto</label>
                            <div className="relative">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDarkMode ? 'text-zinc-700' : 'text-slate-300'}`}>
                                    <LinkIcon size={18} />
                                </div>
                                <input
                                    type="url"
                                    placeholder="https://amazon.it/..."
                                    className={`w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl focus:ring-2 focus:outline-none transition-all font-medium ${isDarkMode
                                        ? 'bg-zinc-950 text-white focus:bg-black focus:ring-zinc-700 placeholder:text-zinc-800'
                                        : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-slate-900 placeholder:text-slate-300'}`}
                                    value={formData.url}
                                    onChange={(e) => {
                                        const cleanUrl = e.target.value.split('?')[0];
                                        setFormData({ ...formData, url: cleanUrl });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>URL Immagine (Opzionale)</label>
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

                        {initialData && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Note Private</label>
                                <textarea
                                    placeholder="Aggiungi dettagli extra (taglia, colore, codici sconto...)"
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
                                <span>{initialData ? 'Salva Modifiche' : 'Aggiungi alla Lista'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div >
    );
};

export default ProductForm;
