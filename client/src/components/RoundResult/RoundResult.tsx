import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  console.log('[RoundResult] RENDERING:', {
    winnerId,
    winnerName,
    reason,
    hideForReplay,
    isVisible,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);
    
    // Auto-continue after 3.5 seconds
    const timer = setTimeout(() => {
      onContinue();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onContinue]);

  const getResultMessage = () => {
    switch (reason) {
      case 'correct_solution':
        return t('roundResult.messages.foundSolution', { winner: winnerName || 'Winner' });
      case 'incorrect_solution':
        return t('roundResult.messages.incorrectSolution', { player: loserName || 'Player' });
      case 'no_solution':
        return t('roundResult.messages.noSolution');
      case 'timeout':
        return t('roundResult.messages.timeOut');
      default:
        return t('roundResult.messages.roundComplete');
    }
  };

  const renderSolution = () => {
    if (!solution || !solution.operations || solution.operations.length === 0) {
      return null;
    }

    return (
      <div className="solution-display">
        <h3>{t('roundResult.solution')}</h3>
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
          {t('roundResult.finalResult', { result: solution.result })}
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
              <span className="result-label">{t('roundResult.labels.winner')}</span>
              <span className="player-name">{winnerName || 'Player'}</span>
            </div>
            <div className="loser-info">
              <span className="result-label">{t('roundResult.labels.cardsGoTo')}</span>
              <span className="player-name">{loserName || 'Player'}</span>
            </div>
          </div>
        )}

        {solution && renderSolution()}

        <div className="result-footer">
          <p className="auto-continue">{t('roundResult.labels.nextRound')}</p>
          <button className="continue-button" onClick={onContinue}>
            {t('roundResult.continueNow')}
          </button>
        </div>
      </div>
    </div>
  );
};