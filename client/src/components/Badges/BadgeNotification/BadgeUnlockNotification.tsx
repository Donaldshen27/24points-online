import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BadgeUnlockNotification as BadgeUnlock } from '../../../types/badges';
import { BADGE_RARITIES, BADGE_TIERS } from '../../../data/badgeDefinitions';
import { useBadgeTranslations } from '../../../utils/badgeTranslations';
import './BadgeUnlockNotification.css';

interface BadgeUnlockNotificationProps {
  notification: BadgeUnlock;
  onClose: () => void;
  onShowDetails?: () => void;
}

export const BadgeUnlockNotification: React.FC<BadgeUnlockNotificationProps> = ({
  notification,
  onClose,
  onShowDetails
}) => {
  const { t } = useTranslation();
  const { getTranslatedBadge } = useBadgeTranslations();
  const translatedBadge = getTranslatedBadge(notification.badge);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto-close after 5 seconds
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(autoCloseTimer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const getRarityColor = () => {
    return BADGE_RARITIES[notification.badge.rarity]?.color || '#9CA3AF';
  };

  const getTierColor = (): string | null => {
    if (notification.badge.tier) {
      return BADGE_TIERS[notification.badge.tier]?.color || '#000';
    }
    return null;
  };

  return (
    <div className={`badge-unlock-notification ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''} ${notification.badge.rarity}`}>
      <div className="badge-unlock-content">
        <div className="badge-unlock-header">
          <div className="unlock-title">{t('badges.notification.unlocked', 'Badge Unlocked!')}</div>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="badge-unlock-body">
          <div className="badge-icon-container">
            <div className="badge-icon-wrapper">
              <div className="badge-icon animated">
                <div className="badge-glow" style={{ backgroundColor: getRarityColor() }}></div>
                <div className="badge-symbol">🏆</div>
              </div>
              {notification.badge.tier && (
                <div 
                  className="tier-indicator"
                  style={{ backgroundColor: getTierColor() || undefined }}
                >
                  {notification.badge.tier.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="sparkles">
              <span className="sparkle">✨</span>
              <span className="sparkle">✨</span>
              <span className="sparkle">✨</span>
              <span className="sparkle">✨</span>
            </div>
          </div>

          <div className="badge-info">
            <h3 className="badge-name">{translatedBadge.name}</h3>
            <p className="badge-description">{translatedBadge.description}</p>
            
            <div className="badge-meta">
              <span 
                className="badge-rarity"
                style={{ color: getRarityColor() }}
              >
                {t(`badges.rarity.${notification.badge.rarity}`, (() => {
                  switch(notification.badge.rarity) {
                    case 'common': return 'Common';
                    case 'rare': return 'Rare';
                    case 'epic': return 'Epic';
                    case 'legendary': return 'Legendary';
                    default: return 'Unknown';
                  }
                })())}
              </span>
              <span className="badge-points">
                +{notification.badge.points} {t('badges.points', 'Points')}
              </span>
            </div>

            {notification.isNewTier && notification.previousTier && (
              <div className="tier-upgrade">
                <span className="upgrade-text">
                  {t('badges.notification.tierUpgrade', `Upgraded from ${notification.previousTier} to ${notification.badge.tier}`, {
                    from: notification.previousTier,
                    to: notification.badge.tier
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {onShowDetails && (
          <button className="show-details-btn" onClick={onShowDetails}>
            {t('badges.notification.viewDetails', 'View Details')}
          </button>
        )}
      </div>
    </div>
  );
};