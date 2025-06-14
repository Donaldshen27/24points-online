import React from 'react';
import type { Card as CardType, Player } from '../../types/game.types';
import { Card } from '../Card/Card';
import { CardUtils } from '../../utils/cardUtils';
import './PlayerHand.css';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  showCards?: boolean;
  onCardClick?: (card: CardType) => void;
  selectedCards?: CardType[];
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  isCurrentPlayer,
  showCards = true,
  onCardClick,
  selectedCards = []
}) => {
  const sortedDeck = CardUtils.sortCardsByValue(player.deck);
  const cardCount = player.deck.length;

  return (
    <div className={`player-hand ${isCurrentPlayer ? 'current-player' : 'opponent'}`}>
      <div className="player-info">
        <h3>{player.name}</h3>
        <span className="card-count">{cardCount} cards</span>
      </div>
      
      <div className="hand-cards">
        {showCards && isCurrentPlayer ? (
          sortedDeck.map((card) => (
            <Card
              key={card.id}
              card={card}
              size="small"
              onClick={onCardClick}
              selected={selectedCards.some(c => c.id === card.id)}
              showOwner={false}
            />
          ))
        ) : (
          <div className="hidden-cards">
            {Array.from({ length: Math.min(cardCount, 10) }).map((_, index) => (
              <div key={index} className="card-back" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};