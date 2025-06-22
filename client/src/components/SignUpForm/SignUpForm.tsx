import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { guestService } from '../../services/guestService';
import './SignUpForm.css';

interface SignUpFormProps {
  onSuccess: (user: any) => void;
  onSwitchToSignIn: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onSwitchToSignIn }) => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUsernameHint, setShowUsernameHint] = useState(false);

  // Pre-fill username from guest service
  useEffect(() => {
    const guestUsername = guestService.getGuestUsername();
    if (guestUsername) {
      setFormData(prev => ({ ...prev, username: guestUsername }));
      setShowUsernameHint(true);
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Remove minimum length check - allow any length username
    if (formData.username.length === 0) {
      newErrors.username = t('auth.signUp.errors.usernameRequired', 'Username is required');
    }

    if (formData.username.length > 20) {
      newErrors.username = t('auth.signUp.errors.usernameMax', 'Username must be less than 20 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = t('auth.signUp.errors.usernameInvalid', 'Username can only contain letters, numbers, - and _');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.signUp.errors.emailInvalid', 'Please enter a valid email address');
    }

    if (formData.password.length < 6) {
      newErrors.password = t('auth.signUp.errors.passwordMin', 'Password must be at least 6 characters');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.signUp.errors.passwordMismatch', 'Passwords do not match');
    }

    if (!acceptTerms) {
      newErrors.terms = t('auth.signUp.errors.termsRequired', 'You must accept the terms and conditions');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.confirmPassword
      );
      onSuccess(true);
    } catch (err) {
      setErrors({ 
        general: err instanceof Error ? err.message : 'Registration failed' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <h2 className="form-title">{t('auth.signUp.title', 'Create Account')}</h2>
      
      {errors.general && (
        <div className="form-error">
          <span className="error-icon">⚠️</span>
          {errors.general}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="username" className="form-label">
          {t('auth.signUp.username', 'Username')}
        </label>
        <input
          id="username"
          name="username"
          type="text"
          className={`form-input ${errors.username ? 'input-error' : ''}`}
          value={formData.username}
          onChange={handleChange}
          placeholder={t('auth.signUp.usernamePlaceholder', 'Choose a username')}
          required
          autoComplete="username"
          disabled={isLoading}
        />
        {errors.username && (
          <span className="field-error">{errors.username}</span>
        )}
        {showUsernameHint && !errors.username && (
          <span className="field-hint" style={{ color: '#4CAF50', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
            {t('auth.signUp.usernameHint', 'Great! You can claim your guest username "{{username}}"', { username: formData.username })}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="signup-email" className="form-label">
          {t('auth.signUp.email', 'Email')}
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          className={`form-input ${errors.email ? 'input-error' : ''}`}
          value={formData.email}
          onChange={handleChange}
          placeholder={t('auth.signUp.emailPlaceholder', 'Enter your email')}
          required
          autoComplete="email"
          disabled={isLoading}
        />
        {errors.email && (
          <span className="field-error">{errors.email}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="signup-password" className="form-label">
          {t('auth.signUp.password', 'Password')}
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          className={`form-input ${errors.password ? 'input-error' : ''}`}
          value={formData.password}
          onChange={handleChange}
          placeholder={t('auth.signUp.passwordPlaceholder', 'Create a password')}
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
        {errors.password && (
          <span className="field-error">{errors.password}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">
          {t('auth.signUp.confirmPassword', 'Confirm Password')}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder={t('auth.signUp.confirmPasswordPlaceholder', 'Confirm your password')}
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <span className="field-error">{errors.confirmPassword}</span>
        )}
      </div>

      <div className="form-terms">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => {
              setAcceptTerms(e.target.checked);
              if (errors.terms) {
                setErrors(prev => ({ ...prev, terms: '' }));
              }
            }}
            disabled={isLoading}
          />
          <span>
            {t('auth.signUp.terms', 'I agree to the')}{' '}
            <a href="#" className="form-link">{t('auth.signUp.termsLink', 'Terms & Conditions')}</a>
          </span>
        </label>
        {errors.terms && (
          <span className="field-error">{errors.terms}</span>
        )}
      </div>

      <button 
        type="submit" 
        className="form-submit btn btn-primary"
        disabled={isLoading || !acceptTerms}
      >
        {isLoading ? t('auth.signUp.creating', 'Creating account...') : t('auth.signUp.submit', 'Create Account')}
      </button>

      <div className="form-footer">
        <span>{t('auth.signUp.haveAccount', 'Already have an account?')}</span>
        <button 
          type="button"
          className="form-link-button"
          onClick={onSwitchToSignIn}
          disabled={isLoading}
        >
          {t('auth.signUp.signInLink', 'Sign in')}
        </button>
      </div>
    </form>
  );
};