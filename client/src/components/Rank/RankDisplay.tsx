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
  
  // Full variant
  return (
    <div className={`rank-display rank-display-full ${className}`}>
      <div className="rank-display-header">
        <RankBadge tier={tier} rating={rating} size="large" animated />
      </div>
      
      <RankProgressBar 
        currentRating={rating} 
        showNextTier 
        showLabels 
        animated 
      />
      
      <div className="rank-display-stats-grid">
        <div className="rank-stat-item">
          <span className="rank-stat-icon">📊</span>
          <span className="rank-stat-label">Current</span>
          <span className="rank-stat-value">{rating}</span>
        </div>
        
        {peakRating && (
          <div className="rank-stat-item">
            <span className="rank-stat-icon">🏔️</span>
            <span className="rank-stat-label">Peak</span>
            <span className="rank-stat-value">{peakRating}</span>
          </div>
        )}
        
        <div className="rank-stat-item">
          <span className="rank-stat-icon">🎯</span>
          <span className="rank-stat-label">Win Rate</span>
          <span className="rank-stat-value">{winRate}%</span>
        </div>
        
        <div className="rank-stat-item">
          <span className="rank-stat-icon">🎮</span>
          <span className="rank-stat-label">W/L</span>
          <span className="rank-stat-value">{wins}/{losses}</span>
        </div>
      </div>
    </div>
  );
};