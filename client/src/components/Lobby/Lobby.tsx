import React, { useState, useEffect } from 'react';
import socketService from '../../services/socketService';
import type { GameRoom } from '../../types/game.types';
import { RoomTypeSelector } from '../RoomTypeSelector/RoomTypeSelector';
import './Lobby.css';

interface LobbyProps {
  onRoomJoined: (room: GameRoom, playerId: string, isReconnection?: boolean) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onRoomJoined }) => {
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
      alert('Please enter your name');
      return;
    }
    setIsCreating(true);
    socketService.createRoom(playerName, selectedRoomType);
  };

  const handleJoinRoom = (roomId: string) => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    socketService.emit('join-room', { roomId, playerName });
  };

  const handleJoinWithCode = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!joinRoomId.trim()) {
      alert('Please enter room code');
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
      <h1>24 Points Arena</h1>
      
      <div className={`player-name-section ${!playerName && hasInteracted ? 'required' : ''}`}>
        <label htmlFor="username-input" className="username-label">
          <span className="label-text">Your Name</span>
          <span className="required-indicator">*</span>
        </label>
        <input
          id="username-input"
          type="text"
          placeholder="Enter your name to start playing"
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
          <span className="error-message">Please enter your name to continue</span>
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
          title={!playerName.trim() ? 'Enter your name first' : ''}
        >
          {!playerName.trim() ? '🔒 ' : ''}Create New Room
        </button>

        <div className="join-with-code">
          <input
            type="text"
            placeholder="Room Code"
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
            title={!playerName.trim() ? 'Enter your name first' : !joinRoomId.trim() ? 'Enter room code' : ''}
          >
            {!playerName.trim() ? '🔒 ' : ''}Join Room
          </button>
        </div>
      </div>

      <div className="all-ongoing-battles">
        <h2 className="battles-title">🔥 ALL ONGOING BATTLES 🔥</h2>
        {allRooms.length === 0 ? (
          <p className="no-battles">No battles in progress. Be the first to start one!</p>
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
                        <span className="vs-text">VS</span>
                        <span className="fighter-name fighter-2">{player2.name}</span>
                      </div>
                    ) : player1 ? (
                      <div className="vs-title">
                        <span className="fighter-name fighter-1">{player1.name}</span>
                        <span className="vs-text">VS</span>
                        <span className="fighter-name waiting">???</span>
                      </div>
                    ) : (
                      <div className="vs-title">
                        <span className="waiting-text">Waiting for fighters...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="battle-info">
                    <span className="room-code">ROOM CODE: {room.id}</span>
                    
                    {room.state === 'waiting' && (
                      <span className="battle-status waiting-status">
                        {room.players.length === 2 && room.players.every(p => p.isReady) 
                          ? '🎮 Ready to Start' 
                          : '⏳ Waiting for Players'}
                      </span>
                    )}
                    {(room.state === 'playing' || room.state === 'solving' || room.state === 'round_end' || room.state === 'replay') && (
                      <span className="battle-status active-status">⚔️ BATTLE IN PROGRESS</span>
                    )}
                    {room.state === 'game_over' && (
                      <span className="battle-status ended-status">🏆 Battle Ended</span>
                    )}
                    
                    {room.players.some(p => !p.socketId) && (
                      <span className="reconnect-available">
                        🔄 Reconnect Available
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
                        title={!playerName.trim() ? 'Enter your name first' : ''}
                      >
                        {!playerName.trim() ? '🔒 ' : ''}JOIN BATTLE
                      </button>
                    )}
                    {(room.state === 'playing' || room.state === 'solving' || room.state === 'round_end') && (
                      <button
                        onClick={() => handleSpectateRoom(room.id)}
                        className="spectate-btn"
                        title="Watch this battle live!"
                      >
                        👁️ SPECTATE
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