import React, { useEffect, useState } from 'react';
import { Card } from '../Card/Card';
import type { Card as CardType } from '../../types/game.types';
import './CardTransfer.css';

interface CardTransferProps {
  cards: CardType[];
  fromPosition: 'center';
  toPosition: 'top' | 'bottom';
  onComplete: () => void;
  duration?: number;
}

export const CardTransfer: React.FC<CardTransferProps> = ({
  cards,
  fromPosition: _fromPosition,
  toPosition,
  onComplete,
  duration = 1000
}) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isAnimating) return null;

  return (
    <div className="card-transfer-container">
      {cards.map((card, index) => (
        <div
          key={card.id}
          className={`transferring-card ${toPosition}`}
          style={{
            animationDelay: `${index * 100}ms`,
            animationDuration: `${duration}ms`
          }}
        >
          <Card card={card} size="small" />
        </div>
      ))}
    </div>
  );
};