import React, { useState } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ isOpen, onClose, isDarkMode }) => {
    const { signInWithEmail, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const result = await signInWithEmail(email);
            setMessage(result.message);
            setEmail('');
        } catch (err) {
            setError(err.message || 'Errore durante il login');
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
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className={'relative w-full max-w-md rounded-3xl p-8 shadow-2xl border ' +
                (isDarkMode
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-white border-slate-100')}>

                <button
                    onClick={onClose}
                    className={'absolute top-4 right-4 p-2 rounded-xl transition-colors ' +
                        (isDarkMode
                            ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600')}
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">Accedi</h2>
                    <p className={'text-sm ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-500')}>
                        Sincronizza la tua wishlist su tutti i dispositivi
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

                <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
                    <div>
                        <label className={'block text-xs font-bold uppercase tracking-wider mb-2 ' +
                            (isDarkMode ? 'text-zinc-400' : 'text-slate-500')}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="la-tua@email.com"
                            disabled={loading}
                            className={'w-full px-4 py-3 rounded-xl border transition-all ' +
                                (isDarkMode
                                    ? 'bg-zinc-800 border-zinc-700 focus:border-zinc-500 placeholder:text-zinc-600'
                                    : 'bg-slate-50 border-slate-200 focus:border-slate-400 placeholder:text-slate-400') +
                                ' focus:outline-none focus:ring-2 ' +
                                (isDarkMode ? 'focus:ring-zinc-700' : 'focus:ring-slate-200')}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email}
                        className={'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ' +
                            (isDarkMode
                                ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                                : 'bg-slate-900 text-white hover:bg-slate-800')}
                    >
                        {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <>
                                <Mail size={18} />
                                Invia Magic Link
                            </>
                        )}
                    </button>
                </form>

                <div className="relative mb-6">
                    <div className={'absolute inset-0 flex items-center'}>
                        <div className={'w-full border-t ' + (isDarkMode ? 'border-zinc-800' : 'border-slate-200')} />
                    </div>
                    <div className="relative flex justify-center">
                        <span className={'px-4 text-xs uppercase tracking-wider ' +
                            (isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-white text-slate-400')}>
                            oppure
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className={'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all border disabled:opacity-50 disabled:cursor-not-allowed ' +
                        (isDarkMode
                            ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm')}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continua con Google
                </button>

                <p className={'text-center text-xs mt-6 ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                    Accedendo, i tuoi dati saranno sincronizzati nel cloud
                </p>
            </div>
        </div>
    );
};

export default LoginModal;
