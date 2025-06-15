import React, { useState, useEffect } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { InteractiveCenterTable } from '../InteractiveCenterTable/InteractiveCenterTable';
import { PlayerHand } from '../PlayerHand/PlayerHand';
import { SolutionBuilder } from '../SolutionBuilder/SolutionBuilder';
import { RoundTimer } from '../RoundTimer/RoundTimer';
import { RoundResult } from '../RoundResult/RoundResult';
import { GameOver } from '../GameOver/GameOver';
import { CardTransfer } from '../CardTransfer/CardTransfer';
import socketService from '../../services/socketService';
import type { GameRoom, Solution, Card, Operation } from '../../types/game.types';
import { GameState } from '../../types/game.types';
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
    isMyTurn,
    canClaimSolution,
    isSolving,
    timeRemaining,
    claimSolution,
    submitSolution,
    resetGame
  } = useGameState(playerId);

  const [showSolutionBuilder, setShowSolutionBuilder] = useState(false);
  const [solutionResult, setSolutionResult] = useState<{ success: boolean; message: string } | null>(null);
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

  // Get current player and opponent
  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const opponent = gameState?.players.find(p => p.id !== playerId);

  // Show solution builder when it's player's turn
  useEffect(() => {
    if (isMyTurn && isSolving) {
      setShowSolutionBuilder(true);
      setSolutionResult(null);
    } else {
      setShowSolutionBuilder(false);
    }
  }, [isMyTurn, isSolving]);

  // Handle solution submission
  const handleSubmitSolution = (operations: Operation[]) => {
    // Construct a proper Solution object from the operations
    const solution: Solution = {
      cards: centerCards,
      operations: operations,
      result: operations.length > 0 ? operations[operations.length - 1].result : 0
    };
    
    submitSolution(solution);
    setShowSolutionBuilder(false);
  };

  // Handle solution builder cancel
  const handleCancelSolution = () => {
    setShowSolutionBuilder(false);
  };

  // Handle direct solution from interactive table
  const handleDirectSolution = (expression: string, result: number) => {
    // Auto-claim and submit solution
    if (canClaimSolution) {
      claimSolution();
      // Submit the solution after a brief delay to allow state update
      setTimeout(() => {
        // For direct solutions, we need to parse the expression to create operations
        // For now, just create a minimal solution with the result
        const solution: Solution = {
          cards: centerCards,
          operations: [], // TODO: Parse expression to create operations
          result: result
        };
        submitSolution(solution);
      }, 100);
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        if (isSolving) {
          return 'Submit your solution!';
        } else {
          return 'Opponent is solving...';
        }
      case GameState.ROUND_END:
        return 'Round ended!';
      case GameState.GAME_OVER:
        return 'Game Over!';
      default:
        return '';
    }
  };

  // Listen for solution results
  useEffect(() => {
    const handleRoundEnded = (data: { winnerId: string; loserId: string; solution: Solution; correct: boolean; reason?: string }) => {
      // Show round result screen
      setRoundResult({
        winnerId: data.winnerId,
        loserId: data.loserId,
        solution: data.solution,
        reason: data.reason as any || (data.correct ? 'correct_solution' : 'incorrect_solution')
      });
      
      // Clear solution builder
      setShowSolutionBuilder(false);
      setSolutionResult(null);
      
      // Show card transfer animation after round result
      if (data.winnerId && data.loserId && centerCards.length > 0) {
        setTimeout(() => {
          setTransferringCards({
            cards: [...centerCards],
            toPlayer: data.loserId === playerId ? 'current' : 'opponent'
          });
        }, 2500);
      }
    };

    const handleClaimError = (data: { message: string }) => {
      setSolutionResult({ success: false, message: data.message });
      setTimeout(() => setSolutionResult(null), 3000);
    };

    const handleSubmitError = (data: { message: string }) => {
      setSolutionResult({ success: false, message: data.message });
      setTimeout(() => setSolutionResult(null), 3000);
    };

    socketService.on('round-ended', handleRoundEnded);
    socketService.on('claim-error', handleClaimError);  
    socketService.on('submit-error', handleSubmitError);
    
    return () => {
      socketService.off('round-ended', handleRoundEnded);
      socketService.off('claim-error', handleClaimError);
      socketService.off('submit-error', handleSubmitError);
    };
  }, [playerId]);

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
          {timeRemaining !== null && (
            <RoundTimer 
              timeRemaining={timeRemaining} 
              isUrgent={timeRemaining <= 10}
            />
          )}
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
            disabled={!canClaimSolution || gameState.state !== GameState.PLAYING}
            allowInteraction={gameState.state === GameState.PLAYING && centerCards.length === 4}
          />

          {/* Solution Result Message */}
          {solutionResult && (
            <div className={`solution-result ${solutionResult.success ? 'success' : 'failure'}`}>
              {solutionResult.message}
            </div>
          )}
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

      {/* Solution Builder Modal */}
      {showSolutionBuilder && (
        <div className="solution-modal">
          <div className="solution-modal-content">
            <h2>Build Your Solution</h2>
            <div className="solution-timer">
              Time remaining: {timeRemaining ? formatTime(timeRemaining) : '0:00'}
            </div>
            <SolutionBuilder 
              cards={centerCards}
              onSubmit={handleSubmitSolution}
              onCancel={handleCancelSolution}
            />
          </div>
        </div>
      )}

      {/* Round Result Modal */}
      {roundResult && gameState.state === GameState.ROUND_END && (
        <RoundResult
          winnerId={roundResult.winnerId}
          winnerName={roundResult.winnerId === playerId ? currentPlayer.name : opponent.name}
          loserId={roundResult.loserId}
          loserName={roundResult.loserId === playerId ? currentPlayer.name : opponent.name}
          solution={roundResult.solution}
          reason={roundResult.reason}
          onContinue={() => setRoundResult(null)}
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

      {/* Game Over Modal */}
      {gameState.state === GameState.GAME_OVER && (
        <GameOver
          gameState={gameState}
          playerId={playerId}
          onRematch={resetGame}
          onLeaveGame={onLeaveGame}
        />
      )}
    </div>
  );
};