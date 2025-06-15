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
  reason: 'correct_solution' | 'incorrect_solution' | 'no_solution';
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
  private currentClaimant: string | null = null;
  private roundStartTime: number = 0;
  private lastRoundResult: RoundResult | null = null;
  private gameOverResult: GameOverResult | null = null;
  private onRedealCallback?: () => void;
  private onReplayEndCallback?: () => void;
  private replaySkipRequests: Set<string> = new Set();
  private replayTimeout?: NodeJS.Timeout;

  constructor(room: GameRoom) {
    this.room = room;
    this.deckManager = new DeckManager();
  }

  /**
   * Set callback for when cards are redealt
   */
  setOnRedealCallback(callback: () => void): void {
    this.onRedealCallback = callback;
  }

  /**
   * Set callback for when replay ends
   */
  setOnReplayEndCallback(callback: () => void): void {
    this.onReplayEndCallback = callback;
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
    
    // Initialize battle statistics
    this.room.roundTimes = {
      [player1.id]: [],
      [player2.id]: []
    };
    this.room.firstSolves = {
      [player1.id]: 0,
      [player2.id]: 0
    };
    this.room.correctSolutions = {
      [player1.id]: 0,
      [player2.id]: 0
    };
    this.room.incorrectAttempts = {
      [player1.id]: 0,
      [player2.id]: 0
    };
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
    // Check if game should end before starting new round
    const player1 = this.room.players[0];
    const player2 = this.room.players[1];
    
    // Check if either player would have insufficient cards for a new round
    console.log(`[GameStateManager] Pre-round check - P1 deck: ${player1.deck.length}, P2 deck: ${player2.deck.length}`);
    if (player1.deck.length < 2 || player2.deck.length < 2) {
      // Determine winner based on who has fewer cards
      console.log(`[GameStateManager] Insufficient cards for new round - ending game`);
      if (player1.deck.length < player2.deck.length) {
        this.endGame(player1.id);
      } else {
        this.endGame(player2.id);
      }
      return;
    }
    
    this.room.currentRound++;
    this.roundStartTime = Date.now();
    
    // Deal cards to center
    const dealtCards = this.deckManager.dealCards(
      this.room.players[0].deck,
      this.room.players[1].deck
    );
    
    // Double-check if these cards have a solution
    const cardValues = dealtCards.map(c => c.value);
    const hasSolution = Calculator.hasSolution(cardValues);
    
    if (!hasSolution) {
      console.log('No solution found for cards:', cardValues, '- returning cards and redealing');
      
      // Return cards to their respective owners
      const player1Cards = dealtCards.filter(c => c.owner === 'player1');
      const player2Cards = dealtCards.filter(c => c.owner === 'player2');
      
      // Add cards back to the bottom of each player's deck
      this.room.players[0].deck.push(...player1Cards);
      this.room.players[1].deck.push(...player2Cards);
      
      // Notify about redeal if callback is set
      if (this.onRedealCallback) {
        this.onRedealCallback();
      }
      
      // Try again with a small delay
      setTimeout(() => {
        this.startNewRound();
      }, 100);
      
      return;
    }
    
    this.room.centerCards = dealtCards;
    this.room.state = GameState.PLAYING;
    console.log('New round started with cards:', cardValues);
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

    console.log(`[GameStateManager] Solution claimed by ${player.name} (${playerId})`);
    this.currentClaimant = playerId;
    
    // Track who claimed first
    if (this.room.firstSolves) {
      this.room.firstSolves[playerId]++;
    }
    
    this.room.state = GameState.SOLVING;
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

    // Calculate solve time
    const solveTime = (Date.now() - this.roundStartTime) / 1000; // in seconds
    
    // Validate solution
    const validation = Calculator.validateSolution(solution.cards, solution.operations);
    console.log(`[GameStateManager] Solution submitted by ${playerId}: result=${validation.result}, valid=${validation.isValid}`);
    
    if (validation.isValid) {
      // Player wins
      const otherPlayer = this.room.players.find(p => p.id !== playerId);
      
      // Track statistics
      if (this.room.roundTimes && this.room.roundTimes[playerId]) {
        this.room.roundTimes[playerId].push(solveTime);
      }
      if (this.room.correctSolutions) {
        this.room.correctSolutions[playerId]++;
      }
      
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
      
      // Track incorrect attempts
      if (this.room.incorrectAttempts) {
        this.room.incorrectAttempts[playerId]++;
      }
      
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
    this.currentClaimant = null;
    this.room.state = GameState.ROUND_END;
    this.lastRoundResult = result;

    // Transfer cards based on result
    if (result.winnerId && result.loserId) {
      const winner = this.room.players.find(p => p.id === result.winnerId);
      const loser = this.room.players.find(p => p.id === result.loserId);
      
      if (winner && loser) {
        // Loser takes all center cards
        console.log(`[GameStateManager] Round ended - Winner: ${winner.name} (${winner.id}), Loser: ${loser.name} (${loser.id})`);
        console.log(`[GameStateManager] Before transfer - Winner deck: ${winner.deck.length}, Loser deck: ${loser.deck.length}`);
        loser.deck.push(...result.cards);
        console.log(`[GameStateManager] After transfer - Winner deck: ${winner.deck.length}, Loser deck: ${loser.deck.length} (added ${result.cards.length} cards)`);
        
        // Update scores
        this.room.scores[result.winnerId]++;
        
        // Check win condition
        console.log(`[GameStateManager] Checking win condition - Winner deck: ${winner.deck.length}, Loser deck: ${loser.deck.length}`);
        if (winner.deck.length === 0) {
          // Winner has no cards left - they win!
          console.log(`[GameStateManager] Game Over - ${result.winnerId} wins (no cards)`);
          this.endGame(result.winnerId);
          return;
        } else if (loser.deck.length === 20) {
          // Loser has all cards - they lose!
          console.log(`[GameStateManager] Game Over - ${result.winnerId} wins (opponent has all cards)`);
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

    // Check if we should show replay (only for correct solutions)
    if (result.reason === 'correct_solution' && result.solution && 
        result.solution.operations && result.solution.operations.length > 0) {
      // Enter replay state
      this.room.state = GameState.REPLAY;
      this.replaySkipRequests.clear();
      
      // Set a timeout for replay duration (7 seconds)
      this.replayTimeout = setTimeout(() => {
        this.endReplay();
      }, 7000);
    } else {
      // No replay needed, start next round after a delay
      setTimeout(() => {
        if (this.room.state === GameState.ROUND_END) {
          this.startNewRound();
        }
      }, 3000);
    }
  }

  /**
   * End the game
   */
  private endGame(winnerId: string): void {
    // Clear any pending timers
    this.room.state = GameState.GAME_OVER;
    
    // Ensure center cards are cleared (they should have been transferred already)
    console.log(`[GameStateManager] Game ending - Center cards: ${this.room.centerCards.length}`);
    if (this.room.centerCards.length > 0) {
      console.warn('[GameStateManager] WARNING: Center cards not empty at game end!');
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
    
    console.log(`[GameStateManager] Game Over - Winner: ${winnerId}, Reason: ${reason}`);
    console.log(`[GameStateManager] Final decks - P1: ${this.room.players[0].deck.length}, P2: ${this.room.players[1].deck.length}`);
    
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

  /**
   * Request to skip replay
   */
  requestSkipReplay(playerId: string): boolean {
    if (this.room.state !== GameState.REPLAY) {
      return false;
    }

    // Add player to skip requests
    this.replaySkipRequests.add(playerId);
    console.log(`[GameStateManager] Player ${playerId} requested to skip replay. Total requests: ${this.replaySkipRequests.size}/2`);

    // If both players want to skip, end replay early
    if (this.replaySkipRequests.size >= 2) {
      if (this.replayTimeout) {
        clearTimeout(this.replayTimeout);
        this.replayTimeout = undefined;
      }
      this.endReplay();
      return true;
    }

    return false;
  }

  /**
   * End replay and start next round
   */
  private endReplay(): void {
    if (this.room.state !== GameState.REPLAY) {
      return;
    }

    console.log('[GameStateManager] Ending replay, transitioning to next round');
    this.replaySkipRequests.clear();
    
    // Clear timeout if it exists
    if (this.replayTimeout) {
      clearTimeout(this.replayTimeout);
      this.replayTimeout = undefined;
    }

    // Transition directly to playing state and start new round
    this.room.state = GameState.PLAYING;
    this.startNewRound();
    
    // Notify that replay ended
    if (this.onReplayEndCallback) {
      this.onReplayEndCallback();
    }
  }
}