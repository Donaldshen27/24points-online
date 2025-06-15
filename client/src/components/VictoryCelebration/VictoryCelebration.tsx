import React, { useEffect, useState } from 'react';
import './VictoryCelebration.css';

interface VictoryCelebrationProps {
  playerName: string;
  onComplete?: () => void;
}

export const VictoryCelebration: React.FC<VictoryCelebrationProps> = ({
  playerName,
  onComplete
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
        </div>
      </div>
    </div>
  );
};