import React, { useState } from 'react';
import { Download, FileImage, FileText, Gift, ListChecks, X } from 'lucide-react';

const ExportModal = ({ isOpen, onClose, onExport, isDarkMode, t }) => {
    const [theme, setTheme] = useState('compact');
    const [format, setFormat] = useState('image');
    const [includePrices, setIncludePrices] = useState(true);
    const [onlyGiftIdeas, setOnlyGiftIdeas] = useState(false);

    if (!isOpen) return null;

    const optionClass = (active) => `flex-1 rounded-2xl border p-4 text-left transition-all ${active
        ? (isDarkMode ? 'border-white bg-white text-zinc-950' : 'border-slate-950 bg-slate-950 text-white')
        : (isDarkMode ? 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300')
        }`;

    return (
        <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-3xl border p-7 shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-100 text-slate-950'}`}>
                <button
                    onClick={onClose}
                    className={`absolute right-4 top-4 rounded-xl p-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                >
                    <X size={18} />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-black tracking-tight">{t('exportModal.title')}</h2>
                    <p className={`mt-1 text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('exportModal.subtitle')}</p>
                </div>

                <div className="space-y-5">
                    <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-950/70' : 'border-slate-100 bg-slate-50'}`}>
                        <div className={`mb-3 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {t('exportModal.preview')}
                        </div>
                        <div className={`rounded-2xl border p-4 ${theme === 'gift'
                            ? (isDarkMode ? 'border-rose-500/20 bg-rose-500/10' : 'border-rose-100 bg-rose-50')
                            : (isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-slate-200 bg-white')
                            }`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className={`mb-2 h-2 w-16 rounded-full ${theme === 'gift' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                    <div className={`h-3 w-36 rounded-full ${isDarkMode ? 'bg-zinc-700' : 'bg-slate-300'}`} />
                                    <div className={`mt-2 h-2 w-24 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                                </div>
                                {includePrices && (
                                    <div className={`h-8 w-20 rounded-full ${theme === 'gift'
                                        ? (isDarkMode ? 'bg-rose-400/20' : 'bg-rose-100')
                                        : (isDarkMode ? 'bg-zinc-800' : 'bg-slate-100')
                                        }`} />
                                )}
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2">
                                {[0, 1, 2].map((item) => (
                                    <div key={item} className={`h-8 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('exportModal.format')}</p>
                        <div className="flex gap-3">
                            <button type="button" className={optionClass(format === 'image')} onClick={() => setFormat('image')}>
                                <FileImage size={18} />
                                <span className="mt-2 block text-sm font-black">{t('exportModal.image')}</span>
                                <span className="mt-1 block text-xs opacity-70">{t('exportModal.imageHelp')}</span>
                            </button>
                            <button type="button" className={optionClass(format === 'pdf')} onClick={() => setFormat('pdf')}>
                                <FileText size={18} />
                                <span className="mt-2 block text-sm font-black">{t('exportModal.pdf')}</span>
                                <span className="mt-1 block text-xs opacity-70">{t('exportModal.pdfHelp')}</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('exportModal.layout')}</p>
                        <div className="flex gap-3">
                            <button type="button" className={optionClass(theme === 'compact')} onClick={() => setTheme('compact')}>
                                <ListChecks size={18} />
                                <span className="mt-2 block text-sm font-black">{t('exportModal.compact')}</span>
                                <span className="mt-1 block text-xs opacity-70">{t('exportModal.compactHelp')}</span>
                            </button>
                            <button type="button" className={optionClass(theme === 'gift')} onClick={() => setTheme('gift')}>
                                <Gift size={18} />
                                <span className="mt-2 block text-sm font-black">{t('exportModal.gift')}</span>
                                <span className="mt-1 block text-xs opacity-70">{t('exportModal.giftHelp')}</span>
                            </button>
                        </div>
                    </div>

                    <label className={`flex items-center justify-between rounded-2xl border p-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-950' : 'border-slate-100 bg-slate-50'}`}>
                        <span>
                            <span className="block text-sm font-bold">{t('exportModal.includePrices')}</span>
                            <span className={`block text-xs ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{t('exportModal.includePricesHelp')}</span>
                        </span>
                        <input type="checkbox" checked={includePrices} onChange={(event) => setIncludePrices(event.target.checked)} className="h-5 w-5 accent-emerald-500" />
                    </label>

                    <label className={`flex items-center justify-between rounded-2xl border p-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-950' : 'border-slate-100 bg-slate-50'}`}>
                        <span>
                            <span className="block text-sm font-bold">{t('exportModal.onlyGiftIdeas')}</span>
                            <span className={`block text-xs ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{t('exportModal.onlyGiftIdeasHelp')}</span>
                        </span>
                        <input type="checkbox" checked={onlyGiftIdeas} onChange={(event) => setOnlyGiftIdeas(event.target.checked)} className="h-5 w-5 accent-rose-500" />
                    </label>

                    <button
                        type="button"
                        onClick={() => {
                            onExport({ theme, format, includePrices, onlyGiftIdeas });
                            onClose();
                        }}
                        className={`w-full rounded-2xl py-4 font-black transition-all flex items-center justify-center gap-2 ${isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-200' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
                    >
                        <Download size={18} />
                        {format === 'pdf' ? t('exportModal.printPdf') : t('exportModal.downloadImage')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
