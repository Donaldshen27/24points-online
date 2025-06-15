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
  owner: 'player1' | 'player2';
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

    // If clicking on already selected card, deselect
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      setSecondCard(null);
      setOperationMenuPosition(null);
      return;
    }

    if (!selectedCard) {
      // First card selection
      setSelectedCard(card);
      setOperationMenuPosition(null); // Don't show menu yet
    } else if (selectedCard.id !== card.id && !operationMenuPosition) {
      // Second card selection - now show operation menu
      setSecondCard(card);
      const rect = event.currentTarget.getBoundingClientRect();
      setOperationMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
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
        expression = `${expr1} * ${expr2}`;
        break;
      case '/':
        result = value1 / value2;
        expression = `${expr1} / ${expr2}`;
        break;
    }

    // Save current state to history
    setHistory(prev => [...prev, { cards: [...cards], expression }]);

    // Create merged card
    const mergedCard: MergedCard = {
      id: `merged-${Date.now()}`,
      value: result,
      owner: selectedCard.owner, // Use first card's owner
      expression,
      sourceCards: [
        ...('sourceCards' in selectedCard ? selectedCard.sourceCards : [selectedCard.id]),
        ...('sourceCards' in secondCard ? secondCard.sourceCards : [secondCard.id])
      ]
    };

    // Add merging class to the cards being merged
    const mergeElement1 = document.querySelector(`[data-card-id="${selectedCard.id}"]`) as HTMLElement;
    const mergeElement2 = document.querySelector(`[data-card-id="${secondCard.id}"]`) as HTMLElement;
    
    if (mergeElement1 && mergeElement2) {
      mergeElement1.classList.add('merging-out');
      mergeElement2.classList.add('merging-out');
      
      // Get positions for animation
      const rect1 = mergeElement1.getBoundingClientRect();
      const rect2 = mergeElement2.getBoundingClientRect();
      const centerX = (rect1.left + rect2.left + rect1.width) / 2;
      const centerY = (rect1.top + rect2.top + rect1.height) / 2;
      
      // Apply transform to merge towards center
      mergeElement1.style.setProperty('--merge-x', `${centerX - rect1.left - rect1.width / 2}px`);
      mergeElement1.style.setProperty('--merge-y', `${centerY - rect1.top - rect1.height / 2}px`);
      mergeElement2.style.setProperty('--merge-x', `${centerX - rect2.left - rect2.width / 2}px`);
      mergeElement2.style.setProperty('--merge-y', `${centerY - rect2.top - rect2.height / 2}px`);
    }
    
    // Calculate new cards array
    const newCards = cards.filter(c => c.id !== selectedCard.id && c.id !== secondCard.id);
    newCards.push(mergedCard);
    
    // Wait for animation then update cards
    setTimeout(() => {
      setCards(newCards);
      
      // Check if we have a solution (only one card left with value 24)
      if (newCards.length === 1 && Math.abs(newCards[0].value - 24) < 0.0001) {
        onSolutionFound(mergedCard.expression, result);
      }
    }, 300);

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
          <h3>
            {!selectedCard ? 'Click a card to start' : 
             !secondCard ? 'Click another card' : 
             'Choose an operation'}
          </h3>
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
                data-card-id={card.id}
                className={`card-wrapper ${selectedCard?.id === card.id ? 'selected' : ''} ${secondCard?.id === card.id ? 'selected-second' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(card, e);
                }}
              >
                <Card
                  card={card}
                  size="large"
                  selected={selectedCard?.id === card.id || secondCard?.id === card.id}
                  disabled={disabled || !allowInteraction}
                  className={`center-card card-${index}`}
                  onClick={() => {}} // Handle click in wrapper
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