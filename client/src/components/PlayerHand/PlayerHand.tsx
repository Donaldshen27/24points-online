import React from 'react';
import type { Player } from '../../types/game.types';
import './PlayerHand.css';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  isCurrentPlayer
}) => {
  const cardCount = player.deck.length;

  return (
    <div className={`player-hand ${isCurrentPlayer ? 'current-player' : 'opponent'}`}>
      <div className="player-info">
        <h3>{player.name}</h3>
        <span className="card-count">{cardCount} cards</span>
      </div>
    </div>
  );
};