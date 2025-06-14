import React from 'react';
import type { Card as CardType } from '../../types/game.types';
import { Card } from '../Card/Card';
import './CenterTable.css';

interface CenterTableProps {
  cards: CardType[];
  onCardClick?: (card: CardType) => void;
  selectedCards?: CardType[];
  disabled?: boolean;
}

export const CenterTable: React.FC<CenterTableProps> = ({
  cards,
  onCardClick,
  selectedCards = [],
  disabled = false
}) => {
  return (
    <div className="center-table">
      <div className="table-surface">
        <h3>Center Cards</h3>
        <div className="center-cards">
          {cards.length > 0 ? (
            cards.map((card, index) => (
              <Card
                key={card.id}
                card={card}
                size="large"
                onClick={onCardClick}
                selected={selectedCards.some(c => c.id === card.id)}
                disabled={disabled}
                className={`center-card card-${index}`}
              />
            ))
          ) : (
            <div className="no-cards">No cards dealt yet</div>
          )}
        </div>
      </div>
    </div>
  );
};