import React, { useState, useEffect } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { InteractiveCenterTable } from '../InteractiveCenterTable/InteractiveCenterTable';
import { PlayerHand } from '../PlayerHand/PlayerHand';
import { RoundResult } from '../RoundResult/RoundResult';
import { GameOverEnhanced } from '../GameOver/GameOverEnhanced';
import { CardTransfer } from '../CardTransfer/CardTransfer';
import { SolutionReplay } from '../SolutionReplay/SolutionReplay';
import { VictoryCelebration } from '../VictoryCelebration/VictoryCelebration';
import socketService from '../../services/socketService';
import type { GameRoom, Solution, Card } from '../../types/game.types';
import { GameState } from '../../types/game.types';
import { Calculator } from '../../utils/calculator';
import './GameScreen.css';

interface GameScreenProps {
  room: GameRoom;
  playerId: string;
  onLeaveGame: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ room, playerId, onLeaveGame }) => {
  const {
    gameState,
    currentRound,
    centerCards,
    resetGame
  } = useGameState(playerId);

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

  // Get current player and opponent
  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const opponent = gameState?.players.find(p => p.id !== playerId);



  // Handle direct solution from interactive table
  const handleDirectSolution = (expression: string, result: number) => {
    console.log('Solution found!', { expression, result });
    
    // Check if it's exactly 24
    if (Math.abs(result - 24) < 0.0001 && gameState?.state === GameState.PLAYING) {
      // First claim the solution
      const socket = socketService.getSocket();
      if (!socket) return;
      
      // Emit claim and solution together
      socket.emit('claim-solution');
      
      // Small delay to ensure claim is processed
      setTimeout(() => {
        // Find a valid solution with operations
        const operations = Calculator.findSolutionOperations(centerCards);
        
        if (operations) {
          const solution: Solution = {
            cards: centerCards,
            operations: operations,
            result: 24
          };
          console.log('Submitting solution:', solution);
          socket.emit('submit-solution', { solution });
        } else {
          console.error('Could not find valid operations for 24');
          // This should not happen since we already verified result is 24
          // But as a fallback, submit empty operations
          const solution: Solution = {
            cards: centerCards,
            operations: [],
            result: result
          };
          socket.emit('submit-solution', { solution });
        }
      }, 50);
    }
  };


  // Get status message
  const getStatusMessage = (): string => {
    if (!gameState) return 'Loading...';
    
    switch (gameState.state) {
      case GameState.WAITING:
        return 'Waiting for players...';
      case GameState.PLAYING:
        return `Round ${currentRound} - Find a solution!`;
      case GameState.SOLVING:
        return 'Race to solve!';
      case GameState.ROUND_END:
        return 'Round ended!';
      case GameState.GAME_OVER:
        return 'Game Over!';
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
        const transferDelay = hasReplay ? 8000 : 2500; // Longer delay if replay
        
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
      console.error('Claim error:', data.message);
    };

    const handleSubmitError = (data: { message: string }) => {
      console.error('Submit error:', data.message);
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

  if (!gameState || !currentPlayer || !opponent) {
    return (
      <div className="game-screen loading">
        <h2>Loading game...</h2>
      </div>
    );
  }

  return (
    <div className="game-screen">
      {/* Game Header */}
      <div className="game-header">
        <div className="game-info">
          <h2>Room: {room.id}</h2>
          <div className="round-info">Round {currentRound}</div>
        </div>
        
        <div className="game-status">
          <div className="status-message">{getStatusMessage()}</div>
        </div>

        <button className="leave-btn" onClick={onLeaveGame}>
          Leave Game
        </button>
      </div>

      {/* Opponent Area */}
      <div className="opponent-area">
        <PlayerHand 
          player={opponent} 
          isCurrentPlayer={false}
          showCards={false}
        />
      </div>

      {/* Game Board */}
      <div className="game-board">
        {/* Center Table */}
        <div className="center-area">
          <InteractiveCenterTable 
            cards={centerCards}
            onSolutionFound={handleDirectSolution}
            disabled={gameState?.state !== GameState.PLAYING}
            allowInteraction={gameState?.state === GameState.PLAYING && centerCards.length === 4}
          />

        </div>
      </div>

      {/* Current Player Area */}
      <div className="player-area">
        <PlayerHand 
          player={currentPlayer} 
          isCurrentPlayer={true}
          showCards={true}
        />
      </div>


      {/* Round Result Modal */}
      {roundResult && gameState.state === GameState.ROUND_END && !showingSolutionReplay && (
        <RoundResult
          winnerId={roundResult.winnerId}
          winnerName={roundResult.winnerId === playerId ? currentPlayer.name : opponent.name}
          loserId={roundResult.loserId}
          loserName={roundResult.loserId === playerId ? currentPlayer.name : opponent.name}
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
          speed={1}
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
        />
      )}
    </div>
  );
};