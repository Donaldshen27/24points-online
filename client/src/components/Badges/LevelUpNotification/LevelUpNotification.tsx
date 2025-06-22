import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LevelUpNotification.css';

interface LevelUpNotificationProps {
  oldLevel: number;
  newLevel: number;
  onClose: () => void;
  autoCloseDelay?: number;
}

export const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({
  oldLevel,
  newLevel,
  onClose,
  autoCloseDelay = 5000
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto close after delay
    const closeTimer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);

    return () => clearTimeout(closeTimer);
  }, [autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getLevelTier = (level: number): string => {
    if (level >= 50) return 'legendary';
    if (level >= 30) return 'epic';
    if (level >= 15) return 'rare';
    if (level >= 5) return 'uncommon';
    return 'common';
  };

  const tier = getLevelTier(newLevel);
  const isMilestone = newLevel % 5 === 0;

  return (
    <div className={`level-up-overlay ${isVisible ? 'visible' : ''} ${isClosing ? 'closing' : ''}`}>
      <div className={`level-up-notification level-up-notification--${tier}`}>
        <button className="close-button" onClick={handleClose}>×</button>
        
        <div className="level-up-content">
          <div className="celebration-effects">
            <div className="particle particle-1">✨</div>
            <div className="particle particle-2">⭐</div>
            <div className="particle particle-3">🌟</div>
            <div className="particle particle-4">✨</div>
            <div className="particle particle-5">⭐</div>
          </div>

          <h2 className="level-up-title">{t('badges.levelUp.title', 'LEVEL UP!')}</h2>
          
          <div className="level-transition">
            <div className="old-level">
              <span className="level-label">{t('badges.level', 'Level')}</span>
              <span className="level-number">{oldLevel}</span>
            </div>
            <div className="arrow">→</div>
            <div className={`new-level new-level--${tier}`}>
              <span className="level-label">{t('badges.level', 'Level')}</span>
              <span className="level-number">{newLevel}</span>
            </div>
          </div>

          {isMilestone && (
            <div className="milestone-message">
              🎉 {t('badges.milestoneAchieved', `Level ${newLevel} Milestone!`, { level: newLevel })}
            </div>
          )}

          <p className="level-up-message">
            {t('badges.levelUp.message', `Congratulations! You've reached Level ${newLevel}!`, { level: newLevel })}
          </p>

          {/* Show special rewards for certain levels */}
          {newLevel === 5 && (
            <div className="level-reward">
              <span className="reward-icon">🏅</span>
              <span className="reward-text">{t('badges.levelUp.unlockRareBadges', 'Rare badges unlocked!')}</span>
            </div>
          )}
          {newLevel === 10 && (
            <div className="level-reward">
              <span className="reward-icon">🎯</span>
              <span className="reward-text">{t('badges.levelUp.profileCustomization', 'Profile customization unlocked!')}</span>
            </div>
          )}
          {newLevel === 25 && (
            <div className="level-reward">
              <span className="reward-icon">💎</span>
              <span className="reward-text">{t('badges.levelUp.unlockEpicBadges', 'Epic badges unlocked!')}</span>
            </div>
          )}
          {newLevel === 50 && (
            <div className="level-reward">
              <span className="reward-icon">👑</span>
              <span className="reward-text">{t('badges.levelUp.unlockLegendaryBadges', 'Legendary badges unlocked!')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LevelUpNotification;