import React from 'react';
import { ExternalLink, CheckCircle, Trash2, ShoppingBag, FileText, Share2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ProductCard = ({ product, onTogglePurchase, onDelete, onEdit, onShowToast, isDarkMode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: product.id, disabled: product.isPurchased });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const priorityEmojis = {
        '3': '🔥',
        '2': '⏳',
        '1': '❄️',
    };

    const currentPrice = Number(product.price);
    const initialPrice = Number(product.initialPrice || product.price);
    const discount = initialPrice > currentPrice
        ? Math.round(((initialPrice - currentPrice) / initialPrice) * 100)
        : 0;

    const handleShare = (e) => {
        e.stopPropagation();
        const text = `Prodotto: ${product.name} - Prezzo: €${currentPrice.toFixed(2)} - Link: ${product.url || 'Non disponibile'}`;
        navigator.clipboard.writeText(text);
        onShowToast('Dettagli copiati!');
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            id={product.id}
            onClick={() => onEdit(product)}
            className={`group rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer ${isDarkMode
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1'
                } ${product.isPurchased ? 'opacity-75' : ''} ${isDragging ? 'z-50 shadow-2xl scale-[1.02] opacity-80' : ''}`}
        >
            <div className={`relative h-56 flex items-center justify-center p-4 overflow-hidden ${isDarkMode ? 'bg-zinc-950/50' : 'bg-slate-50/50'}`}>
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600&auto=format&fit=crop'; }}
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'text-zinc-800' : 'text-slate-100'}`}>
                        <ShoppingBag size={56} strokeWidth={1.5} />
                    </div>
                )}

                {!product.isPurchased && (
                    <div
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute top-3 right-3 p-1.5 rounded-lg backdrop-blur-md transition-opacity md:opacity-0 md:group-hover:opacity-100 cursor-grab active:cursor-grabbing z-10 ${isDarkMode ? 'bg-zinc-900/80 text-zinc-500 hover:text-white' : 'bg-white/80 text-slate-400 hover:text-slate-600 shadow-sm'
                            }`}
                        title="Trascina per riordinare"
                    >
                        <GripVertical size={18} />
                    </div>
                )}

                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <span className={`backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border w-fit ${isDarkMode ? 'bg-zinc-900/90 text-zinc-300 border-zinc-700' : 'bg-white/90 text-slate-900 border-slate-100'
                        }`}>
                        {product.category}
                    </span>
                    {discount > 0 && !product.isPurchased && (
                        <span className={`backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm border w-fit animate-pulse ${isDarkMode ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50/90 text-emerald-600 border-emerald-100'
                            }`}>
                            -{discount}% RISPARMIO
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
                            <span className="font-semibold text-sm">Acquistato</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col gap-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                            <h4 className={`font-semibold truncate text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{product.name}</h4>
                            {product.notes && product.notes.trim() !== '' && (
                                <FileText size={14} className={`${isDarkMode ? 'text-zinc-600' : 'text-slate-400'} flex-shrink-0`} title="Contiene note" />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={`font-bold flex-shrink-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>€{currentPrice.toFixed(2)}</span>
                        {discount > 0 && (
                            <span className={`text-[10px] line-through ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`}>€{initialPrice.toFixed(2)}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                    {(() => {
                        const url = product.url || '';
                        let domain = 'Vai allo Store';
                        let Icon = ExternalLink;

                        try {
                            if (url) {
                                const urlObj = new URL(url);
                                domain = urlObj.hostname.replace('www.', '');

                                if (domain.includes('amazon')) {
                                    Icon = ShoppingBag;
                                } else if (domain.includes('apple')) {
                                    Icon = Package; // Placeholder for Apple-specific icon logic if needed
                                }
                            }
                        } catch (e) {
                            // Invalid URL, fallback to default
                        }

                        return (
                            <a
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Icon size={14} />
                                <span className="capitalize">{domain}</span>
                            </a>
                        );
                    })()}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700' : 'bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200'
                                }`}
                            title="Condividi"
                        >
                            <Share2 size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onTogglePurchase(product.id); }}
                            className={`p-2.5 rounded-xl transition-all ${product.isPurchased
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : (isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-emerald-400' : 'bg-slate-100 text-slate-400 hover:text-emerald-500 hover:bg-slate-200')
                                }`}
                            title={product.isPurchased ? "Rimuovi dallo storico" : "Segna come Acquistato"}
                        >
                            <CheckCircle size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-rose-400' : 'bg-slate-100 text-slate-400 hover:text-rose-500 hover:bg-slate-200'
                                }`}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
