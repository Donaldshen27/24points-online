import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import './SignInForm.css';

interface SignInFormProps {
  onSuccess: (user: any) => void;
  onSwitchToSignUp: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSuccess, onSwitchToSignUp }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await authService.login({ email, password });
      onSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="signin-form" onSubmit={handleSubmit}>
      <h2 className="form-title">{t('auth.signIn.title', 'Sign In')}</h2>
      
      {error && (
        <div className="form-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          {t('auth.signIn.email', 'Email')}
        </label>
        <input
          id="email"
          type="email"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.signIn.emailPlaceholder', 'Enter your email')}
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          {t('auth.signIn.password', 'Password')}
        </label>
        <input
          id="password"
          type="password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.signIn.passwordPlaceholder', 'Enter your password')}
          required
          autoComplete="current-password"
          disabled={isLoading}
        />
      </div>

      <div className="form-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <span>{t('auth.signIn.rememberMe', 'Remember me')}</span>
        </label>
        <a href="#" className="form-link">
          {t('auth.signIn.forgotPassword', 'Forgot password?')}
        </a>
      </div>

      <button 
        type="submit" 
        className="form-submit btn btn-primary"
        disabled={isLoading || !email || !password}
      >
        {isLoading ? t('auth.signIn.signingIn', 'Signing in...') : t('auth.signIn.submit', 'Sign In')}
      </button>

      <div className="form-footer">
        <span>{t('auth.signIn.noAccount', "Don't have an account?")}</span>
        <button 
          type="button"
          className="form-link-button"
          onClick={onSwitchToSignUp}
          disabled={isLoading}
        >
          {t('auth.signIn.signUpLink', 'Sign up')}
        </button>
      </div>
    </form>
  );
};