import { GameRoom, GameState, Player, Card, Solution } from '../types/game.types';
import { DeckManager } from './DeckManager';
import { Calculator } from '../utils/calculator';
import { v4 as uuidv4 } from 'uuid';
import { RoomTypeConfig } from '../types/roomTypes';
import { BaseGameRules } from './rules/BaseGameRules';
import { ClassicGameRules } from './rules/ClassicGameRules';
import { SuperGameRules } from './rules/SuperGameRules';
import { ExtendedGameRules } from './rules/ExtendedGameRules';
import { trackPuzzle, recordSolveTime, getPuzzleStats, isNewRecord } from '../models/puzzleRepository';

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
  reason: 'no_cards' | 'all_cards' | 'forfeit';
  finalScores: { [playerId: string]: number };
  finalDecks: { [playerId: string]: number };
}

export class GameStateManager {
  protected room: GameRoom;
  protected deckManager: DeckManager;
  protected currentClaimant: string | null = null;
  protected roundStartTime: number = 0;
  protected lastRoundResult: RoundResult | null = null;
  protected gameOverResult: GameOverResult | null = null;
  protected onRedealCallback?: () => void;
  protected onReplayEndCallback?: () => void;
  protected onGameOverCallback?: () => void;
  protected onGameStateChangeCallback?: () => void;
  protected replaySkipRequests: Set<string> = new Set();
  protected replayTimeout?: NodeJS.Timeout;
  protected disconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  protected static readonly DISCONNECT_TIMEOUT_MS = 30000; // 30 seconds
  protected config: RoomTypeConfig;
  protected gameRules: BaseGameRules;

  constructor(room: GameRoom, config?: RoomTypeConfig) {
    this.room = room;
    this.deckManager = new DeckManager();
    
    // Use provided config or default to classic
    this.config = config || {
      id: 'classic',
      displayName: 'Classic 1v1',
      description: 'Traditional 2-player 24 points game',
      playerCount: 2,
      cardsPerPlayer: 10,
      cardsPerDraw: 2,
      teamBased: false,
      minPlayers: 2,
      maxPlayers: 2,
      rules: {
        turnTimeLimit: 120,
        solutionTimeLimit: 30,
        scoringSystem: 'classic',
        winCondition: 'no_cards',
        allowSpectators: false,
        requireExactMatch: true,
      },
      features: {
        hasTimer: true,
        hasChat: true,
        hasVoice: false,
        hasReplay: true,
        hasStatistics: true,
        hasTournamentMode: false,
      }
    };
    
    // Create appropriate game rules based on room type
    if (this.config.id === 'super') {
      this.gameRules = new SuperGameRules(this.config);
    } else if (this.config.id === 'extended') {
      this.gameRules = new ExtendedGameRules(this.config);
    } else {
      this.gameRules = new ClassicGameRules(this.config);
    }
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
   * Set callback for when game ends
   */
  setOnGameOverCallback(callback: () => void): void {
    this.onGameOverCallback = callback;
  }

  /**
   * Set callback for when game state changes
   */
  setOnGameStateChangeCallback(callback: () => void): void {
    this.onGameStateChangeCallback = callback;
  }

  /**
   * Initialize game with two players
   */
  initializeGame(player1: Player, player2: Player): void {
    // Use game rules to initialize decks
    this.room.players = [player1, player2];
    this.gameRules.initializeDecks(this.room.players);
    
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
  private async startNewRound(): Promise<void> {
    console.log(`[GameStateManager] Starting new round:`, {
      roomId: this.room.id,
      isSoloPractice: this.room.isSoloPractice,
      currentRound: this.room.currentRound,
      players: this.room.players.map(p => ({ id: p.id, name: p.name, deckSize: p.deck.length }))
    });
    
    // Check if game should end before starting new round
    const player1 = this.room.players[0];
    const player2 = this.room.players[1];
    
    // Check if either player would have insufficient cards for a new round
    const minCardsNeeded = Math.ceil(this.config.cardsPerDraw / this.room.players.length);
    console.log(`[GameStateManager] Pre-round check - P1 deck: ${player1.deck.length}, P2 deck: ${player2.deck.length}, min needed: ${minCardsNeeded}`);
    
    if (player1.deck.length < minCardsNeeded || player2.deck.length < minCardsNeeded) {
      // Determine winner based on who has fewer cards
      console.log(`[GameStateManager] Insufficient cards for new round - ending game`);
      if (player1.deck.length < player2.deck.length) {
        this.endGame(player1.id, 'no_cards');
      } else {
        this.endGame(player2.id, 'no_cards');
      }
      return;
    }
    
    this.room.currentRound++;
    this.roundStartTime = Date.now();
    
    // Use game rules to deal cards
    const dealtCards = this.gameRules.dealCards(this.room);
    
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
      // Shuffle both decks to prevent the same unsolvable combination from appearing again
      this.gameRules.shuffleDeck(this.room.players[0].deck);
      this.gameRules.shuffleDeck(this.room.players[1].deck);
      
      // Notify about redeal if callback is set
      if (this.onRedealCallback) {
        this.onRedealCallback();
      }
      
      // Try again with a small delay
      setTimeout(() => {
        this.startNewRound();
        
        // After successful redeal, emit the new game state
        if (this.room.state === GameState.PLAYING && this.room.centerCards.length > 0) {
          // Trigger a game state update to notify all clients
          if (this.onGameStateChangeCallback) {
            this.onGameStateChangeCallback();
          }
        }
      }, 100);
      
      return;
    }
    
    this.room.centerCards = dealtCards;
    this.room.state = GameState.PLAYING;
    console.log('New round started with cards:', cardValues);
    
    // Track puzzle occurrence and get stats
    trackPuzzle(cardValues).catch(err => console.error('Error tracking puzzle:', err));
    const puzzleStats = await getPuzzleStats(cardValues);
    
    // Store puzzle stats in room for clients to display
    this.room.currentPuzzleStats = {
      occurrenceCount: puzzleStats.occurrenceCount,
      bestRecord: puzzleStats.bestRecord ? {
        username: puzzleStats.bestRecord.username,
        timeSeconds: puzzleStats.bestRecord.solveTimeMs / 1000
      } : null
    };
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
  async submitSolution(playerId: string, solution: Solution): Promise<void> {
    if (this.room.state !== GameState.SOLVING) {
      throw new Error('Not in solving state');
    }

    if (this.currentClaimant !== playerId) {
      throw new Error('Player did not claim solution');
    }

    // Calculate solve time
    const solveTime = (Date.now() - this.roundStartTime) / 1000; // in seconds
    
    // Log the solution details
    console.log(`[GameStateManager] Solution submitted by ${playerId}:`);
    console.log('  Solution cards:', solution.cards?.map(c => ({ value: c.value, id: c.id })));
    console.log('  Solution operations:', solution.operations);
    console.log('  Center cards:', this.room.centerCards.map(c => ({ value: c.value, id: c.id })));
    
    // Validate solution using game rules
    const isValid = this.gameRules.validateSolution(solution, this.room.centerCards);
    console.log(`[GameStateManager] Solution validation result: valid=${isValid}`);
    
    if (isValid) {
      // Player wins
      const otherPlayer = this.room.players.find(p => p.id !== playerId);
      const winner = this.room.players.find(p => p.id === playerId);
      
      // Track statistics
      if (this.room.roundTimes && this.room.roundTimes[playerId]) {
        this.room.roundTimes[playerId].push(solveTime);
      }
      if (this.room.correctSolutions) {
        this.room.correctSolutions[playerId]++;
      }
      
      // Record solve time for puzzle records
      const solveTimeMs = solveTime * 1000; // Convert to milliseconds
      const cardValues = this.room.centerCards.map(c => c.value);
      
      // Convert operations to readable string format
      const solutionSteps = solution.operations?.map(op => 
        `${op.left} ${op.operator} ${op.right} = ${op.result}`
      ).join(' → ') || '';
      
      const wasNewRecord = await isNewRecord(cardValues, solveTimeMs);
      recordSolveTime(
        cardValues, 
        winner?.name || 'Unknown', 
        solveTimeMs,
        solutionSteps,
        playerId
      ).catch(err => console.error('Error recording solve time:', err));
      
      // Store if this was a new record
      this.room.newRecordSet = wasNewRecord;
      
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
        // Shuffle the loser's deck to prevent the same cards from appearing repeatedly
        this.gameRules.shuffleDeck(loser.deck);
        console.log(`[GameStateManager] After transfer - Winner deck: ${winner.deck.length}, Loser deck: ${loser.deck.length} (added ${result.cards.length} cards)`);
        
        // Update scores using game rules scoring
        const timeElapsed = Date.now() - this.roundStartTime;
        const points = result.solution ? 
          this.gameRules.calculateScore(result.solution, timeElapsed) : 1;
        this.room.scores[result.winnerId] += points;
        
        // Check win condition using game rules
        console.log(`[GameStateManager] Checking win condition - Winner deck: ${winner.deck.length}, Loser deck: ${loser.deck.length}`);
        const winResult = this.gameRules.checkWinCondition(this.room);
        if (winResult) {
          console.log(`[GameStateManager] Game Over - ${winResult.winnerId} wins (${winResult.reason})`);
          this.endGame(winResult.winnerId, winResult.reason as any);
          return;
        }
      }
    } else {
      // No winner (timeout or no solution) - each player takes their own cards back
      const player1Cards = result.cards.filter(c => c.owner === 'player1');
      const player2Cards = result.cards.filter(c => c.owner === 'player2');
      
      this.room.players[0].deck.push(...player1Cards);
      this.room.players[1].deck.push(...player2Cards);
      // Shuffle both decks to prevent repetitive patterns
      this.gameRules.shuffleDeck(this.room.players[0].deck);
      this.gameRules.shuffleDeck(this.room.players[1].deck);
    }

    // Clear center cards
    this.room.centerCards = [];
    
    // Clear puzzle record flag after round ends
    this.room.newRecordSet = false;

    // Check if we should show replay (only for correct solutions)
    if (result.reason === 'correct_solution' && result.solution && 
        result.solution.operations && result.solution.operations.length > 0) {
      // Enter replay state
      this.room.state = GameState.REPLAY;
      this.replaySkipRequests.clear();
      
      // In solo practice mode, skip replay immediately
      if (this.room.isSoloPractice) {
        console.log('[GameStateManager] Solo practice mode - skipping replay immediately');
        this.replayTimeout = setTimeout(() => {
          this.endReplay();
        }, 100); // Minimal delay to ensure state updates propagate
      } else {
        // Set a timeout for replay duration (15 seconds to ensure animations complete)
        this.replayTimeout = setTimeout(() => {
          this.endReplay();
        }, 15000);
      }
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
   * Handle auto-forfeit when a player doesn't reconnect in time
   */
  private handleAutoForfeit(playerId: string): void {
    // Remove the timer
    this.disconnectTimers.delete(playerId);
    
    // Find the other player who wins by forfeit
    const otherPlayer = this.room.players.find(p => p.id !== playerId);
    if (!otherPlayer) {
      console.error('[GameStateManager] Cannot find other player for auto-forfeit');
      return;
    }
    
    console.log(`[GameStateManager] Game forfeited by ${playerId}. Winner: ${otherPlayer.id}`);
    
    // End the game with the connected player as winner
    this.endGame(otherPlayer.id, 'forfeit');
  }

  /**
   * End the game
   */
  private endGame(winnerId: string, reason?: 'no_cards' | 'all_cards' | 'forfeit'): void {
    // Clear any pending timers
    this.clearAllTimers();
    this.room.state = GameState.GAME_OVER;
    
    // Ensure center cards are cleared (they should have been transferred already)
    console.log(`[GameStateManager] Game ending - Center cards: ${this.room.centerCards.length}`);
    if (this.room.centerCards.length > 0) {
      console.warn('[GameStateManager] WARNING: Center cards not empty at game end!');
    }
    
    // Determine game over reason
    const winner = this.room.players.find(p => p.id === winnerId);
    const loser = this.room.players.find(p => p.id !== winnerId);
    
    let finalReason: 'no_cards' | 'all_cards' | 'forfeit' = reason || 'no_cards';
    if (!reason) {
      if (winner && winner.deck.length === 0) {
        finalReason = 'no_cards';
      } else if (loser && loser.deck.length === 20) {
        finalReason = 'all_cards';
      }
    }
    
    console.log(`[GameStateManager] Game Over - Winner: ${winnerId}, Reason: ${finalReason}`);
    console.log(`[GameStateManager] Final decks - P1: ${this.room.players[0].deck.length}, P2: ${this.room.players[1].deck.length}`);
    
    // Store game over result
    this.gameOverResult = {
      winnerId,
      reason: finalReason,
      finalScores: { ...this.room.scores },
      finalDecks: {
        [this.room.players[0].id]: this.room.players[0].deck.length,
        [this.room.players[1].id]: this.room.players[1].deck.length
      }
    };
    
    // Notify that game ended
    if (this.onGameOverCallback) {
      this.onGameOverCallback();
    }
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

    // If game is in progress, start auto-forfeit timer
    if (this.room.state === GameState.PLAYING || 
        this.room.state === GameState.SOLVING || 
        this.room.state === GameState.ROUND_END ||
        this.room.state === GameState.REPLAY) {
      
      console.log(`[GameStateManager] Player ${player.name} (${playerId}) disconnected during active game. Starting ${GameStateManager.DISCONNECT_TIMEOUT_MS / 1000}s auto-forfeit timer.`);
      
      // Clear any existing timer for this player
      const existingTimer = this.disconnectTimers.get(playerId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      // Start new auto-forfeit timer
      const timer = setTimeout(() => {
        console.log(`[GameStateManager] Auto-forfeit timer expired for ${player.name} (${playerId}). Forfeiting game.`);
        this.handleAutoForfeit(playerId);
      }, GameStateManager.DISCONNECT_TIMEOUT_MS);
      
      this.disconnectTimers.set(playerId, timer);
    }

    // Clear socket ID but keep player in game
    player.socketId = '';
  }

  /**
   * Handle player reconnection
   */
  handleReconnect(playerId: string, socketId: string): void {
    const player = this.room.players.find(p => p.id === playerId);
    if (!player) return;

    // Cancel any pending auto-forfeit timer
    const timer = this.disconnectTimers.get(playerId);
    if (timer) {
      console.log(`[GameStateManager] Player ${player.name} (${playerId}) reconnected. Cancelling auto-forfeit timer.`);
      clearTimeout(timer);
      this.disconnectTimers.delete(playerId);
    }

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

  /**
   * Clear all timers (disconnect and replay)
   */
  private clearAllTimers(): void {
    // Clear disconnect timers
    this.disconnectTimers.forEach(timer => clearTimeout(timer));
    this.disconnectTimers.clear();
    
    // Clear replay timeout
    if (this.replayTimeout) {
      clearTimeout(this.replayTimeout);
      this.replayTimeout = undefined;
    }
  }
}