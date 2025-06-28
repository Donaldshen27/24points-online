import React from 'react';
import { useTranslation } from 'react-i18next';
import { SignInForm } from '../SignInForm';
import { SignUpForm } from '../SignUpForm';
import './AuthModalMobile.css';

interface AuthModalMobileProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  activeTab: 'signin' | 'signup';
  onTabChange: (tab: 'signin' | 'signup') => void;
}

export const AuthModalMobile: React.FC<AuthModalMobileProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  activeTab,
  onTabChange
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleSuccess = (user: any) => {
    onSuccess(user);
    onClose();
  };

  return (
    <div className="auth-modal-mobile">
      <div className="mobile-header">
        <button className="mobile-close" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <div className="mobile-tabs">
          <button
            className={`mobile-tab ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => onTabChange('signin')}
          >
            {t('auth.tabs.signIn', 'Sign In')}
          </button>
          <button
            className={`mobile-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => onTabChange('signup')}
          >
            {t('auth.tabs.signUp', 'Sign Up')}
          </button>
        </div>
      </div>

      <div className="mobile-scroll-container">
        <div className="mobile-form-container">
          {activeTab === 'signin' ? (
            <SignInForm 
              onSuccess={handleSuccess}
              onSwitchToSignUp={() => onTabChange('signup')}
            />
          ) : (
            <SignUpForm 
              onSuccess={handleSuccess}
              onSwitchToSignIn={() => onTabChange('signin')}
            />
          )}
        </div>
      </div>

      <div className="mobile-footer">
        <button className="social-btn guest-btn" onClick={() => onClose()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <span>{t('auth.continueAsGuest', 'Continue as Guest')}</span>
        </button>
      </div>
    </div>
  );
};