import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Page,
  Navbar,
  NavLeft,
  NavTitle,
  Link,
  Block,
  List,
  ListInput,
  Button,
  BlockTitle,
  Segmented,
  Sheet
} from 'framework7-react';
// import 'framework7/css/bundle';
import './AuthModalF7.css';

interface AuthModalF7Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModalF7: React.FC<AuthModalF7Props> = ({ 
  isOpen, 
  onClose, 
  onSuccess: _onSuccess, 
  defaultTab = 'signin' 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    agreeToTerms: false
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // This would integrate with your existing auth logic
    console.log('Form submitted:', formData);
  };

  const handleGuestContinue = () => {
    onClose();
  };

  return (
    <Sheet
      className="auth-sheet"
      opened={isOpen}
      onSheetClosed={onClose}
      swipeToClose
      backdrop
    >
      <Page>
        <Navbar>
          <NavLeft>
            <Link onClick={onClose}>
              {t('common.close', 'Close')}
            </Link>
          </NavLeft>
          <NavTitle>{t('auth.title', 'Account')}</NavTitle>
        </Navbar>

        <Block>
          <Segmented raised>
            <Button
              active={activeTab === 'signin'}
              onClick={() => setActiveTab('signin')}
            >
              {t('auth.tabs.signIn', 'Sign In')}
            </Button>
            <Button
              active={activeTab === 'signup'}
              onClick={() => setActiveTab('signup')}
            >
              {t('auth.tabs.signUp', 'Sign Up')}
            </Button>
          </Segmented>
        </Block>

        {activeTab === 'signin' ? (
          <>
            <BlockTitle>{t('auth.signIn.title', 'Welcome Back')}</BlockTitle>
            <List strongIos dividersIos insetIos>
              <ListInput
                type="email"
                placeholder={t('auth.email.placeholder', 'Your email')}
                value={formData.email}
                onInput={(e) => handleInputChange('email', e.target.value)}
                clearButton
              />
              <ListInput
                type="password"
                placeholder={t('auth.password.placeholder', 'Your password')}
                value={formData.password}
                onInput={(e) => handleInputChange('password', e.target.value)}
                clearButton
              />
            </List>

            <Block>
              <Button fill raised onClick={handleSubmit}>
                {t('auth.signIn.submit', 'Sign In')}
              </Button>
            </Block>

            <Block className="text-align-center">
              <Link onClick={() => setActiveTab('signup')}>
                {t('auth.signIn.noAccount', "Don't have an account? Sign up")}
              </Link>
            </Block>
          </>
        ) : (
          <>
            <BlockTitle>{t('auth.signUp.title', 'Create Account')}</BlockTitle>
            <List strongIos dividersIos insetIos>
              <ListInput
                type="text"
                placeholder={t('auth.username.placeholder', 'Choose a username')}
                value={formData.username}
                onInput={(e) => handleInputChange('username', e.target.value)}
                clearButton
              />
              <ListInput
                type="email"
                placeholder={t('auth.email.placeholder', 'Your email')}
                value={formData.email}
                onInput={(e) => handleInputChange('email', e.target.value)}
                clearButton
              />
              <ListInput
                type="password"
                placeholder={t('auth.password.placeholder', 'Create a password')}
                value={formData.password}
                onInput={(e) => handleInputChange('password', e.target.value)}
                clearButton
              />
              <ListInput
                type="password"
                placeholder={t('auth.confirmPassword.placeholder', 'Confirm password')}
                value={formData.confirmPassword}
                onInput={(e) => handleInputChange('confirmPassword', e.target.value)}
                clearButton
              />
            </List>

            <Block>
              <Button fill raised onClick={handleSubmit}>
                {t('auth.signUp.submit', 'Create Account')}
              </Button>
            </Block>

            <Block className="text-align-center">
              <Link onClick={() => setActiveTab('signin')}>
                {t('auth.signUp.hasAccount', 'Already have an account? Sign in')}
              </Link>
            </Block>
          </>
        )}

        <Block>
          <Button 
            outline 
            onClick={handleGuestContinue}
            className="guest-continue-btn"
          >
            {t('auth.continueAsGuest', 'Continue as Guest')}
          </Button>
        </Block>
      </Page>
    </Sheet>
  );
};