import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import socketService from '../../services/socketService';
import { BadgeShowcase } from '../Badges/BadgeShowcase';
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

  console.log('[WaitingRoom] Component mounted:', {
    roomId: room?.id,
    isSoloPractice: room?.isSoloPractice,
    players: room?.players?.map(p => ({ id: p.id, name: p.name, isReady: p.isReady })),
    currentPlayer: currentPlayer ? { id: currentPlayer.id, name: currentPlayer.name, isReady: currentPlayer.isReady } : null,
    otherPlayer: otherPlayer ? { id: otherPlayer.id, name: otherPlayer.name, isReady: otherPlayer.isReady } : null
  });

  useEffect(() => {
    socketService.on('room-updated', (updatedRoom: GameRoom) => {
      console.log('[WaitingRoom] Room updated:', {
        roomId: updatedRoom?.id,
        isSoloPractice: updatedRoom?.isSoloPractice,
        players: updatedRoom?.players?.map(p => ({ id: p.id, name: p.name, isReady: p.isReady }))
      });
      setRoom(updatedRoom);
    });

    socketService.on('player-left', () => {
      setCountdown(null);
    });

    socketService.on('player-disconnected', () => {
      setCountdown(null);
    });

    socketService.on('game-starting', (data: { countdown: number }) => {
      console.log('[WaitingRoom] Game starting with countdown:', data.countdown);
      setCountdown(data.countdown);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            if (prev === 1) {
              console.log('[WaitingRoom] Countdown finished, calling onGameStart');
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
      <h2 className="waiting-room-title">
        <span className="title-full">{t('waitingRoom.roomCode', { code: room.id })}</span>
        <span className="title-mobile">{room.id}</span>
      </h2>
      
      <div className="players-section">
        <div className="player-card">
          <h3>{currentPlayer?.name || 'You'}</h3>
          <div className={`ready-status ${currentPlayer?.isReady ? 'ready' : 'not-ready'}`}>
            {currentPlayer?.isReady ? t('waitingRoom.status.ready') : t('waitingRoom.status.notReady')}
          </div>
          {currentPlayer && (
            <BadgeShowcase userId={currentPlayer.id} compact={true} />
          )}
        </div>

        <div className="vs">
          <span className="vs-full">{t('waitingRoom.vs')}</span>
          <span className="vs-mobile">vs</span>
        </div>

        <div className="player-card">
          {otherPlayer ? (
            <>
              <h3>{otherPlayer.name}</h3>
              <div className={`ready-status ${otherPlayer.isReady ? 'ready' : 'not-ready'}`}>
                {otherPlayer.isReady ? t('waitingRoom.status.ready') : t('waitingRoom.status.notReady')}
              </div>
              <BadgeShowcase userId={otherPlayer.id} compact={true} />
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
          <h2>
            <span className="countdown-full">{t('waitingRoom.gameStarting', { seconds: countdown })}</span>
            <span className="countdown-mobile">{countdown}</span>
          </h2>
        </div>
      )}

      <div className="room-actions">
        {room.players.length === 2 && !countdown && (
          <button 
            className={`ready-btn ${currentPlayer?.isReady ? 'ready' : ''}`}
            onClick={handleReadyToggle}
          >
            <span className="btn-text-full">{currentPlayer?.isReady ? t('waitingRoom.buttons.cancelReady') : t('waitingRoom.buttons.ready')}</span>
            <span className="btn-text-mobile">{currentPlayer?.isReady ? '✓' : 'Ready'}</span>
          </button>
        )}
        
        {countdown === null && (
          <button className="leave-btn" onClick={handleLeaveRoom}>
            <span className="btn-text-full">{t('waitingRoom.buttons.leaveRoom')}</span>
            <span className="btn-text-mobile">Leave</span>
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