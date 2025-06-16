import { useState, useEffect } from 'react'
import socketService from '../../services/socketService'
import type { GameRoom } from '../../types/game.types'
import { GameState } from '../../types/game.types'
import { PlayerHand } from '../PlayerHand/PlayerHand'
import { InteractiveCenterTable } from '../InteractiveCenterTable/InteractiveCenterTable'
import './SpectatorView.css'

interface SpectatorViewProps {
  room: GameRoom
  onLeave: () => void
}

export function SpectatorView({ room, onLeave }: SpectatorViewProps) {
  const [viewingPlayerIndex, setViewingPlayerIndex] = useState<0 | 1>(0)
  const [spectatorCount, setSpectatorCount] = useState(0)

  useEffect(() => {
    // Listen for spectator count updates
    socketService.on('spectator-count-updated', (data: { count: number }) => {
      setSpectatorCount(data.count)
    })

    // Listen for game state updates
    socketService.on('spectator-room-updated', (_data: { room: GameRoom }) => {
      // Room is already updated via parent component
    })

    return () => {
      socketService.off('spectator-count-updated')
      socketService.off('spectator-room-updated')
    }
  }, [])

  const currentPlayer = room.players[viewingPlayerIndex]
  const otherPlayer = room.players[1 - viewingPlayerIndex]

  if (!currentPlayer || !otherPlayer) {
    return (
      <div className="spectator-view">
        <div className="spectator-error">
          <h2>Unable to spectate</h2>
          <p>Game room is not ready for spectating</p>
          <button onClick={onLeave}>Return to Lobby</button>
        </div>
      </div>
    )
  }

  return (
    <div className="spectator-view">
      <div className="spectator-header">
        <h2>🎮 Spectator Mode</h2>
        <div className="spectator-controls">
          <div className="view-toggle">
            <button 
              className={viewingPlayerIndex === 0 ? 'active' : ''}
              onClick={() => setViewingPlayerIndex(0)}
            >
              View {room.players[0]?.name || 'Player 1'}
            </button>
            <button 
              className={viewingPlayerIndex === 1 ? 'active' : ''}
              onClick={() => setViewingPlayerIndex(1)}
            >
              View {room.players[1]?.name || 'Player 2'}
            </button>
          </div>
          <div className="spectator-stats">
            <span>👁️ {spectatorCount} watching</span>
          </div>
          <button className="leave-btn" onClick={onLeave}>
            ← Leave
          </button>
        </div>
      </div>

      <div className="spectator-info">
        <p>Viewing from <strong>{currentPlayer.name}'s</strong> perspective</p>
        <p className="room-info">Room: {room.id} | Round: {room.currentRound || 0}</p>
      </div>

      <div className="game-area">
        {/* Opponent's hand (top) */}
        <div className="opponent-area">
          <PlayerHand 
            player={otherPlayer}
            isCurrentPlayer={false}
            isSpectatorView={true}
          />
        </div>

        {/* Game table */}
        <div className="table-area">
          {room.state === GameState.PLAYING && (
            <>
              <h3 className="game-status">Round {room.currentRound} - Players are finding solutions...</h3>
              <InteractiveCenterTable 
                cards={room.centerCards}
                onSolutionFound={() => {}}
                disabled={true}
                allowInteraction={false}
              />
            </>
          )}

          {room.state === GameState.SOLVING && (
            <div className="solving-view">
              <h3>A player is solving...</h3>
              <InteractiveCenterTable 
                cards={room.centerCards}
                onSolutionFound={() => {}}
                disabled={true}
                allowInteraction={false}
              />
            </div>
          )}

          {room.state === GameState.ROUND_END && (
            <div className="round-end-view">
              <h3>Round Complete!</h3>
              <p>Next round starting soon...</p>
            </div>
          )}

          {room.state === GameState.GAME_OVER && (
            <div className="game-over-view">
              <h2>🏆 Game Over!</h2>
              <div className="final-scores">
                <h4>Final Scores:</h4>
                {room.players.map(player => (
                  <div key={player.id} className="player-score">
                    <span>{player.name}:</span>
                    <span>{room.scores?.[player.id] || 0} points</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {room.state === GameState.WAITING && (
            <div className="waiting-view">
              <h3>Waiting for game to start...</h3>
              <p>Players are getting ready</p>
            </div>
          )}
        </div>

        {/* Current viewing player's hand (bottom) */}
        <div className="player-area">
          <PlayerHand 
            player={currentPlayer}
            isCurrentPlayer={false}
            isSpectatorView={true}
          />
        </div>
      </div>

      {/* Battle statistics */}
      <div className="battle-stats">
        <h3>Battle Statistics</h3>
        <div className="stats-grid">
          {room.players.map((player, idx) => (
            <div key={player.id} className={`player-stats ${viewingPlayerIndex === idx ? 'viewing' : ''}`}>
              <h4>{player.name}</h4>
              <div className="stat-item">
                <span>Cards:</span>
                <span className="stat-value">{player.deck.length}</span>
              </div>
              <div className="stat-item">
                <span>Score:</span>
                <span className="stat-value">{room.scores?.[player.id] || 0}</span>
              </div>
              {player.socketId ? (
                <span className="connection-status connected">🟢 Connected</span>
              ) : (
                <span className="connection-status disconnected">🔴 Disconnected</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}