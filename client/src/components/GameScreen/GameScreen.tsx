import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameState } from '../../hooks/useGameState';
import { InteractiveCenterTable } from '../InteractiveCenterTable/InteractiveCenterTable';
import { PlayerHand } from '../PlayerHand/PlayerHand';
import { RoundResult } from '../RoundResult/RoundResult';
import { GameOverEnhanced } from '../GameOver/GameOverEnhanced';
import { CardTransfer } from '../CardTransfer/CardTransfer';
import { SolutionReplay } from '../SolutionReplay/SolutionReplay';
import { VictoryCelebration } from '../VictoryCelebration/VictoryCelebration';
import DisconnectNotification from '../DisconnectNotification/DisconnectNotification';
import { PuzzleRecords } from '../PuzzleRecords/PuzzleRecords';
import socketService from '../../services/socketService';
import type { GameRoom, Solution, Card, Operation } from '../../types/game.types';
import { GameState } from '../../types/game.types';
import './GameScreen.css';

interface GameScreenProps {
  room: GameRoom;
  playerId: string;
  onLeaveGame: () => void;
  isSpectator?: boolean;
}

export const GameScreen: React.FC<GameScreenProps> = ({ room, playerId, onLeaveGame, isSpectator = false }) => {
  const { t } = useTranslation();
  console.log('[GameScreen] Component mounted with:', { 
    roomId: room?.id, 
    roomState: room?.state, 
    playerId, 
    isSpectator,
    isSoloPractice: room?.isSoloPractice,
    players: room?.players?.map(p => ({ id: p.id, name: p.name, isReady: p.isReady }))
  });
  
  const {
    gameState,
    currentRound,
    centerCards,
    resetGame
  } = useGameState(playerId, room);

  const [roundResult, setRoundResult] = useState<{
    winnerId: string | null;
    loserId: string | null;
    solution?: Solution;
    reason: 'correct_solution' | 'incorrect_solution' | 'no_solution' | 'timeout';
  } | null>(null);
  const [transferringCards, setTransferringCards] = useState<{
    cards: Card[];
    toPlayer: 'current' | 'opponent';
  } | null>(null);
  const [showingSolutionReplay, setShowingSolutionReplay] = useState(false);
  const [replaySolution, setReplaySolution] = useState<Solution | null>(null);
  const [replayCompleting, setReplayCompleting] = useState(false);
  const [showVictoryCelebration, setShowVictoryCelebration] = useState<string | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [gameOverWinnerId, setGameOverWinnerId] = useState<string | null>(null);
  const [opponentDisconnectedTime, setOpponentDisconnectedTime] = useState<number | null>(null);
  const [showNewRecord, setShowNewRecord] = useState(false);

  // Get current player and opponent
  // For spectators, just show the first player as "current" and second as "opponent"
  const currentPlayer = isSpectator 
    ? gameState?.players?.[0] 
    : gameState?.players.find(p => p.id === playerId);
  const opponent = isSpectator 
    ? gameState?.players?.[1] 
    : gameState?.players.find(p => p.id !== playerId);

  console.log('[GameScreen] Player state:', {
    gameState: gameState?.state,
    currentPlayer: currentPlayer ? { id: currentPlayer.id, name: currentPlayer.name } : null,
    opponent: opponent ? { id: opponent.id, name: opponent.name } : null,
    centerCards: centerCards?.length,
    currentRound,
    isSoloPractice: room?.isSoloPractice
  });



  // Handle direct solution from interactive table
  const handleDirectSolution = (expression: string, result: number, usedCards: Card[], operations: Operation[]) => {
    console.log(t('gameScreen.console.solutionFound'), { expression, result, usedCards, operations });
    
    // Check if it's exactly 24
    if (Math.abs(result - 24) < 0.0001 && gameState?.state === GameState.PLAYING) {
      // First claim the solution
      const socket = socketService.getSocket();
      if (!socket) return;
      
      // Emit claim and solution together
      socket.emit('claim-solution');
      
      // Small delay to ensure claim is processed
      setTimeout(() => {
        const solution: Solution = {
          cards: usedCards,
          operations: operations,
          result: 24
        };
        console.log(t('gameScreen.console.submittingSolution'), solution);
        socket.emit('submit-solution', { solution });
      }, 50);
    }
  };


  // Get status message
  const getStatusMessage = (): string => {
    if (!gameState) return t('gameScreen.status.loading');
    
    switch (gameState.state) {
      case GameState.WAITING:
        return t('gameScreen.status.waitingForPlayers');
      case GameState.PLAYING:
        return isSpectator 
          ? t('gameScreen.status.watchingGame', { number: currentRound }) 
          : t('gameScreen.status.findSolution', { number: currentRound });
      case GameState.SOLVING:
        return isSpectator ? t('gameScreen.status.playerSolving') : t('gameScreen.status.raceToSolve');
      case GameState.ROUND_END:
        return t('gameScreen.status.roundEnded');
      case GameState.GAME_OVER:
        return t('gameScreen.status.gameOver');
      default:
        return '';
    }
  };

  // Listen for game state changes to detect replay state
  useEffect(() => {
    if (gameState?.state === GameState.REPLAY && replaySolution) {
      console.log('[GameScreen] Game entered REPLAY state, showing replay');
      setShowingSolutionReplay(true);
    } else if (showingSolutionReplay && gameState?.state !== GameState.REPLAY && !replayCompleting) {
      console.log('[GameScreen] Game left REPLAY state while not completing');
      // Don't immediately hide if replay is completing
      if (!replayCompleting) {
        setTimeout(() => {
          if (!replayCompleting) {
            setShowingSolutionReplay(false);
          }
        }, 1000);
      }
    }
  }, [gameState?.state, replaySolution, showingSolutionReplay, replayCompleting]);

  // Listen for solution results
  useEffect(() => {
    const handleRoundEnded = (data: { winnerId: string; loserId: string; solution: Solution; correct: boolean; reason?: string }) => {
      console.log('[GameScreen] Round ended:', {
        winnerId: data.winnerId,
        loserId: data.loserId,
        myPlayerId: playerId,
        amIWinner: data.winnerId === playerId,
        amILoser: data.loserId === playerId,
        correct: data.correct
      });
      
      // Show victory celebration for correct solutions
      if (data.correct && data.winnerId) {
        const winnerName = data.winnerId === playerId ? currentPlayer?.name : opponent?.name;
        if (winnerName) {
          setShowVictoryCelebration(winnerName);
        }
      }
      
      // Show round result screen
      setRoundResult({
        winnerId: data.winnerId,
        loserId: data.loserId,
        solution: data.solution,
        reason: data.reason as any || (data.correct ? 'correct_solution' : 'incorrect_solution')
      });
      
      // Store solution for replay if valid
      if (data.solution && data.correct && data.solution.operations && data.solution.operations.length > 0) {
        console.log('[GameScreen] Valid solution received, waiting for server to trigger replay');
        setReplaySolution(data.solution);
      }
      
      // Show card transfer animation after round result
      if (data.winnerId && data.loserId && centerCards.length > 0) {
        // Don't transfer immediately if there will be a replay
        const hasReplay = data.solution && data.correct && data.solution.operations && data.solution.operations.length > 0;
        // In solo practice with auto-skip, use minimal delay
        const transferDelay = hasReplay && !gameState?.isSoloPractice ? 8000 : 2500;
        
        setTimeout(() => {
          const transferTo = data.loserId === playerId ? 'current' : 'opponent';
          console.log('[GameScreen] Transferring cards to:', transferTo);
          setTransferringCards({
            cards: [...centerCards],
            toPlayer: transferTo
          });
        }, transferDelay);
      }
    };

    const handleClaimError = (data: { message: string }) => {
      console.error(t('gameScreen.console.claimError'), data.message);
    };

    const handleSubmitError = (data: { message: string }) => {
      console.error(t('gameScreen.console.submitError'), data.message);
    };

    socketService.on('round-ended', handleRoundEnded);
    socketService.on('claim-error', handleClaimError);  
    socketService.on('submit-error', handleSubmitError);
    
    return () => {
      socketService.off('round-ended', handleRoundEnded);
      socketService.off('claim-error', handleClaimError);
      socketService.off('submit-error', handleSubmitError);
    };
  }, [playerId, currentPlayer, opponent]);

  // Listen for opponent disconnection
  useEffect(() => {
    const handlePlayerDisconnected = (data: { playerId: string }) => {
      console.log('Player disconnected:', data.playerId);
      // Don't show notification immediately for active games
    };

    const handlePlayerDisconnectedActiveGame = (data: { playerId: string; playerName: string; timeoutSeconds: number }) => {
      console.log('Player disconnected during active game:', data);
      if (data.playerId !== playerId) {
        // Track disconnect time for status display
        setOpponentDisconnectedTime(Date.now());
      }
    };

    const handlePlayerReconnected = (data: { playerId: string; playerName: string }) => {
      console.log('Player reconnected:', data);
      if (data.playerId !== playerId) {
        // Clear disconnect time
        setOpponentDisconnectedTime(null);
      }
    };

    socketService.on('player-disconnected', handlePlayerDisconnected);
    socketService.on('player-disconnected-active-game', handlePlayerDisconnectedActiveGame);
    socketService.on('player-reconnected', handlePlayerReconnected);

    return () => {
      socketService.off('player-disconnected', handlePlayerDisconnected);
      socketService.off('player-disconnected-active-game', handlePlayerDisconnectedActiveGame);
      socketService.off('player-reconnected', handlePlayerReconnected);
    };
  }, [playerId]);

  // Listen for game over events
  useEffect(() => {
    const handleGameOver = (data: { winnerId: string; reason?: string }) => {
      console.log('Game over event received:', data);
      setGameOverWinnerId(data.winnerId);
      if (data.reason) {
        setGameOverReason(data.reason);
        if (data.reason === 'forfeit' && data.winnerId === playerId) {
          // Show forfeit notification for winner only
          setOpponentDisconnected(true);
          // Clear disconnect tracking
          setOpponentDisconnectedTime(null);
          // Auto-transition to game over screen after a delay
          setTimeout(() => {
            setOpponentDisconnected(false);
          }, 3000);
        }
      }
    };

    socketService.on('game-over', handleGameOver);

    return () => {
      socketService.off('game-over', handleGameOver);
    };
  }, [playerId]);

  // Handle new record notification
  useEffect(() => {
    if (gameState?.newRecordSet && gameState?.state === GameState.ROUND_END) {
      setShowNewRecord(true);
      // Clear after 3 seconds
      const timer = setTimeout(() => {
        setShowNewRecord(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowNewRecord(false);
    }
  }, [gameState?.newRecordSet, gameState?.state]);

  // For spectators, we need to wait for game state but not for player matching
  if (!gameState || (!isSpectator && (!currentPlayer || !opponent))) {
    console.log('[GameScreen] Still loading - missing data:', {
      hasGameState: !!gameState,
      hasCurrentPlayer: !!currentPlayer,
      hasOpponent: !!opponent,
      isSpectator,
      roomId: room?.id,
      isSoloPractice: room?.isSoloPractice,
      playersInRoom: room?.players?.length
    });
    return (
      <div className="game-screen loading">
        <h2>{t('gameScreen.status.loading')}</h2>
      </div>
    );
  }
  
  // For spectators, if players aren't loaded yet, show a different message
  if (isSpectator && (!currentPlayer || !opponent)) {
    return (
      <div className="game-screen loading">
        <h2>{t('gameScreen.status.waitingForData')}</h2>
      </div>
    );
  }

  return (
    <div className="game-screen">
      {/* Minimal Game Header */}
      <div className="game-header minimal">
        <div className="game-info compact">
          <span className="room-code">{room.id}</span>
          <span className="round-indicator">R{currentRound}</span>
          {isSpectator && <span className="spectator-icon">👁️</span>}
        </div>
        
        <div className="status-mini">{getStatusMessage()}</div>

        <button className="leave-btn minimal" onClick={onLeaveGame}>
          ✕
        </button>
      </div>

      {/* Opponent Area */}
      <div className="opponent-area">
        {opponent && (
          <PlayerHand 
            player={opponent} 
            isCurrentPlayer={false}
            isDisconnected={!!opponentDisconnectedTime}
            roomType={room.roomType}
          />
        )}
      </div>

      {/* Game Board */}
      <div className="game-board">
        {/* Center Table */}
        <div className="center-area">
          {/* Puzzle Records */}
          {(() => {
            console.log('[GameScreen] Puzzle Records check:', {
              gameState: gameState?.state,
              isPlaying: gameState?.state === GameState.PLAYING,
              hasPuzzleStats: !!gameState?.currentPuzzleStats,
              puzzleStats: gameState?.currentPuzzleStats
            });
            return gameState?.state === GameState.PLAYING && gameState?.currentPuzzleStats && (
              <PuzzleRecords
                occurrenceCount={gameState.currentPuzzleStats.occurrenceCount}
                bestRecord={gameState.currentPuzzleStats.bestRecord}
                showNewRecord={showNewRecord}
              />
            );
          })()}
          
          <InteractiveCenterTable 
            cards={centerCards}
            onSolutionFound={handleDirectSolution}
            disabled={isSpectator || gameState?.state !== GameState.PLAYING}
            allowInteraction={!isSpectator && gameState?.state === GameState.PLAYING && centerCards.length > 0}
          />
          {gameState?.roomType === 'super' && (
            <div className="super-mode-hint">
              <svg className="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v6m0 4v6m0 4v2m0-18a2 2 0 110 4 2 2 0 010-4zm0 8a2 2 0 110 4 2 2 0 010-4z" />
              </svg>
              <span>{t('gameScreen.hints.superMode')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Player Area */}
      <div className="player-area">
        {currentPlayer && (
          <PlayerHand 
            player={currentPlayer} 
            isCurrentPlayer={true}
            roomType={room.roomType}
          />
        )}
      </div>


      {/* Round Result Modal */}
      {roundResult && gameState.state === GameState.ROUND_END && !showingSolutionReplay && (
        <RoundResult
          winnerId={roundResult.winnerId}
          winnerName={isSpectator 
            ? (gameState.players.find(p => p.id === roundResult.winnerId)?.name || 'Winner')
            : (roundResult.winnerId === playerId ? (currentPlayer?.name || 'Player') : (opponent?.name || 'Opponent'))}
          loserId={roundResult.loserId}
          loserName={isSpectator
            ? (gameState.players.find(p => p.id === roundResult.loserId)?.name || 'Loser')
            : (roundResult.loserId === playerId ? (currentPlayer?.name || 'Player') : (opponent?.name || 'Opponent'))}
          solution={roundResult.solution}
          reason={roundResult.reason}
          onContinue={() => setRoundResult(null)}
          hideForReplay={showingSolutionReplay}
        />
      )}

      {/* Solution Replay */}
      {showingSolutionReplay && replaySolution && (
        <SolutionReplay
          solution={replaySolution}
          onComplete={() => {
            console.log('[GameScreen] Solution replay completed');
            setReplayCompleting(true);
            // Add a small delay before hiding to ensure animations complete
            setTimeout(() => {
              setShowingSolutionReplay(false);
              setReplaySolution(null);
              setReplayCompleting(false);
            }, 300);
          }}
          autoPlay={true}
          speed={1.5}
          autoSkip={gameState?.isSoloPractice}
        />
      )}

      {/* Card Transfer Animation */}
      {transferringCards && (
        <CardTransfer
          cards={transferringCards.cards}
          fromPosition="center"
          toPosition={transferringCards.toPlayer === 'current' ? 'bottom' : 'top'}
          onComplete={() => setTransferringCards(null)}
          duration={1000}
        />
      )}

      {/* Victory Celebration */}
      {showVictoryCelebration && (
        <VictoryCelebration
          playerName={showVictoryCelebration}
          onComplete={() => setShowVictoryCelebration(null)}
        />
      )}

      {/* Game Over Modal */}
      {gameState.state === GameState.GAME_OVER && (
        <GameOverEnhanced
          gameState={gameState}
          playerId={playerId}
          onRematch={resetGame}
          onLeaveGame={onLeaveGame}
          gameOverReason={gameOverReason}
          gameOverWinnerId={gameOverWinnerId}
          isSpectator={isSpectator}
        />
      )}

      {/* Opponent Disconnection Notification - Shows after forfeit */}
      {opponentDisconnected && gameOverReason === 'forfeit' && (
        <>
          {console.log('Rendering DisconnectNotification for forfeit victory')}
          <DisconnectNotification
            opponentName={opponent?.name || 'Opponent'}
            onReturnToLobby={() => setOpponentDisconnected(false)}
            timeoutSeconds={3}
            isVictory={true}
          />
        </>
      )}
    </div>
  );
};