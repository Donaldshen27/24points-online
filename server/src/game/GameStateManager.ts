import { GameRoom, GameState, Player, Card, Solution } from '../types/game.types';
import { DeckManager } from './DeckManager';
import { Calculator } from '../utils/calculator';
import { v4 as uuidv4 } from 'uuid';

export interface GameEvent {
  type: 'round_start' | 'player_claim' | 'solution_attempt' | 'round_end' | 'game_over';
  playerId?: string;
  data?: any;
}

export interface RoundResult {
  winnerId: string | null;
  loserId: string | null;
  cards: Card[];
  solution?: Solution;
  reason: 'correct_solution' | 'incorrect_solution' | 'no_solution' | 'timeout';
}

export interface GameOverResult {
  winnerId: string;
  reason: 'no_cards' | 'all_cards';
  finalScores: { [playerId: string]: number };
  finalDecks: { [playerId: string]: number };
}

export class GameStateManager {
  private room: GameRoom;
  private deckManager: DeckManager;
  private roundTimer: NodeJS.Timeout | null = null;
  private claimTimer: NodeJS.Timeout | null = null;
  private currentClaimant: string | null = null;
  private roundStartTime: number = 0;
  private lastRoundResult: RoundResult | null = null;
  private gameOverResult: GameOverResult | null = null;

  constructor(room: GameRoom) {
    this.room = room;
    this.deckManager = new DeckManager();
  }

  /**
   * Initialize game with two players
   */
  initializeGame(player1: Player, player2: Player): void {
    // Initialize decks
    const { deck1, deck2 } = this.deckManager.initializeDecks();
    
    player1.deck = deck1;
    player2.deck = deck2;
    
    this.room.players = [player1, player2];
    this.room.state = GameState.WAITING;
    this.room.currentRound = 0;
    this.room.scores = {
      [player1.id]: 0,
      [player2.id]: 0
    };
    this.room.centerCards = [];
  }

  /**
   * Start the game when both players are ready
   */
  startGame(): void {
    if (this.room.state !== GameState.WAITING) {
      throw new Error('Game already started');
    }

    if (this.room.players.length !== 2) {
      throw new Error('Need exactly 2 players to start');
    }

    if (!this.room.players.every(p => p.isReady)) {
      throw new Error('All players must be ready');
    }

    this.room.state = GameState.PLAYING;
    this.startNewRound();
  }

  /**
   * Start a new round
   */
  private startNewRound(): void {
    this.room.currentRound++;
    this.roundStartTime = Date.now();
    
    // Deal cards to center
    const dealtCards = this.deckManager.dealCards(
      this.room.players[0].deck,
      this.room.players[1].deck
    );
    
    this.room.centerCards = dealtCards;
    this.room.state = GameState.PLAYING;
    
    // Check if cards have a solution
    const cardValues = dealtCards.map(c => c.value);
    const hasSolution = Calculator.hasSolution(cardValues);
    
    if (!hasSolution) {
      // Auto-end round after 10 seconds if no solution exists
      this.roundTimer = setTimeout(() => {
        this.endRound({
          winnerId: null,
          loserId: null,
          cards: dealtCards,
          reason: 'no_solution'
        });
      }, 10000);
    } else {
      // Set a 2-minute timeout for the round
      this.roundTimer = setTimeout(() => {
        this.endRound({
          winnerId: null,
          loserId: null,
          cards: dealtCards,
          reason: 'timeout'
        });
      }, 120000);
    }
  }

  /**
   * Handle player claiming they know the solution
   */
  claimSolution(playerId: string): void {
    if (this.room.state !== GameState.PLAYING) {
      throw new Error('Cannot claim solution in current state');
    }

    if (this.currentClaimant) {
      throw new Error('Another player already claimed');
    }

    const player = this.room.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    this.currentClaimant = playerId;
    this.room.state = GameState.SOLVING;
    
    // Clear round timer
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    
    // Give player 30 seconds to submit solution
    this.claimTimer = setTimeout(() => {
      // Timeout - player loses
      const otherPlayer = this.room.players.find(p => p.id !== playerId);
      this.endRound({
        winnerId: otherPlayer?.id || null,
        loserId: playerId,
        cards: this.room.centerCards,
        reason: 'incorrect_solution'
      });
    }, 30000);
  }

  /**
   * Submit a solution attempt
   */
  submitSolution(playerId: string, solution: Solution): void {
    if (this.room.state !== GameState.SOLVING) {
      throw new Error('Not in solving state');
    }

    if (this.currentClaimant !== playerId) {
      throw new Error('Player did not claim solution');
    }

    // Clear claim timer
    if (this.claimTimer) {
      clearTimeout(this.claimTimer);
      this.claimTimer = null;
    }

    // Validate solution
    const validation = Calculator.validateSolution(solution.cards, solution.operations);
    
    if (validation.isValid) {
      // Player wins
      const otherPlayer = this.room.players.find(p => p.id !== playerId);
      this.endRound({
        winnerId: playerId,
        loserId: otherPlayer?.id || null,
        cards: this.room.centerCards,
        solution,
        reason: 'correct_solution'
      });
    } else {
      // Player loses
      const otherPlayer = this.room.players.find(p => p.id !== playerId);
      this.endRound({
        winnerId: otherPlayer?.id || null,
        loserId: playerId,
        cards: this.room.centerCards,
        reason: 'incorrect_solution'
      });
    }
  }

  /**
   * End the current round
   */
  private endRound(result: RoundResult): void {
    // Clear timers
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    if (this.claimTimer) {
      clearTimeout(this.claimTimer);
      this.claimTimer = null;
    }

    this.currentClaimant = null;
    this.room.state = GameState.ROUND_END;
    this.lastRoundResult = result;

    // Transfer cards based on result
    if (result.winnerId && result.loserId) {
      const winner = this.room.players.find(p => p.id === result.winnerId);
      const loser = this.room.players.find(p => p.id === result.loserId);
      
      if (winner && loser) {
        // Loser takes all center cards
        loser.deck.push(...result.cards);
        
        // Update scores
        this.room.scores[result.winnerId]++;
        
        // Check win condition
        if (winner.deck.length === 0) {
          // Winner has no cards left - they win!
          this.endGame(result.winnerId);
          return;
        } else if (loser.deck.length === 20) {
          // Loser has all cards - they lose!
          this.endGame(result.winnerId);
          return;
        }
      }
    } else {
      // No winner (timeout or no solution) - each player takes their own cards back
      const player1Cards = result.cards.filter(c => c.owner === 'player1');
      const player2Cards = result.cards.filter(c => c.owner === 'player2');
      
      this.room.players[0].deck.push(...player1Cards);
      this.room.players[1].deck.push(...player2Cards);
    }

    // Clear center cards
    this.room.centerCards = [];

    // Start next round after a delay
    setTimeout(() => {
      if (this.room.state === GameState.ROUND_END) {
        this.startNewRound();
      }
    }, 3000);
  }

  /**
   * End the game
   */
  private endGame(winnerId: string): void {
    this.room.state = GameState.GAME_OVER;
    
    // Clear any remaining timers
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    if (this.claimTimer) {
      clearTimeout(this.claimTimer);
      this.claimTimer = null;
    }
    
    // Determine game over reason
    const winner = this.room.players.find(p => p.id === winnerId);
    const loser = this.room.players.find(p => p.id !== winnerId);
    
    let reason: 'no_cards' | 'all_cards' = 'no_cards';
    if (winner && winner.deck.length === 0) {
      reason = 'no_cards';
    } else if (loser && loser.deck.length === 20) {
      reason = 'all_cards';
    }
    
    // Store game over result
    this.gameOverResult = {
      winnerId,
      reason,
      finalScores: { ...this.room.scores },
      finalDecks: {
        [this.room.players[0].id]: this.room.players[0].deck.length,
        [this.room.players[1].id]: this.room.players[1].deck.length
      }
    };
  }

  /**
   * Get current game state
   */
  getState(): GameRoom {
    return { ...this.room };
  }

  /**
   * Get safe state for a specific player (hide opponent's deck)
   */
  getStateForPlayer(playerId: string): any {
    const state = this.getState();
    const playerIndex = state.players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1) return state;
    
    // Hide opponent's deck values
    const safeState = { ...state };
    safeState.players = state.players.map((player, index) => {
      if (index !== playerIndex) {
        return {
          ...player,
          deck: player.deck.map(card => ({ ...card, value: -1 })) // Hide values
        };
      }
      return player;
    });
    
    return safeState;
  }

  /**
   * Handle player disconnection
   */
  handleDisconnect(playerId: string): void {
    const player = this.room.players.find(p => p.id === playerId);
    if (!player) return;

    // If game hasn't started, just remove the player
    if (this.room.state === GameState.WAITING) {
      this.room.players = this.room.players.filter(p => p.id !== playerId);
      return;
    }

    // If game is in progress, pause and wait for reconnection
    // This could be enhanced with a reconnection timeout
    player.socketId = ''; // Clear socket ID but keep player in game
  }

  /**
   * Handle player reconnection
   */
  handleReconnect(playerId: string, socketId: string): void {
    const player = this.room.players.find(p => p.id === playerId);
    if (!player) return;

    player.socketId = socketId;
  }

  /**
   * Get the last round result
   */
  getLastRoundResult(): RoundResult | null {
    return this.lastRoundResult;
  }

  /**
   * Get the game over result
   */
  getGameOverResult(): GameOverResult | null {
    return this.gameOverResult;
  }

  /**
   * Reset game to initial state
   */
  resetGame(): void {
    // Clear timers
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    if (this.claimTimer) {
      clearTimeout(this.claimTimer);
      this.claimTimer = null;
    }

    // Reset state
    this.room.state = GameState.WAITING;
    this.room.currentRound = 0;
    this.room.centerCards = [];
    this.currentClaimant = null;
    this.lastRoundResult = null;
    this.gameOverResult = null;
    
    // Reset player states
    this.room.players.forEach(player => {
      player.isReady = false;
      player.deck = [];
    });
    
    // Reset scores
    this.room.scores = {};
    this.room.players.forEach(player => {
      this.room.scores[player.id] = 0;
    });
  }
}