import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BadgeDefinition, BadgeProgress } from '../../../types/badges';
import ProgressBar from '../BadgeProgress/ProgressBar';

interface BadgeDetailModalProps {
  badge: BadgeDefinition;
  status: 'earned' | 'in-progress' | 'locked';
  progress?: BadgeProgress;
  onClose: () => void;
}

const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({ 
  badge, 
  status, 
  progress, 
  onClose 
}) => {
  const { t } = useTranslation();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: '#9CA3AF',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getTierColor = (tier?: string) => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF'
    };
    return tier ? colors[tier as keyof typeof colors] || '#000' : '#000';
  };

  return (
    <div className="badge-detail-modal-backdrop" onClick={handleBackdropClick}>
      <div className="badge-detail-modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="badge-detail-header">
          <div className={`badge-detail-icon ${status}`}>
            <div className="icon-content">
              {status === 'earned' ? '✓' : status === 'in-progress' ? '◐' : '🔒'}
            </div>
            {badge.tier && (
              <div 
                className="tier-badge"
                style={{ backgroundColor: getTierColor(badge.tier) }}
              >
                {badge.tier.toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="badge-detail-info">
            <h2 className="badge-detail-name">{badge.name}</h2>
            <p className="badge-detail-description">{badge.description}</p>
            
            <div className="badge-meta">
              <span 
                className="badge-rarity"
                style={{ color: getRarityColor(badge.rarity) }}
              >
                {t(`badges.rarity.${badge.rarity}`, (() => {
                  switch(badge.rarity) {
                    case 'common': return 'Common';
                    case 'rare': return 'Rare';
                    case 'epic': return 'Epic';
                    case 'legendary': return 'Legendary';
                    default: return 'Unknown';
                  }
                })())}
              </span>
              <span className="badge-points">
                {badge.points} {t('badges.points', 'Points')}
              </span>
            </div>
          </div>
        </div>

        <div className="badge-detail-content">
          {status === 'earned' && (
            <div className="earned-info">
              <div className="earned-icon">🎉</div>
              <p className="earned-text">{t('badges.detail.earned', "You've earned this badge!")}</p>
            </div>
          )}

          {status === 'in-progress' && progress && (
            <div className="progress-section">
              <h3>{t('badges.detail.progress', 'Progress')}</h3>
              <ProgressBar 
                current={progress.currentValue}
                target={progress.targetValue}
                showLabel
              />
              <p className="progress-text">
                {t('badges.detail.progressText', `${progress.currentValue} / ${progress.targetValue}`, {
                  current: progress.currentValue,
                  target: progress.targetValue
                })}
              </p>
            </div>
          )}

          {status === 'locked' && (
            <div className="requirements-section">
              <h3>{t('badges.detail.requirements', 'Requirements')}</h3>
              <div className="requirement-details">
                {renderRequirements(badge)}
              </div>
            </div>
          )}

          <div className="badge-category-info">
            <h3>{t('badges.detail.category', 'Category')}</h3>
            <p>{t(`badges.categories.${badge.category}`, (() => {
              switch(badge.category) {
                case 'skill': return 'Skill';
                case 'progression': return 'Progression';
                case 'mode': return 'Game Modes';
                case 'social': return 'Social';
                case 'unique': return 'Unique';
                case 'seasonal': return 'Seasonal';
                default: return 'Unknown';
              }
            })())}</p>
          </div>

          {badge.tier && (
            <div className="tier-progression">
              <h3>{t('badges.detail.tierProgression', 'Tier Progression')}</h3>
              <div className="tier-list">
                {['bronze', 'silver', 'gold', 'platinum', 'diamond'].map(tier => (
                  <div 
                    key={tier}
                    className={`tier-item ${tier === badge.tier ? 'current' : ''}`}
                    style={{ 
                      color: getTierColor(tier),
                      opacity: tier === badge.tier ? 1 : 0.5 
                    }}
                  >
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to render requirements
const renderRequirements = (badge: BadgeDefinition) => {
  // This is simplified - in production, you'd parse the requirements object
  return (
    <p className="requirement-text">
      {badge.description}
    </p>
  );
};

export default BadgeDetailModal;