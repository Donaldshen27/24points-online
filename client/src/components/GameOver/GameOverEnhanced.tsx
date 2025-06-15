import React, { useState, useEffect, useRef } from 'react';
import socketService from '../../services/socketService';
import type { GameRoom } from '../../types/game.types';
import './GameOverEnhanced.css';

interface GameOverEnhancedProps {
  gameState: GameRoom;
  playerId: string;
  onRematch: () => void;
  onLeaveGame: () => void;
}

interface DetailedStats {
  totalRounds: number;
  playerWins: number;
  opponentWins: number;
  avgSolveTime: number;
  opponentAvgSolveTime: number;
  fastestSolve: number;
  firstSolveRate: number;
  accuracyRate: number;
  longestStreak: number;
  totalCardsWon: number;
  totalCardsLost: number;
}

export const GameOverEnhanced: React.FC<GameOverEnhancedProps> = ({
  gameState,
  playerId,
  onRematch,
  onLeaveGame
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const opponent = gameState.players.find(p => p.id !== playerId);

  const playerScore = gameState.scores[playerId] || 0;
  const opponentScore = opponent ? (gameState.scores[opponent.id] || 0) : 0;
  const isWinner = currentPlayer?.deck.length === 0 || opponent?.deck.length === 20;

  // Calculate detailed statistics
  const getDetailedStats = (): DetailedStats => {
    const playerTimes = gameState.roundTimes?.[playerId] || [];
    const opponentTimes = opponent ? (gameState.roundTimes?.[opponent.id] || []) : [];
    
    const avgSolveTime = playerTimes.length > 0 
      ? playerTimes.reduce((a, b) => a + b, 0) / playerTimes.length 
      : 0;
    
    const opponentAvgSolveTime = opponentTimes.length > 0 
      ? opponentTimes.reduce((a, b) => a + b, 0) / opponentTimes.length 
      : 0;

    const fastestSolve = playerTimes.length > 0 
      ? Math.min(...playerTimes) 
      : 0;

    const firstSolves = gameState.firstSolves?.[playerId] || 0;
    const totalAttempts = (gameState.correctSolutions?.[playerId] || 0) + 
                         (gameState.incorrectAttempts?.[playerId] || 0);
    
    const accuracyRate = totalAttempts > 0 
      ? ((gameState.correctSolutions?.[playerId] || 0) / totalAttempts) * 100 
      : 0;

    const firstSolveRate = gameState.currentRound > 0 
      ? (firstSolves / gameState.currentRound) * 100 
      : 0;

    // Calculate longest winning streak
    let longestStreak = 0;
    let currentStreak = 0;
    // This would need round-by-round data to calculate properly
    
    const totalCardsWon = playerScore * 4; // Each round win = 4 cards
    const totalCardsLost = opponentScore * 4;

    return {
      totalRounds: gameState.currentRound,
      playerWins: playerScore,
      opponentWins: opponentScore,
      avgSolveTime: Math.round(avgSolveTime * 10) / 10,
      opponentAvgSolveTime: Math.round(opponentAvgSolveTime * 10) / 10,
      fastestSolve: Math.round(fastestSolve * 10) / 10,
      firstSolveRate: Math.round(firstSolveRate),
      accuracyRate: Math.round(accuracyRate),
      longestStreak,
      totalCardsWon,
      totalCardsLost
    };
  };

  // Fireworks animation
  useEffect(() => {
    if (!isWinner || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.size = Math.random() * 3 + 1;
        this.life = 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life -= 0.01;
        this.size *= 0.98;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const createFirework = () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.5;
      
      for (let i = 0; i < 50; i++) {
        particles.push(new Particle(x, y));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        
        if (p.life <= 0 || p.size <= 0.1) {
          particles.splice(i, 1);
        }
      }
      
      requestAnimationFrame(animate);
    };

    // Create fireworks periodically
    const fireworkInterval = setInterval(createFirework, 800);
    animate();

    // Cleanup
    return () => {
      clearInterval(fireworkInterval);
    };
  }, [isWinner]);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
    setTimeout(() => setShowStats(true), 800);
    
    const socket = socketService.getSocket();
    if (!socket) return;
    
    const handleOpponentRematch = () => {
      setOpponentWantsRematch(true);
    };
    
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

  const stats = getDetailedStats();

  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'N/A';
    return `${seconds}s`;
  };

  return (
    <div className={`game-over-enhanced ${isVisible ? 'visible' : ''}`}>
      {isWinner && <canvas ref={canvasRef} className="fireworks-canvas" />}
      
      <div className={`celebration-container ${isWinner ? 'victory' : 'defeat'}`}>
        {/* Trophy/Medal Animation */}
        <div className="trophy-container">
          <div className={`trophy ${isWinner ? 'gold' : 'silver'}`}>
            {isWinner ? '🏆' : '🥈'}
          </div>
          <div className="sparkles">
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`sparkle sparkle-${i + 1}`}>✨</div>
            ))}
          </div>
        </div>

        {/* Result Header */}
        <div className="result-header">
          <h1 className="result-title">
            {isWinner ? 'VICTORY!' : 'DEFEAT'}
          </h1>
          <p className="result-subtitle">
            {isWinner 
              ? 'Outstanding performance! You are the 24 Points Champion!' 
              : 'A valiant effort! Ready for a rematch?'}
          </p>
        </div>

        {/* Battle Report */}
        <div className={`battle-report ${showStats ? 'show' : ''}`}>
          <h2>⚔️ Battle Report ⚔️</h2>
          
          {/* Score Overview */}
          <div className="score-overview">
            <div className="player-final-score">
              <div className="player-avatar">{isWinner ? '👑' : '🎮'}</div>
              <div className="player-info">
                <span className="player-name">{currentPlayer?.name || 'You'}</span>
                <span className="final-score">{playerScore} wins</span>
              </div>
            </div>
            
            <div className="vs-separator">VS</div>
            
            <div className="player-final-score">
              <div className="player-avatar">{!isWinner ? '👑' : '🎮'}</div>
              <div className="player-info">
                <span className="player-name">{opponent?.name || 'Opponent'}</span>
                <span className="final-score">{opponentScore} wins</span>
              </div>
            </div>
          </div>

          {/* Detailed Statistics Grid */}
          <div className="stats-grid-enhanced">
            <div className="stat-category">
              <h3>⏱️ Speed Analysis</h3>
              <div className="stat-row">
                <span className="stat-label">Your Average Time</span>
                <span className="stat-value highlight">{formatTime(stats.avgSolveTime)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Opponent Average</span>
                <span className="stat-value">{formatTime(stats.opponentAvgSolveTime)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Your Fastest Solve</span>
                <span className="stat-value trophy">{formatTime(stats.fastestSolve)}</span>
              </div>
            </div>

            <div className="stat-category">
              <h3>🎯 Performance Metrics</h3>
              <div className="stat-row">
                <span className="stat-label">First Solve Rate</span>
                <span className="stat-value">{stats.firstSolveRate}%</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Solution Accuracy</span>
                <span className="stat-value">{stats.accuracyRate}%</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Win Rate</span>
                <span className="stat-value highlight">
                  {stats.totalRounds > 0 
                    ? Math.round((stats.playerWins / stats.totalRounds) * 100) 
                    : 0}%
                </span>
              </div>
            </div>

            <div className="stat-category">
              <h3>🃏 Card Statistics</h3>
              <div className="stat-row">
                <span className="stat-label">Cards Won</span>
                <span className="stat-value success">+{stats.totalCardsWon}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Cards Lost</span>
                <span className="stat-value danger">-{stats.totalCardsLost}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Final Deck Size</span>
                <span className="stat-value">{currentPlayer?.deck.length || 0} cards</span>
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="achievements">
            <h3>🏅 Match Achievements</h3>
            <div className="achievement-list">
              {stats.avgSolveTime < 10 && stats.avgSolveTime > 0 && (
                <div className="achievement-badge speed">
                  <span className="badge-icon">⚡</span>
                  <span className="badge-text">Speed Demon</span>
                </div>
              )}
              {stats.accuracyRate >= 80 && (
                <div className="achievement-badge accuracy">
                  <span className="badge-icon">🎯</span>
                  <span className="badge-text">Sharpshooter</span>
                </div>
              )}
              {stats.firstSolveRate >= 60 && (
                <div className="achievement-badge quick">
                  <span className="badge-icon">🚀</span>
                  <span className="badge-text">Quick Thinker</span>
                </div>
              )}
              {isWinner && (
                <div className="achievement-badge winner">
                  <span className="badge-icon">👑</span>
                  <span className="badge-text">Champion</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {!rematchRequested ? (
            <button 
              className="action-button rematch-btn"
              onClick={handleRematch}
            >
              <span className="button-icon">🔄</span>
              Request Rematch
            </button>
          ) : (
            <div className="rematch-waiting">
              <div className="waiting-spinner"></div>
              <p>Waiting for opponent...</p>
              {opponentWantsRematch && (
                <p className="opponent-ready">✅ Opponent wants rematch!</p>
              )}
            </div>
          )}
          
          <button 
            className="action-button home-btn"
            onClick={onLeaveGame}
          >
            <span className="button-icon">🏠</span>
            Back to Main Page
          </button>
        </div>
      </div>
    </div>
  );
};