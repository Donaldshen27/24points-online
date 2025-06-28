import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './AuthModalSimple.css';

interface AuthModalSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModalSimple: React.FC<AuthModalSimpleProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  defaultTab = 'signin' 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Add your auth logic here
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="mobile-auth-overlay">
      <div className="mobile-auth-container">
        {/* Header */}
        <div className="mobile-auth-header">
          <button className="mobile-auth-close" onClick={onClose}>
            ✕
          </button>
          <h2 className="mobile-auth-title">
            {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
        </div>

        {/* Tabs */}
        <div className="mobile-auth-tabs">
          <button 
            className={`mobile-auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button 
            className={`mobile-auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Content */}
        <div className="mobile-auth-content">
          {error && <div className="mobile-auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="mobile-auth-form">
            {activeTab === 'signup' && (
              <input
                type="text"
                placeholder="Username"
                className="mobile-auth-input"
                required
              />
            )}
            
            <input
              type="email"
              placeholder="Email"
              className="mobile-auth-input"
              required
            />
            
            <input
              type="password"
              placeholder="Password"
              className="mobile-auth-input"
              required
            />
            
            {activeTab === 'signup' && (
              <input
                type="password"
                placeholder="Confirm Password"
                className="mobile-auth-input"
                required
              />
            )}

            <button 
              type="submit" 
              className="mobile-auth-submit"
              disabled={loading}
            >
              {loading ? 'Loading...' : activeTab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mobile-auth-divider">OR</div>

          <button className="mobile-auth-guest" onClick={onClose}>
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};