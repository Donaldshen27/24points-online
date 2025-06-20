import React, { useEffect, useState } from 'react';
import './VictoryCelebration.css';

interface VictoryCelebrationProps {
  playerName: string;
  onComplete?: () => void;
  isFirstSolve?: boolean;
  solveTime?: number;
}

export const VictoryCelebration: React.FC<VictoryCelebrationProps> = ({
  playerName,
  onComplete,
  isFirstSolve = false,
  solveTime
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 300); // Allow fade out animation
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`victory-celebration ${isVisible ? 'visible' : ''}`}>
      <div className="victory-message">
        <div className="message-content">
          <h1>{playerName} got it right!</h1>
          {isFirstSolve && solveTime && (
            <p className="first-solve-text">{playerName} did it first in {solveTime.toFixed(1)}s!</p>
          )}
        </div>
      </div>
    </div>
  );
};