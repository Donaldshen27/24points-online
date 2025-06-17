import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        <h2>{isVictory ? t('disconnect.victoryByForfeit') : t('disconnect.opponentDisconnected')}</h2>
        <p className="disconnect-message">
          {isVictory 
            ? t('disconnect.messages.disconnectedTooLong', { opponent: opponentName })
            : t('disconnect.messages.leftGame', { opponent: opponentName })}
        </p>
        <p className="disconnect-timer">
          {isVictory 
            ? t('disconnect.messages.showingVictory', { seconds: timeRemaining })
            : t('disconnect.messages.returningToLobby', { seconds: timeRemaining })}
        </p>
        <button className="return-button" onClick={onReturnToLobby}>
          {isVictory ? t('disconnect.buttons.viewResults') : t('disconnect.buttons.returnToLobby')}
        </button>
      </div>
    </div>
  );
};

export default DisconnectNotification;