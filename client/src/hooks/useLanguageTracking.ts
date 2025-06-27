import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';

/**
 * Hook to track language usage for badge achievements
 */
export function useLanguageTracking() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Track language change
    const handleLanguageChange = (language: string) => {
      // Emit language usage event to server
      socketService.emit('track-language-usage', {
        userId: user.id,
        language: language
      });
    };

    // Track initial language
    handleLanguageChange(i18n.language);

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [user, i18n]);
}