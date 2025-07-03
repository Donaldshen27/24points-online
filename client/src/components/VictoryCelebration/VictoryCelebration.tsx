import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './VictoryCelebration.css';

interface VictoryCelebrationProps {
  playerName: string;
  onComplete?: () => void;
  isFirstSolve?: boolean;
  solveTime?: number;
  isNewRecord?: boolean;
  previousRecord?: {
    username: string;
    timeSeconds: number;
  } | null;
}

export const VictoryCelebration: React.FC<VictoryCelebrationProps> = ({
  playerName,
  onComplete,
  isFirstSolve = false,
  solveTime,
  isNewRecord = false,
  previousRecord
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  
  // Store the initial values to prevent them from changing during the celebration
  const [initialSolveTime] = useState(solveTime);
  const [initialIsNewRecord] = useState(isNewRecord);
  const [initialPreviousRecord] = useState(previousRecord);
  
  console.log('[VictoryCelebration] RENDERING:', {
    playerName,
    isFirstSolve,
    solveTime,
    showFirstSolve: isFirstSolve && solveTime,
    isNewRecord,
    previousRecord,
    isVisible,
    timestamp: new Date().toISOString(),
    willShowNewRecord: isNewRecord && solveTime && previousRecord,
    willShowFirstRecord: isNewRecord && solveTime && !previousRecord
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 300); // Allow fade out animation
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`victory-celebration ${isVisible ? 'visible' : ''}`}>
      <div className="victory-message">
        <div className="message-content">
          <h1>
            {t('game.victory.gotItRight', { player: playerName })}
            {initialIsNewRecord && initialSolveTime && initialPreviousRecord && (
              <><br/>{t('game.victory.newRecordBeats', { 
                time: initialSolveTime.toFixed(1), 
                difference: (initialPreviousRecord.timeSeconds - initialSolveTime).toFixed(1) 
              })}</>
            )}
            {initialIsNewRecord && initialSolveTime && !initialPreviousRecord && (
              <><br/>{t('game.victory.setsNewRecord', { time: initialSolveTime.toFixed(1) })}</>
            )}
          </h1>
        </div>
      </div>
    </div>
  );
};