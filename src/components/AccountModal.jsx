import React, { useState } from 'react';
import { Eye, EyeOff, Image, Lock, Mail, Save, X, LogOut, Download, Upload, MousePointer2, ShieldCheck, CheckCircle2, Clipboard } from 'lucide-react';

const AccountModal = ({ isOpen, onClose, onLogout, onSave, user, isDarkMode, allowExternalImages, onToggleExternalImages, onExportData, onImportData, onCopyQuickAdd, onOpenPrivacy, t }) => {
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [quickAddScript, setQuickAddScript] = useState('');
    const [quickAddCopied, setQuickAddCopied] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');

        if (newPassword.trim() && newPassword.length < 12) {
            setError(t('accountModal.passwordTooShort'));
            return;
        }

        setSaving(true);

        try {
            await onSave({
                email,
                currentPassword,
                newPassword: newPassword.trim() ? newPassword : undefined,
            });
            setCurrentPassword('');
            setNewPassword('');
            setMessage(t('accountModal.updated'));
        } catch (err) {
            setError(err.message || t('accountModal.updateFailed'));
        } finally {
            setSaving(false);
        }
    };

    const inputClass = `w-full rounded-2xl border py-3.5 pl-11 pr-12 outline-none transition-all ${isDarkMode
        ? 'bg-zinc-950 border-zinc-800 text-white focus:border-white placeholder:text-zinc-700'
        : 'bg-slate-50 border-slate-200 focus:border-slate-900 placeholder:text-slate-400'
        }`;

    const handleQuickAdd = async () => {
        const result = await onCopyQuickAdd?.();
        if (!result?.script) return;
        setQuickAddScript(result.script);
        setQuickAddCopied(Boolean(result.copied));
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border p-7 shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-100 text-slate-950'}`}>
                <button
                    onClick={onClose}
                    className={`absolute right-4 top-4 rounded-xl p-2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                >
                    <X size={18} />
                </button>

                <div className="mb-7">
                    <h2 className="text-2xl font-black tracking-tight">{t('account')}</h2>
                    <p className={`mt-1 text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('accountModal.subtitle')}</p>
                </div>

                <div className={`mb-6 rounded-2xl border p-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                            <div className={`mt-0.5 rounded-xl p-2 ${isDarkMode ? 'bg-zinc-900 text-zinc-400' : 'bg-white text-slate-500'}`}>
                                <Image size={17} />
                            </div>
                            <div>
                                <p className="text-sm font-bold">{t('accountModal.externalImages')}</p>
                                <p className={`mt-1 text-xs leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                                    {t('accountModal.externalImagesText')}
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={Boolean(allowExternalImages)}
                                onChange={(event) => onToggleExternalImages(event.target.checked)}
                            />
                            <div className={(isDarkMode ? 'bg-zinc-800' : 'bg-slate-200') + " h-6 w-11 rounded-full transition-all peer-checked:bg-emerald-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"} />
                        </label>
                    </div>
                </div>

                <div className={`mb-6 rounded-2xl border p-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-100 bg-slate-50'}`}>
                    <p className="text-sm font-bold">{t('accountModal.dataTools')}</p>
                    <p className={`mt-1 text-xs leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{t('accountModal.dataToolsText')}</p>
                    <div className={`mt-3 rounded-xl px-3 py-2 text-[11px] font-semibold leading-relaxed ${isDarkMode ? 'bg-amber-500/10 text-amber-200' : 'bg-amber-50 text-amber-800'}`}>
                        {t('accountModal.backupWarning')}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={onExportData}
                            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isDarkMode ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                            <Download size={14} />
                            {t('accountModal.exportData')}
                        </button>
                        <label className={`rounded-xl px-3 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isDarkMode ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>
                            <Upload size={14} />
                            {t('accountModal.importData')}
                            <input
                                type="file"
                                accept="application/json"
                                className="hidden"
                                onChange={(event) => {
                                    onImportData?.(event.target.files?.[0]);
                                    event.target.value = '';
                                }}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={handleQuickAdd}
                            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isDarkMode ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                            <MousePointer2 size={14} />
                            {t('accountModal.quickAdd')}
                        </button>
                        <button
                            type="button"
                            onClick={onOpenPrivacy}
                            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isDarkMode ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                            <ShieldCheck size={14} />
                            {t('privacyModal.shortTitle')}
                        </button>
                    </div>
                    {quickAddScript && (
                        <div className={`mt-4 rounded-2xl border p-3 text-xs ${isDarkMode ? 'border-zinc-800 bg-zinc-900/80 text-zinc-300' : 'border-slate-200 bg-white text-slate-600'}`}>
                            <div className="flex items-start gap-2">
                                {quickAddCopied ? (
                                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={15} />
                                ) : (
                                    <Clipboard className="mt-0.5 shrink-0 text-amber-500" size={15} />
                                )}
                                <div className="min-w-0">
                                    <p className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{t('accountModal.quickAddTitle')}</p>
                                    <p className="mt-1 leading-relaxed">{t('accountModal.quickAddText')}</p>
                                </div>
                            </div>
                            <a
                                href={quickAddScript}
                                onClick={(event) => event.preventDefault()}
                                className={`mt-3 flex items-center justify-center rounded-xl px-3 py-2 font-black transition-all ${isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-200' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
                            >
                                {t('accountModal.quickAddBookmark')}
                            </a>
                            <p className={`mt-2 leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{t('accountModal.quickAddDrag')}</p>
                            <code className={`mt-2 block max-h-20 overflow-auto rounded-xl px-3 py-2 text-[10px] leading-relaxed ${isDarkMode ? 'bg-zinc-950 text-zinc-400' : 'bg-slate-50 text-slate-500'}`}>
                                {quickAddScript}
                            </code>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('login.email')}</label>
                        <div className="relative">
                            <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`} size={17} />
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('accountModal.currentPassword')}</label>
                        <div className="relative">
                            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`} size={17} />
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                placeholder={t('accountModal.currentPasswordPlaceholder')}
                                className={inputClass}
                            />
                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                                {showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{t('accountModal.newPassword')}</label>
                        <div className="relative">
                            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`} size={17} />
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                placeholder={t('accountModal.newPasswordPlaceholder')}
                                className={inputClass}
                            />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                                {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>
                    </div>

                    {message && <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-500">{message}</div>}
                    {error && <div className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-500">{error}</div>}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onLogout}
                            className={`flex-1 rounded-2xl py-3 font-bold transition-all flex items-center justify-center gap-2 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <LogOut size={17} />
                            {t('accountModal.logout')}
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !currentPassword}
                            className={`flex-1 rounded-2xl py-3 font-bold transition-all flex items-center justify-center gap-2 ${saving || !currentPassword
                                ? isDarkMode ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-200' : 'bg-slate-950 text-white hover:bg-slate-800'
                                }`}
                        >
                            <Save size={17} />
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountModal;
