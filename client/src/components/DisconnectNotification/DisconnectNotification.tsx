import React, { useEffect, useState } from 'react';
import './DisconnectNotification.css';

interface DisconnectNotificationProps {
  opponentName: string;
  onReturnToLobby: () => void;
  timeoutSeconds?: number;
  isVictory?: boolean;
}

const DisconnectNotification: React.FC<DisconnectNotificationProps> = ({
  opponentName,
  onReturnToLobby,
  timeoutSeconds = 30,
  isVictory = false
}) => {
  const [timeRemaining, setTimeRemaining] = useState(timeoutSeconds);
  
  console.log('DisconnectNotification mounted, opponent:', opponentName, 'isVictory:', isVictory);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onReturnToLobby();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onReturnToLobby]);

  return (
    <div className="disconnect-overlay">
      <div className="disconnect-modal">
        <div className="disconnect-icon">{isVictory ? '🏆' : '⚠️'}</div>
        <h2>{isVictory ? 'Victory by Forfeit!' : 'Opponent Disconnected'}</h2>
        <p className="disconnect-message">
          {isVictory 
            ? `${opponentName} disconnected for too long. You won automatically!`
            : `${opponentName} has left the game.`}
        </p>
        <p className="disconnect-timer">
          {isVictory 
            ? `Showing victory screen in ${timeRemaining} seconds...`
            : `Returning to lobby in ${timeRemaining} seconds...`}
        </p>
        <button className="return-button" onClick={onReturnToLobby}>
          {isVictory ? 'View Results Now' : 'Return to Lobby Now'}
        </button>
      </div>
    </div>
  );
};

export default DisconnectNotification;