import React, { useState, useEffect } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { CenterTable } from '../CenterTable/CenterTable';
import { PlayerHand } from '../PlayerHand/PlayerHand';
import { SolutionBuilder } from '../SolutionBuilder/SolutionBuilder';
import { RoundTimer } from '../RoundTimer/RoundTimer';
import { RoundResult } from '../RoundResult/RoundResult';
import socketService from '../../services/socketService';
import type { GameRoom, Solution } from '../../types/game.types';
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
  const handleSubmitSolution = (solution: Solution) => {
    submitSolution(solution);
    setShowSolutionBuilder(false);
  };

  // Handle solution builder cancel
  const handleCancelSolution = () => {
    setShowSolutionBuilder(false);
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
    const handleRoundEnded = (data: { winnerId: string; loserId: string; solution: Solution; correct: boolean }) => {
      const message = data.winnerId === playerId 
        ? '✅ Correct! You won this round!' 
        : data.correct 
          ? '❌ Your opponent solved it!' 
          : '❌ Wrong answer! You get the cards.';
      
      setSolutionResult({ 
        success: data.winnerId === playerId, 
        message 
      });
      
      setTimeout(() => setSolutionResult(null), 3000);
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
          <CenterTable cards={centerCards} />
          
          {/* Action Button */}
          {canClaimSolution && centerCards.length === 4 && (
            <button 
              className="claim-solution-btn"
              onClick={claimSolution}
            >
              I know it! 🎯
            </button>
          )}

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

      {/* Game Over Modal */}
      {gameState.state === GameState.GAME_OVER && (
        <div className="game-over-modal">
          <div className="game-over-content">
            <h2>Game Over!</h2>
            <div className="winner-info">
              {gameState.scores[playerId] > gameState.scores[opponent.id] ? '🎉 You Win! 🎉' : '😢 You Lose 😢'}
            </div>
            <div className="final-stats">
              <div>Your cards: {currentPlayer.deck.length}</div>
              <div>Opponent cards: {opponent.deck.length}</div>
            </div>
            <button className="play-again-btn" onClick={resetGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};