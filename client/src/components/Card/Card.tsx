import React from 'react';
import type { Card as CardType } from '../../types/game.types';
import { CardUtils } from '../../utils/cardUtils';
import './Card.css';

interface CardProps {
  card: CardType;
  onClick?: (card: CardType) => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showOwner?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  size = 'medium',
  showOwner = true,
  className = ''
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(card);
    }
  };

  const cardColor = CardUtils.getCardColor(card.owner);
  
  return (
    <div
      className={`card ${size} ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      onClick={handleClick}
      style={{
        '--card-color': cardColor
      } as React.CSSProperties}
    >
      <div className="card-value">
        {card.value}
      </div>
      {showOwner && (
        <div className="card-owner">
          {card.owner === 'player1' ? 'P1' : 'P2'}
        </div>
      )}
    </div>
  );
};