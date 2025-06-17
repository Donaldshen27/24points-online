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
  
  // Generate heart emojis based on card count
  const renderHearts = () => {
    const hearts = [];
    const fullHearts = Math.floor(cardCount / 2);
    const hasHalfHeart = cardCount % 2 === 1;
    
    // Add full hearts
    for (let i = 0; i < fullHearts; i++) {
      hearts.push(<span key={`full-${i}`} className="heart full">❤️</span>);
    }
    
    // Add half heart if odd number
    if (hasHalfHeart) {
      hearts.push(<span key="half" className="heart half">💔</span>);
    }
    
    // If no cards left, show empty hearts
    if (cardCount === 0) {
      hearts.push(<span key="empty" className="heart empty">🤍🤍🤍🤍🤍</span>);
    }
    
    return hearts;
  };

  return (
    <div className={`player-hand-minimal ${isCurrentPlayer ? 'current-player' : 'opponent'} ${isDisconnected ? 'disconnected' : ''}`}>
      <div className="player-info-minimal">
        <span className="player-name">
          {player.name}
          {isDisconnected && <span className="disconnect-indicator"> ⚠️</span>}
        </span>
        <div className="hearts-container">
          {renderHearts()}
          <span className="card-count-number">({cardCount})</span>
        </div>
      </div>
    </div>
  );
};