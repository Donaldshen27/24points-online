import { useTranslation } from 'react-i18next';
import type { BadgeDefinition } from '../types/badges';

/**
 * Get translated badge name and description
 * @param badge The badge definition
 * @param t The translation function from i18next
 * @returns Object with translated name and description
 */
export function getTranslatedBadge(badge: BadgeDefinition, t: any) {
  const translationKey = `badges.definitions.${badge.id}`;
  
  return {
    name: t(`${translationKey}.name`, badge.name),
    description: t(`${translationKey}.description`, badge.description)
  };
}

/**
 * Hook to get badge translations
 */
export function useBadgeTranslations() {
  const { t } = useTranslation();
  
  return {
    getTranslatedBadge: (badge: BadgeDefinition) => getTranslatedBadge(badge, t)
  };
}