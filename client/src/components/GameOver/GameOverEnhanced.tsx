import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameRoom } from '../../types/game.types';
import './GameOverEnhanced.css';

interface GameOverEnhancedProps {
  gameState: GameRoom;
  playerId: string;
  onRematch: () => void;
  onLeaveGame: () => void;
  gameOverReason?: string | null;
  gameOverWinnerId?: string | null;
  isSpectator?: boolean;
  unlockedBadges?: any[];
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
  onLeaveGame,
  gameOverReason,
  gameOverWinnerId,
  isSpectator = false,
  unlockedBadges = []
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showRatingAnimation, setShowRatingAnimation] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // For spectators, determine the winner and show their stats
  let currentPlayer, opponent, playerScore, opponentScore, isWinner;
  
  if (isSpectator) {
    // Find the actual winner
    const actualWinnerId = gameOverWinnerId || 
      (gameState.players.find(p => p.deck.length === 0)?.id || 
       gameState.players.find(p => p.deck.length === 20)?.id);
    
    if (actualWinnerId) {
      currentPlayer = gameState.players.find(p => p.id === actualWinnerId);
      opponent = gameState.players.find(p => p.id !== actualWinnerId);
      playerScore = gameState.scores[actualWinnerId] || 0;
      opponentScore = opponent ? (gameState.scores[opponent.id] || 0) : 0;
      isWinner = true; // Always show as winner for spectator view
    } else {
      // Fallback to first player if no clear winner
      currentPlayer = gameState.players[0];
      opponent = gameState.players[1];
      playerScore = gameState.scores[currentPlayer?.id] || 0;
      opponentScore = gameState.scores[opponent?.id] || 0;
      isWinner = playerScore > opponentScore;
    }
  } else {
    currentPlayer = gameState.players.find(p => p.id === playerId);
    opponent = gameState.players.find(p => p.id !== playerId);
    playerScore = gameState.scores[playerId] || 0;
    opponentScore = opponent ? (gameState.scores[opponent.id] || 0) : 0;
    // Use gameOverWinnerId if provided (for forfeit cases), otherwise use deck length
    isWinner = gameOverWinnerId ? gameOverWinnerId === playerId : (currentPlayer?.deck.length === 0 || opponent?.deck.length === 20);
  }

  // Calculate detailed statistics
  const getDetailedStats = (): DetailedStats => {
    // Use the current player's ID (which is the winner's ID for spectators)
    const statsPlayerId = currentPlayer?.id || playerId;
    const playerTimes = gameState.roundTimes?.[statsPlayerId] || [];
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

    const firstSolves = gameState.firstSolves?.[statsPlayerId] || 0;
    const totalAttempts = (gameState.correctSolutions?.[statsPlayerId] || 0) + 
                         (gameState.incorrectAttempts?.[statsPlayerId] || 0);
    
    const accuracyRate = totalAttempts > 0 
      ? ((gameState.correctSolutions?.[statsPlayerId] || 0) / totalAttempts) * 100 
      : 0;

    const firstSolveRate = gameState.currentRound > 0 
      ? (firstSolves / gameState.currentRound) * 100 
      : 0;

    // Calculate longest winning streak
    let longestStreak = 0;
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
    // Show rating animation after stats
    if (gameState.isRanked && gameState.rankedData?.ratingChanges) {
      setTimeout(() => setShowRatingAnimation(true), 1200);
    }
  }, [gameState.isRanked, gameState.rankedData]);


  const stats = getDetailedStats();

  const formatTime = (milliseconds: number) => {
    if (milliseconds === 0) return t('gameOver.labels.na');
    const seconds = (milliseconds / 1000).toFixed(1);
    return t('gameOver.labels.seconds', { seconds });
  };

  return (
    <div className={`game-over-enhanced ${isVisible ? 'visible' : ''}`}>
      {isWinner && <canvas ref={canvasRef} className="fireworks-canvas" />}
      
      <div className={`celebration-container ${isWinner ? 'victory' : 'defeat'}`}>
        {/* Trophy/Medal Animation */}
        <div className="trophy-container">
          <div className={`trophy ${isWinner ? 'gold' : 'silver'}`}>
            <span role="img" aria-label={isWinner ? 'Gold trophy' : 'Silver medal'}>
              {isWinner ? '🏆' : '🥈'}
            </span>
          </div>
          <div className="sparkles">
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`sparkle sparkle-${i + 1}`}>
                <span role="img" aria-label="Sparkle">
                  ✨
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Result Header */}
        <div className="result-header">
          <h1 className="result-title">
            {isSpectator 
              ? t('gameOver.spectator.wins', { player: currentPlayer?.name }) 
              : (isWinner ? t('gameOver.victory') : t('gameOver.defeat'))}
          </h1>
          <p className="result-subtitle">
            {gameOverReason === 'forfeit' 
              ? (isWinner 
                  ? t('gameOver.messages.opponentDisconnected') 
                  : t('gameOver.messages.youDisconnected'))
              : (isWinner 
                  ? t('gameOver.messages.victoryMessage') 
                  : t('gameOver.messages.defeatMessage'))}
          </p>
        </div>

        {/* Ranked Rating Changes - Show prominently at the top */}
        {gameState.isRanked && gameState.rankedData && gameState.rankedData.ratingChanges && (
          <div className={`ranked-rating-section ${showRatingAnimation ? 'animate' : ''}`}>
            <div className="rating-change-container">
              {/* Player Rating Change */}
              <div className={`rating-change-card ${isWinner ? 'winner' : 'loser'}`}>
                <div className="player-rating-info">
                  <span className="player-label">{currentPlayer?.name || t('gameOver.labels.you')}</span>
                  <div className="rating-display">
                    <span className="old-rating">
                      {currentPlayer?.id === gameState.players[0].id 
                        ? gameState.rankedData.player1Rating 
                        : gameState.rankedData.player2Rating}
                    </span>
                    <span className="rating-arrow">→</span>
                    <span className="new-rating">
                      {(currentPlayer?.id === gameState.players[0].id 
                        ? gameState.rankedData.player1Rating 
                        : gameState.rankedData.player2Rating) + 
                        (gameState.rankedData.ratingChanges[currentPlayer?.id || playerId] || 0)}
                    </span>
                  </div>
                  <div className={`rating-delta ${isWinner ? 'positive' : 'negative'}`}>
                    <span className="delta-sign">{isWinner ? '+' : ''}</span>
                    <span className="delta-value">
                      {Math.abs(gameState.rankedData.ratingChanges[currentPlayer?.id || playerId] || 0)}
                    </span>
                    <span className="delta-label">ELO</span>
                  </div>
                </div>
              </div>
              
              {/* Opponent Rating Change */}
              {opponent && !isSpectator && (
                <div className={`rating-change-card ${!isWinner ? 'winner' : 'loser'}`}>
                  <div className="player-rating-info">
                    <span className="player-label">{opponent.name}</span>
                    <div className="rating-display">
                      <span className="old-rating">
                        {opponent.id === gameState.players[0].id 
                          ? gameState.rankedData.player1Rating 
                          : gameState.rankedData.player2Rating}
                      </span>
                      <span className="rating-arrow">→</span>
                      <span className="new-rating">
                        {(opponent.id === gameState.players[0].id 
                          ? gameState.rankedData.player1Rating 
                          : gameState.rankedData.player2Rating) + 
                          (gameState.rankedData.ratingChanges[opponent.id] || 0)}
                      </span>
                    </div>
                    <div className={`rating-delta ${!isWinner ? 'positive' : 'negative'}`}>
                      <span className="delta-sign">{!isWinner ? '+' : ''}</span>
                      <span className="delta-value">
                        {Math.abs(gameState.rankedData.ratingChanges[opponent.id] || 0)}
                      </span>
                      <span className="delta-label">ELO</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Battle Report */}
        <div className={`battle-report ${showStats ? 'show' : ''}`}>
          <h2>{t('gameOver.battleReport')}</h2>
          
          {/* Score Overview */}
          <div className="score-overview">
            <div className="player-final-score">
              <div className="player-avatar">
                <span role="img" aria-label={isWinner ? 'Crown' : 'Game controller'}>
                  {isWinner ? '👑' : '🎮'}
                </span>
              </div>
              <div className="player-info">
                <span className="player-name">{currentPlayer?.name || t('gameOver.labels.you')}</span>
                <span className="final-score">{t('gameOver.labels.wins', { count: playerScore })}</span>
              </div>
            </div>
            
            <div className="vs-separator">{t('gameOver.labels.vs')}</div>
            
            <div className="player-final-score">
              <div className="player-avatar">
                <span role="img" aria-label={!isWinner ? 'Crown' : 'Game controller'}>
                  {!isWinner ? '👑' : '🎮'}
                </span>
              </div>
              <div className="player-info">
                <span className="player-name">{opponent?.name || t('gameOver.labels.opponent')}</span>
                <span className="final-score">{t('gameOver.labels.wins', { count: opponentScore })}</span>
              </div>
            </div>
          </div>

          {/* Detailed Statistics Grid */}
          <div className="stats-grid-enhanced">
            <div className="stat-category">
              <h3>{t('gameOver.speedAnalysis')}</h3>
              <div className="stat-row">
                <span className="stat-label">{isSpectator ? t('gameOver.labels.playerAverage', { player: currentPlayer?.name }) : t('gameOver.labels.averageTime')}</span>
                <span className="stat-value highlight">{formatTime(stats.avgSolveTime)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">{isSpectator ? t('gameOver.labels.playerAverage', { player: opponent?.name }) : t('gameOver.labels.opponentAverage')}</span>
                <span className="stat-value">{formatTime(stats.opponentAvgSolveTime)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">{isSpectator ? t('gameOver.labels.playerFastestSolve') : t('gameOver.labels.fastestSolve')}</span>
                <span className="stat-value trophy">{formatTime(stats.fastestSolve)}</span>
              </div>
            </div>

            <div className="stat-category">
              <h3>{t('gameOver.performanceMetrics')}</h3>
              <div className="stat-row">
                <span className="stat-label">{t('gameOver.labels.firstSolveRate')}</span>
                <span className="stat-value">{stats.firstSolveRate}%</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">{t('gameOver.labels.solutionAccuracy')}</span>
                <span className="stat-value">{stats.accuracyRate}%</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">{t('gameOver.labels.winRate')}</span>
                <span className="stat-value highlight">
                  {stats.totalRounds > 0 
                    ? Math.round((stats.playerWins / stats.totalRounds) * 100) 
                    : 0}%
                </span>
              </div>
            </div>

            <div className="stat-category">
              <h3>{t('gameOver.cardStatistics')}</h3>
              <div className="stat-row">
                <span className="stat-label">{t('gameOver.labels.cardsWon')}</span>
                <span className="stat-value success">+{stats.totalCardsWon}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">{t('gameOver.labels.cardsLost')}</span>
                <span className="stat-value danger">-{stats.totalCardsLost}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">{t('gameOver.labels.finalDeckSize')}</span>
                <span className="stat-value">{t('gameOver.labels.cards', { count: currentPlayer?.deck.length || 0 })}</span>
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="achievements">
            <h3>{t('gameOver.matchAchievements')}</h3>
            <div className="achievement-list">
              {stats.avgSolveTime < 10000 && stats.avgSolveTime > 0 && (
                <div className="achievement-badge speed">
                  <span className="badge-icon" role="img" aria-label="Lightning bolt">⚡</span>
                  <span className="badge-text">{t('gameOver.achievements.speedDemon')}</span>
                </div>
              )}
              {stats.accuracyRate >= 80 && (
                <div className="achievement-badge accuracy">
                  <span className="badge-icon" role="img" aria-label="Target">🎯</span>
                  <span className="badge-text">{t('gameOver.achievements.sharpshooter')}</span>
                </div>
              )}
              {stats.firstSolveRate >= 60 && (
                <div className="achievement-badge quick">
                  <span className="badge-icon" role="img" aria-label="Rocket">🚀</span>
                  <span className="badge-text">{t('gameOver.achievements.quickThinker')}</span>
                </div>
              )}
              {isWinner && (
                <div className="achievement-badge winner">
                  <span className="badge-icon" role="img" aria-label="Crown">👑</span>
                  <span className="badge-text">{t('gameOver.achievements.champion')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Unlocked Badges */}
          {unlockedBadges.length > 0 && (
            <div className="unlocked-badges">
              <h3>{t('gameOver.unlockedBadges')}</h3>
              <div className="badge-list">
                {unlockedBadges.map((unlock, index) => (
                  <div key={index} className="unlocked-badge">
                    <div className={`badge-icon tier-${unlock.badge.tier || 'none'}`}>
                      {unlock.badge.tier === 'bronze' && '🥉'}
                      {unlock.badge.tier === 'silver' && '🥈'}
                      {unlock.badge.tier === 'gold' && '🥇'}
                      {unlock.badge.tier === 'platinum' && '💎'}
                      {unlock.badge.tier === 'diamond' && '💠'}
                      {!unlock.badge.tier && '🏆'}
                    </div>
                    <div className="badge-info">
                      <span className="badge-name">{unlock.badge.name}</span>
                      <span className="badge-description">{unlock.badge.description}</span>
                      <span className="badge-points">+{unlock.badge.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="action-button home-btn"
            onClick={onLeaveGame}
          >
            <span className="button-icon" role="img" aria-label="Home">🏠</span>
            {isSpectator ? t('gameOver.spectator.backToLobby') : t('gameOver.backToMainPage')}
          </button>
        </div>
      </div>
    </div>
  );
};