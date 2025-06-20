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
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.errors.invalidEmail');
    }

    if (!formData.password) {
      newErrors.password = t('auth.errors.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
    setErrors({});

    try {
      const user = await authService.login({ 
        email: formData.email, 
        password: formData.password 
      });
      
      if (formData.rememberMe) {
        // The auth service already handles token persistence
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      onSuccess(user);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        setErrors({ general: t('auth.errors.invalidCredentials') });
      } else if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: t('auth.errors.loginFailed') });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as any);
    }
  };

  return (
    <form className="signin-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      <h2 className="form-title">{t('auth.signIn.title')}</h2>
      
      {errors.general && (
        <div className="form-error-banner">
          {errors.general}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          {t('auth.signIn.email')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form-input ${errors.email ? 'form-input-error' : ''}`}
          value={formData.email}
          onChange={handleChange}
          placeholder={t('auth.signIn.emailPlaceholder')}
          disabled={isLoading}
          autoFocus
          autoComplete="email"
        />
        {errors.email && (
          <span className="form-error">{errors.email}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          {t('auth.signIn.password')}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className={`form-input ${errors.password ? 'form-input-error' : ''}`}
          value={formData.password}
          onChange={handleChange}
          placeholder={t('auth.signIn.passwordPlaceholder')}
          disabled={isLoading}
          autoComplete="current-password"
        />
        {errors.password && (
          <span className="form-error">{errors.password}</span>
        )}
      </div>

      <div className="form-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            disabled={isLoading}
          />
          <span>{t('auth.signIn.rememberMe')}</span>
        </label>
        <a href="#" className="form-link" onClick={(e) => e.preventDefault()}>
          {t('auth.signIn.forgotPassword')}
        </a>
      </div>

      <button
        type="submit"
        className="form-submit btn btn-primary"
        disabled={isLoading}
      >
        {isLoading ? t('auth.signIn.signingIn') : t('auth.signIn.submit')}
      </button>

      <div className="form-footer">
        <span>{t('auth.signIn.noAccount')}</span>
        <button
          type="button"
          className="form-link-button"
          onClick={onSwitchToSignUp}
          disabled={isLoading}
        >
          {t('auth.tabs.signUp')}
        </button>
      </div>
    </form>
  );
};