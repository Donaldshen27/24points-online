import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import socketService from '../../services/socketService';
import type { GameRoom } from '../../types/game.types';
import './WaitingRoom.css';

interface WaitingRoomProps {
  room: GameRoom;
  playerId: string;
  onGameStart: () => void;
  onLeaveRoom: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ 
  room: initialRoom, 
  playerId, 
  onGameStart,
  onLeaveRoom 
}) => {
  const { t } = useTranslation();
  const [room, setRoom] = useState<GameRoom>(initialRoom);
  const [countdown, setCountdown] = useState<number | null>(null);
  const currentPlayer = room.players.find(p => p.id === playerId);
  const otherPlayer = room.players.find(p => p.id !== playerId);

  useEffect(() => {
    socketService.on('room-updated', (updatedRoom: GameRoom) => {
      setRoom(updatedRoom);
    });

    socketService.on('player-left', () => {
      setCountdown(null);
    });

    socketService.on('player-disconnected', () => {
      setCountdown(null);
    });

    socketService.on('game-starting', (data: { countdown: number }) => {
      setCountdown(data.countdown);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            if (prev === 1) {
              // Call onGameStart outside of setState
              setTimeout(() => onGameStart(), 0);
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    });

    return () => {
      socketService.off('room-updated');
      socketService.off('player-left');
      socketService.off('player-disconnected');
      socketService.off('game-starting');
    };
  }, [onGameStart]);

  const handleReadyToggle = () => {
    if (currentPlayer) {
      socketService.emit('player-ready', { isReady: !currentPlayer.isReady });
    }
  };

  const handleLeaveRoom = () => {
    socketService.emit('leave-room');
    onLeaveRoom();
  };

  return (
    <div className="waiting-room">
      <h2>{t('waitingRoom.roomCode', { code: room.id })}</h2>
      
      <div className="players-section">
        <div className="player-card">
          <h3>{currentPlayer?.name || 'You'}</h3>
          <div className={`ready-status ${currentPlayer?.isReady ? 'ready' : 'not-ready'}`}>
            {currentPlayer?.isReady ? t('waitingRoom.status.ready') : t('waitingRoom.status.notReady')}
          </div>
        </div>

        <div className="vs">{t('waitingRoom.vs')}</div>

        <div className="player-card">
          {otherPlayer ? (
            <>
              <h3>{otherPlayer.name}</h3>
              <div className={`ready-status ${otherPlayer.isReady ? 'ready' : 'not-ready'}`}>
                {otherPlayer.isReady ? t('waitingRoom.status.ready') : t('waitingRoom.status.notReady')}
              </div>
            </>
          ) : (
            <>
              <h3>{t('waitingRoom.status.waitingForOpponent')}</h3>
              <div className="ready-status waiting">{t('waitingRoom.status.waiting')}</div>
            </>
          )}
        </div>
      </div>

      {countdown !== null && (
        <div className="countdown">
          <h2>{t('waitingRoom.gameStarting', { seconds: countdown })}</h2>
        </div>
      )}

      <div className="room-actions">
        {room.players.length === 2 && !countdown && (
          <button 
            className={`ready-btn ${currentPlayer?.isReady ? 'ready' : ''}`}
            onClick={handleReadyToggle}
          >
            {currentPlayer?.isReady ? t('waitingRoom.buttons.cancelReady') : t('waitingRoom.buttons.ready')}
          </button>
        )}
        
        {countdown === null && (
          <button className="leave-btn" onClick={handleLeaveRoom}>
            {t('waitingRoom.buttons.leaveRoom')}
          </button>
        )}
      </div>

      {room.players.length === 1 && (
        <div className="waiting-message">
          <p>{t('waitingRoom.shareCode')}</p>
          <div className="room-code-display">{room.id}</div>
        </div>
      )}
    </div>
  );
};