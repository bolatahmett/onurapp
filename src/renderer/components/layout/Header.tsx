import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export function Header() {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useAppStore();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
    window.api.settings.set('language', newLang);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-700">{t('app.title')}</h1>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Globe size={16} />
          <span>{i18n.language === 'tr' ? 'TR' : 'EN'}</span>
        </button>
      </div>
    </header>
  );
}
