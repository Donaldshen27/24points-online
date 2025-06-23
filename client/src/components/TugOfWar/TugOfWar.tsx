import React from 'react';
import './TugOfWar.css';

interface TugOfWarProps {
  leftScore: number;  // 0-4
  rightScore: number; // 0-4
  leftName?: string;
  rightName?: string;
  isCurrentPlayerLeft?: boolean;
  leftIsBot?: boolean;
  rightIsBot?: boolean;
}

export const TugOfWar: React.FC<TugOfWarProps> = ({
  leftScore,
  rightScore,
  leftName = 'Player 1',
  rightName = 'Player 2',
  isCurrentPlayerLeft = true,
  leftIsBot = false,
  rightIsBot = false
}) => {
  // Calculate position based on scores
  // -4 = far left (right player winning), 0 = center, 4 = far right (left player winning)
  const position = leftScore - rightScore;
  
  // Calculate rope center position (as percentage)
  // Range: 10% to 90% of container width
  const ropePosition = 50 - (position * 10);
  
  // Determine who's winning for visual feedback
  const leftWinning = leftScore > rightScore;
  const rightWinning = rightScore > leftScore;
  const tied = leftScore === rightScore;

  return (
    <div className="tug-of-war-container">
      <div className="tug-of-war-game">
        {/* Left Player */}
        <div className={`player-figure left ${leftWinning ? 'winning' : ''} ${isCurrentPlayerLeft ? 'current' : ''}`}>
          <div className="player-avatar">
            <span className="player-emoji">{leftIsBot ? '🤖' : '🧑'}</span>
          </div>
          <div className="player-label">{leftName}</div>
          {/* Stars below player */}
          <div className="player-stars">
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} className={`star ${i < leftScore ? 'filled' : 'empty'}`}>
                {i < leftScore ? '⭐' : '☆'}
              </span>
            ))}
          </div>
        </div>

        {/* Rope and Flag */}
        <div className="rope-container">
          <div className="rope">
            <div 
              className="rope-center-flag"
              style={{ left: `${ropePosition}%` }}
            >
              <div className="flag">🚩</div>
            </div>
          </div>
          {/* Victory zones */}
          <div className="victory-zone left">
            <div className="zone-marker">🏁</div>
          </div>
          <div className="victory-zone right">
            <div className="zone-marker">🏁</div>
          </div>
          {/* Center line */}
          <div className="center-line"></div>
        </div>

        {/* Right Player */}
        <div className={`player-figure right ${rightWinning ? 'winning' : ''} ${!isCurrentPlayerLeft ? 'current' : ''}`}>
          <div className="player-avatar">
            <span className="player-emoji">{rightIsBot ? '🤖' : '👤'}</span>
          </div>
          <div className="player-label">{rightName}</div>
          {/* Stars below player */}
          <div className="player-stars">
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} className={`star ${i < rightScore ? 'filled' : 'empty'}`}>
                {i < rightScore ? '⭐' : '☆'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Status message */}
      <div className="tug-status">
        {tied && <span className="status-tied">Tied at center!</span>}
        {leftWinning && <span className="status-winning">{leftName} is pulling ahead!</span>}
        {rightWinning && <span className="status-winning">{rightName} is pulling ahead!</span>}
        {leftScore === 4 && <span className="status-victory">{leftName} wins! 🎉</span>}
        {rightScore === 4 && <span className="status-victory">{rightName} wins! 🎉</span>}
      </div>
    </div>
  );
};