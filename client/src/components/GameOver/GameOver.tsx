import React, { useState, useEffect } from 'react';
import socketService from '../../services/socketService';
import type { GameRoom } from '../../types/game.types';
import './GameOver.css';

interface GameOverProps {
  gameState: GameRoom;
  playerId: string;
  onRematch: () => void;
  onLeaveGame: () => void;
}

interface GameStats {
  totalRounds: number;
  playerWins: number;
  opponentWins: number;
  avgSolveTime?: number;
}

export const GameOver: React.FC<GameOverProps> = ({
  gameState,
  playerId,
  onRematch,
  onLeaveGame
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const opponent = gameState.players.find(p => p.id !== playerId);

  const playerScore = gameState.scores[playerId] || 0;
  const opponentScore = opponent ? (gameState.scores[opponent.id] || 0) : 0;
  const isWinner = (currentPlayer?.points || 0) >= 4;

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
    
    const socket = socketService.getSocket();
    if (!socket) return;
    
    // Listen for opponent rematch request
    const handleOpponentRematch = () => {
      setOpponentWantsRematch(true);
    };
    
    // Listen for rematch started
    const handleRematchStarted = () => {
      onRematch();
    };
    
    socket.on('opponent-wants-rematch', handleOpponentRematch);
    socket.on('rematch-started', handleRematchStarted);
    
    return () => {
      socket.off('opponent-wants-rematch', handleOpponentRematch);
      socket.off('rematch-started', handleRematchStarted);
    };
  }, [onRematch]);

  const handleRematch = () => {
    setRematchRequested(true);
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('request-rematch');
    }
  };

  const getGameStats = (): GameStats => {
    return {
      totalRounds: gameState.currentRound,
      playerWins: playerScore,
      opponentWins: opponentScore,
    };
  };

  const stats = getGameStats();

  return (
    <div className={`game-over-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`game-over-content ${isWinner ? 'victory' : 'defeat'}`}>
        {/* Header */}
        <div className="game-over-header">
          <h1>{isWinner ? '🎉 Victory! 🎉' : '😢 Defeat 😢'}</h1>
          <p className="game-over-subtitle">
            {isWinner ? 'Congratulations! You won the game!' : 'Better luck next time!'}
          </p>
        </div>

        {/* Final Score */}
        <div className="final-score-section">
          <h2>Final Score</h2>
          <div className="score-display">
            <div className={`player-score ${isWinner ? 'winner' : 'loser'}`}>
              <span className="player-name">{currentPlayer?.name || 'You'}</span>
              <span className="score-value">{playerScore}</span>
            </div>
            <div className="score-separator">-</div>
            <div className={`player-score ${!isWinner ? 'winner' : 'loser'}`}>
              <span className="player-name">{opponent?.name || 'Opponent'}</span>
              <span className="score-value">{opponentScore}</span>
            </div>
          </div>
        </div>

        {/* Game Statistics */}
        <div className="game-stats-section">
          <h3>Match Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Rounds</span>
              <span className="stat-value">{stats.totalRounds}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Rounds Won</span>
              <span className="stat-value">{stats.playerWins}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Rounds Lost</span>
              <span className="stat-value">{stats.opponentWins}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Win Rate</span>
              <span className="stat-value">
                {stats.totalRounds > 0 
                  ? Math.round((stats.playerWins / stats.totalRounds) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Final Card Count */}
        <div className="final-cards-section">
          <h3>Final Card Count</h3>
          <div className="card-counts">
            <div className="card-count-item">
              <span className="player-name">{currentPlayer?.name || 'You'}</span>
              <span className="card-count">{currentPlayer?.deck.length || 0} cards</span>
            </div>
            <div className="card-count-item">
              <span className="player-name">{opponent?.name || 'Opponent'}</span>
              <span className="card-count">{opponent?.deck.length || 0} cards</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="game-over-actions">
          {!rematchRequested ? (
            <button 
              className="rematch-button primary-button"
              onClick={handleRematch}
            >
              Request Rematch
            </button>
          ) : (
            <div className="rematch-status">
              <p>Waiting for opponent...</p>
              {opponentWantsRematch && <p className="both-ready">Opponent wants rematch too!</p>}
            </div>
          )}
          
          <button 
            className="leave-button secondary-button"
            onClick={onLeaveGame}
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};