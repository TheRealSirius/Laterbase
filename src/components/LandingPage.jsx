import React, { useState } from 'react';
import { Gift, Mail, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const LandingPage = ({ isDarkMode }) => {
    const { signUp, signInWithPassword, signInWithGoogle } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showTerms, setShowTerms] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return;

        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (isRegister) {
                const result = await signUp(email, password);
                setMessage(result.message);
                setEmail('');
                setPassword('');
            } else {
                await signInWithPassword(email, password);
            }
        } catch (err) {
            setError(err.message || 'Errore durante l\'operazione');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Inserisci la tua email');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin
            });

            if (error) throw error;

            setMessage('Email di reset inviata! Controlla la tua posta.');
            setEmail('');
        } catch (err) {
            setError(err.message || 'Errore nell\'invio dell\'email');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err.message || 'Errore durante il login con Google');
        } finally {
            // Always reset loading state, even if cancelled or redirected
            setLoading(false);
        }
    };

    // Forgot Password View
    if (isForgotPassword) {
        return (
            <div className={'min-h-screen flex items-center justify-center p-6 ' + (isDarkMode ? 'bg-zinc-950' : 'bg-gradient-to-br from-slate-50 to-slate-100')}>
                <div className={'w-full max-w-md rounded-3xl p-8 shadow-2xl border ' + (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100')}>

                    <button
                        onClick={() => { setIsForgotPassword(false); setError(''); setMessage(''); }}
                        className={'flex items-center gap-2 mb-6 transition-colors ' + (isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}
                    >
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">Torna al login</span>
                    </button>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">Password dimenticata?</h2>
                        <p className={'text-sm ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-500')}>
                            Inserisci la tua email per ricevere il link di reset
                        </p>
                    </div>

                    {message && (
                        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm text-center">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                            <label className={'block text-xs font-bold uppercase tracking-wider mb-2 ' + (isDarkMode ? 'text-zinc-400' : 'text-slate-500')}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="la-tua@email.com"
                                disabled={loading}
                                autoFocus
                                className={'w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 ' +
                                    (isDarkMode
                                        ? 'bg-zinc-800 border-zinc-700 focus:border-zinc-500 focus:ring-zinc-700 placeholder:text-zinc-600'
                                        : 'bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-slate-200 placeholder:text-slate-400')}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className={'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ' +
                                (isDarkMode ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-slate-900 text-white hover:bg-slate-800')}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Mail size={18} /> Invia email di reset</>}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <footer className={'absolute bottom-0 left-0 right-0 text-center py-6 text-xs ' + (isDarkMode ? 'text-zinc-600' : 'text-gray-500')}>
                    © 2026 Progetto idealizzato da{' '}
                    <a
                        href="https://t.me/PortfolioSirius"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={'hover:underline transition-colors ' + (isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-slate-900')}
                    >
                        Sirius
                    </a>
                </footer>
            </div>
        );
    }

    return (
        <div className={'min-h-screen flex flex-col items-center justify-center p-6 relative ' + (isDarkMode ? 'bg-zinc-950' : 'bg-gradient-to-br from-slate-50 to-slate-100')}>
            <div className={'w-full max-w-md rounded-3xl p-8 shadow-2xl border ' + (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100')}>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className={'w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ' +
                        (isDarkMode ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-emerald-400 to-teal-500')}>
                        <Gift size={40} className="text-white" />
                    </div>
                    <h1 className={'text-3xl font-bold mb-2 ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                        Wishlist & Shopping
                    </h1>
                    <p className={'text-sm ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-500')}>
                        Organizza i tuoi desideri, sincronizzali ovunque
                    </p>
                </div>

                {/* Google Login Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className={'w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all border disabled:opacity-50 disabled:cursor-not-allowed mb-6 ' +
                        (isDarkMode
                            ? 'bg-white text-zinc-900 hover:bg-zinc-100 border-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-md hover:shadow-lg')}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Accedi con Google
                </button>

                {/* Divider */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className={'w-full border-t ' + (isDarkMode ? 'border-zinc-800' : 'border-slate-200')} />
                    </div>
                    <div className="relative flex justify-center">
                        <span className={'px-4 text-xs uppercase tracking-wider ' + (isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-white text-slate-400')}>
                            oppure con email
                        </span>
                    </div>
                </div>

                {/* Messages */}
                {message && (
                    <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm text-center">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Toggle Login/Register */}
                <div className={'flex p-1 rounded-xl mb-6 ' + (isDarkMode ? 'bg-zinc-800' : 'bg-slate-100')}>
                    <button
                        type="button"
                        onClick={() => { setIsRegister(false); setError(''); setMessage(''); }}
                        className={'flex-1 py-2 rounded-lg text-sm font-semibold transition-all ' +
                            (!isRegister
                                ? (isDarkMode ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                                : (isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'))}
                    >
                        Accedi
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIsRegister(true); setError(''); setMessage(''); }}
                        className={'flex-1 py-2 rounded-lg text-sm font-semibold transition-all ' +
                            (isRegister
                                ? (isDarkMode ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                                : (isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'))}
                    >
                        Registrati
                    </button>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={'block text-xs font-bold uppercase tracking-wider mb-2 ' + (isDarkMode ? 'text-zinc-400' : 'text-slate-500')}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="la-tua@email.com"
                            disabled={loading}
                            className={'w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 ' +
                                (isDarkMode
                                    ? 'bg-zinc-800 border-zinc-700 focus:border-zinc-500 focus:ring-zinc-700 placeholder:text-zinc-600'
                                    : 'bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-slate-200 placeholder:text-slate-400')}
                        />
                    </div>

                    <div>
                        <label className={'block text-xs font-bold uppercase tracking-wider mb-2 ' + (isDarkMode ? 'text-zinc-400' : 'text-slate-500')}>
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={loading}
                                className={'w-full px-4 py-3 pr-12 rounded-xl border transition-all focus:outline-none focus:ring-2 ' +
                                    (isDarkMode
                                        ? 'bg-zinc-800 border-zinc-700 focus:border-zinc-500 focus:ring-zinc-700 placeholder:text-zinc-600'
                                        : 'bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-slate-200 placeholder:text-slate-400')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={'absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ' + (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-600')}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Forgot Password Link */}
                        {!isRegister && (
                            <button
                                type="button"
                                onClick={() => { setIsForgotPassword(true); setError(''); setMessage(''); }}
                                className={'mt-2 text-sm font-medium transition-colors ' + (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-700')}
                            >
                                Password dimenticata?
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className={'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ' +
                            (isDarkMode ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-900 text-white hover:bg-slate-800')}
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <>{isRegister ? 'Crea Account' : 'Accedi'}</>}
                    </button>
                </form>

                <p className={'text-center text-xs mt-6 ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                    {isRegister
                        ? (
                            <>
                                Creando un account, accetti i{' '}
                                <button
                                    type="button"
                                    onClick={() => setShowTerms(true)}
                                    className={'underline transition-colors ' + (isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-700')}
                                >
                                    termini di servizio
                                </button>
                            </>
                        )
                        : 'I tuoi dati saranno sincronizzati in modo sicuro'}
                </p>
            </div>

            {/* Terms of Service Modal */}
            {showTerms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                        onClick={() => setShowTerms(false)}
                    />
                    <div className={'relative w-full max-w-md rounded-3xl p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-300 ' + (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100')}>
                        <h3 className={'text-xl font-bold mb-4 ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                            Termini di Servizio
                        </h3>

                        <div className={'space-y-4 text-sm ' + (isDarkMode ? 'text-zinc-400' : 'text-slate-600')}>
                            <p>
                                <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Progetto Portfolio</strong><br />
                                Wishlist & Shopping è un progetto portfolio sviluppato da Sirius. L'applicazione è fornita "così com'è" a scopo dimostrativo e personale.
                            </p>

                            <p>
                                <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Gestione dei Dati</strong><br />
                                I tuoi dati sono archiviati in modo sicuro tramite Supabase e non vengono ceduti a terzi. Le informazioni raccolte (email, wishlist) sono utilizzate esclusivamente per il funzionamento dell'app.
                            </p>

                            <p>
                                <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Uso Gratuito</strong><br />
                                L'utilizzo dell'app è completamente gratuito e inteso per scopi personali. Non sono previsti abbonamenti o costi nascosti.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowTerms(false)}
                            className={'w-full mt-6 py-3 rounded-xl font-semibold transition-all ' + (isDarkMode ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-slate-900 text-white hover:bg-slate-800')}
                        >
                            Ho capito
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className={'absolute bottom-0 left-0 right-0 text-center py-6 text-xs ' + (isDarkMode ? 'text-zinc-600' : 'text-gray-500')}>
                © 2026 Progetto idealizzato da{' '}
                <a
                    href="https://t.me/PortfolioSirius"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={'hover:underline transition-colors ' + (isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-slate-900')}
                >
                    Sirius
                </a>
            </footer>
        </div>
    );
};

export default LandingPage;
