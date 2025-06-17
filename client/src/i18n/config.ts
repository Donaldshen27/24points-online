import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import urlLanguageDetector from './urlLanguageDetector';

import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

const resources = {
  en: {
    translation: enTranslation
  },
  zh: {
    translation: zhTranslation
  }
};

// Create custom language detector instance
const customDetector = new LanguageDetector();
customDetector.addDetector(urlLanguageDetector);

i18n
  .use(customDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['urlLanguageDetector', 'localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Update HTML lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

// Set initial language
document.documentElement.lang = i18n.language;

export default i18n;