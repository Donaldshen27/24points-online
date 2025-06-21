import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  compact?: boolean;
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  target, 
  compact = false,
  showLabel = false 
}) => {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  
  return (
    <div className={`progress-bar ${compact ? 'compact' : ''}`}>
      <div className="progress-track">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="progress-label">
          <span className="current">{current}</span>
          <span className="separator">/</span>
          <span className="target">{target}</span>
          <span className="percentage">({percentage}%)</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;