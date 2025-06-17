import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../LanguageToggle';
import './Navigation.css';

interface NavigationProps {
  username?: string;
  onSignOut?: () => void;
  onTestModeToggle?: () => void;
  isTestMode?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ username, onSignOut, onTestModeToggle, isTestMode }) => {
  const { t } = useTranslation();
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-left">
          <a href="/" className="nav-logo">
            <div className="logo-icon">24</div>
            <span className="logo-text">Points Arena</span>
          </a>
          
          <div className="nav-links">
            <button className="nav-link active">
              <span className="nav-link-icon">🎮</span>
              {t('app.nav.play')}
            </button>
            <button className="nav-link" disabled>
              <span className="nav-link-icon">🧩</span>
              {t('app.nav.puzzles')}
            </button>
            <button className="nav-link" disabled>
              <span className="nav-link-icon">📚</span>
              {t('app.nav.learn')}
            </button>
            <button className="nav-link" disabled>
              <span className="nav-link-icon">🏆</span>
              {t('app.nav.leaderboard')}
            </button>
          </div>
        </div>
        
        <div className="nav-right">
          {onTestModeToggle && (
            <button 
              className="test-mode-btn"
              onClick={onTestModeToggle}
            >
              {isTestMode ? t('app.exitTestMode') : t('app.testMode')}
            </button>
          )}
          
          <LanguageToggle />
          
          {username ? (
            <>
              <div className="nav-stats">
                <div className="stat-item">
                  <span className="stat-label">Rating</span>
                  <span className="stat-value">1500</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Games</span>
                  <span className="stat-value">0</span>
                </div>
              </div>
              
              <div className="nav-user">
                <button className="user-menu-trigger">
                  <div className="user-avatar">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-name">{username}</span>
                  <svg className="dropdown-icon" width="12" height="8" viewBox="0 0 12 8">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </button>
                
                <div className="user-dropdown">
                  <a href="/profile" className="dropdown-item">Profile</a>
                  <a href="/settings" className="dropdown-item">Settings</a>
                  <a href="/stats" className="dropdown-item">Statistics</a>
                  <div className="dropdown-divider"></div>
                  <button onClick={onSignOut} className="dropdown-item">Sign Out</button>
                </div>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <button className="btn btn-secondary" disabled>{t('app.nav.signIn')}</button>
              <button className="btn btn-primary" disabled>{t('app.nav.signUp')}</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;