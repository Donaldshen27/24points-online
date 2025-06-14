import React from 'react';
import './RoundTimer.css';

interface RoundTimerProps {
  timeRemaining: number;
  isUrgent?: boolean;
}

export const RoundTimer: React.FC<RoundTimerProps> = ({ timeRemaining, isUrgent = false }) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const getTimerClass = () => {
    if (isUrgent || timeRemaining <= 10) return 'urgent';
    if (timeRemaining <= 30) return 'warning';
    return 'normal';
  };

  const getCircleProgress = () => {
    // For a 2-minute timer, calculate percentage
    const maxTime = 120;
    const percentage = (timeRemaining / maxTime) * 100;
    return percentage;
  };

  return (
    <div className={`round-timer ${getTimerClass()}`}>
      <div className="timer-circle">
        <svg viewBox="0 0 100 100" className="timer-svg">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className="timer-progress"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - getCircleProgress() / 100)}`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="timer-text">
          <span className="timer-value">{formattedTime}</span>
          {isUrgent && <span className="timer-label">Hurry!</span>}
        </div>
      </div>
    </div>
  );
};