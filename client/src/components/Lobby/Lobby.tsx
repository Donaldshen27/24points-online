import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import socketService from '../../services/socketService';
import type { GameRoom } from '../../types/game.types';
import { RoomTypeSelector } from '../RoomTypeSelector/RoomTypeSelector';
import './Lobby.css';

interface LobbyProps {
  onRoomJoined: (room: GameRoom, playerId: string, isReconnection?: boolean) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onRoomJoined }) => {
  const { t } = useTranslation();
  const [playerName, setPlayerName] = useState('');
  const [allRooms, setAllRooms] = useState<GameRoom[]>([]);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState('classic');
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    socketService.on('rooms-list', () => {
      // We don't use rooms-list anymore, just keeping the handler for compatibility
    });

    socketService.on('all-rooms-list', (roomsList: GameRoom[]) => {
      setAllRooms(roomsList);
    });

    socketService.on('rooms-updated', () => {
      // When rooms are updated, get the full list again
      socketService.emit('get-all-rooms');
    });

    socketService.on('room-created', (data: { room: GameRoom; playerId: string }) => {
      onRoomJoined(data.room, data.playerId, false);
    });

    socketService.on('room-joined', (data: { room: GameRoom; playerId: string; isSpectator?: boolean }) => {
      console.log('Lobby: room-joined event received:', data);
      // Only handle non-spectator joins here
      if (!data.isSpectator) {
        onRoomJoined(data.room, data.playerId, false);
      }
    });

    socketService.on('reconnected-to-game', (data: { room: GameRoom; playerId: string }) => {
      console.log('Reconnected to game:', data);
      onRoomJoined(data.room, data.playerId, true);
    });

    socketService.on('join-room-error', (data: { message: string }) => {
      alert(data.message);
    });

    socketService.emit('get-rooms');
    socketService.emit('get-all-rooms');

    return () => {
      socketService.off('rooms-list');
      socketService.off('all-rooms-list');
      socketService.off('rooms-updated');
      socketService.off('room-created');
      socketService.off('room-joined');
      socketService.off('reconnected-to-game');
      socketService.off('join-room-error');
    };
  }, [onRoomJoined]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert(t('lobby.errors.enterName'));
      return;
    }
    setIsCreating(true);
    socketService.createRoom(playerName, selectedRoomType);
  };

  const handleJoinRoom = (roomId: string) => {
    if (!playerName.trim()) {
      alert(t('lobby.errors.enterName'));
      return;
    }
    socketService.emit('join-room', { roomId, playerName });
  };

  const handleJoinWithCode = () => {
    if (!playerName.trim()) {
      alert(t('lobby.errors.enterName'));
      return;
    }
    if (!joinRoomId.trim()) {
      alert(t('lobby.errors.enterRoomCode'));
      return;
    }
    socketService.emit('join-room', { roomId: joinRoomId.toUpperCase(), playerName });
  };

  const handleSpectateRoom = (roomId: string) => {
    console.log('Spectate button clicked for room:', roomId);
    // Join as spectator - this will be handled differently in App.tsx
    const spectatorName = `Spectator-${Math.random().toString(36).substring(2, 7)}`;
    console.log('Emitting join-room as spectator:', { roomId, playerName: spectatorName, isSpectator: true });
    socketService.emit('join-room', { roomId, playerName: spectatorName, isSpectator: true });
  };

  return (
    <div className="lobby">
      <h1>{t('lobby.title')}</h1>
      
      <div className={`player-name-section ${!playerName && hasInteracted ? 'required' : ''}`}>
        <label htmlFor="username-input" className="username-label">
          <span className="label-text">{t('lobby.yourName')}</span>
          <span className="required-indicator">*</span>
        </label>
        <input
          id="username-input"
          type="text"
          placeholder={t('lobby.placeholders.enterName')}
          value={playerName}
          onChange={(e) => {
            setPlayerName(e.target.value);
            if (!hasInteracted) setHasInteracted(true);
          }}
          onBlur={() => setHasInteracted(true)}
          maxLength={20}
          className={!playerName && hasInteracted ? 'input-error' : ''}
          autoFocus
        />
        {!playerName && hasInteracted && (
          <span className="error-message">{t('lobby.errors.enterNameToContinue')}</span>
        )}
      </div>

      <RoomTypeSelector
        selectedType={selectedRoomType}
        onSelectType={setSelectedRoomType}
      />

      <div className="lobby-actions">
        <button 
          onClick={() => {
            setHasInteracted(true);
            handleCreateRoom();
          }} 
          disabled={!playerName.trim() || isCreating}
          className={`create-room-btn ${!playerName.trim() ? 'disabled-hint' : ''}`}
          title={!playerName.trim() ? t('lobby.tooltips.enterNameFirst') : ''}
        >
          {!playerName.trim() ? '🔒 ' : ''}{t('lobby.createRoom')}
        </button>

        <div className="join-with-code">
          <input
            type="text"
            placeholder={t('lobby.roomCode')}
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button 
            onClick={() => {
              setHasInteracted(true);
              handleJoinWithCode();
            }}
            disabled={!playerName.trim() || !joinRoomId.trim()}
            className={!playerName.trim() ? 'disabled-hint' : ''}
            title={!playerName.trim() ? t('lobby.tooltips.enterNameFirst') : !joinRoomId.trim() ? t('lobby.tooltips.enterRoomCode') : ''}
          >
            {!playerName.trim() ? '🔒 ' : ''}{t('lobby.joinRoom')}
          </button>
        </div>
      </div>

      <div className="all-ongoing-battles">
        <h2 className="battles-title">{t('lobby.ongoingBattles')}</h2>
        {allRooms.length === 0 ? (
          <p className="no-battles">{t('lobby.status.noBattles')}</p>
        ) : (
          <div className="battles-list">
            {allRooms.map((room) => {
              const player1 = room.players[0];
              const player2 = room.players[1];
              const isJoinable = room.players.length < 2 || room.players.some(p => !p.socketId);
              
              return (
                <div key={room.id} className="battle-card">
                  <div className="battle-header">
                    {player1 && player2 ? (
                      <div className="vs-title">
                        <span className="fighter-name fighter-1">{player1.name}</span>
                        <span className="vs-text">{t('lobby.status.vs')}</span>
                        <span className="fighter-name fighter-2">{player2.name}</span>
                      </div>
                    ) : player1 ? (
                      <div className="vs-title">
                        <span className="fighter-name fighter-1">{player1.name}</span>
                        <span className="vs-text">{t('lobby.status.vs')}</span>
                        <span className="fighter-name waiting">{t('lobby.status.waiting')}</span>
                      </div>
                    ) : (
                      <div className="vs-title">
                        <span className="waiting-text">{t('lobby.status.waitingForFighters')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="battle-info">
                    <span className="room-code">{t('lobby.status.roomCode', { code: room.id })}</span>
                    
                    {room.state === 'waiting' && (
                      <span className="battle-status waiting-status">
                        {room.players.length === 2 && room.players.every(p => p.isReady) 
                          ? t('lobby.status.readyToStart') 
                          : t('lobby.status.waitingForPlayers')}
                      </span>
                    )}
                    {(room.state === 'playing' || room.state === 'solving' || room.state === 'round_end' || room.state === 'replay') && (
                      <span className="battle-status active-status">{t('lobby.status.battleInProgress')}</span>
                    )}
                    {room.state === 'game_over' && (
                      <span className="battle-status ended-status">{t('lobby.status.battleEnded')}</span>
                    )}
                    
                    {room.players.some(p => !p.socketId) && (
                      <span className="reconnect-available">
                        {t('lobby.status.reconnectAvailable')}
                        {room.players.filter(p => !p.socketId).map(p => (
                          <span key={p.id} className="reconnect-name"> ({p.name})</span>
                        ))}
                      </span>
                    )}
                  </div>
                  
                  <div className="battle-actions">
                    {isJoinable && (
                      <button
                        onClick={() => {
                          setHasInteracted(true);
                          handleJoinRoom(room.id);
                        }}
                        disabled={!playerName.trim()}
                        className={`join-battle-btn ${!playerName.trim() ? 'disabled-hint' : ''}`}
                        title={!playerName.trim() ? t('lobby.tooltips.enterNameFirst') : ''}
                      >
                        {!playerName.trim() ? '🔒 ' : ''}{t('lobby.joinBattle')}
                      </button>
                    )}
                    {(room.state === 'playing' || room.state === 'solving' || room.state === 'round_end') && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSpectateRoom(room.id);
                        }}
                        className="spectate-btn"
                        title={t('lobby.tooltips.watchBattle')}
                        type="button"
                      >
                        {t('lobby.spectate')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};