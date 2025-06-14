import React, { useState, useEffect } from 'react';
import socketService from '../../services/socketService';
import type { GameRoom } from '../../types/game.types';
import './Lobby.css';

interface LobbyProps {
  onRoomJoined: (room: GameRoom, playerId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onRoomJoined }) => {
  const [playerName, setPlayerName] = useState('');
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    socketService.on('rooms-list', (roomsList: GameRoom[]) => {
      setRooms(roomsList);
    });

    socketService.on('rooms-updated', (roomsList: GameRoom[]) => {
      setRooms(roomsList);
    });

    socketService.on('room-created', (data: { room: GameRoom; playerId: string }) => {
      onRoomJoined(data.room, data.playerId);
    });

    socketService.on('room-joined', (data: { room: GameRoom; playerId: string }) => {
      onRoomJoined(data.room, data.playerId);
    });

    socketService.on('join-room-error', (data: { message: string }) => {
      alert(data.message);
    });

    socketService.emit('get-rooms');

    return () => {
      socketService.off('rooms-list');
      socketService.off('rooms-updated');
      socketService.off('room-created');
      socketService.off('room-joined');
      socketService.off('join-room-error');
    };
  }, [onRoomJoined]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    setIsCreating(true);
    socketService.emit('create-room', { playerName });
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

  return (
    <div className="lobby">
      <h1>24 Points Game Lobby</h1>
      
      <div className="player-name-section">
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={20}
        />
      </div>

      <div className="lobby-actions">
        <button 
          onClick={handleCreateRoom} 
          disabled={!playerName.trim() || isCreating}
          className="create-room-btn"
        >
          Create New Room
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
            onClick={handleJoinWithCode}
            disabled={!playerName.trim() || !joinRoomId.trim()}
          >
            Join Room
          </button>
        </div>
      </div>

      <div className="available-rooms">
        <h2>Available Rooms</h2>
        {rooms.length === 0 ? (
          <p>No rooms available. Create one!</p>
        ) : (
          <div className="rooms-list">
            {rooms.map((room) => (
              <div key={room.id} className="room-item">
                <div className="room-info">
                  <span className="room-id">Room: {room.id}</span>
                  <span className="player-count">
                    Players: {room.players.length}/2
                  </span>
                  {room.players[0] && (
                    <span className="host-name">
                      Host: {room.players[0].name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={!playerName.trim()}
                  className="join-btn"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};