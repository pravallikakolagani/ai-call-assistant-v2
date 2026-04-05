import React, { useState } from 'react';
import { Sparkles, Mic } from 'lucide-react';
import { languageService, SupportedLanguage, LANGUAGE_CONFIGS } from '../services/languageService';

interface LanguageSelectorProps {
  isDark: boolean;
}

export function LanguageSelector({ isDark }: LanguageSelectorProps) {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(languageService.getCurrentLanguage());
  const [autoDetect, setAutoDetect] = useState(languageService.isAutoDetectEnabled());

  const handleLanguageChange = (lang: SupportedLanguage) => {
    languageService.setLanguage(lang);
    setCurrentLang(lang);
  };

  const handleToggleAutoDetect = () => {
    if (autoDetect) {
      languageService.setLanguage(currentLang);
    } else {
      languageService.enableAutoDetect();
    }
    setAutoDetect(!autoDetect);
  };

  const languages = Object.values(LANGUAGE_CONFIGS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          AI Language
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Auto-detect
          </span>
          <button
            onClick={handleToggleAutoDetect}
            className={`w-10 h-5 rounded-full transition-colors ${
              autoDetect ? 'bg-blue-500' : 'bg-gray-400'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
              autoDetect ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      {!autoDetect && (
        <div className="grid grid-cols-2 gap-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`p-3 rounded-xl flex items-center gap-3 transition-all ${
                currentLang === lang.code
                  ? isDark ? 'bg-blue-500/20 border border-blue-500' : 'bg-blue-50 border border-blue-500'
                  : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="text-left">
                <p className="font-medium text-sm">{lang.name}</p>
                {currentLang === lang.code && (
                  <span className="text-xs text-blue-500">Active</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {autoDetect && (
        <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-500">Auto-Detection Enabled</span>
          </div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            AI will automatically detect the caller's language from their country code and respond in their native language.
          </p>
        </div>
      )}

      {/* Preview */}
      <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Mic className="w-4 h-4 text-purple-500" />
          <span className="text-xs font-medium">AI Greeting Preview</span>
        </div>
        <p className="text-sm italic">
          "{languageService.getGreeting()}"
        </p>
      </div>
    </div>
  );
}
