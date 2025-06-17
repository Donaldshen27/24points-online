import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageToggle.css';

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
    
    // Update URL path based on language
    const currentPath = window.location.pathname;
    const isZhPath = currentPath.startsWith('/zh');
    
    if (newLang === 'zh' && !isZhPath) {
      // Add /zh prefix
      const newPath = '/zh' + currentPath;
      window.history.pushState(null, '', newPath);
    } else if (newLang === 'en' && isZhPath) {
      // Remove /zh prefix
      const newPath = currentPath.replace(/^\/zh/, '') || '/';
      window.history.pushState(null, '', newPath);
    }
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