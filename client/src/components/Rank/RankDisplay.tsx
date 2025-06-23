import React from 'react';
import { getRankTier } from '../../../../shared/game/elo';
import { RankBadge } from './RankBadge';
import { RankProgressBar } from './RankProgressBar';
import './RankDisplay.css';

interface RankDisplayProps {
  rating: number;
  peakRating?: number;
  wins?: number;
  losses?: number;
  variant?: 'compact' | 'detailed' | 'full';
  className?: string;
}

export const RankDisplay: React.FC<RankDisplayProps> = ({
  rating,
  peakRating,
  wins = 0,
  losses = 0,
  variant = 'detailed',
  className = ''
}) => {
  const tier = getRankTier(rating);
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : '0.0';
  
  if (variant === 'compact') {
    return (
      <div className={`rank-display rank-display-compact ${className}`}>
        <RankBadge tier={tier} rating={rating} size="small" />
      </div>
    );
  }
  
  if (variant === 'detailed') {
    return (
      <div className={`rank-display rank-display-detailed ${className}`}>
        <RankBadge tier={tier} rating={rating} size="medium" />
        <div className="rank-display-stats">
          <div className="rank-stat">
            <span className="rank-stat-label">Win Rate</span>
            <span className="rank-stat-value">{winRate}%</span>
          </div>
          <div className="rank-stat">
            <span className="rank-stat-label">Games</span>
            <span className="rank-stat-value">{totalGames}</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Full variant - Competitive horizontal layout
  return (
    <div className={`rank-display rank-display-full ${className}`}>
      <div className="rank-display-main">
        <div className="rank-badge-section">
          <RankBadge tier={tier} rating={rating} size="large" animated />
          <div className="rank-info">
            <h2 className="rank-tier-name">{tier.name}</h2>
            <div className="rank-rating-display">
              <span className="current-rating">{rating}</span>
              <span className="rating-label">ELO</span>
            </div>
          </div>
        </div>
        
        <div className="rank-stats-section">
          <div className="stat-group performance">
            <div className="stat-box wins">
              <span className="stat-number">{wins}</span>
              <span className="stat-label">Wins</span>
            </div>
            <div className="stat-divider">-</div>
            <div className="stat-box losses">
              <span className="stat-number">{losses}</span>
              <span className="stat-label">Losses</span>
            </div>
          </div>
          
          <div className="stat-group metrics">
            <div className="metric-item">
              <span className="metric-label">Win Rate</span>
              <div className="metric-value-bar">
                <span className="metric-value">{winRate}%</span>
                <div className="winrate-bar">
                  <div className="winrate-fill" style={{ width: `${winRate}%` }}></div>
                </div>
              </div>
            </div>
            
            {peakRating && (
              <div className="metric-item">
                <span className="metric-label">Peak Rating</span>
                <span className="metric-value peak">{peakRating}</span>
              </div>
            )}
            
            <div className="metric-item">
              <span className="metric-label">Total Games</span>
              <span className="metric-value">{totalGames}</span>
            </div>
          </div>
        </div>
      </div>
      
      <RankProgressBar 
        currentRating={rating} 
        showNextTier 
        showLabels 
        animated 
        compact
      />
    </div>
  );
};