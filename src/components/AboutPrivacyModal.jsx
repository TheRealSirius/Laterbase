import React from 'react';
import { createElement } from 'react';
import { Database, EyeOff, Globe2, ImageOff, ShieldCheck, WandSparkles, X } from 'lucide-react';

const AboutPrivacyModal = ({ isOpen, onClose, isDarkMode, t }) => {
    if (!isOpen) return null;

    const items = [
        { icon: Database, title: t('privacyModal.localTitle'), text: t('privacyModal.localText') },
        { icon: EyeOff, title: t('privacyModal.telemetryTitle'), text: t('privacyModal.telemetryText') },
        { icon: ImageOff, title: t('privacyModal.imagesTitle'), text: t('privacyModal.imagesText') },
        { icon: WandSparkles, title: t('privacyModal.autofillTitle'), text: t('privacyModal.autofillText') },
    ];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-lg rounded-3xl border p-7 shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-100 text-slate-950'}`}>
                <button
                    onClick={onClose}
                    className={`absolute right-4 top-4 rounded-xl p-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                    title={t('common.close')}
                >
                    <X size={18} />
                </button>

                <div className="mb-6 flex items-start gap-4">
                    <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">{t('privacyModal.title')}</h2>
                        <p className={`mt-1 text-sm leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{t('privacyModal.subtitle')}</p>
                    </div>
                </div>

                <div className="grid gap-3">
                    {items.map(({ icon, title, text }) => (
                        <div key={title} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-100 bg-slate-50'}`}>
                            <div className="flex gap-3">
                                <div className={`mt-0.5 rounded-xl p-2 ${isDarkMode ? 'bg-zinc-900 text-zinc-400' : 'bg-white text-slate-500'}`}>
                                    {createElement(icon, { size: 17 })}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{title}</p>
                                    <p className={`mt-1 text-xs leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`mt-4 flex gap-3 rounded-2xl border p-4 ${isDarkMode ? 'border-sky-500/20 bg-sky-500/10 text-sky-200' : 'border-sky-100 bg-sky-50 text-sky-900'}`}>
                    <Globe2 size={18} className="mt-0.5 shrink-0" />
                    <p className="text-xs font-semibold leading-relaxed">{t('privacyModal.networkNote')}</p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className={`mt-5 w-full rounded-2xl py-3 font-black transition-all ${isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-200' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
                >
                    {t('common.close')}
                </button>
            </div>
        </div>
    );
};

export default AboutPrivacyModal;
