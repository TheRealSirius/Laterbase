import React, { useState, useEffect, useRef } from 'react';
import { X, User, Camera, KeyRound, BarChart3, LogOut, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ProfileModal = ({ isOpen, onClose, user, onLogout, isDarkMode }) => {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [sendingReset, setSendingReset] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            // Get display name from user metadata
            setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || 'Utente');
            // Load avatar
            loadAvatar();
        }
    }, [user]);

    const loadAvatar = async () => {
        if (!user) return;

        try {
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(user.id + '/profile_pic');

            // Check if image actually exists by trying to load it
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

            // Upload with upsert to replace existing
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Reload avatar
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

    const handlePasswordReset = async () => {
        if (!user?.email) return;

        setSendingReset(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: window.location.origin
            });

            if (error) throw error;

            setMessage('Email di reset inviata!');
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            console.error('Error sending reset:', error);
            setMessage('Errore nell\'invio');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setSendingReset(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/50"
                style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                onClick={onClose}
            />

            {/* Modal Card */}
            <div
                className={'relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-300 ' +
                    (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100')}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    {/* Avatar */}
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

                    {/* Close Button */}
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

                    {/* Password Reset */}
                    <button
                        onClick={handlePasswordReset}
                        disabled={sendingReset}
                        className={'w-full flex items-center gap-3 p-4 rounded-2xl transition-all ' +
                            (isDarkMode
                                ? 'hover:bg-zinc-800 text-zinc-300'
                                : 'hover:bg-slate-50 text-slate-700')}
                    >
                        {sendingReset ? (
                            <Loader2 size={20} className="animate-spin text-amber-500" />
                        ) : (
                            <KeyRound size={20} className="text-amber-500" />
                        )}
                        <span className="font-medium">Modifica Password</span>
                    </button>

                    {/* Statistics (placeholder) */}
                    <button
                        className={'w-full flex items-center gap-3 p-4 rounded-2xl transition-all ' +
                            (isDarkMode
                                ? 'hover:bg-zinc-800 text-zinc-300'
                                : 'hover:bg-slate-50 text-slate-700')}
                    >
                        <BarChart3 size={20} className="text-indigo-500" />
                        <span className="font-medium">Statistiche</span>
                        <span className={'ml-auto text-xs px-2 py-0.5 rounded-full ' +
                            (isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-100 text-slate-400')}>
                            Presto
                        </span>
                    </button>

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
