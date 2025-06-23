import { supabase } from '../db/supabase';
import { GameRoom } from '../types/game.types';

export interface MatchStatistics {
  gameMode: string;
  disconnectForfeit: boolean;
  player1SolveTimes: number[];
  player2SolveTimes: number[];
  player1FirstSolves: number;
  player2FirstSolves: number;
  player1AvgSolveTime?: number;
  player2AvgSolveTime?: number;
  replayData?: any;
  matchStatistics: {
    totalSolutions: number;
    timeouts: number;
    fastestSolve?: number;
    slowestSolve?: number;
    comebackWin?: boolean;
    flawlessVictory?: boolean;
    perfectGame?: boolean;
  };
}

export interface MatchAnalytics {
  matchId: string;
  opponentId: string;
  opponentName: string;
  won: boolean;
  gameMode: string;
  durationSeconds: number;
  roundsPlayed: number;
  roundsWon: number;
  firstSolves: number;
  avgSolveTimeMs?: number;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  createdAt: Date;
}

export interface PlayerPerformanceStats {
  userId: string;
  totalSolveTimeMs: number;
  totalRoundsPlayed: number;
  totalFirstSolves: number;
  fastestSolveMs?: number;
  avgSolveTimeMs?: number;
  favoriteGameMode?: string;
  winRateByMode: Record<string, { played: number; won: number }>;
  hourlyPerformance: Record<string, { played: number; won: number; avgSolveTime: number }>;
  opponentStatistics: Record<string, { played: number; won: number }>;
  streakStatistics: {
    currentWin: number;
    currentLoss: number;
    bestWin: number;
    worstLoss: number;
  };
}

export class MatchAnalyticsService {
  private static instance: MatchAnalyticsService;

  private constructor() {}

  static getInstance(): MatchAnalyticsService {
    if (!MatchAnalyticsService.instance) {
      MatchAnalyticsService.instance = new MatchAnalyticsService();
    }
    return MatchAnalyticsService.instance;
  }

  /**
   * Record detailed match statistics
   */
  async recordMatchStatistics(
    matchId: string,
    room: GameRoom,
    winnerId: string,
    loserId: string,
    disconnectForfeit: boolean = false
  ): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized');

    const player1 = room.players[0];
    const player2 = room.players[1];
    
    // Calculate solve times from round times
    const player1SolveTimes = room.roundTimes?.[player1.id] || [];
    const player2SolveTimes = room.roundTimes?.[player2.id] || [];
    
    // Calculate average solve times
    const player1AvgSolveTime = player1SolveTimes.length > 0 
      ? Math.round(player1SolveTimes.reduce((a, b) => a + b, 0) / player1SolveTimes.length)
      : null;
    const player2AvgSolveTime = player2SolveTimes.length > 0
      ? Math.round(player2SolveTimes.reduce((a, b) => a + b, 0) / player2SolveTimes.length)
      : null;

    // Determine game mode
    const gameMode = room.roomType || 'classic';

    // Calculate match statistics
    const totalSolutions = (room.correctSolutions?.[player1.id] || 0) + (room.correctSolutions?.[player2.id] || 0);
    const allSolveTimes = [...player1SolveTimes, ...player2SolveTimes];
    const fastestSolve = allSolveTimes.length > 0 ? Math.min(...allSolveTimes) : null;
    const slowestSolve = allSolveTimes.length > 0 ? Math.max(...allSolveTimes) : null;

    // Check for special achievements
    const winnerScore = room.scores[winnerId] || 0;
    const loserScore = room.scores[loserId] || 0;
    const flawlessVictory = winnerScore >= 10 && loserScore === 0;
    const perfectGame = winnerId === player1.id 
      ? player1SolveTimes.length === winnerScore && loserScore === 0
      : player2SolveTimes.length === winnerScore && loserScore === 0;

    // Update the ranked_matches table with detailed statistics
    const { error } = await supabase
      .from('ranked_matches')
      .update({
        game_mode: gameMode,
        disconnect_forfeit: disconnectForfeit,
        player1_solve_times: player1SolveTimes,
        player2_solve_times: player2SolveTimes,
        player1_first_solves: room.firstSolves?.[player1.id] || 0,
        player2_first_solves: room.firstSolves?.[player2.id] || 0,
        player1_avg_solve_time_ms: player1AvgSolveTime,
        player2_avg_solve_time_ms: player2AvgSolveTime,
        match_statistics: {
          totalSolutions,
          timeouts: room.currentRound - totalSolutions,
          fastestSolve,
          slowestSolve,
          flawlessVictory,
          perfectGame
        }
      })
      .eq('id', matchId);

    if (error) {
      console.error('Failed to update match statistics:', error);
      throw new Error(`Failed to update match statistics: ${error.message}`);
    }

    // Update player performance stats
    await this.updatePlayerPerformanceStats(matchId);
  }

  /**
   * Update player performance statistics
   */
  private async updatePlayerPerformanceStats(matchId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized');

    // Call the database function to update performance stats
    const { error } = await supabase.rpc('update_player_performance_after_match', {
      p_match_id: matchId
    });

    if (error) {
      console.error('Failed to update player performance stats:', error);
    }
  }

  /**
   * Get player match history with analytics
   */
  async getPlayerMatchHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      gameMode?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<MatchAnalytics[]> {
    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase.rpc('get_match_analytics', {
      p_user_id: userId,
      p_limit: options.limit || 20,
      p_offset: options.offset || 0,
      p_game_mode: options.gameMode || null,
      p_start_date: options.startDate?.toISOString() || null,
      p_end_date: options.endDate?.toISOString() || null
    });

    if (error) {
      throw new Error(`Failed to get match history: ${error.message}`);
    }

    return data.map((row: any) => ({
      matchId: row.match_id,
      opponentId: row.opponent_id,
      opponentName: row.opponent_name,
      won: row.won,
      gameMode: row.game_mode,
      durationSeconds: row.duration_seconds,
      roundsPlayed: row.rounds_played,
      roundsWon: row.rounds_won,
      firstSolves: row.first_solves,
      avgSolveTimeMs: row.avg_solve_time_ms,
      ratingBefore: row.rating_before,
      ratingAfter: row.rating_after,
      ratingChange: row.rating_change,
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * Get player performance statistics
   */
  async getPlayerPerformanceStats(userId: string): Promise<PlayerPerformanceStats | null> {
    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase
      .from('player_performance_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No stats yet
        return null;
      }
      throw new Error(`Failed to get performance stats: ${error.message}`);
    }

    return {
      userId: data.user_id,
      totalSolveTimeMs: data.total_solve_time_ms,
      totalRoundsPlayed: data.total_rounds_played,
      totalFirstSolves: data.total_first_solves,
      fastestSolveMs: data.fastest_solve_ms,
      avgSolveTimeMs: data.avg_solve_time_ms,
      favoriteGameMode: data.favorite_game_mode,
      winRateByMode: data.win_rate_by_mode || {},
      hourlyPerformance: data.hourly_performance || {},
      opponentStatistics: data.opponent_statistics || {},
      streakStatistics: data.streak_statistics || {
        currentWin: 0,
        currentLoss: 0,
        bestWin: 0,
        worstLoss: 0
      }
    };
  }

  /**
   * Get head-to-head statistics between two players
   */
  async getHeadToHeadStats(player1Id: string, player2Id: string): Promise<{
    totalMatches: number;
    player1Wins: number;
    player2Wins: number;
    recentMatches: MatchAnalytics[];
  }> {
    if (!supabase) throw new Error('Supabase not initialized');

    // Get all matches between these two players
    const { data, error } = await supabase
      .from('ranked_matches')
      .select(`
        *,
        player1:users!player1_id(username),
        player2:users!player2_id(username)
      `)
      .or(`and(player1_id.eq.${player1Id},player2_id.eq.${player2Id}),and(player1_id.eq.${player2Id},player2_id.eq.${player1Id})`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Failed to get head-to-head stats: ${error.message}`);
    }

    const totalMatches = data.length;
    const player1Wins = data.filter(match => match.winner_id === player1Id).length;
    const player2Wins = data.filter(match => match.winner_id === player2Id).length;

    const recentMatches = data.map((match: any) => {
      const isPlayer1Perspective = match.player1_id === player1Id;
      return {
        matchId: match.id,
        opponentId: isPlayer1Perspective ? match.player2_id : match.player1_id,
        opponentName: isPlayer1Perspective ? match.player2.username : match.player1.username,
        won: match.winner_id === player1Id,
        gameMode: match.game_mode || 'classic',
        durationSeconds: match.match_duration,
        roundsPlayed: match.rounds_played,
        roundsWon: isPlayer1Perspective ? match.player1_rounds_won : match.player2_rounds_won,
        firstSolves: isPlayer1Perspective ? match.player1_first_solves : match.player2_first_solves,
        avgSolveTimeMs: isPlayer1Perspective ? match.player1_avg_solve_time_ms : match.player2_avg_solve_time_ms,
        ratingBefore: isPlayer1Perspective ? match.player1_rating_before : match.player2_rating_before,
        ratingAfter: isPlayer1Perspective ? match.player1_rating_after : match.player2_rating_after,
        ratingChange: isPlayer1Perspective 
          ? match.player1_rating_after - match.player1_rating_before
          : match.player2_rating_after - match.player2_rating_before,
        createdAt: new Date(match.created_at)
      };
    });

    return {
      totalMatches,
      player1Wins,
      player2Wins,
      recentMatches
    };
  }

  /**
   * Get player's performance trends over time
   */
  async getPerformanceTrends(
    userId: string,
    days: number = 30
  ): Promise<{
    daily: Array<{
      date: string;
      matches: number;
      wins: number;
      avgRating: number;
      avgSolveTime?: number;
    }>;
    weeklyAverage: {
      matches: number;
      winRate: number;
      avgSolveTime?: number;
    };
  }> {
    if (!supabase) throw new Error('Supabase not initialized');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('ranked_matches')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get performance trends: ${error.message}`);
    }

    // Group by day
    const dailyStats: Record<string, {
      matches: number;
      wins: number;
      totalRating: number;
      totalSolveTime: number;
      solveCount: number;
    }> = {};

    data.forEach((match: any) => {
      const date = new Date(match.created_at).toISOString().split('T')[0];
      const isPlayer1 = match.player1_id === userId;
      const won = match.winner_id === userId;
      const rating = isPlayer1 ? match.player1_rating_after : match.player2_rating_after;
      const solveTimes = isPlayer1 ? match.player1_solve_times : match.player2_solve_times;
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          matches: 0,
          wins: 0,
          totalRating: 0,
          totalSolveTime: 0,
          solveCount: 0
        };
      }

      dailyStats[date].matches++;
      if (won) dailyStats[date].wins++;
      dailyStats[date].totalRating += rating;
      
      if (solveTimes && Array.isArray(solveTimes)) {
        solveTimes.forEach((time: number) => {
          dailyStats[date].totalSolveTime += time;
          dailyStats[date].solveCount++;
        });
      }
    });

    // Convert to array
    const daily = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      matches: stats.matches,
      wins: stats.wins,
      avgRating: Math.round(stats.totalRating / stats.matches),
      avgSolveTime: stats.solveCount > 0 
        ? Math.round(stats.totalSolveTime / stats.solveCount)
        : undefined
    }));

    // Calculate weekly average
    const totalMatches = data.length;
    const totalWins = data.filter((match: any) => match.winner_id === userId).length;
    const weeklyMatches = (totalMatches / days) * 7;
    
    let totalSolveTime = 0;
    let totalSolveCount = 0;
    
    data.forEach((match: any) => {
      const isPlayer1 = match.player1_id === userId;
      const solveTimes = isPlayer1 ? match.player1_solve_times : match.player2_solve_times;
      
      if (solveTimes && Array.isArray(solveTimes)) {
        solveTimes.forEach((time: number) => {
          totalSolveTime += time;
          totalSolveCount++;
        });
      }
    });

    return {
      daily,
      weeklyAverage: {
        matches: Math.round(weeklyMatches * 10) / 10,
        winRate: totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0,
        avgSolveTime: totalSolveCount > 0 
          ? Math.round(totalSolveTime / totalSolveCount)
          : undefined
      }
    };
  }
}