import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageToggle.css';

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button 
      className="language-toggle"
      onClick={toggleLanguage}
      aria-label="Toggle language"
      type="button"
    >
      <span className={`lang-option ${i18n.language === 'en' ? 'active' : ''}`}>
        EN
      </span>
      <span className="separator">|</span>
      <span className={`lang-option ${i18n.language === 'zh' ? 'active' : ''}`}>
        中文
      </span>
    </button>
  );
};

export default LanguageToggle;