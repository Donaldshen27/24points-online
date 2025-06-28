import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameState } from '../../hooks/useGameState';
import { InteractiveCenterTable } from '../InteractiveCenterTable/InteractiveCenterTable';
import { GameOverEnhanced } from '../GameOver/GameOverEnhanced';
import { SolutionReplay } from '../SolutionReplay/SolutionReplay';
import { VictoryCelebration } from '../VictoryCelebration/VictoryCelebration';
import DisconnectNotification from '../DisconnectNotification/DisconnectNotification';
import { TugOfWar } from '../TugOfWar';
import socketService from '../../services/socketService';
import type { GameRoom, Solution, Card, Operation } from '../../types/game.types';
import { GameState } from '../../types/game.types';
import { preventBodyScroll, useKeyboardHeight } from '../../utils/mobilePatterns';
import './GameScreenMobile.css';

interface GameScreenMobileProps {
  room: GameRoom;
  playerId: string;
  onLeaveGame: () => void;
  isSpectator?: boolean;
}

export const GameScreenMobile: React.FC<GameScreenMobileProps> = ({ 
  room, 
  playerId, 
  onLeaveGame, 
  isSpectator = false 
}) => {
  const { t } = useTranslation();
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSubmittingSolution, setIsSubmittingSolution] = useState(false);
  const lastClaimTime = React.useRef<number>(0);
  const claimCooldown = 100;

  const {
    gameState,
    currentRound,
    centerCards,
    resetGame
  } = useGameState(playerId, room);

  const [showingSolutionReplay, setShowingSolutionReplay] = useState(false);
  const [replaySolution, setReplaySolution] = useState<Solution | null>(null);
  const [showVictoryCelebration, setShowVictoryCelebration] = useState<string | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [gameOverWinnerId, setGameOverWinnerId] = useState<string | null>(null);
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);

  // Get current player and opponent
  const currentPlayer = isSpectator 
    ? gameState?.players?.[0] 
    : gameState?.players.find(p => p.id === playerId);
  const opponent = isSpectator 
    ? gameState?.players?.[1] 
    : gameState?.players.find(p => p.id !== playerId);

  // Handle keyboard height changes
  useKeyboardHeight(setKeyboardHeight);

  // Prevent body scroll when controls are expanded
  useEffect(() => {
    preventBodyScroll(isControlsExpanded);
    return () => preventBodyScroll(false);
  }, [isControlsExpanded]);

  // Handle direct solution from interactive table
  const handleDirectSolution = useCallback((
    expression: string, 
    result: number, 
    usedCards: Card[], 
    operations: Operation[]
  ) => {
    if (Math.abs(result - 24) < 0.0001 && gameState?.state === GameState.PLAYING && !isSubmittingSolution) {
      const now = Date.now();
      if (now - lastClaimTime.current < claimCooldown) {
        return;
      }
      lastClaimTime.current = now;

      setIsSubmittingSolution(true);
      socketService.submitSolution({ 
        expression, 
        result, 
        usedCards, 
        operations,
        timestamp: now
      });

      // Visual feedback
      navigator.vibrate?.(50);
      setIsControlsExpanded(false);

      setTimeout(() => {
        setIsSubmittingSolution(false);
      }, 3000);
    }
  }, [gameState?.state, isSubmittingSolution]);

  // Socket event handlers
  useEffect(() => {
    const handleRoundEnded = (data: any) => {
      if (data.solution) {
        setReplaySolution(data.solution);
        setShowingSolutionReplay(true);
      }
    };

    const handleGameEnded = (data: any) => {
      setGameOverReason(data.reason);
      setGameOverWinnerId(data.winnerId);
    };

    const handleBadgeUnlocked = (badges: any[]) => {
      setUnlockedBadges(prev => [...prev, ...badges]);
    };

    socketService.on('round-ended', handleRoundEnded);
    socketService.on('game-ended', handleGameEnded);
    socketService.on('badge-unlocked', handleBadgeUnlocked);

    return () => {
      socketService.off('round-ended', handleRoundEnded);
      socketService.off('game-ended', handleGameEnded);
      socketService.off('badge-unlocked', handleBadgeUnlocked);
    };
  }, []);

  if (!gameState || !currentPlayer) {
    return <div className="mobile-game-loading">{t('loading')}</div>;
  }

  const handleControlsSwipe = (_: any, info: PanInfo) => {
    if (info.offset.y > 50 || info.velocity.y > 500) {
      setIsControlsExpanded(false);
    } else if (info.offset.y < -50 || info.velocity.y < -500) {
      setIsControlsExpanded(true);
    }
  };

  const isGameActive = gameState.state === GameState.PLAYING || 
                      gameState.state === GameState.SOLVING ||
                      gameState.state === GameState.ROUND_END;

  return (
    <div className="mobile-game-screen">
      {/* Compact Header */}
      <div className="mobile-game-header">
        <div className="mobile-header-left">
          <span className="mobile-room-code">{room.id}</span>
          <span className="mobile-round">R{currentRound}</span>
          {isSpectator && <span className="mobile-spectator-badge">👁️</span>}
        </div>
        
        <div className="mobile-score-display">
          <span className="mobile-player-score">{currentPlayer.score}</span>
          <span className="mobile-score-separator">:</span>
          <span className="mobile-opponent-score">{opponent?.score || 0}</span>
        </div>

        <button className="mobile-menu-btn" onClick={onLeaveGame}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Tug of War Visualization */}
      <div className="mobile-tug-container">
        <TugOfWar 
          player1Score={currentPlayer.score} 
          player2Score={opponent?.score || 0}
          player1Name={currentPlayer.name}
          player2Name={opponent?.name || 'Waiting...'}
        />
      </div>

      {/* Main Game Area */}
      <div className="mobile-game-area">
        {/* Opponent Info */}
        <div className="mobile-opponent-section">
          <div className="mobile-player-info opponent">
            <span className="mobile-player-name">{opponent?.name || 'Waiting...'}</span>
            <div className="mobile-card-count">
              {opponent?.deck?.length || 0} {t('cards')}
            </div>
          </div>
        </div>

        {/* Center Table */}
        <div className="mobile-center-area">
          <InteractiveCenterTable
            cards={centerCards}
            onSolutionFound={handleDirectSolution}
            solvingPlayer={gameState.solvingPlayer}
            currentUserId={playerId}
            disabled={
              isSpectator || 
              gameState.state !== GameState.PLAYING || 
              isSubmittingSolution
            }
            gameMode={room.gameMode}
          />
        </div>

        {/* Current Player Info */}
        <div className="mobile-player-section">
          <div className="mobile-player-info current">
            <span className="mobile-player-name">{currentPlayer.name}</span>
            <div className="mobile-card-count">
              {currentPlayer.deck?.length || 0} {t('cards')}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control Sheet */}
      <motion.div
        className="mobile-control-sheet"
        initial={false}
        animate={{ 
          y: isControlsExpanded ? 0 : '70%',
          height: keyboardHeight > 0 ? `calc(80% - ${keyboardHeight}px)` : '80%'
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 300 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={handleControlsSwipe}
      >
        {/* Drag Handle */}
        <div className="mobile-sheet-handle-container">
          <div className="mobile-sheet-handle" />
        </div>

        {/* Control Content */}
        <div className="mobile-control-content">
          {gameState.state === GameState.PLAYING && !isSpectator && (
            <button 
              className="mobile-claim-btn"
              onClick={() => setIsControlsExpanded(true)}
              disabled={isSubmittingSolution}
            >
              {isSubmittingSolution ? t('submitting') : t('iKnowIt')}
            </button>
          )}

          {gameState.state === GameState.WAITING && (
            <div className="mobile-waiting-message">
              {t('waitingForPlayer')}
            </div>
          )}

          {room.isSoloPractice && (
            <button 
              className="mobile-skip-btn"
              onClick={() => socketService.skipPuzzle()}
            >
              {t('skipPuzzle')}
            </button>
          )}
        </div>
      </motion.div>

      {/* Modals and Overlays */}
      <AnimatePresence>
        {showingSolutionReplay && replaySolution && (
          <SolutionReplay
            solution={replaySolution}
            onComplete={() => {
              setShowingSolutionReplay(false);
              setReplaySolution(null);
            }}
          />
        )}

        {showVictoryCelebration && (
          <VictoryCelebration
            winnerId={showVictoryCelebration}
            onComplete={() => setShowVictoryCelebration(null)}
          />
        )}

        {gameOverReason && gameOverWinnerId && (
          <GameOverEnhanced
            winner={gameState.players.find(p => p.id === gameOverWinnerId)!}
            players={gameState.players}
            reason={gameOverReason}
            roundHistory={gameState.roundHistory || []}
            onRematch={resetGame}
            onLeave={onLeaveGame}
            unlockedBadges={unlockedBadges}
          />
        )}

        {opponentDisconnected && (
          <DisconnectNotification
            playerName={opponent?.name || 'Opponent'}
            onWaitForReconnect={() => {}}
            onEndGame={onLeaveGame}
            timeRemaining={30}
          />
        )}
      </AnimatePresence>
    </div>
  );
};