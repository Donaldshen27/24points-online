import React from 'react';
import type { Player } from '../../types/game.types';
import './PlayerHand.css';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  isDisconnected?: boolean;
  isSpectatorView?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  isCurrentPlayer,
  isDisconnected = false
}) => {
  const cardCount = player.deck.length;
  
  // Generate heart display based on card count
  const getHeartDisplay = () => {
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
  };

  return (
    <div className={`player-hand minimal ${isCurrentPlayer ? 'current-player' : 'opponent'} ${isDisconnected ? 'disconnected' : ''}`}>
      <div className="player-info minimal">
        <span className="player-name">
          {player.name}
          {isDisconnected && <span className="disconnect-icon">⚠️</span>}
        </span>
        <div className="card-display">
          {getHeartDisplay()}
          <span className="card-count">({cardCount})</span>
        </div>
      </div>
    </div>
  );
};