import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../LanguageToggle';
import { AuthModal } from '../AuthModal';
import './MobileNavigation.css';

interface MobileNavigationProps {
  username?: string;
  rating?: number;
  onSignOut?: () => void;
  onAuthSuccess?: (user: any) => void;
  onPuzzlesClick?: () => void;
  onPlayClick?: () => void;
  onLeaderboardClick?: () => void;
  onBadgesClick?: () => void;
  onProfileClick?: () => void;
  currentView?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  username,
  rating,
  onSignOut,
  onAuthSuccess,
  onPuzzlesClick,
  onPlayClick,
  onLeaderboardClick,
  onBadgesClick,
  onProfileClick,
  currentView
}) => {
  const { t } = useTranslation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'signin' | 'signup'>('signin');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide header on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleJoinClick = () => {
    if (!username) {
      setAuthDefaultTab('signup');
      setShowAuthModal(true);
    } else {
      onPlayClick?.();
    }
  };

  const handleUserClick = () => {
    if (!username) {
      setAuthDefaultTab('signin');
      setShowAuthModal(true);
    } else {
      onProfileClick?.();
    }
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="mobile-navigation">
      {/* Mobile Header */}
      <header className={`mobile-header ${!isHeaderVisible ? 'hidden' : ''}`}>
        <div className="mobile-header-inner">
          <a href="/" className="mobile-logo">
            <div className="mobile-logo-icon">24</div>
            <span className="mobile-logo-text">Points Arena</span>
          </a>
          
          <div className="mobile-header-actions">
            <LanguageToggle />
            <button className="mobile-action-btn mobile-user-btn" onClick={handleUserClick}>
              {username ? (
                <>
                  <div className="mobile-user-avatar">{getInitial(username)}</div>
                  <div className="mobile-online-indicator"></div>
                </>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Tab Bar */}
      <nav className="mobile-tab-bar">
        <div className="mobile-tab-bar-inner">
          <button 
            className={`mobile-tab ${currentView === 'lobby' || currentView === 'ranked_lobby' || currentView === 'waiting_room' || currentView === 'in_game' ? 'active' : ''}`}
            onClick={onPlayClick}
          >
            <span className="mobile-tab-icon">🎮</span>
            <span className="mobile-tab-label">{t('app.nav.play')}</span>
          </button>
          
          <button 
            className={`mobile-tab ${currentView === 'puzzles' ? 'active' : ''}`}
            onClick={onPuzzlesClick}
          >
            <span className="mobile-tab-icon">🧩</span>
            <span className="mobile-tab-label">{t('app.nav.puzzles')}</span>
          </button>
          
          <button 
            className={`mobile-tab ${currentView === 'leaderboard' ? 'active' : ''}`}
            onClick={onLeaderboardClick}
          >
            <span className="mobile-tab-icon">🏆</span>
            <span className="mobile-tab-label">{t('app.nav.leaderboard')}</span>
          </button>
          
          <button 
            className={`mobile-tab ${currentView === 'badges' ? 'active' : ''}`}
            onClick={onBadgesClick}
          >
            <span className="mobile-tab-icon">🎖️</span>
            <span className="mobile-tab-label">{t('app.nav.badges')}</span>
          </button>
          
          <button 
            className={`mobile-tab ${currentView === 'profile' ? 'active' : ''}`}
            onClick={username ? onProfileClick : handleUserClick}
          >
            <span className="mobile-tab-icon">👤</span>
            <span className="mobile-tab-label">{username || t('app.nav.profile')}</span>
          </button>
        </div>
      </nav>

      {/* Floating Action Button for Join/Play */}
      {currentView === 'lobby' && (
        <button className="mobile-fab extended" onClick={handleJoinClick}>
          <span className="mobile-fab-icon">➕</span>
          <span className="mobile-fab-text">{username ? t('app.join') : t('app.getStarted')}</span>
        </button>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => {
            onAuthSuccess?.(user);
            setShowAuthModal(false);
          }}
          defaultTab={authDefaultTab}
        />
      )}
    </div>
  );
};