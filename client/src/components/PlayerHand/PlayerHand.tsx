import React from 'react';
import type { Player } from '../../types/game.types';
import './PlayerHand.css';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  isDisconnected?: boolean;
  isSpectatorView?: boolean;
  roomType?: string;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  isCurrentPlayer,
  isDisconnected = false
}) => {
  const points = player.points || 0;
  
  // Generate display for all game modes using points
  const getDisplay = () => {
    // All modes now use points (0-4)
    const stars = '⭐'.repeat(points);
    const emptyStars = '☆'.repeat(4 - points);
    const className = points >= 3 ? 'points-display near-win' : 'points-display';
    return <span className={className}>{stars}{emptyStars}</span>;
  };

  return (
    <div className={`player-hand minimal ${isCurrentPlayer ? 'current-player' : 'opponent'} ${isDisconnected ? 'disconnected' : ''}`}>
      <div className="player-info minimal">
        <span className="player-name">
          {player.name}
          {isDisconnected && <span className="disconnect-icon">⚠️</span>}
        </span>
        <div className="card-display">
          {getDisplay()}
          <span className="card-count">
            ({points}/4)
          </span>
        </div>
      </div>
    </div>
  );
};