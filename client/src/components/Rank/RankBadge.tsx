import React from 'react';
import { RankTier, RANK_TIERS } from '../../../../shared/types/elo';
import './RankBadge.css';

interface RankBadgeProps {
  tier: RankTier;
  rating?: number;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  animated?: boolean;
  className?: string;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  tier,
  rating,
  size = 'medium',
  showTooltip = true,
  animated = false,
  className = ''
}) => {
  const tierInfo = RANK_TIERS.find(t => t.tier === tier) || RANK_TIERS[0];
  
  const sizeClasses = {
    small: 'rank-badge-small',
    medium: 'rank-badge-medium',
    large: 'rank-badge-large'
  };

  const badgeClasses = [
    'rank-badge',
    `rank-badge-${tier}`,
    sizeClasses[size],
    animated ? 'rank-badge-animated' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={badgeClasses}
      title={showTooltip ? `${tierInfo.displayName}${rating ? ` (${rating})` : ''}` : undefined}
      style={{ '--rank-color': tierInfo.color } as React.CSSProperties}
    >
      <div className="rank-badge-inner">
        <div className="rank-badge-icon">
          {getIconForTier(tier)}
        </div>
        {size !== 'small' && (
          <div className="rank-badge-label">
            {tierInfo.displayName}
          </div>
        )}
        {rating && size === 'large' && (
          <div className="rank-badge-rating">{rating}</div>
        )}
      </div>
    </div>
  );
};

function getIconForTier(tier: RankTier): React.ReactNode {
  // Unicode chess pieces and symbols for ranks
  const icons: Record<RankTier, string> = {
    iron: '♟',      // Pawn
    bronze: '♜',    // Rook
    silver: '♞',    // Knight
    gold: '♝',      // Bishop
    platinum: '♛',  // Queen
    diamond: '♔',   // King
    master: '⚔',    // Crossed swords
    grandmaster: '👑' // Crown
  };
  
  return <span className="rank-icon">{icons[tier]}</span>;
}