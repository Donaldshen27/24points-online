import React, { useEffect, useState } from 'react';
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
            {playerName} got it right!
            {initialIsNewRecord && initialSolveTime && initialPreviousRecord && (
              <><br/>New record {initialSolveTime.toFixed(1)}s! Beats old record by {(initialPreviousRecord.timeSeconds - initialSolveTime).toFixed(1)}s</>
            )}
            {initialIsNewRecord && initialSolveTime && !initialPreviousRecord && (
              <><br/>Sets the new record of {initialSolveTime.toFixed(1)}s!</>
            )}
          </h1>
        </div>
      </div>
    </div>
  );
};