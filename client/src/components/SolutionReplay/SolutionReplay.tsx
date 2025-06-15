import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Solution } from '../../types/game.types';
import { Calculator } from '../../utils/calculator';
import './SolutionReplay.css';

interface SolutionReplayProps {
  solution: Solution;
  onComplete?: () => void;
  autoPlay?: boolean;
  speed?: number; // 0.5 = slow, 1 = normal, 2 = fast
}

interface AnimationStep {
  type: 'setup' | 'operation' | 'complete';
  operationIndex?: number;
  duration: number;
}

export const SolutionReplay: React.FC<SolutionReplayProps> = ({
  solution,
  onComplete,
  autoPlay = true,
  speed = 1
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [highlightedCards, setHighlightedCards] = useState<Set<number>>(new Set());
  const [usedCards, setUsedCards] = useState<Set<number>>(new Set());
  const [currentOperation, setCurrentOperation] = useState<number>(-1);
  const [showResult, setShowResult] = useState<number>(-1);

  // Create animation steps
  const steps: AnimationStep[] = [
    { type: 'setup', duration: 500 },
    { type: 'operation', operationIndex: 0, duration: 2000 },
    { type: 'operation', operationIndex: 1, duration: 2000 },
    { type: 'operation', operationIndex: 2, duration: 2000 },
    { type: 'complete', duration: 1000 }
  ];

  // Get values for current step
  const getStepValues = useCallback((opIndex: number) => {
    if (opIndex < 0 || opIndex >= solution.operations.length) return null;
    
    const op = solution.operations[opIndex];
    const cards = solution.cards;
    
    // For first operation, both values come from cards
    if (opIndex === 0) {
      const leftCard = cards.find(c => c.value === op.left);
      const rightCard = cards.find(c => c.value === op.right && c.id !== leftCard?.id);
      return {
        left: { value: op.left, isCard: true, cardIndex: cards.indexOf(leftCard!) },
        right: { value: op.right, isCard: true, cardIndex: cards.indexOf(rightCard!) },
        operation: op
      };
    }
    
    // For subsequent operations, check if values are from previous results or cards
    const isLeftResult = solution.operations.slice(0, opIndex).some(prevOp => 
      Math.abs(prevOp.result - op.left) < 0.0001
    );
    const isRightResult = solution.operations.slice(0, opIndex).some(prevOp => 
      Math.abs(prevOp.result - op.right) < 0.0001
    );
    
    let leftCardIndex = -1;
    let rightCardIndex = -1;
    
    if (!isLeftResult) {
      const leftCard = cards.find(c => c.value === op.left);
      leftCardIndex = cards.indexOf(leftCard!);
    }
    
    if (!isRightResult) {
      const rightCard = cards.find(c => c.value === op.right);
      rightCardIndex = cards.indexOf(rightCard!);
    }
    
    return {
      left: { value: op.left, isCard: !isLeftResult, cardIndex: leftCardIndex },
      right: { value: op.right, isCard: !isRightResult, cardIndex: rightCardIndex },
      operation: op
    };
  }, [solution]);

  // Handle step progression
  useEffect(() => {
    if (!isPlaying || currentStep >= steps.length) {
      if (currentStep >= steps.length && onComplete) {
        onComplete();
      }
      return;
    }

    const step = steps[currentStep];
    const duration = step.duration / speed;

    const timer = setTimeout(() => {
      // Execute step actions
      if (step.type === 'setup') {
        // Initial setup - just wait
      } else if (step.type === 'operation' && step.operationIndex !== undefined) {
        const stepData = getStepValues(step.operationIndex);
        if (stepData) {
          // Highlight cards being used
          const newHighlighted = new Set<number>();
          if (stepData.left.isCard && stepData.left.cardIndex >= 0) {
            newHighlighted.add(stepData.left.cardIndex);
          }
          if (stepData.right.isCard && stepData.right.cardIndex >= 0) {
            newHighlighted.add(stepData.right.cardIndex);
          }
          setHighlightedCards(newHighlighted);
          setCurrentOperation(step.operationIndex);
          
          // After half the duration, show result and mark cards as used
          setTimeout(() => {
            setShowResult(step.operationIndex!);
            setUsedCards(prev => new Set([...prev, ...newHighlighted]));
            setHighlightedCards(new Set());
          }, duration / 2);
        }
      }

      setCurrentStep(currentStep + 1);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, steps, speed, onComplete, getStepValues]);

  const handleSkip = () => {
    setIsPlaying(false);
    setCurrentStep(steps.length);
    if (onComplete) onComplete();
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const getOperatorSymbol = (op: string) => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return op;
    }
  };

  const getOperatorColor = (op: string) => {
    switch (op) {
      case '+': return 'green';
      case '-': return 'blue';
      case '*': return 'orange';
      case '/': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="solution-replay-overlay">
      <motion.div 
        className="solution-replay-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="replay-header">
          <h2>Solution Replay</h2>
          <div className="replay-controls">
            <button onClick={handleTogglePlay} className="control-btn">
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button onClick={handleSkip} className="control-btn skip-btn">
              Skip ⏭️
            </button>
          </div>
        </div>

        <div className="replay-content">
          {/* Original cards */}
          <div className="cards-row">
            {solution.cards.map((card, index) => (
              <motion.div
                key={card.id}
                className={`replay-card ${
                  highlightedCards.has(index) ? 'highlighted' : ''
                } ${usedCards.has(index) ? 'used' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: usedCards.has(index) ? 0.3 : 1,
                  y: 0,
                  scale: highlightedCards.has(index) ? 1.2 : 1
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="card-value">{card.value}</span>
              </motion.div>
            ))}
          </div>

          {/* Operations display */}
          <div className="operations-display">
            <AnimatePresence mode="wait">
              {currentOperation >= 0 && solution.operations[currentOperation] && (
                <motion.div
                  key={currentOperation}
                  className="operation-step"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="calculation">
                    <span className="operand">{solution.operations[currentOperation].left}</span>
                    <span 
                      className={`operator operator-${getOperatorColor(solution.operations[currentOperation].operator)}`}
                    >
                      {getOperatorSymbol(solution.operations[currentOperation].operator)}
                    </span>
                    <span className="operand">{solution.operations[currentOperation].right}</span>
                    
                    {showResult >= currentOperation && (
                      <motion.span
                        className="equals"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        = <span className="result">{Calculator.formatNumber(solution.operations[currentOperation].result)}</span>
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results history */}
          <div className="results-history">
            {solution.operations.map((op, index) => (
              showResult >= index && (
                <motion.div
                  key={index}
                  className="result-bubble"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {Calculator.formatNumber(op.result)}
                </motion.div>
              )
            ))}
          </div>

          {/* Final result */}
          {currentStep >= steps.length - 1 && (
            <motion.div
              className="final-result"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20
              }}
            >
              <span className="equals-24">= 24!</span>
              <div className="success-message">Brilliant!</div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};