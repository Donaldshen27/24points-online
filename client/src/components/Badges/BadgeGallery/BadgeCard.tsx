import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BadgeDefinition, BadgeProgress } from '../../../types/badges';
import ProgressBar from '../BadgeProgress/ProgressBar';
import { useBadgeTranslations } from '../../../utils/badgeTranslations';

interface BadgeCardProps {
  badge: BadgeDefinition;
  status: 'earned' | 'in-progress' | 'locked';
  progress?: BadgeProgress;
  onClick: () => void;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge, status, progress, onClick }) => {
  const { t } = useTranslation();
  const { getTranslatedBadge } = useBadgeTranslations();
  const translatedBadge = getTranslatedBadge(badge);
  
  const getRarityClass = (rarity: string) => {
    return `badge-rarity-${rarity}`;
  };

  const getTierClass = (tier?: string) => {
    return tier ? `badge-tier-${tier}` : '';
  };

  return (
    <div 
      className={`badge-card ${status} ${getRarityClass(badge.rarity)} ${getTierClass(badge.tier)}`}
      onClick={onClick}
    >
      <div className="badge-icon-wrapper">
        <div className="badge-icon">
          {status === 'earned' ? '✓' : status === 'in-progress' ? '◐' : '🔒'}
        </div>
        {badge.tier && (
          <div className={`badge-tier-indicator ${badge.tier}`}>
            {badge.tier.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <h3 className="badge-name">{translatedBadge.name}</h3>
      <p className="badge-description">{translatedBadge.description}</p>
      
      <div className="badge-footer">
        <div className="badge-points">
          <span className="points-value">{badge.points}</span>
          <span className="points-label">{t('badges.points', 'Points')}</span>
        </div>
        
        {status === 'in-progress' && progress && (
          <ProgressBar 
            current={progress.currentValue}
            target={progress.targetValue}
            compact
          />
        )}
      </div>
    </div>
  );
};

export default BadgeCard;