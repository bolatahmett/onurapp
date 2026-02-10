import { useTranslation } from 'react-i18next';
import { Globe, LogOut, User as UserIcon } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useAppStore();

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const currentParam = i18n.language;
    let newLang = 'tr';
    if (currentParam === 'tr') newLang = 'en';
    else if (currentParam === 'en') newLang = 'ru';
    else newLang = 'tr';

    i18n.changeLanguage(newLang);
    setLanguage(newLang);
    window.api.settings.set('language', newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          <span>{i18n.language.toUpperCase()}</span>
        </button>

        <div className="h-6 w-px bg-gray-200"></div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
              <UserIcon size={16} />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user?.username}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
