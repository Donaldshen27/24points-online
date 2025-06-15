import React, { useState, useEffect } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { InteractiveCenterTable } from '../InteractiveCenterTable/InteractiveCenterTable';
import { PlayerHand } from '../PlayerHand/PlayerHand';
import { RoundResult } from '../RoundResult/RoundResult';
import { GameOver } from '../GameOver/GameOver';
import { CardTransfer } from '../CardTransfer/CardTransfer';
import socketService from '../../services/socketService';
import type { GameRoom, Solution, Card } from '../../types/game.types';
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
        // For now, create a minimal solution - in production, you'd parse the expression
        const solution: Solution = {
          cards: centerCards,
          operations: [], // The server mainly cares about the result being 24
          result: 24
        };
        socket.emit('submit-solution', { solution });
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