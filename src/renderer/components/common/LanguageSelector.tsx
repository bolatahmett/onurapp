import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

const LANGUAGES: Language[] = [
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
];

interface LanguageSelectorProps {
  onLanguageChange: (lang: string) => void;
  currentLanguage: string;
}

export function LanguageSelector({ onLanguageChange, currentLanguage }: LanguageSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <Globe size={24} className="text-primary-600" />
        <h3 className="text-lg font-semibold">{t('settings.language')}</h3>
      </div>

      {/* Language Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`p-4 rounded-lg border-2 transition-all text-center ${
              currentLanguage === lang.code
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 bg-gray-50 hover:border-primary-300'
            }`}
          >
            <div className="text-3xl mb-2">{lang.flag}</div>
            <div className={`font-semibold ${currentLanguage === lang.code ? 'text-primary-600' : 'text-gray-700'}`}>
              {lang.nativeName}
            </div>
            <div className="text-sm text-gray-500 mt-1">{lang.name}</div>
            {currentLanguage === lang.code && (
              <div className="text-xs mt-2 px-2 py-1 bg-primary-600 text-white rounded inline-block">
                {t('common.active')}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Language Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <strong>{t('common.success')}</strong>: {t('settings.language')} {t('common.success').toLowerCase()}
      </div>
    </div>
  );
}
