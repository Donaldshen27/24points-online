import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import socketService from '../../services/socketService';
import type { GameRoom } from '../../types/game.types';
import type { AuthUser } from '../../services/authService';
import { guestService } from '../../services/guestService';
import { RoomTypeSelector } from '../RoomTypeSelector/RoomTypeSelector';
import './Lobby.css';
import './Lobby.mobile.css';

interface LobbyProps {
  onRoomJoined: (room: GameRoom, playerId: string, isReconnection?: boolean) => void;
  authUser?: AuthUser | null;
  onRankedClick?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onRoomJoined, authUser, onRankedClick }) => {
  const { t } = useTranslation();
  const [playerName, setPlayerName] = useState(() => {
    // Priority: authenticated user > cached guest username > empty
    if (authUser?.username) {
      return authUser.username;
    }
    return guestService.getGuestUsername() || '';
  });
  const [allRooms, setAllRooms] = useState<GameRoom[]>([]);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState('classic');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isSoloPractice, setIsSoloPractice] = useState(false);
  const [showQuickGamePopup, setShowQuickGamePopup] = useState(false);
  const [popupSelectedMode, setPopupSelectedMode] = useState('classic');

  useEffect(() => {
    // If user is authenticated, use their username
    if (authUser?.username) {
      setPlayerName(authUser.username);
      // Clear guest username when authenticated
      guestService.clearGuestUsername();
    }
  }, [authUser]);
  
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

    socketService.on('room-creation-error', (data: { message: string }) => {
      setIsCreating(false);
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
      socketService.off('room-creation-error');
    };
  }, [onRoomJoined]);

  const handleCreateRoom = () => {
    console.log('handleCreateRoom called', { playerName, selectedRoomType, isSoloPractice });
    if (!playerName.trim()) {
      alert(t('lobby.errors.enterName'));
      return;
    }
    // Save guest username if not authenticated
    if (!authUser) {
      guestService.setGuestUsername(playerName);
    }
    setIsCreating(true);
    console.log('Creating room with:', { playerName, selectedRoomType, isSoloPractice });
    socketService.createRoom(playerName, selectedRoomType, isSoloPractice);
  };

  const handleModeClick = (modeId: string) => {
    setPopupSelectedMode(modeId);
    setSelectedRoomType(modeId);
    setShowQuickGamePopup(true);
  };

  const handleJoinRoom = (roomId: string) => {
    if (!playerName.trim()) {
      alert(t('lobby.errors.enterName'));
      return;
    }
    // Save guest username if not authenticated
    if (!authUser) {
      guestService.setGuestUsername(playerName);
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
    // Save guest username if not authenticated
    if (!authUser) {
      guestService.setGuestUsername(playerName);
    }
    socketService.emit('join-room', { roomId: joinRoomId.toUpperCase(), playerName });
  };

  const handleSpectateRoom = (roomId: string) => {
    console.log('Spectate button clicked for room:', roomId);
    const spectatorName = `Spectator-${Math.random().toString(36).substring(2, 7)}`;
    console.log('Emitting join-room as spectator:', { roomId, playerName: spectatorName, isSpectator: true });
    socketService.emit('join-room', { roomId, playerName: spectatorName, isSpectator: true });
  };

  const getGameStatus = (room: GameRoom) => {
    if (room.state === 'waiting') {
      if (room.players.length === 2 && room.players.every(p => p.isReady)) {
        return { status: 'ready', text: t('lobby.status.readyToStart'), className: 'status-waiting' };
      }
      return { status: 'waiting', text: t('lobby.status.waitingForPlayers'), className: 'status-waiting' };
    }
    if (['playing', 'solving', 'round_end', 'replay'].includes(room.state)) {
      return { status: 'active', text: t('lobby.status.battleInProgress'), className: 'status-active' };
    }
    if (room.state === 'game_over') {
      return { status: 'ended', text: t('lobby.status.battleEnded'), className: 'status-ended' };
    }
    return { status: 'unknown', text: '', className: '' };
  };

  return (
    <div className="lobby">
      
      {/* Player Setup Section */}
      <div className="player-setup">
        <div className="player-name-section">
          <label htmlFor="username-input" className="player-name-label">
            {t('lobby.yourName')}
          </label>
          <input
            id="username-input"
            type="text"
            placeholder={t('lobby.placeholders.enterName')}
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              if (!hasInteracted) setHasInteracted(true);
              // Save guest username on change if not authenticated
              if (!authUser && e.target.value.trim()) {
                guestService.setGuestUsername(e.target.value.trim());
              }
            }}
            onBlur={() => setHasInteracted(true)}
            maxLength={20}
            className="player-name-input"
            autoFocus
            aria-label="Enter your name to play 24 Points (24points) online game"
            disabled={!!authUser}
          />
          {!authUser && (
            <div className="username-hint">
              💡 {t('lobby.usernameHint')}
            </div>
          )}
          {!playerName && hasInteracted && (
            <span className="error-message">{t('lobby.errors.enterNameToContinue')}</span>
          )}
        </div>

        {/* Room Type Selection */}
        <div className="room-type-section">
          <RoomTypeSelector
            selectedType={selectedRoomType}
            onSelectType={setSelectedRoomType}
            onModeClick={handleModeClick}
          />
        </div>

        {/* Quick Game Popup */}
        {showQuickGamePopup && (
          <div className="quick-game-popup-overlay" onClick={() => setShowQuickGamePopup(false)}>
            <div className="quick-game-popup" onClick={(e) => e.stopPropagation()}>
              <button 
                className="popup-close-btn"
                onClick={() => setShowQuickGamePopup(false)}
                aria-label="Close popup"
              >
                ✕
              </button>
              
              <h3 className="popup-title">
                {popupSelectedMode === 'classic' && t('roomTypeSelector.modes.classic.name', 'Classic Mode')}
                {popupSelectedMode === 'super' && t('roomTypeSelector.modes.super.name', 'Super Mode')}
                {popupSelectedMode === 'extended' && t('roomTypeSelector.modes.extended.name', 'Extended Range')}
              </h3>

              <div className="popup-game-options">
                <div className="game-option-card">
                  <div className="option-icon">⚡</div>
                  <h3 className="option-title">
                    <span className="title-full">{t('lobby.quickPlay', 'Quick Play')}</span>
                    <span className="title-mobile">Quick</span>
                  </h3>
                  <p className="option-description">
                    <span className="desc-full">{t('lobby.quickPlayDesc', 'Create a new game instantly')}</span>
                    <span className="desc-mobile">New game</span>
                  </p>
                  <button 
                    onClick={() => {
                      setHasInteracted(true);
                      handleCreateRoom();
                      setShowQuickGamePopup(false);
                    }} 
                    disabled={!playerName.trim() || isCreating}
                    className="quick-play-btn"
                    aria-label="Create a new 24 Points (24points) multiplayer game room"
                  >
                    <span className="btn-text-full">{isCreating ? t('lobby.creating', 'Creating...') : t('lobby.createRoom')}</span>
                    <span className="btn-text-mobile">{isCreating ? '...' : 'Create'}</span>
                  </button>
                  <div className="solo-practice-wrapper">
                    <label className="solo-practice-label">
                      <input
                        type="checkbox"
                        checked={isSoloPractice}
                        onChange={(e) => setIsSoloPractice(e.target.checked)}
                        className="solo-practice-checkbox"
                      />
                      <span>{t('lobby.soloPractice')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Options */}
        <div className="game-options">
          {/* Ranked Matchmaking */}
          <div className="game-option-card ranked-option">
            <div className="option-icon">🎯</div>
            <h3 className="option-title">
              <span className="title-full">{t('lobby.rankedPlay', 'Ranked Play')}</span>
              <span className="title-mobile">Ranked</span>
            </h3>
            <p className="option-description">
              <span className="desc-full">{t('lobby.rankedPlayDesc', 'Compete in ranked matches')}</span>
              <span className="desc-mobile">Compete</span>
            </p>
            <button 
              onClick={onRankedClick}
              className="ranked-play-btn"
              aria-label="Play ranked 24 Points matches"
            >
              <span className="btn-text-full">{t('lobby.findMatch', 'Find Match')}</span>
              <span className="btn-text-mobile">Play</span>
            </button>
          </div>

          {/* Quick Play */}
          <div className="game-option-card">
            <div className="option-icon">⚡</div>
            <h3 className="option-title">
              <span className="title-full">{t('lobby.quickPlay', 'Quick Play')}</span>
              <span className="title-mobile">Quick</span>
            </h3>
            <p className="option-description">
              <span className="desc-full">{t('lobby.quickPlayDesc', 'Create a new game instantly')}</span>
              <span className="desc-mobile">New game</span>
            </p>
            <button 
              onClick={() => {
                setHasInteracted(true);
                handleCreateRoom();
              }} 
              disabled={!playerName.trim() || isCreating}
              className="quick-play-btn"
              aria-label="Create a new 24 Points (24points) multiplayer game room"
            >
              <span className="btn-text-full">{isCreating ? t('lobby.creating', 'Creating...') : t('lobby.createRoom')}</span>
              <span className="btn-text-mobile">{isCreating ? '...' : 'Create'}</span>
            </button>
            <div className="solo-practice-wrapper">
              <label className="solo-practice-label">
                <input
                  type="checkbox"
                  checked={isSoloPractice}
                  onChange={(e) => setIsSoloPractice(e.target.checked)}
                  className="solo-practice-checkbox"
                />
                <span>{t('lobby.soloPractice')}</span>
              </label>
            </div>
          </div>

          {/* Join with Code */}
          <div className="game-option-card">
            <div className="option-icon">🔑</div>
            <h3 className="option-title">
              <span className="title-full">{t('lobby.joinWithCode', 'Join with Code')}</span>
              <span className="title-mobile">Join</span>
            </h3>
            <p className="option-description">
              <span className="desc-full">{t('lobby.joinWithCodeDesc', 'Enter a room code to join')}</span>
              <span className="desc-mobile">Enter code</span>
            </p>
            <div className="join-code-section">
              <input
                type="text"
                placeholder={t('lobby.roomCode')}
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                maxLength={6}
                className="code-input"
                aria-label="Enter 24 Points (24points) game room code"
              />
              <button 
                onClick={() => {
                  setHasInteracted(true);
                  handleJoinWithCode();
                }}
                disabled={!playerName.trim() || !joinRoomId.trim()}
                className="join-code-btn"
                aria-label="Join existing 24 Points (24points) game room with code"
              >
                <span className="btn-text-full">{t('lobby.joinRoom')}</span>
                <span className="btn-text-mobile">Join</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Games Section */}
      <div className="active-games-section">
        <div className="section-header">
          <h2 className="section-title">
            {t('lobby.activeGames', 'Active Games')}
            {allRooms.length > 0 && (
              <span className="live-indicator">
                <span className="live-dot"></span>
                LIVE
              </span>
            )}
          </h2>
        </div>

        <div className="games-grid">
          {allRooms.length === 0 ? (
            <p className="no-games">{t('lobby.status.noBattles')}</p>
          ) : (
            allRooms.map((room) => {
              const player1 = room.players[0];
              const player2 = room.players[1];
              const isJoinable = room.players.length < 2 || room.players.some(p => !p.socketId);
              const gameStatus = getGameStatus(room);
              
              return (
                <div 
                  key={room.id} 
                  className="game-card"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                  }}
                >
                  {/* Player Match Display */}
                  <div className="player-match">
                    <div className="player-info">
                      {player1 ? (
                        <>
                          <div className="player-avatar">
                            {player1.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="player-name">{player1.name}</span>
                        </>
                      ) : (
                        <span className="waiting-player">{t('lobby.status.waiting')}</span>
                      )}
                    </div>
                    
                    <span className="vs-divider">VS</span>
                    
                    <div className="player-info">
                      {player2 ? (
                        <>
                          <span className="player-name">{player2.name}</span>
                          <div className="player-avatar">
                            {player2.name.charAt(0).toUpperCase()}
                          </div>
                        </>
                      ) : (
                        <span className="waiting-player">{t('lobby.status.waiting')}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Game Meta Info */}
                  <div className="game-meta">
                    <div className="room-code-modern">
                      <span className="room-code-icon">#</span>
                      <span className="room-code-value">{room.id}</span>
                      <button 
                        className="room-code-copy"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(room.id);
                          const button = e.currentTarget;
                          button.classList.add('copied');
                          setTimeout(() => button.classList.remove('copied'), 2000);
                        }}
                        title={t('lobby.copyRoomCode')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        <svg className="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                    </div>
                    <span className={`game-status ${gameStatus.className}`}>
                      {gameStatus.text}
                    </span>
                  </div>
                  
                  {/* Reconnect Info */}
                  {room.players.some(p => !p.socketId) && (
                    <div className="reconnect-info">
                      <span className="reconnect-available">
                        {t('lobby.status.reconnectAvailable')}
                        {room.players.filter(p => !p.socketId).map(p => (
                          <span key={p.id} className="reconnect-name"> ({p.name})</span>
                        ))}
                      </span>
                    </div>
                  )}
                  
                  {/* Game Actions */}
                  <div className="game-actions">
                    {isJoinable && (
                      <button
                        onClick={() => {
                          setHasInteracted(true);
                          handleJoinRoom(room.id);
                        }}
                        disabled={!playerName.trim()}
                        className="action-btn join-game-btn"
                      >
                        {t('lobby.joinBattle')}
                      </button>
                    )}
                    {['playing', 'solving', 'round_end'].includes(room.state) && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSpectateRoom(room.id);
                        }}
                        className="action-btn spectate-game-btn"
                      >
                        {t('lobby.spectate')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};