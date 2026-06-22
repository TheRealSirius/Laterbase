import React from 'react';
import { createElement } from 'react';
import { CheckCircle2, Database, EyeOff, Image, KeyRound, Languages, X } from 'lucide-react';

const OnboardingModal = ({ isOpen, onClose, onOpenAccount, onOpenPrivacy, isDarkMode, t }) => {
    if (!isOpen) return null;

    const steps = [
        { icon: KeyRound, title: t('onboarding.passwordTitle'), text: t('onboarding.passwordText') },
        { icon: Languages, title: t('onboarding.languageTitle'), text: t('onboarding.languageText') },
        { icon: Image, title: t('onboarding.imagesTitle'), text: t('onboarding.imagesText') },
        { icon: Database, title: t('onboarding.backupTitle'), text: t('onboarding.backupText') },
        { icon: EyeOff, title: t('onboarding.privacyTitle'), text: t('onboarding.privacyText') },
    ];

    return (
        <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-xl rounded-3xl border p-7 shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-100 text-slate-950'}`}>
                <button
                    onClick={onClose}
                    className={`absolute right-4 top-4 rounded-xl p-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                    title={t('common.close')}
                >
                    <X size={18} />
                </button>

                <div className="mb-6">
                    <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${isDarkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                        <CheckCircle2 size={14} />
                        {t('onboarding.badge')}
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">{t('onboarding.title')}</h2>
                    <p className={`mt-2 text-sm leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{t('onboarding.subtitle')}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {steps.map(({ icon, title, text }) => (
                        <div key={title} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-100 bg-slate-50'}`}>
                            <div className={`mb-3 inline-flex rounded-xl p-2 ${isDarkMode ? 'bg-zinc-900 text-zinc-400' : 'bg-white text-slate-500'}`}>
                                {createElement(icon, { size: 17 })}
                            </div>
                            <p className="text-sm font-bold">{title}</p>
                            <p className={`mt-1 text-xs leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{text}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            onOpenAccount();
                            onClose();
                        }}
                        className={`flex-1 rounded-2xl py-3 font-black transition-all ${isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-200' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
                    >
                        {t('onboarding.accountButton')}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onOpenPrivacy();
                            onClose();
                        }}
                        className={`flex-1 rounded-2xl py-3 font-black transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        {t('onboarding.privacyButton')}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`flex-1 rounded-2xl py-3 font-black transition-all ${isDarkMode ? 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        {t('onboarding.doneButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
