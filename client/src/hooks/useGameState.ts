import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import type { GameRoom, Solution, Card } from '../types/game.types';
import { GameState } from '../types/game.types';

interface GameStateHook {
  gameState: GameRoom | null;
  currentRound: number;
  centerCards: Card[];
  isMyTurn: boolean;
  canClaimSolution: boolean;
  isSolving: boolean;
  claimSolution: () => void;
  submitSolution: (solution: Solution) => void;
  requestHint: () => void;
  resetGame: () => void;
}

export const useGameState = (playerId: string | null): GameStateHook => {
  const [gameState, setGameState] = useState<GameRoom | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [centerCards, setCenterCards] = useState<Card[]>([]);
  const [isSolving, setIsSolving] = useState(false);

  // Check if it's player's turn to solve
  const isMyTurn = gameState?.state === GameState.SOLVING && isSolving;

  // Check if player can claim solution
  const canClaimSolution = gameState?.state === GameState.PLAYING && !isSolving;

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Game state update handler
    const handleGameStateUpdate = (state: GameRoom) => {
      setGameState(state);
      setCenterCards(state.centerCards);
      
      // Check if we're still solving
      if (state.state !== GameState.SOLVING) {
        setIsSolving(false);
      }
    };

    // Round started handler
    const handleRoundStarted = (data: { round: number; centerCards: Card[] }) => {
      setCurrentRound(data.round);
      setCenterCards(data.centerCards);
      setIsSolving(false);
    };

    // Solution claimed handler
    const handleSolutionClaimed = (data: { playerId: string; playerName: string }) => {
      if (data.playerId === playerId) {
        setIsSolving(true);
      }
    };

    // Round ended handler
    const handleRoundEnded = () => {
      setIsSolving(false);
    };

    // Game over handler
    const handleGameOver = () => {
      setIsSolving(false);
    };

    // Game reset handler
    const handleGameReset = (state: GameRoom) => {
      setGameState(state);
      setCurrentRound(0);
      setCenterCards([]);
      setIsSolving(false);
    };

    // Register event listeners
    socket.on('game-state-updated', handleGameStateUpdate);
    socket.on('round-started', handleRoundStarted);
    socket.on('solution-claimed', handleSolutionClaimed);
    socket.on('round-ended', handleRoundEnded);
    socket.on('game-over', handleGameOver);
    socket.on('game-reset', handleGameReset);

    // Cleanup
    return () => {
      socket.off('game-state-updated', handleGameStateUpdate);
      socket.off('round-started', handleRoundStarted);
      socket.off('solution-claimed', handleSolutionClaimed);
      socket.off('round-ended', handleRoundEnded);
      socket.off('game-over', handleGameOver);
      socket.off('game-reset', handleGameReset);
    };
  }, [playerId]);

  const claimSolution = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket || !canClaimSolution) return;
    
    socket.emit('claim-solution');
  }, [canClaimSolution]);

  const submitSolution = useCallback((solution: Solution) => {
    const socket = socketService.getSocket();
    if (!socket || !isMyTurn) return;
    
    socket.emit('submit-solution', { solution });
  }, [isMyTurn]);

  const requestHint = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket) return;
    
    socket.emit('request-hint');
  }, []);

  const resetGame = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket) return;
    
    socket.emit('reset-game');
  }, []);

  return {
    gameState,
    currentRound,
    centerCards,
    isMyTurn,
    canClaimSolution,
    isSolving,
    claimSolution,
    submitSolution,
    requestHint,
    resetGame
  };
};