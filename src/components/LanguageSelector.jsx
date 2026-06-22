import React from 'react';
import { Globe2 } from 'lucide-react';
import { getLanguageMeta, supportedLanguages } from '../lib/i18n';

const LanguageSelector = ({ language, onChange, isDarkMode, compact = false, label = 'Lingua' }) => {
    const selectedLanguage = getLanguageMeta(language);

    return (
        <label
            className={`relative inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-all ${isDarkMode
                ? 'border-zinc-800 bg-zinc-900 text-zinc-300'
                : 'border-slate-200 bg-white text-slate-700 shadow-sm'
                }`}
            title={label}
        >
            <Globe2 size={15} className={isDarkMode ? 'text-zinc-500' : 'text-slate-500'} />
            <span className={compact ? 'sr-only' : 'max-w-28 truncate'}>{selectedLanguage.nativeLabel}</span>
            <select
                aria-label={label}
                value={language}
                onChange={(event) => onChange(event.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
                {supportedLanguages.map((item) => (
                    <option key={item.code} value={item.code}>
                        {item.nativeLabel}
                    </option>
                ))}
            </select>
        </label>
    );
};

export default LanguageSelector;
