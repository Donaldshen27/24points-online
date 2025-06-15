import React, { useEffect, useState } from 'react';
import type { Solution } from '../../types/game.types';
import './RoundResult.css';

interface RoundResultProps {
  winnerId: string | null;
  winnerName?: string;
  loserId: string | null;
  loserName?: string;
  solution?: Solution;
  reason: 'correct_solution' | 'incorrect_solution' | 'no_solution' | 'timeout';
  onContinue: () => void;
  hideForReplay?: boolean;
}

export const RoundResult: React.FC<RoundResultProps> = ({
  winnerId,
  winnerName,
  loserId,
  loserName,
  solution,
  reason,
  onContinue,
  hideForReplay = false
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto-continue after 5 seconds
    const timer = setTimeout(() => {
      onContinue();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  const getResultMessage = () => {
    switch (reason) {
      case 'correct_solution':
        return `${winnerName || 'Winner'} found the solution!`;
      case 'incorrect_solution':
        return `${loserName || 'Player'}'s solution was incorrect!`;
      case 'no_solution':
        return 'No solution exists for these cards!';
      case 'timeout':
        return 'Time ran out!';
      default:
        return 'Round complete!';
    }
  };

  const renderSolution = () => {
    if (!solution || !solution.operations || solution.operations.length === 0) {
      return null;
    }

    return (
      <div className="solution-display">
        <h3>Solution:</h3>
        <div className="solution-steps">
          {solution.operations.map((op, index) => (
            <div key={index} className="solution-step">
              <span className="step-number">{index + 1}.</span>
              <span className="step-expression">
                {op.left} {op.operator} {op.right} = {op.result}
              </span>
            </div>
          ))}
        </div>
        <div className="solution-final">
          Final Result: <strong>{solution.result}</strong>
        </div>
      </div>
    );
  };

  const getResultClass = () => {
    if (reason === 'correct_solution') return 'success';
    if (reason === 'incorrect_solution') return 'failure';
    return 'neutral';
  };

  // Don't render if we're showing the replay
  if (hideForReplay && reason === 'correct_solution' && solution && solution.operations && solution.operations.length > 0) {
    return null;
  }

  return (
    <div className={`round-result-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`round-result-content ${getResultClass()}`}>
        <div className="result-header">
          <h2>{getResultMessage()}</h2>
        </div>

        {winnerId && loserId && (
          <div className="result-players">
            <div className="winner-info">
              <span className="result-label">Winner:</span>
              <span className="player-name">{winnerName || 'Player'}</span>
            </div>
            <div className="loser-info">
              <span className="result-label">Cards go to:</span>
              <span className="player-name">{loserName || 'Player'}</span>
            </div>
          </div>
        )}

        {solution && renderSolution()}

        <div className="result-footer">
          <p className="auto-continue">Next round starts in 5 seconds...</p>
          <button className="continue-button" onClick={onContinue}>
            Continue Now
          </button>
        </div>
      </div>
    </div>
  );
};