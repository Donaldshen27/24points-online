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

  return (
    <div className={`player-hand ${isCurrentPlayer ? 'current-player' : 'opponent'} ${isDisconnected ? 'disconnected' : ''}`}>
      <div className="player-info">
        <h3>
          {player.name}
          {isDisconnected && <span className="disconnect-indicator"> (Disconnected)</span>}
        </h3>
        <span className="card-count">{cardCount} cards</span>
      </div>
    </div>
  );
};