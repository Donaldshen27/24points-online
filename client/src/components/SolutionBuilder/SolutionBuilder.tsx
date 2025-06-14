import React, { useState } from 'react';
import type { Card, Operation } from '../../types/game.types';
import { Calculator } from '../../utils/calculator';
import './SolutionBuilder.css';

interface SolutionBuilderProps {
  cards: Card[];
  onSubmit: (operations: Operation[]) => void;
  onCancel: () => void;
}

interface NumberOption {
  value: number;
  source: 'card' | 'result';
  cardId?: string;
  operationIndex?: number;
}

export const SolutionBuilder: React.FC<SolutionBuilderProps> = ({
  cards,
  onSubmit,
  onCancel
}) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<NumberOption | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [selectedRight, setSelectedRight] = useState<NumberOption | null>(null);
  const [error, setError] = useState<string>('');

  const operators = ['+', '-', '×', '÷'];

  // Get available numbers (unused cards + results from operations)
  const getAvailableNumbers = (): NumberOption[] => {
    const numbers: NumberOption[] = [];
    
    // Add unused cards
    const usedCardIds = new Set<string>();
    operations.forEach((_, index) => {
      if (index === 0) {
        // First operation uses two cards
        const leftCard = cards.find(c => c.value === operations[0].left);
        const rightCard = cards.find(c => c.value === operations[0].right);
        if (leftCard) usedCardIds.add(leftCard.id);
        if (rightCard) usedCardIds.add(rightCard.id);
      }
    });

    cards.forEach(card => {
      if (!usedCardIds.has(card.id)) {
        numbers.push({
          value: card.value,
          source: 'card',
          cardId: card.id
        });
      }
    });

    // Add results from previous operations
    operations.forEach((op, index) => {
      numbers.push({
        value: op.result,
        source: 'result',
        operationIndex: index
      });
    });

    return numbers;
  };

  const availableNumbers = getAvailableNumbers();

  const handleNumberClick = (option: NumberOption) => {
    if (!selectedLeft) {
      setSelectedLeft(option);
      setError('');
    } else if (selectedOperator && !selectedRight) {
      if (option === selectedLeft) {
        setError('Cannot use the same number twice');
        return;
      }
      setSelectedRight(option);
      setError('');
    }
  };

  const handleOperatorClick = (op: string) => {
    if (selectedLeft && !selectedOperator) {
      setSelectedOperator(op);
      setError('');
    }
  };

  const handleCalculate = () => {
    if (!selectedLeft || !selectedOperator || !selectedRight) {
      setError('Please select two numbers and an operator');
      return;
    }

    try {
      const operation = Calculator.createOperation(
        selectedLeft.value,
        selectedOperator,
        selectedRight.value
      );

      setOperations([...operations, operation]);
      setSelectedLeft(null);
      setSelectedOperator('');
      setSelectedRight(null);
      setError('');

      // Check if we have 3 operations (solution complete)
      if (operations.length === 2) {
        const finalOperations = [...operations, operation];
        const validation = Calculator.validateSolution(cards, finalOperations);
        
        if (validation.isValid) {
          onSubmit(finalOperations);
        } else {
          setError(validation.error || 'Invalid solution');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid operation');
    }
  };

  const handleReset = () => {
    setOperations([]);
    setSelectedLeft(null);
    setSelectedOperator('');
    setSelectedRight(null);
    setError('');
  };

  const handleUndo = () => {
    if (operations.length > 0) {
      setOperations(operations.slice(0, -1));
    }
    setSelectedLeft(null);
    setSelectedOperator('');
    setSelectedRight(null);
    setError('');
  };

  return (
    <div className="solution-builder">
      <h3>Build Your Solution</h3>
      
      <div className="available-numbers">
        <h4>Available Numbers:</h4>
        <div className="number-options">
          {availableNumbers.map((option, index) => (
            <button
              key={`${option.source}-${index}`}
              className={`number-option ${option.source} ${
                selectedLeft === option || selectedRight === option ? 'selected' : ''
              }`}
              onClick={() => handleNumberClick(option)}
              disabled={operations.length === 3}
            >
              {Calculator.formatNumber(option.value)}
              {option.source === 'card' && <span className="source-label">card</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="operation-builder">
        <div className="operation-row">
          <div className={`operand ${selectedLeft ? 'filled' : ''}`}>
            {selectedLeft ? Calculator.formatNumber(selectedLeft.value) : '?'}
          </div>
          
          <div className="operators">
            {operators.map(op => (
              <button
                key={op}
                className={`operator ${selectedOperator === op ? 'selected' : ''}`}
                onClick={() => handleOperatorClick(op)}
                disabled={!selectedLeft || selectedRight !== null || operations.length === 3}
              >
                {op}
              </button>
            ))}
          </div>
          
          <div className={`operand ${selectedRight ? 'filled' : ''}`}>
            {selectedRight ? Calculator.formatNumber(selectedRight.value) : '?'}
          </div>
          
          <button
            className="equals-button"
            onClick={handleCalculate}
            disabled={!selectedLeft || !selectedOperator || !selectedRight}
          >
            =
          </button>
          
          <div className="result">
            {selectedLeft && selectedOperator && selectedRight
              ? Calculator.formatNumber(
                  Calculator.evaluate(selectedLeft.value, selectedOperator, selectedRight.value)
                )
              : '?'}
          </div>
        </div>
      </div>

      <div className="operations-history">
        <h4>Steps:</h4>
        {operations.map((op, index) => (
          <div key={index} className="operation-step">
            {index + 1}. {Calculator.formatNumber(op.left)} {op.operator}{' '}
            {Calculator.formatNumber(op.right)} = {Calculator.formatNumber(op.result)}
          </div>
        ))}
        {operations.length === 3 && (
          <div className="final-result">
            Final Result: {Calculator.formatNumber(operations[2].result)}
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="builder-actions">
        <button onClick={handleUndo} disabled={operations.length === 0}>
          Undo
        </button>
        <button onClick={handleReset}>
          Reset
        </button>
        <button onClick={onCancel}>
          Cancel
        </button>
        {operations.length === 3 && (
          <button 
            className="submit-button"
            onClick={() => onSubmit(operations)}
          >
            Submit Solution
          </button>
        )}
      </div>
    </div>
  );
};