import { MatchmakingEntry, ELO_CONSTANTS } from '../../../shared/types/elo';
import { RatingService } from './RatingService';
import { getMatchmakingRange, canMatch } from '../../../shared/game/elo';
import { v4 as uuidv4 } from 'uuid';

interface QueueEntry extends MatchmakingEntry {
  socketId: string;
  username: string;
  queueType: 'ranked' | 'casual';
}

interface MatchFound {
  player1: QueueEntry;
  player2: QueueEntry;
  roomId: string;
  queueType: 'ranked' | 'casual';
}

export class MatchmakingService {
  private static instance: MatchmakingService;
  private rankedQueue: Map<string, QueueEntry> = new Map(); // userId -> QueueEntry
  private casualQueue: Map<string, QueueEntry> = new Map(); // userId -> QueueEntry
  private matchCheckInterval: NodeJS.Timeout | null = null;
  private onMatchFoundCallback?: (match: MatchFound) => void;
  private recentMatches: Map<string, Set<string>> = new Map(); // userId -> Set of recent opponent IDs
  private static readonly MATCH_CHECK_INTERVAL_MS = 2000; // Check for matches every 2 seconds
  private static readonly RECENT_MATCH_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes for ranked
  private static readonly CASUAL_MATCH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes for casual

  private constructor() {
    this.startMatchCheckInterval();
  }

  static getInstance(): MatchmakingService {
    if (!MatchmakingService.instance) {
      MatchmakingService.instance = new MatchmakingService();
    }
    return MatchmakingService.instance;
  }

  /**
   * Set callback for when a match is found
   */
  onMatchFound(callback: (match: MatchFound) => void): void {
    this.onMatchFoundCallback = callback;
  }

  /**
   * Add a player to the matchmaking queue
   */
  async joinQueue(
    userId: string,
    socketId: string,
    username: string,
    queueType: 'ranked' | 'casual' = 'ranked',
    gameMode: 'classic' | 'super' | 'extended' = 'classic',
    region?: string
  ): Promise<void> {
    // Remove from both queues if already in one
    this.leaveQueue(userId);

    // Get player's current rating (for ranked mode)
    let rating = 1200; // Default for casual
    if (queueType === 'ranked') {
      const ratingService = RatingService.getInstance();
      const playerRating = await ratingService.getPlayerRating(userId);
      rating = playerRating.current_rating;
    }

    // Add to appropriate queue
    const entry: QueueEntry = {
      userId,
      socketId,
      username,
      rating,
      queueTime: new Date(),
      searchRange: queueType === 'ranked' ? ELO_CONSTANTS.K_FACTORS.NEW_PLAYER : 9999, // Wide range for casual
      gameMode,
      region,
      queueType
    };

    const queue = queueType === 'ranked' ? this.rankedQueue : this.casualQueue;
    queue.set(userId, entry);
    console.log(`[MatchmakingService] Player ${username} (${userId}) joined ${queueType} queue. Rating: ${entry.rating}, Mode: ${gameMode}`);
  }

  /**
   * Remove a player from the matchmaking queue
   */
  leaveQueue(userId: string): boolean {
    const removedFromRanked = this.rankedQueue.delete(userId);
    const removedFromCasual = this.casualQueue.delete(userId);
    const removed = removedFromRanked || removedFromCasual;
    
    if (removed) {
      const queueType = removedFromRanked ? 'ranked' : 'casual';
      console.log(`[MatchmakingService] Player ${userId} left ${queueType} queue`);
    }
    return removed;
  }

  /**
   * Get current queue status for a player
   */
  getQueueStatus(userId: string): {
    inQueue: boolean;
    queueType?: 'ranked' | 'casual';
    queueTime?: number;
    queueSize: number;
    estimatedWaitTime?: number;
  } {
    // Check both queues
    const rankedEntry = this.rankedQueue.get(userId);
    const casualEntry = this.casualQueue.get(userId);
    const entry = rankedEntry || casualEntry;
    
    if (!entry) {
      return { 
        inQueue: false, 
        queueSize: this.rankedQueue.size + this.casualQueue.size 
      };
    }

    const queue = entry.queueType === 'ranked' ? this.rankedQueue : this.casualQueue;
    const queueTimeSeconds = Math.floor((Date.now() - entry.queueTime.getTime()) / 1000);
    
    // Estimate wait time based on queue size and player rating
    const playersInRange = this.getPlayersInRatingRange(entry.rating, entry.searchRange, entry.gameMode, entry.queueType);
    const estimatedWaitTime = this.estimateWaitTime(playersInRange.length);

    return {
      inQueue: true,
      queueType: entry.queueType,
      queueTime: queueTimeSeconds,
      queueSize: queue.size,
      estimatedWaitTime
    };
  }

  /**
   * Get all players currently in queue (for admin/debug)
   */
  getQueuedPlayers(queueType?: 'ranked' | 'casual'): Array<{
    userId: string;
    username: string;
    rating: number;
    queueTime: number;
    gameMode: string;
    queueType: 'ranked' | 'casual';
  }> {
    const players: QueueEntry[] = [];
    
    if (!queueType || queueType === 'ranked') {
      players.push(...Array.from(this.rankedQueue.values()));
    }
    if (!queueType || queueType === 'casual') {
      players.push(...Array.from(this.casualQueue.values()));
    }
    
    return players.map(entry => ({
      userId: entry.userId,
      username: entry.username,
      rating: entry.rating,
      queueTime: Math.floor((Date.now() - entry.queueTime.getTime()) / 1000),
      gameMode: entry.gameMode,
      queueType: entry.queueType
    }));
  }

  /**
   * Start interval to check for matches
   */
  private startMatchCheckInterval(): void {
    this.matchCheckInterval = setInterval(() => {
      this.checkForMatches();
    }, MatchmakingService.MATCH_CHECK_INTERVAL_MS);
  }

  /**
   * Stop match checking interval
   */
  stopMatchChecking(): void {
    if (this.matchCheckInterval) {
      clearInterval(this.matchCheckInterval);
      this.matchCheckInterval = null;
    }
  }

  /**
   * Check queue for possible matches
   */
  private checkForMatches(): void {
    // Check ranked queue
    this.checkQueueForMatches(this.rankedQueue, 'ranked');
    
    // Check casual queue
    this.checkQueueForMatches(this.casualQueue, 'casual');
  }

  /**
   * Check a specific queue for matches
   */
  private checkQueueForMatches(queue: Map<string, QueueEntry>, queueType: 'ranked' | 'casual'): void {
    // Sort queue by wait time (oldest first)
    const sortedQueue = Array.from(queue.values()).sort(
      (a, b) => a.queueTime.getTime() - b.queueTime.getTime()
    );

    const matched = new Set<string>();

    for (const player1 of sortedQueue) {
      if (matched.has(player1.userId)) continue;

      // Update search range based on queue time (only for ranked)
      const queueTimeSeconds = (Date.now() - player1.queueTime.getTime()) / 1000;
      if (queueType === 'ranked') {
        player1.searchRange = getMatchmakingRange(queueTimeSeconds);
      }

      // Find best match for this player
      const match = this.findBestMatch(player1, sortedQueue, matched);
      
      if (match) {
        // Mark both players as matched
        matched.add(player1.userId);
        matched.add(match.userId);

        // Create match
        this.createMatch(player1, match);
      }
    }
  }

  /**
   * Find the best match for a player
   */
  private findBestMatch(
    player: QueueEntry, 
    candidates: QueueEntry[], 
    excluded: Set<string>
  ): QueueEntry | null {
    let bestMatch: QueueEntry | null = null;
    let bestRatingDiff = Infinity;

    for (const candidate of candidates) {
      // Skip self and already matched players
      if (candidate.userId === player.userId || excluded.has(candidate.userId)) {
        continue;
      }

      // Must be same game mode
      if (candidate.gameMode !== player.gameMode) {
        continue;
      }

      // Check if within rating range (only for ranked)
      if (player.queueType === 'ranked' && !canMatch(player.rating, candidate.rating, player.searchRange)) {
        continue;
      }

      // Check if they played recently
      if (this.havePlayedRecently(player.userId, candidate.userId)) {
        continue;
      }

      // Prefer players from same region if specified
      const regionBonus = player.region && candidate.region === player.region ? 50 : 0;
      
      // Calculate effective rating difference (lower is better)
      const ratingDiff = Math.abs(player.rating - candidate.rating) - regionBonus;
      
      if (ratingDiff < bestRatingDiff) {
        bestRatingDiff = ratingDiff;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  /**
   * Create a match between two players
   */
  private createMatch(player1: QueueEntry, player2: QueueEntry): void {
    const roomId = uuidv4();
    const queue = player1.queueType === 'ranked' ? this.rankedQueue : this.casualQueue;
    
    // Remove both players from queue
    queue.delete(player1.userId);
    queue.delete(player2.userId);

    // Record this match to prevent immediate rematches
    this.recordRecentMatch(player1.userId, player2.userId, player1.queueType);

    // Log match details
    console.log(`[MatchmakingService] ${player1.queueType} match found!`);
    console.log(`  Player 1: ${player1.username} (${player1.rating})`);
    console.log(`  Player 2: ${player2.username} (${player2.rating})`);
    console.log(`  Rating diff: ${Math.abs(player1.rating - player2.rating)}`);
    console.log(`  Room ID: ${roomId}`);

    // Notify about the match
    if (this.onMatchFoundCallback) {
      this.onMatchFoundCallback({
        player1,
        player2,
        roomId,
        queueType: player1.queueType
      });
    }
  }

  /**
   * Check if two players have played recently
   */
  private havePlayedRecently(player1Id: string, player2Id: string): boolean {
    const player1Recent = this.recentMatches.get(player1Id);
    const player2Recent = this.recentMatches.get(player2Id);
    
    return (player1Recent?.has(player2Id) || player2Recent?.has(player1Id)) ?? false;
  }

  /**
   * Record a recent match between two players
   */
  private recordRecentMatch(player1Id: string, player2Id: string, queueType: 'ranked' | 'casual' = 'ranked'): void {
    // Add to recent matches for both players
    if (!this.recentMatches.has(player1Id)) {
      this.recentMatches.set(player1Id, new Set());
    }
    if (!this.recentMatches.has(player2Id)) {
      this.recentMatches.set(player2Id, new Set());
    }
    
    this.recentMatches.get(player1Id)!.add(player2Id);
    this.recentMatches.get(player2Id)!.add(player1Id);

    // Use different cooldown periods for ranked vs casual
    const cooldownMs = queueType === 'ranked' 
      ? MatchmakingService.RECENT_MATCH_COOLDOWN_MS 
      : MatchmakingService.CASUAL_MATCH_COOLDOWN_MS;

    // Clear after cooldown period
    setTimeout(() => {
      this.recentMatches.get(player1Id)?.delete(player2Id);
      this.recentMatches.get(player2Id)?.delete(player1Id);
    }, cooldownMs);
  }

  /**
   * Get players within rating range
   */
  private getPlayersInRatingRange(
    rating: number, 
    range: number, 
    gameMode: string,
    queueType: 'ranked' | 'casual'
  ): QueueEntry[] {
    const queue = queueType === 'ranked' ? this.rankedQueue : this.casualQueue;
    return Array.from(queue.values()).filter(entry => 
      entry.gameMode === gameMode && 
      Math.abs(entry.rating - rating) <= range
    );
  }

  /**
   * Estimate wait time based on queue state
   */
  private estimateWaitTime(playersInRange: number): number {
    if (playersInRange >= 2) return 5; // 5 seconds if players available
    if (playersInRange === 1) return 15; // 15 seconds if one player in range
    return 30; // 30 seconds if no players in range
  }

  /**
   * Clear all queues (for testing/admin)
   */
  clearQueues(): void {
    this.rankedQueue.clear();
    this.casualQueue.clear();
    this.recentMatches.clear();
    console.log('[MatchmakingService] All queues cleared');
  }
}