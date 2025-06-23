import React from 'react';
import { RANK_TIERS } from '../../../../shared/types/elo';
import { getRankTier, getTierProgress } from '../../../../shared/game/elo';
import { RankBadge } from './RankBadge';
import './RankProgressBar.css';

interface RankProgressBarProps {
  currentRating: number;
  showNextTier?: boolean;
  showLabels?: boolean;
  animated?: boolean;
  className?: string;
}

export const RankProgressBar: React.FC<RankProgressBarProps> = ({
  currentRating,
  showNextTier = true,
  showLabels = true,
  animated = true,
  className = ''
}) => {
  const currentTier = getRankTier(currentRating);
  const progress = getTierProgress(currentRating);
  const tierInfo = RANK_TIERS.find(t => t.tier === currentTier) || RANK_TIERS[0];
  
  // Find next tier
  const currentTierIndex = RANK_TIERS.findIndex(t => t.tier === currentTier);
  const nextTierInfo = currentTierIndex < RANK_TIERS.length - 1 
    ? RANK_TIERS[currentTierIndex + 1] 
    : null;
  
  const isMaxTier = currentTier === 'grandmaster';
  
  return (
    <div className={`rank-progress-container ${className}`}>
      <div className="rank-progress-header">
        <RankBadge tier={currentTier} rating={currentRating} size="small" />
        {showLabels && (
          <div className="rank-progress-info">
            <div className="rank-progress-tier">{tierInfo.displayName}</div>
            <div className="rank-progress-rating">{currentRating} MMR</div>
          </div>
        )}
        {showNextTier && nextTierInfo && (
          <RankBadge tier={nextTierInfo.tier} size="small" />
        )}
      </div>
      
      {!isMaxTier && (
        <div className="rank-progress-bar-container">
          <div className="rank-progress-bar">
            <div 
              className={`rank-progress-fill ${animated ? 'animated' : ''}`}
              style={{ 
                width: `${progress}%`,
                backgroundColor: tierInfo.color
              }}
            />
          </div>
          {showLabels && (
            <div className="rank-progress-labels">
              <span>{tierInfo.minRating}</span>
              {nextTierInfo && (
                <span className="rank-progress-next">
                  {nextTierInfo.minRating} ({nextTierInfo.minRating - currentRating} to {nextTierInfo.displayName})
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      {isMaxTier && showLabels && (
        <div className="rank-progress-max-tier">
          Highest tier achieved! 🏆
        </div>
      )}
    </div>
  );
};