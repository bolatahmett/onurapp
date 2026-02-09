import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './i18n';
import './styles/globals.css';

// Load saved language
window.api?.settings.get('language').then((lang: string | null) => {
  if (lang) {
    import('./i18n').then((i18nModule) => {
      i18nModule.default.changeLanguage(lang);
    });
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
