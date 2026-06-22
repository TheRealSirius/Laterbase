import React, { useState } from 'react';
import {
    Archive,
    Eye,
    EyeOff,
    Globe2,
    Heart,
    Lock,
    LogIn,
    Mail,
    PiggyBank,
    Server,
    Share2,
    ShieldCheck,
    Target,
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const WishMark = () => (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#11233d] text-white shadow-lg shadow-[#11233d]/15">
        <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden="true">
            <path
                d="M15 7h18a4 4 0 0 1 4 4v29.4a1.8 1.8 0 0 1-2.9 1.4L24 34l-10.1 7.8a1.8 1.8 0 0 1-2.9-1.4V11a4 4 0 0 1 4-4Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
            />
            <path
                d="M20.2 20.6c-3-3.2-8 1.2-4.2 5.4l8 7.3 8-7.3c3.8-4.2-1.2-8.6-4.2-5.4L24 24.3l-3.8-3.7Z"
                fill="#ff735c"
            />
            <path d="M36 4v7M32.5 7.5h7" stroke="#79c7b5" strokeLinecap="round" strokeWidth="2.6" />
        </svg>
    </div>
);

const capabilityItems = [
    { icon: Target, titleKey: 'login.featureTargetsShort' },
    { icon: PiggyBank, titleKey: 'login.featureBudgetShort' },
    { icon: Archive, titleKey: 'login.featureArchiveShort' },
    { icon: Share2, titleKey: 'login.featureShareShort' },
    { icon: Globe2, titleKey: 'login.featureLanguageShort' },
    { icon: ShieldCheck, titleKey: 'login.featurePrivacyShort' },
];

const PreviewRow = ({ name, meta, value, tone = 'navy' }) => {
    const toneClass = {
        navy: 'bg-[#edf3ff] text-[#163765]',
        coral: 'bg-[#fff0ec] text-[#c9503b]',
        mint: 'bg-[#eaf8f4] text-[#307d70]',
    };

    return (
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm">
            <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#10233f]">{name}</p>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{meta}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${toneClass[tone]}`}>{value}</span>
        </div>
    );
};

const CapabilityRail = ({ isDarkMode, t, className = '' }) => (
    <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${className}`}>
        {capabilityItems.map((item) => {
            const Icon = item.icon;
            return (
                <div key={item.titleKey} className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-slate-200 bg-white/72'}`}>
                    <Icon className="shrink-0 text-[#4d9b8a]" size={15} strokeWidth={2.2} />
                    <span className="truncate text-[11px] font-black">{t(item.titleKey)}</span>
                </div>
            );
        })}
    </div>
);

const ProductPreview = ({ t, formatCurrency, className = '' }) => (
    <div className={`relative overflow-hidden rounded-[1.7rem] border border-white/75 bg-white/70 p-4 shadow-2xl shadow-[#c9c2b5]/35 backdrop-blur-xl ${className}`}>
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#79c7b5]/18" />
        <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-[#ff735c]/12" />

        <div className="relative flex items-center justify-between gap-4">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">{t('login.capabilitiesLabel')}</p>
                <h3 className="mt-1 font-serif text-2xl font-black text-[#10233f]">Wishlist OS</h3>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#10233f] text-white">
                <Server size={20} />
            </div>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
            {[
                ['12', t('login.previewWishes')],
                [formatCurrency(420), t('login.previewBudget')],
                ['0', t('login.previewTracker')],
            ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-[#f7f5f0] px-3 py-3">
                    <p className="text-lg font-black text-[#10233f]">{value}</p>
                    <p className="mt-0.5 text-[11px] font-bold text-slate-500">{label}</p>
                </div>
            ))}
        </div>

        <div className="relative mt-4 space-y-2.5">
            <PreviewRow name="Sony WH-1000XM5" meta={t('login.previewTargetMeta')} value="-18%" tone="coral" />
            <PreviewRow name="Steam Deck OLED" meta={t('login.previewSavingsMeta')} value={formatCurrency(679)} tone="mint" />
            <PreviewRow name={t('login.previewGiftName')} meta={t('login.previewShareMeta')} value={t('login.previewShareButton')} />
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
            {capabilityItems.map((item) => {
                const Icon = item.icon;
                return (
                    <div key={item.titleKey} className="flex min-w-0 items-center gap-2 rounded-xl border border-white bg-white/75 px-3 py-2">
                        <Icon className="shrink-0 text-[#4d9b8a]" size={15} strokeWidth={2.2} />
                        <span className="truncate text-[11px] font-black text-[#10233f]">{t(item.titleKey)}</span>
                    </div>
                );
            })}
        </div>
    </div>
);

const SelfHostedLogin = ({ isDarkMode, onLogin, language, onLanguageChange, t, formatCurrency }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onLogin({ email, password });
        } catch (err) {
            setError(err.message || t('login.errorFallback'));
        } finally {
            setLoading(false);
        }
    };

    const formSurface = isDarkMode
        ? 'border-zinc-800 bg-zinc-950/90 text-white shadow-black/30'
        : 'border-white bg-white/92 text-[#10233f] shadow-[#c9c2b5]/35';

    return (
        <div className={`min-h-screen overflow-x-hidden p-3 font-sans sm:p-5 ${isDarkMode ? 'bg-[#080b10] text-white' : 'bg-[#eee9df] text-[#10233f]'}`}>
            <div
                className="fixed inset-0 opacity-80"
                style={{
                    backgroundImage: isDarkMode
                        ? 'radial-gradient(circle at 18% 20%, rgba(121,199,181,.15), transparent 28%), radial-gradient(circle at 82% 14%, rgba(255,115,92,.12), transparent 26%)'
                        : 'radial-gradient(circle at 14% 18%, rgba(121,199,181,.20), transparent 28%), radial-gradient(circle at 86% 16%, rgba(255,115,92,.15), transparent 25%), linear-gradient(135deg, rgba(255,255,255,.55), rgba(255,255,255,.18))',
                }}
            />

            <main className={`relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1360px] overflow-hidden rounded-[2rem] border shadow-2xl sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[minmax(0,1.04fr)_minmax(390px,0.72fr)] ${isDarkMode ? 'border-zinc-800 bg-[#0e141b]' : 'border-white/75 bg-[#fbfaf7]'}`}>
                <section className="relative flex min-w-0 flex-col justify-between p-6 sm:p-8 lg:p-10">
                    <div className="flex items-center justify-between gap-5">
                        <div className="flex min-w-0 items-center gap-3">
                            <WishMark />
                            <span className="truncate font-serif text-3xl font-black tracking-tight sm:text-4xl">{t('login.brand')}</span>
                        </div>
                        <div className="shrink-0 lg:hidden">
                            <LanguageSelector language={language} onChange={onLanguageChange} isDarkMode={isDarkMode} label={t('language')} />
                        </div>
                    </div>

                    <div className="my-8 grid items-center gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.82fr)]">
                        <div className="max-w-xl">
                            <h1 className="font-serif text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl xl:text-6xl">
                                {t('login.heroTitle')}
                            </h1>
                            <p className={`mt-5 max-w-lg text-base font-medium leading-7 sm:text-lg ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                                {t('login.heroText')}
                            </p>

                            <div className="mt-7 grid max-w-lg grid-cols-3 gap-2">
                                {[
                                    [ShieldCheck, t('login.featurePrivacyShort')],
                                    [Server, 'Docker'],
                                    [Heart, t('local')],
                                ].map(([Icon, label]) => (
                                    <div key={label} className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-black ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-slate-200 bg-white/70'}`}>
                                        {React.createElement(Icon, { size: 15, className: 'text-[#4d9b8a]' })}
                                        <span className="truncate">{label}</span>
                                    </div>
                                ))}
                            </div>

                            <CapabilityRail isDarkMode={isDarkMode} t={t} className="mt-4 max-w-lg xl:hidden" />
                        </div>

                        <ProductPreview t={t} formatCurrency={formatCurrency} className="hidden md:block" />
                    </div>

                    <p className={`text-sm font-bold ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{t('login.status')}</p>
                </section>

                <aside className={`relative flex min-w-0 flex-col justify-center border-t p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10 ${isDarkMode ? 'border-zinc-800 bg-black/18' : 'border-slate-200/70 bg-white/42'}`}>
                    <div className="absolute right-8 top-8 hidden lg:block">
                        <LanguageSelector language={language} onChange={onLanguageChange} isDarkMode={isDarkMode} label={t('language')} />
                    </div>

                    <form onSubmit={handleSubmit} className={`mx-auto w-full max-w-[430px] rounded-[1.5rem] border p-6 shadow-2xl backdrop-blur-xl sm:p-7 ${formSurface}`}>
                        <div className="mb-6">
                            <h2 className="font-serif text-4xl font-black tracking-tight">{t('login.title')}</h2>
                            <p className={`mt-2 text-sm font-semibold ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{t('login.subtitle')}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="wishlist-email" className={`mb-2 block text-xs font-black uppercase tracking-[0.17em] ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                                    {t('login.email')}
                                </label>
                                <div className="relative">
                                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`} size={18} />
                                    <input
                                        id="wishlist-email"
                                        type="email"
                                        autoComplete="username"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="admin@wishlist.local"
                                        className={`w-full rounded-2xl border py-4 pl-12 pr-4 text-sm font-bold outline-none transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-700 focus:border-[#79c7b5]' : 'border-slate-200 bg-white text-[#10233f] placeholder:text-slate-400 focus:border-[#10233f]'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="wishlist-password" className={`mb-2 block text-xs font-black uppercase tracking-[0.17em] ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                                    {t('login.password')}
                                </label>
                                <div className="relative">
                                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`} size={18} />
                                    <input
                                        id="wishlist-password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder={t('login.passwordPlaceholder')}
                                        className={`w-full rounded-2xl border py-4 pl-12 pr-12 text-sm font-bold outline-none transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-700 focus:border-[#79c7b5]' : 'border-slate-200 bg-white text-[#10233f] placeholder:text-slate-400 focus:border-[#10233f]'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
                                        title={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-500">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all ${loading || !email || !password
                                ? isDarkMode ? 'cursor-not-allowed bg-zinc-800 text-zinc-600' : 'cursor-not-allowed bg-slate-200 text-slate-400'
                                : 'bg-[#10233f] text-white shadow-xl shadow-[#10233f]/18 hover:bg-[#18365f]'
                                }`}
                        >
                            <LogIn size={18} />
                            {loading ? t('login.submitting') : t('login.submit')}
                        </button>

                        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <div className="h-px bg-current/10" />
                            <span className={`text-xs font-bold ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`}>{t('local')}</span>
                            <div className="h-px bg-current/10" />
                        </div>

                        <div className={`mt-5 rounded-2xl border px-4 py-3 text-center text-sm font-black ${isDarkMode ? 'border-zinc-800 text-zinc-400' : 'border-[#79c7b5]/50 text-[#377f72]'}`}>
                            <Server className="mr-2 inline" size={16} />
                            Wishlist.local
                        </div>
                    </form>
                </aside>
            </main>
        </div>
    );
};

export default SelfHostedLogin;
