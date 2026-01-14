import React, { useState, useEffect, useRef } from 'react';
import { X, User, Camera, KeyRound, BarChart3, LogOut, Check, Loader2, Eye, EyeOff, Package, Crown, Target, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Animated counter hook
const useAnimatedCounter = (targetValue, duration = 1000) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (targetValue === 0) {
            setCount(0);
            return;
        }

        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            setCount(Math.floor(progress * targetValue));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [targetValue, duration]);

    return count;
};

const ProfileModal = ({ isOpen, onClose, user, onLogout, isDarkMode, products = [] }) => {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);
    const [showStats, setShowStats] = useState(false);

    // Password change state
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // Calculate statistics
    const totalProducts = products.length;
    const purchasedProducts = products.filter(p => p.isPurchased);
    const activeWishlist = products.filter(p => !p.isPurchased && !p.isArchived);
    const archivedProducts = products.filter(p => p.isArchived);

    const wishlistValue = [...activeWishlist, ...archivedProducts].reduce((sum, p) => sum + Number(p.price || 0), 0);
    const totalForCompletion = purchasedProducts.length + activeWishlist.length;
    const completionRate = totalForCompletion > 0 ? Math.round((purchasedProducts.length / totalForCompletion) * 100) : 0;

    // Golden Month - month with most spending this year
    const currentYear = new Date().getFullYear();
    const monthlySpending = {};
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    purchasedProducts.forEach(p => {
        if (p.purchaseDate) {
            const date = new Date(p.purchaseDate);
            if (date.getFullYear() === currentYear) {
                const month = date.getMonth();
                monthlySpending[month] = (monthlySpending[month] || 0) + Number(p.price || 0);
            }
        }
    });

    let goldenMonth = null;
    let maxSpending = 0;
    Object.entries(monthlySpending).forEach(([month, spending]) => {
        if (spending > maxSpending) {
            maxSpending = spending;
            goldenMonth = monthNames[parseInt(month)];
        }
    });

    // Top Category - category with most purchased products
    const categoryCount = {};
    purchasedProducts.forEach(p => {
        const cat = p.category || 'Altro';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    let topCategory = null;
    let maxCount = 0;
    Object.entries(categoryCount).forEach(([cat, count]) => {
        if (count > maxCount) {
            maxCount = count;
            topCategory = cat;
        }
    });

    // Animated values
    const animatedTotal = useAnimatedCounter(showStats ? totalProducts : 0, 800);
    const animatedValue = useAnimatedCounter(showStats ? Math.round(wishlistValue) : 0, 1000);
    const animatedCompletion = useAnimatedCounter(showStats ? completionRate : 0, 1000);

    useEffect(() => {
        if (user) {
            setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || 'Utente');
            loadAvatar();
        }
    }, [user]);

    useEffect(() => {
        if (!isOpen) {
            setIsChangingPassword(false);
            setNewPassword('');
            setConfirmPassword('');
            setShowStats(false);
        }
    }, [isOpen]);

    const loadAvatar = async () => {
        if (!user) return;

        try {
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(user.id + '/profile_pic');

            const img = new Image();
            img.onload = () => setAvatarUrl(data.publicUrl + '?t=' + Date.now());
            img.onerror = () => setAvatarUrl(null);
            img.src = data.publicUrl + '?t=' + Date.now();
        } catch (error) {
            console.error('Error loading avatar:', error);
        }
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            const filePath = user.id + '/profile_pic';

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            await loadAvatar();
            setMessage('Foto profilo aggiornata!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            setMessage('Errore nel caricamento');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setUploading(false);
        }
    };

    const handleNameEdit = () => {
        setTempName(displayName);
        setIsEditingName(true);
    };

    const handleNameSave = async () => {
        if (!tempName.trim() || !user) return;

        setSavingName(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { display_name: tempName.trim() }
            });

            if (error) throw error;

            setDisplayName(tempName.trim());
            setIsEditingName(false);
            setMessage('Nome aggiornato!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error updating name:', error);
            setMessage('Errore nel salvataggio');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setSavingName(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!newPassword || !confirmPassword) {
            setMessage('Errore: Compila tutti i campi');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage('Errore: Le password non coincidono');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        if (newPassword.length < 6) {
            setMessage('Errore: La password deve avere almeno 6 caratteri');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setSavingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setMessage('Password aggiornata con successo!');
            setIsChangingPassword(false);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error updating password:', error);
            setMessage('Errore: ' + (error.message || 'Impossibile aggiornare la password'));
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setSavingPassword(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50"
                style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                onClick={onClose}
            />

            <div
                className={'relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto ' +
                    (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100')}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="relative">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={'w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all hover:scale-105 ' +
                                (isDarkMode ? 'border-zinc-700 bg-zinc-800' : 'border-slate-200 bg-slate-100')}
                        >
                            {uploading ? (
                                <Loader2 size={28} className="animate-spin text-green-500" />
                            ) : avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} className="text-green-500" />
                            )}
                        </button>
                        <div className={'absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 ' +
                            (isDarkMode ? 'bg-zinc-800 border-zinc-900' : 'bg-white border-white')}>
                            <Camera size={12} className={isDarkMode ? 'text-zinc-400' : 'text-slate-500'} />
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div className={'mb-4 px-4 py-2 rounded-xl text-sm text-center font-medium ' +
                        (message.includes('Errore')
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-green-500/10 text-green-500')}>
                        {message}
                    </div>
                )}

                {/* Menu Options */}
                <div className="space-y-2">
                    {/* Display Name */}
                    <div className={'rounded-2xl p-4 ' + (isDarkMode ? 'bg-zinc-800/50' : 'bg-slate-50')}>
                        <label className={'block text-[10px] font-bold uppercase tracking-wider mb-2 ' +
                            (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                            Nome Utente
                        </label>
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    autoFocus
                                    className={'flex-1 px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none ' +
                                        (isDarkMode
                                            ? 'bg-zinc-900 border-zinc-700 focus:border-green-500'
                                            : 'bg-white border-slate-200 focus:border-green-500')}
                                />
                                <button
                                    onClick={handleNameSave}
                                    disabled={savingName}
                                    className="p-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
                                >
                                    {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                </button>
                                <button
                                    onClick={() => setIsEditingName(false)}
                                    className={'p-2 rounded-xl transition-colors ' +
                                        (isDarkMode ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-slate-200 text-slate-500')}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleNameEdit}
                                className={'w-full text-left font-semibold text-lg hover:opacity-70 transition-opacity ' +
                                    (isDarkMode ? 'text-white' : 'text-slate-900')}
                            >
                                {displayName}
                            </button>
                        )}
                        <p className={'text-xs mt-1 ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                            {user.email}
                        </p>
                    </div>

                    {/* Password Change Section */}
                    {isChangingPassword ? (
                        <div className={'rounded-2xl p-4 space-y-3 ' + (isDarkMode ? 'bg-zinc-800/50' : 'bg-slate-50')}>
                            <label className={'block text-[10px] font-bold uppercase tracking-wider ' +
                                (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                                Modifica Password
                            </label>

                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nuova password"
                                    className={'w-full px-3 py-2 pr-10 rounded-xl border text-sm focus:outline-none ' +
                                        (isDarkMode
                                            ? 'bg-zinc-900 border-zinc-700 focus:border-amber-500 placeholder:text-zinc-600'
                                            : 'bg-white border-slate-200 focus:border-amber-500 placeholder:text-slate-400')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className={'absolute right-2 top-1/2 -translate-y-1/2 p-1 ' +
                                        (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-600')}
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Ripeti nuova password"
                                    className={'w-full px-3 py-2 pr-10 rounded-xl border text-sm focus:outline-none ' +
                                        (isDarkMode
                                            ? 'bg-zinc-900 border-zinc-700 focus:border-amber-500 placeholder:text-zinc-600'
                                            : 'bg-white border-slate-200 focus:border-amber-500 placeholder:text-slate-400')}
                                />
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => {
                                        setIsChangingPassword(false);
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                    className={'flex-1 py-2 rounded-xl font-medium transition-colors ' +
                                        (isDarkMode ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300')}
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={savingPassword}
                                    className="flex-1 py-2 rounded-xl font-medium bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Conferma
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsChangingPassword(true)}
                            className={'w-full flex items-center gap-3 p-4 rounded-2xl transition-all ' +
                                (isDarkMode
                                    ? 'hover:bg-zinc-800 text-zinc-300'
                                    : 'hover:bg-slate-50 text-slate-700')}
                        >
                            <KeyRound size={20} className="text-amber-500" />
                            <span className="font-medium">Modifica Password</span>
                        </button>
                    )}

                    {/* Statistics Section */}
                    <div>
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className={'w-full flex items-center gap-3 p-4 rounded-2xl transition-all ' +
                                (isDarkMode
                                    ? 'hover:bg-zinc-800 text-zinc-300'
                                    : 'hover:bg-slate-50 text-slate-700')}
                        >
                            <BarChart3 size={20} className="text-indigo-500" />
                            <span className="font-medium">Statistiche</span>
                            <span className="ml-auto">
                                {showStats ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </span>
                        </button>

                        {showStats && (
                            <div className={'mt-2 p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 ' +
                                (isDarkMode ? 'bg-zinc-800/50' : 'bg-slate-50')}>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Total Products */}
                                    <div className={'p-3 rounded-xl ' + (isDarkMode ? 'bg-zinc-900/50' : 'bg-white')}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Package size={14} className="text-blue-500" />
                                            <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                                                Totale
                                            </span>
                                        </div>
                                        <p className={'text-xl font-bold ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                                            {animatedTotal}
                                        </p>
                                        <p className={'text-[10px] ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                            prodotti
                                        </p>
                                    </div>

                                    {/* Wishlist Value */}
                                    <div className={'p-3 rounded-xl ' + (isDarkMode ? 'bg-zinc-900/50' : 'bg-white')}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp size={14} className="text-emerald-500" />
                                            <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                                                Valore
                                            </span>
                                        </div>
                                        <p className={'text-xl font-bold ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                                            €{animatedValue}
                                        </p>
                                        <p className={'text-[10px] ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                            wishlist
                                        </p>
                                    </div>

                                    {/* Golden Month */}
                                    <div className={'p-3 rounded-xl ' + (isDarkMode ? 'bg-zinc-900/50' : 'bg-white')}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Crown size={14} className="text-amber-500" />
                                            <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                                                Mese d'oro
                                            </span>
                                        </div>
                                        <p className={'text-xl font-bold ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                                            {goldenMonth || '—'}
                                        </p>
                                        <p className={'text-[10px] ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                            {goldenMonth ? '€' + maxSpending.toFixed(0) : 'nessun acquisto'}
                                        </p>
                                    </div>

                                    {/* Top Category */}
                                    <div className={'p-3 rounded-xl ' + (isDarkMode ? 'bg-zinc-900/50' : 'bg-white')}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Target size={14} className="text-purple-500" />
                                            <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                                                Top Cat.
                                            </span>
                                        </div>
                                        <p className={'text-xl font-bold truncate ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                                            {topCategory || '—'}
                                        </p>
                                        <p className={'text-[10px] ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                            {topCategory ? maxCount + ' acquisti' : 'nessun acquisto'}
                                        </p>
                                    </div>
                                </div>

                                {/* Completion Bar */}
                                <div className={'p-3 rounded-xl ' + (isDarkMode ? 'bg-zinc-900/50' : 'bg-white')}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={'text-[10px] font-bold uppercase tracking-wider ' + (isDarkMode ? 'text-zinc-500' : 'text-slate-400')}>
                                            Wishlist Completion
                                        </span>
                                        <span className={'text-sm font-bold ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                                            {animatedCompletion}%
                                        </span>
                                    </div>
                                    <div className={'h-2 rounded-full overflow-hidden ' + (isDarkMode ? 'bg-zinc-800' : 'bg-slate-100')}>
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                                            style={{ width: completionRate + '%' }}
                                        />
                                    </div>
                                    <p className={'text-[10px] mt-1 ' + (isDarkMode ? 'text-zinc-600' : 'text-slate-400')}>
                                        {purchasedProducts.length} acquistati su {purchasedProducts.length + activeWishlist.length} desiderati
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className={'my-2 border-t ' + (isDarkMode ? 'border-zinc-800' : 'border-slate-100')} />

                    {/* Logout */}
                    <button
                        onClick={onLogout}
                        className={'w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-red-500 ' +
                            (isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50')}
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Esci dall'account</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
