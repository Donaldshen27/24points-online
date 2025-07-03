import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type { Card as CardType, Operation } from '../../types/game.types';
import './InteractiveCenterTableMobile.css';

interface InteractiveCenterTableMobileProps {
  cards: CardType[];
  onSolutionFound: (expression: string, result: number, usedCards: CardType[], operations: Operation[]) => void;
  disabled?: boolean;
  allowInteraction?: boolean;
  solvingPlayer?: string | null;
  currentUserId?: string;
}

interface MergedCard extends CardType {
  expression: string;
  sourceCards: string[];
  owner: 'player1' | 'player2';
}

interface DraggedCard {
  card: CardType | MergedCard;
  x: number;
  y: number;
}

export const InteractiveCenterTableMobile: React.FC<InteractiveCenterTableMobileProps> = ({
  cards: initialCards,
  onSolutionFound,
  disabled = false,
  allowInteraction = true,
  solvingPlayer,
  currentUserId
}) => {
  const [cards, setCards] = useState<(CardType | MergedCard)[]>(initialCards);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [draggedCard, setDraggedCard] = useState<DraggedCard | null>(null);
  const [showOperations, setShowOperations] = useState(false);
  const [history, setHistory] = useState<{ cards: (CardType | MergedCard)[], expression: string }[]>([]);
  const [operationHistory, setOperationHistory] = useState<Operation[]>([]);
  const [currentExpression, setCurrentExpression] = useState<string>('');
  const tableRef = useRef<HTMLDivElement>(null);

  // Reset when initial cards change
  useEffect(() => {
    setCards(initialCards);
    setSelectedCards(new Set());
    setDraggedCard(null);
    setShowOperations(false);
    setHistory([]);
    setOperationHistory([]);
    setCurrentExpression('');
  }, [initialCards]);

  const handleCardTap = (card: CardType | MergedCard) => {
    if (disabled || !allowInteraction) return;

    // Vibrate on tap
    navigator.vibrate?.(20);

    const newSelected = new Set(selectedCards);
    if (newSelected.has(card.id)) {
      newSelected.delete(card.id);
    } else {
      newSelected.add(card.id);
    }
    
    setSelectedCards(newSelected);
    
    // Show operations when 2 cards are selected
    if (newSelected.size === 2) {
      setShowOperations(true);
    } else {
      setShowOperations(false);
    }
  };

  const handleDragStart = (card: CardType | MergedCard, info: PanInfo) => {
    if (disabled || !allowInteraction) return;
    
    setDraggedCard({
      card,
      x: info.point.x,
      y: info.point.y
    });
    
    // Add to selected if not already
    const newSelected = new Set(selectedCards);
    newSelected.add(card.id);
    setSelectedCards(newSelected);
  };

  const handleDragEnd = (info: PanInfo) => {
    if (!draggedCard || !tableRef.current) return;

    // Find the card under the drop point
    const elements = document.elementsFromPoint(info.point.x, info.point.y);
    const droppedOnCard = elements.find(el => 
      el.classList.contains('mobile-card') && 
      el.getAttribute('data-card-id') !== draggedCard.card.id
    );

    if (droppedOnCard) {
      const targetCardId = droppedOnCard.getAttribute('data-card-id');
      const targetCard = cards.find(c => c.id === targetCardId);
      
      if (targetCard) {
        // Select both cards
        const newSelected = new Set<string>([draggedCard.card.id, targetCard.id]);
        setSelectedCards(newSelected);
        setShowOperations(true);
        
        // Vibrate on successful drop
        navigator.vibrate?.(50);
      }
    }

    setDraggedCard(null);
  };

  const performOperation = (operator: '+' | '-' | '*' | '/') => {
    const selectedCardsList = Array.from(selectedCards);
    if (selectedCardsList.length !== 2) return;

    const [card1, card2] = selectedCardsList.map(id => cards.find(c => c.id === id)!);
    if (!card1 || !card2) return;

    // Calculate result
    const value1 = card1.value;
    const value2 = card2.value;
    let result = 0;
    let expression = '';

    switch (operator) {
      case '+':
        result = value1 + value2;
        expression = `${value1} + ${value2}`;
        break;
      case '-':
        result = Math.abs(value1 - value2);
        expression = value1 > value2 ? `${value1} - ${value2}` : `${value2} - ${value1}`;
        break;
      case '*':
        result = value1 * value2;
        expression = `${value1} × ${value2}`;
        break;
      case '/':
        if (value2 === 0 || value1 % value2 !== 0) {
          // Invalid division
          navigator.vibrate?.([50, 50, 50]); // Error vibration
          return;
        }
        result = value1 / value2;
        expression = `${value1} ÷ ${value2}`;
        break;
    }

    // Create merged card
    const mergedCard: MergedCard = {
      id: `merged-${Date.now()}`,
      value: result,
      expression: expression,
      sourceCards: [card1.id, card2.id],
      owner: 'player1'
    };

    // Update cards
    const newCards = cards.filter(c => c.id !== card1.id && c.id !== card2.id);
    newCards.push(mergedCard);
    
    // Save to history
    setHistory([...history, { cards: [...cards], expression }]);
    setOperationHistory([...operationHistory, {
      operator,
      left: value1,
      right: value2,
      result
    }]);

    // Update state
    setCards(newCards);
    setSelectedCards(new Set());
    setShowOperations(false);
    setCurrentExpression(expression);

    // Check for solution
    if (newCards.length === 1 && Math.abs(result - 24) < 0.0001) {
      navigator.vibrate?.([100, 50, 100]); // Success vibration
      
      // Get all used cards from initial cards
      const usedCards = initialCards;
      
      onSolutionFound(
        expression,
        result,
        usedCards,
        [...operationHistory, {
          operator,
          left: value1,
          right: value2,
          result
        }]
      );
    } else {
      navigator.vibrate?.(30); // Normal operation vibration
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    const lastState = history[history.length - 1];
    setCards(lastState.cards);
    setHistory(history.slice(0, -1));
    setOperationHistory(operationHistory.slice(0, -1));
    setSelectedCards(new Set());
    setShowOperations(false);
    
    navigator.vibrate?.(20);
  };

  const canInteract = !disabled && allowInteraction && 
    (!solvingPlayer || solvingPlayer === currentUserId);

  return (
    <div className="mobile-center-table" ref={tableRef} data-card-count={cards.length}>
      {/* Current Expression Display */}
      {currentExpression && (
        <motion.div 
          className="mobile-expression-display"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {currentExpression} = {cards[cards.length - 1]?.value}
        </motion.div>
      )}

      {/* Cards */}
      <div className="mobile-cards-container">
        <AnimatePresence>
          {cards.map((card) => (
            <motion.div
              key={card.id}
              className={`mobile-card-wrapper ${selectedCards.has(card.id) ? 'selected' : ''}`}
              data-card-id={card.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              drag={canInteract}
              dragSnapToOrigin
              onDragStart={(_, info) => handleDragStart(card, info)}
              onDragEnd={(_, info) => handleDragEnd(info)}
              onTap={() => handleCardTap(card)}
              whileTap={{ scale: 0.95 }}
              whileDrag={{ scale: 1.1, zIndex: 100 }}
            >
              <div className="mobile-card">
                <div className="mobile-card-value">{card.value}</div>
                {'expression' in card && (
                  <div className="mobile-card-expression">{card.expression}</div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Operation Buttons */}
      <AnimatePresence>
        {showOperations && selectedCards.size === 2 && (
          <motion.div 
            className="mobile-operations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {['+', '-', '×', '÷'].map((op) => (
              <motion.button
                key={op}
                className="mobile-operation-btn"
                onClick={() => performOperation(op === '×' ? '*' : op === '÷' ? '/' : op as '+' | '-')}
                whileTap={{ scale: 0.9 }}
              >
                {op}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo Button */}
      {history.length > 0 && canInteract && (
        <motion.button
          className="mobile-undo-btn"
          onClick={handleUndo}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.9 }}
        >
          ↶ Undo
        </motion.button>
      )}

      {/* Instructions */}
      {cards.length === initialCards.length && canInteract && (
        <motion.div 
          className="mobile-instructions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>Tap 2 cards or drag one onto another</p>
        </motion.div>
      )}
    </div>
  );
};