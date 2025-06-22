import React from 'react';
import { useTranslation } from 'react-i18next';
import './LevelIndicator.css';

interface LevelIndicatorProps {
  currentPoints: number;
  currentLevel: number;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

const POINTS_PER_LEVEL = 100;

export const LevelIndicator: React.FC<LevelIndicatorProps> = ({
  currentPoints,
  currentLevel,
  showDetails = true,
  size = 'medium',
  animated = true
}) => {
  const { t } = useTranslation();
  
  // Calculate progress to next level
  const currentLevelPoints = (currentLevel - 1) * POINTS_PER_LEVEL;
  const nextLevelPoints = currentLevel * POINTS_PER_LEVEL;
  const progressPoints = currentPoints - currentLevelPoints;
  const progressPercentage = (progressPoints / POINTS_PER_LEVEL) * 100;
  
  // Calculate points needed for next level
  const pointsToNextLevel = nextLevelPoints - currentPoints;
  
  // Determine level tier for styling
  const getLevelTier = (level: number): string => {
    if (level >= 50) return 'legendary';
    if (level >= 30) return 'epic';
    if (level >= 15) return 'rare';
    if (level >= 5) return 'uncommon';
    return 'common';
  };
  
  const levelTier = getLevelTier(currentLevel);
  
  return (
    <div className={`level-indicator level-indicator--${size} level-indicator--${levelTier}`}>
      <div className="level-header">
        <div className="level-badge">
          <span className="level-number">{currentLevel}</span>
          <span className="level-label">{t('badges.level', 'Level')}</span>
        </div>
        {showDetails && (
          <div className="level-details">
            <span className="current-points">{currentPoints} {t('badges.points', 'Points')}</span>
            <span className="points-separator">/</span>
            <span className="next-level-points">{nextLevelPoints} {t('badges.points', 'Points')}</span>
          </div>
        )}
      </div>
      
      <div className="level-progress">
        <div className="progress-bar">
          <div 
            className={`progress-fill ${animated ? 'animated' : ''}`}
            style={{ width: `${progressPercentage}%` }}
          >
            {size !== 'small' && progressPercentage > 20 && (
              <span className="progress-text">{Math.floor(progressPercentage)}%</span>
            )}
          </div>
        </div>
        {showDetails && size !== 'small' && (
          <div className="progress-info">
            <span className="points-to-next">
              {t('badges.pointsToNextLevel', `${pointsToNextLevel} points to next level`, { points: pointsToNextLevel })}
            </span>
          </div>
        )}
      </div>
      
      {/* Level milestone indicators */}
      {size === 'large' && showDetails && (
        <div className="level-milestones">
          {currentLevel % 5 === 0 && currentLevel > 0 && (
            <div className="milestone-achieved">
              🎉 {t('badges.milestoneAchieved', `Level ${currentLevel} Milestone!`, { level: currentLevel })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LevelIndicator;