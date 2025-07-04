import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SignInForm } from '../SignInForm';
import { SignUpForm } from '../SignUpForm';
import './AuthModalMobile.css';

interface AuthModalMobileSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModalMobileSimple: React.FC<AuthModalMobileSimpleProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  defaultTab = 'signin' 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, defaultTab]);

  const handleSuccess = (user: any) => {
    onSuccess(user);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="mobile-auth-backdrop" onClick={onClose} />
      
      <div className="mobile-auth-sheet-simple">
        {/* Close Handle */}
        <div className="mobile-auth-handle-container" onClick={onClose}>
          <div className="mobile-auth-handle" />
        </div>

        {/* Header */}
        <div className="mobile-auth-header">
          <h2 className="mobile-auth-title">
            {t('auth.welcome', 'Welcome to 24 Points')}
          </h2>
          <p className="mobile-auth-subtitle">
            {activeTab === 'signin' 
              ? t('auth.signInSubtitle', 'Sign in to continue')
              : t('auth.signUpSubtitle', 'Create your account')
            }
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mobile-auth-tabs">
          <button
            className={`mobile-auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => setActiveTab('signin')}
          >
            {t('auth.tabs.signIn', 'Sign In')}
          </button>
          <button
            className={`mobile-auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            {t('auth.tabs.signUp', 'Sign Up')}
          </button>
        </div>

        {/* Content */}
        <div className="mobile-auth-content">
          {activeTab === 'signin' ? (
            <SignInForm 
              onSuccess={handleSuccess}
              onSwitchToSignUp={() => setActiveTab('signup')}
            />
          ) : (
            <SignUpForm 
              onSuccess={handleSuccess}
              onSwitchToSignIn={() => setActiveTab('signin')}
            />
          )}

          {/* Social Auth Options */}
          <div className="mobile-auth-divider">
            <span>{t('auth.or', 'OR')}</span>
          </div>

          <div className="mobile-auth-social">
            <button className="mobile-auth-social-btn google" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{t('auth.continueWithGoogle', 'Continue with Google')}</span>
            </button>

            <button className="mobile-auth-social-btn guest" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              <span>{t('auth.continueAsGuest', 'Continue as Guest')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};