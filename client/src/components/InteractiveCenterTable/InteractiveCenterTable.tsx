import React, { useState, useEffect } from 'react';
import type { Card as CardType } from '../../types/game.types';
import { Card } from '../Card/Card';
import { OperationMenu } from '../OperationMenu/OperationMenu';
import './InteractiveCenterTable.css';

interface InteractiveCenterTableProps {
  cards: CardType[];
  onSolutionFound: (expression: string, result: number) => void;
  disabled?: boolean;
  allowInteraction?: boolean;
}

interface MergedCard extends CardType {
  expression: string;
  sourceCards: string[]; // IDs of cards used to create this
}

export const InteractiveCenterTable: React.FC<InteractiveCenterTableProps> = ({
  cards: initialCards,
  onSolutionFound,
  disabled = false,
  allowInteraction = true
}) => {
  const [cards, setCards] = useState<(CardType | MergedCard)[]>(initialCards);
  const [selectedCard, setSelectedCard] = useState<CardType | MergedCard | null>(null);
  const [secondCard, setSecondCard] = useState<CardType | MergedCard | null>(null);
  const [operationMenuPosition, setOperationMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<{ cards: (CardType | MergedCard)[], expression: string }[]>([]);

  // Reset cards when initial cards change
  useEffect(() => {
    setCards(initialCards);
    setSelectedCard(null);
    setSecondCard(null);
    setOperationMenuPosition(null);
    setHistory([]);
  }, [initialCards]);

  const handleCardClick = (card: CardType | MergedCard, event: React.MouseEvent) => {
    if (disabled || !allowInteraction) return;

    if (!selectedCard) {
      // First card selection - show operation menu
      setSelectedCard(card);
      const rect = event.currentTarget.getBoundingClientRect();
      setOperationMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    } else if (selectedCard.id !== card.id) {
      // Second card selection - store it and wait for operation selection
      setSecondCard(card);
    }
  };

  const handleOperationSelect = (operation: '+' | '-' | '*' | '/') => {
    if (!selectedCard || !secondCard) return;

    // Calculate result
    const value1 = selectedCard.value;
    const value2 = secondCard.value;
    let result: number;
    let expression: string;

    const expr1 = 'expression' in selectedCard ? `(${selectedCard.expression})` : String(value1);
    const expr2 = 'expression' in secondCard ? `(${secondCard.expression})` : String(value2);

    switch (operation) {
      case '+':
        result = value1 + value2;
        expression = `${expr1} + ${expr2}`;
        break;
      case '-':
        result = value1 - value2;
        expression = `${expr1} - ${expr2}`;
        break;
      case '*':
        result = value1 * value2;
        expression = `${expr1} × ${expr2}`;
        break;
      case '/':
        result = value1 / value2;
        expression = `${expr1} ÷ ${expr2}`;
        break;
    }

    // Save current state to history
    setHistory(prev => [...prev, { cards: [...cards], expression }]);

    // Create merged card
    const mergedCard: MergedCard = {
      id: `merged-${Date.now()}`,
      value: result,
      ownerId: selectedCard.ownerId, // Use first card's owner
      expression,
      sourceCards: [
        ...('sourceCards' in selectedCard ? selectedCard.sourceCards : [selectedCard.id]),
        ...('sourceCards' in secondCard ? secondCard.sourceCards : [secondCard.id])
      ]
    };

    // Remove used cards and add merged card
    const newCards = cards.filter(c => c.id !== selectedCard.id && c.id !== secondCard.id);
    newCards.push(mergedCard);
    setCards(newCards);

    // Check if we have a solution (only one card left with value 24)
    if (newCards.length === 1 && Math.abs(newCards[0].value - 24) < 0.0001) {
      onSolutionFound(mergedCard.expression, result);
    }

    closeOperationMenu();
  };

  const closeOperationMenu = () => {
    setSelectedCard(null);
    setSecondCard(null);
    setOperationMenuPosition(null);
  };

  const handleReset = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setCards(previousState.cards);
      setHistory(history.slice(0, -1));
      setSelectedCard(null);
      setSecondCard(null);
      setOperationMenuPosition(null);
    }
  };

  const isMergedCard = (card: CardType | MergedCard): card is MergedCard => {
    return 'expression' in card;
  };

  return (
    <div className="interactive-center-table">
      <div className="table-surface">
        <div className="table-header">
          <h3>Combine to 24</h3>
          {history.length > 0 && allowInteraction && (
            <button className="reset-btn" onClick={handleReset}>
              ↩ Undo
            </button>
          )}
        </div>
        
        <div className="center-cards interactive">
          {cards.length > 0 ? (
            cards.map((card, index) => (
              <div
                key={card.id}
                className={`card-wrapper ${selectedCard?.id === card.id ? 'selected' : ''} ${secondCard?.id === card.id ? 'selected-second' : ''}`}
                onClick={(e) => handleCardClick(card, e)}
              >
                <Card
                  card={card}
                  size="large"
                  selected={selectedCard?.id === card.id || secondCard?.id === card.id}
                  disabled={disabled || !allowInteraction}
                  className={`center-card card-${index}`}
                />
                {isMergedCard(card) && (
                  <div className="card-expression">{card.expression}</div>
                )}
              </div>
            ))
          ) : (
            <div className="no-cards">No cards dealt yet</div>
          )}
        </div>

        {cards.length === 1 && (
          <div className={`result-indicator ${Math.abs(cards[0].value - 24) < 0.0001 ? 'success' : 'continue'}`}>
            {Math.abs(cards[0].value - 24) < 0.0001 ? '✓ Equals 24!' : `= ${cards[0].value}`}
          </div>
        )}
      </div>

      {operationMenuPosition && (
        <OperationMenu
          position={operationMenuPosition}
          onSelect={handleOperationSelect}
          onClose={closeOperationMenu}
        />
      )}
    </div>
  );
};