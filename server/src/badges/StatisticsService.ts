import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserStatistics } from '../../../shared/types/badges';
import { GameRoom, Player } from '../types/game.types';

export class StatisticsService {
  private supabase!: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not found. Statistics tracking disabled.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Initialize user statistics if they don't exist
   */
  async initializeUserStats(userId: string, username: string): Promise<void> {
    if (!this.supabase) return;

    try {
      // Check if this is a guest user (non-UUID format)
      const isGuest = !this.isValidUUID(userId);
      
      const { data, error } = await this.supabase
        .from('user_statistics')
        .upsert({
          user_id: userId,
          username: username,
          games_played: 0,
          games_won: 0,
          games_lost: 0,
          current_win_streak: 0,
          longest_win_streak: 0,
          is_guest: isGuest
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: true
        });

      if (error) {
        console.error('Error initializing user stats:', error);
      }
    } catch (error) {
      console.error('Failed to initialize user stats:', error);
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Update statistics after a game ends
   */
  async updateGameStats(
    gameRoom: GameRoom,
    winnerId: string,
    loserId: string,
    gameStats: {
      roundTimes: { [playerId: string]: number[] };
      firstSolves: { [playerId: string]: number };
      correctSolutions: { [playerId: string]: number };
      incorrectAttempts: { [playerId: string]: number };
    }
  ): Promise<void> {
    if (!this.supabase) return;

    try {
      // Update winner stats
      await this.updatePlayerGameStats(winnerId, true, gameStats, gameRoom);
      
      // Update loser stats
      await this.updatePlayerGameStats(loserId, false, gameStats, gameRoom);

      // Update time-based stats for both players
      await this.updateTimeBasedStats([winnerId, loserId]);

      // Update social stats if not solo practice
      if (!gameRoom.isSoloPractice) {
        await this.updateSocialStats(winnerId, loserId);
      }
    } catch (error) {
      console.error('Failed to update game stats:', error);
    }
  }

  /**
   * Update individual player's game statistics
   */
  private async updatePlayerGameStats(
    playerId: string,
    isWinner: boolean,
    gameStats: any,
    gameRoom: GameRoom
  ): Promise<void> {
    const { data: currentStats } = await this.supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', playerId)
      .single();

    if (!currentStats) return;

    const playerRoundTimes = gameStats.roundTimes[playerId] || [];
    const avgSolveTime = playerRoundTimes.length > 0
      ? playerRoundTimes.reduce((a, b) => a + b, 0) / playerRoundTimes.length
      : 0;
    const fastestSolve = playerRoundTimes.length > 0
      ? Math.min(...playerRoundTimes)
      : null;

    // Calculate special achievements
    const perfectGame = isWinner && (gameStats.incorrectAttempts[playerId] || 0) === 0;
    const flawlessVictory = isWinner && 
      gameRoom.players.find(p => p.id !== playerId)?.deck.length === 20;

    // Determine game mode
    const roomType = gameRoom.roomType || 'classic';
    const modeWinField = {
      'classic': 'classic_wins',
      'super': 'super_mode_wins',
      'extended': 'extended_range_wins'
    }[roomType] || 'classic_wins';

    // Build update object
    const updates: any = {
      games_played: currentStats.games_played + 1,
      total_rounds_played: currentStats.total_rounds_played + gameRoom.currentRound,
      total_first_solves: currentStats.total_first_solves + (gameStats.firstSolves[playerId] || 0),
      total_correct_solutions: currentStats.total_correct_solutions + (gameStats.correctSolutions[playerId] || 0),
      total_incorrect_attempts: currentStats.total_incorrect_attempts + (gameStats.incorrectAttempts[playerId] || 0),
      total_solve_time_ms: currentStats.total_solve_time_ms + playerRoundTimes.reduce((a, b) => a + b, 0),
      updated_at: new Date().toISOString()
    };

    if (isWinner) {
      updates.games_won = currentStats.games_won + 1;
      updates.current_win_streak = currentStats.current_win_streak + 1;
      updates.longest_win_streak = Math.max(
        currentStats.longest_win_streak,
        currentStats.current_win_streak + 1
      );
      updates[modeWinField] = (currentStats[modeWinField] || 0) + 1;
      
      if (perfectGame) {
        updates.perfect_games = (currentStats.perfect_games || 0) + 1;
      }
      if (flawlessVictory) {
        updates.flawless_victories = (currentStats.flawless_victories || 0) + 1;
      }
    } else {
      updates.games_lost = currentStats.games_lost + 1;
      updates.current_win_streak = 0;
    }

    if (fastestSolve !== null) {
      updates.fastest_solve_ms = currentStats.fastest_solve_ms
        ? Math.min(currentStats.fastest_solve_ms, fastestSolve)
        : fastestSolve;
    }

    // Update cards won/lost
    const player = gameRoom.players.find(p => p.id === playerId);
    const opponent = gameRoom.players.find(p => p.id !== playerId);
    if (player && opponent) {
      const cardsWon = isWinner ? (20 - player.deck.length) : 0;
      const cardsLost = isWinner ? 0 : (20 - opponent.deck.length);
      updates.total_cards_won = currentStats.total_cards_won + cardsWon;
      updates.total_cards_lost = currentStats.total_cards_lost + cardsLost;
    }

    await this.supabase
      .from('user_statistics')
      .update(updates)
      .eq('user_id', playerId);
  }

  /**
   * Update time-based statistics
   */
  private async updateTimeBasedStats(playerIds: string[]): Promise<void> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    const isNightTime = hour >= 0 && hour < 6;
    const isEarlyMorning = hour >= 5 && hour < 8;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const playerId of playerIds) {
      const { data: stats } = await this.supabase
        .from('user_statistics')
        .select('last_played_date, consecutive_days_played')
        .eq('user_id', playerId)
        .single();

      if (!stats) continue;

      const updates: any = {
        last_played_date: now.toISOString().split('T')[0]
      };

      // Update consecutive days
      if (stats.last_played_date) {
        const lastPlayed = new Date(stats.last_played_date);
        const daysDiff = Math.floor((now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          updates.consecutive_days_played = stats.consecutive_days_played + 1;
        } else if (daysDiff > 1) {
          updates.consecutive_days_played = 1;
        }
      } else {
        updates.consecutive_days_played = 1;
      }

      // Update time-specific counters
      if (isNightTime) {
        await this.incrementStat(playerId, 'night_games');
      }
      if (isEarlyMorning) {
        await this.incrementStat(playerId, 'early_games');
      }
      if (isWeekend) {
        await this.incrementStat(playerId, 'weekend_games');
      }

      await this.supabase
        .from('user_statistics')
        .update(updates)
        .eq('user_id', playerId);
    }
  }

  /**
   * Update social statistics
   */
  private async updateSocialStats(player1Id: string, player2Id: string): Promise<void> {
    // Track unique opponents
    // This would require a separate table or JSON field to track opponent history
    // For now, we'll increment the unique opponents counter
    // In a real implementation, you'd check if this opponent is new
    
    await this.incrementStat(player1Id, 'unique_opponents');
    await this.incrementStat(player2Id, 'unique_opponents');
  }

  /**
   * Update statistics for solo practice mode
   */
  async updateSoloPracticeStats(playerId: string, solved: boolean, solveTimeMs: number): Promise<void> {
    if (!this.supabase) return;

    try {
      const updates: any = {
        solo_puzzles_completed: this.supabase.rpc('increment', { x: 1 })
      };

      if (solved && solveTimeMs) {
        const { data: stats } = await this.supabase
          .from('user_statistics')
          .select('fastest_solve_ms')
          .eq('user_id', playerId)
          .single();

        if (stats && (!stats.fastest_solve_ms || solveTimeMs < stats.fastest_solve_ms)) {
          updates.fastest_solve_ms = solveTimeMs;
        }
      }

      await this.supabase
        .from('user_statistics')
        .update(updates)
        .eq('user_id', playerId);

    } catch (error) {
      console.error('Failed to update solo practice stats:', error);
    }
  }

  /**
   * Update spectator statistics
   */
  async updateSpectatorStats(spectatorId: string): Promise<void> {
    await this.incrementStat(spectatorId, 'games_spectated');
  }

  /**
   * Track special achievements during gameplay
   */
  async trackSpecialAchievement(
    playerId: string,
    achievementType: 'comeback_win' | 'underdog_win' | 'all_operations' | 'minimal_operations',
    context?: any
  ): Promise<void> {
    if (!this.supabase) return;

    try {
      switch (achievementType) {
        case 'comeback_win':
          await this.incrementStat(playerId, 'comeback_wins');
          break;
        case 'underdog_win':
          await this.incrementStat(playerId, 'underdog_wins');
          break;
        // Other special achievements would be tracked here
      }
    } catch (error) {
      console.error('Failed to track special achievement:', error);
    }
  }

  /**
   * Helper function to increment a single stat
   */
  private async incrementStat(playerId: string, statField: string): Promise<void> {
    await this.supabase.rpc('increment_user_stat', {
      p_user_id: playerId,
      p_stat_field: statField,
      p_increment: 1
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStatistics | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user stats:', error);
        return null;
      }

      // Convert snake_case to camelCase
      return this.convertStatsToCamelCase(data);
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  }

  /**
   * Convert database snake_case to TypeScript camelCase
   */
  private convertStatsToCamelCase(dbStats: any): UserStatistics {
    return {
      userId: dbStats.user_id,
      username: dbStats.username,
      gamesPlayed: dbStats.games_played,
      gamesWon: dbStats.games_won,
      gamesLost: dbStats.games_lost,
      currentWinStreak: dbStats.current_win_streak,
      longestWinStreak: dbStats.longest_win_streak,
      totalRoundsPlayed: dbStats.total_rounds_played,
      totalFirstSolves: dbStats.total_first_solves,
      totalCorrectSolutions: dbStats.total_correct_solutions,
      totalIncorrectAttempts: dbStats.total_incorrect_attempts,
      fastestSolveMs: dbStats.fastest_solve_ms,
      totalSolveTimeMs: dbStats.total_solve_time_ms,
      classicWins: dbStats.classic_wins,
      superModeWins: dbStats.super_mode_wins,
      extendedRangeWins: dbStats.extended_range_wins,
      soloPuzzlesCompleted: dbStats.solo_puzzles_completed,
      consecutiveDaysPlayed: dbStats.consecutive_days_played,
      lastPlayedDate: dbStats.last_played_date ? new Date(dbStats.last_played_date) : undefined,
      weekendGames: dbStats.weekend_games,
      nightGames: dbStats.night_games,
      earlyGames: dbStats.early_games,
      uniqueOpponents: dbStats.unique_opponents,
      gamesSpectated: dbStats.games_spectated,
      comebackWins: dbStats.comeback_wins,
      underdogWins: dbStats.underdog_wins,
      perfectGames: dbStats.perfect_games,
      flawlessVictories: dbStats.flawless_victories,
      totalCardsWon: dbStats.total_cards_won,
      totalCardsLost: dbStats.total_cards_lost,
      createdAt: new Date(dbStats.created_at),
      updatedAt: new Date(dbStats.updated_at)
    };
  }
}

// Singleton instance
export const statisticsService = new StatisticsService();