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
  isDisconnected = false,
  roomType
}) => {
  const cardCount = player.deck.length;
  const points = player.points || 0;
  const isExtendedMode = roomType === 'extended';
  
  // Generate display based on game mode
  const getDisplay = () => {
    if (isExtendedMode) {
      // Extended mode: show points (0-5)
      const stars = '⭐'.repeat(points);
      const emptyStars = '☆'.repeat(5 - points);
      const className = points >= 4 ? 'points-display near-win' : 'points-display';
      return <span className={className}>{stars}{emptyStars}</span>;
    } else {
      // Classic/Super mode: show hearts based on card count
      if (cardCount === 0) {
        // Victory - show empty hearts
        return '🤍🤍🤍🤍🤍';
      }
      
      const fullHearts = Math.floor(cardCount / 2);
      const hasHalfHeart = cardCount % 2 === 1;
      const hearts = '❤️'.repeat(fullHearts) + (hasHalfHeart ? '💔' : '');
      
      // Add shaking class for low health (2 or less cards)
      const className = cardCount <= 2 ? 'hearts-display shaking' : 'hearts-display';
      
      return <span className={className}>{hearts}</span>;
    }
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
            {isExtendedMode ? `(${points}/5)` : `(${cardCount})`}
          </span>
        </div>
      </div>
    </div>
  );
};