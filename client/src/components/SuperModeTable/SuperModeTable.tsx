import React from 'react';
import type { Card } from '../../types/game.types';
import { Card as CardComponent } from '../Card/Card';
import './SuperModeTable.css';

interface SuperModeTableProps {
  centerCards: Card[];
  onCardClick?: (card: Card) => void;
}

export const SuperModeTable: React.FC<SuperModeTableProps> = ({ 
  centerCards, 
  onCardClick 
}) => {
  return (
    <div className="super-mode-table">
      <div className="cards-grid super-grid">
        {centerCards.map((card, index) => (
          <div
            key={card.id}
            className={`super-card super-card-${index}`}
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            <CardComponent
              card={card}
              onClick={onCardClick ? () => onCardClick(card) : undefined}
            />
          </div>
        ))}
      </div>
      
      <div className="super-mode-hint">
        <svg className="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v6m0 4v6m0 4v2m0-18a2 2 0 110 4 2 2 0 010-4zm0 8a2 2 0 110 4 2 2 0 010-4z" />
        </svg>
        <span>Use any combination of the 8 cards to make 24!</span>
      </div>
    </div>
  );
};