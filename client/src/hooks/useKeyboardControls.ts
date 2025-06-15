import { useEffect, useCallback, useState } from 'react';
import type { Card } from '../types/game.types';

interface UseKeyboardControlsProps {
  cards: Card[];
  onCardSelect: (card: Card) => void;
  onOperatorSelect: (operator: '+' | '-' | '*' | '/') => void;
  onConfirm: () => void;
  onUndo: () => void;
  onReset: () => void;
  enabled?: boolean;
}

export const useKeyboardControls = ({
  cards,
  onCardSelect,
  onOperatorSelect,
  onConfirm,
  onUndo,
  onReset,
  enabled = true
}: UseKeyboardControlsProps) => {
  const [showHelp, setShowHelp] = useState(false);
  
  // Map cards to keyboard numbers
  const cardNumberMap = new Map<number, Card>();
  cards.forEach((card, index) => {
    cardNumberMap.set(index + 1, card);
  });

  const normalizeOperator = (key: string): '+' | '-' | '*' | '/' | null => {
    switch (key) {
      case '+':
      case '=':
        return '+';
      case '-':
      case '_':
        return '-';
      case '*':
      case 'x':
      case 'X':
        return '*';
      case '/':
      case '?':
        return '/';
      default:
        return null;
    }
  };

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Prevent default for our keys
    if (['/', '+', '-', '*', '=', ' '].includes(event.key)) {
      event.preventDefault();
    }

    const key = event.key;

    // Number keys for card selection
    if (key >= '1' && key <= '9') {
      const cardNumber = parseInt(key);
      const card = cardNumberMap.get(cardNumber);
      if (card) {
        // Add keyboard focus animation
        const cardElement = document.querySelector(`[data-card-id="${card.id}"] .card`);
        if (cardElement) {
          cardElement.classList.add('keyboard-focused');
          setTimeout(() => {
            cardElement.classList.remove('keyboard-focused');
          }, 400);
        }
        onCardSelect(card);
      }
    } else if (key === '0') {
      // Use 0 for 10th card
      const card = cardNumberMap.get(10);
      if (card) {
        const cardElement = document.querySelector(`[data-card-id="${card.id}"] .card`);
        if (cardElement) {
          cardElement.classList.add('keyboard-focused');
          setTimeout(() => {
            cardElement.classList.remove('keyboard-focused');
          }, 400);
        }
        onCardSelect(card);
      }
    }
    
    // Operator keys
    const operator = normalizeOperator(key);
    if (operator) {
      onOperatorSelect(operator);
    }
    
    // Action keys
    else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      onConfirm();
    } else if (key === 'Backspace' || key.toLowerCase() === 'u') {
      event.preventDefault();
      onUndo();
    } else if (key.toLowerCase() === 'r') {
      onReset();
    } else if (key === 'Escape') {
      // Cancel current selection
      onReset();
    } else if (key.toLowerCase() === 'h') {
      setShowHelp(prev => !prev);
    }
  }, [cards, enabled, onCardSelect, onOperatorSelect, onConfirm, onUndo, onReset]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress, enabled]);

  return {
    showHelp,
    setShowHelp,
    cardNumberMap
  };
};