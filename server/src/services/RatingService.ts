import { calculateELO, getRankTier, isPromotion, isDemotion, applyInactivityDecay } from '../../../shared/game/elo';
import { 
  PlayerRating, 
  RankedMatch, 
  RatingUpdatePayload,
  ELO_CONSTANTS,
  SeasonalRating
} from '../../../shared/types/elo';
import { supabase } from '../db/supabase';

export class RatingService {
  private static instance: RatingService;

  private constructor() {}

  static getInstance(): RatingService {
    if (!RatingService.instance) {
      RatingService.instance = new RatingService();
    }
    return RatingService.instance;
  }

  /**
   * Get or create player rating record
   */
  async getPlayerRating(userId: string): Promise<PlayerRating> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('player_ratings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Player doesn't have a rating yet, create one
      return this.createInitialRating(userId);
    }

    if (error) {
      throw new Error(`Failed to get player rating: ${error.message}`);
    }

    // Check for inactivity decay
    if (data.last_game_at) {
      const daysSinceLastGame = Math.floor(
        (Date.now() - new Date(data.last_game_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const decayedRating = applyInactivityDecay(data.current_rating, daysSinceLastGame);
      
      if (decayedRating !== data.current_rating) {
        // Apply decay
        await this.updateRatingInDatabase(userId, {
          current_rating: decayedRating
        });
        data.current_rating = decayedRating;
      }
    }

    return data;
  }

  /**
   * Create initial rating for new player
   */
  private async createInitialRating(userId: string): Promise<PlayerRating> {
    const initialRating = {
      user_id: userId,
      current_rating: ELO_CONSTANTS.BASE_RATING,
      peak_rating: ELO_CONSTANTS.BASE_RATING,
      games_played: 0,
      wins: 0,
      losses: 0,
      win_streak: 0,
      loss_streak: 0,
      placement_matches_remaining: ELO_CONSTANTS.PLACEMENT_MATCHES,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase
      .from('player_ratings')
      .insert(initialRating)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create initial rating: ${error.message}`);
    }

    return data;
  }

  /**
   * Update ratings after a match
   */
  async updateRatingsAfterMatch(
    winnerId: string,
    loserId: string,
    gameMode: 'classic' | 'super' | 'extended',
    matchStats: {
      duration: number;
      roundsPlayed: number;
      winnerRoundsWon: number;
      loserRoundsWon: number;
    }
  ): Promise<{
    winnerUpdate: RatingUpdatePayload;
    loserUpdate: RatingUpdatePayload;
    match: RankedMatch;
  }> {
    // Get current ratings
    const [winnerRating, loserRating] = await Promise.all([
      this.getPlayerRating(winnerId),
      this.getPlayerRating(loserId)
    ]);

    // Calculate new ratings
    const eloResult = calculateELO({
      winnerRating: winnerRating.current_rating,
      loserRating: loserRating.current_rating,
      winnerGamesPlayed: winnerRating.games_played,
      loserGamesPlayed: loserRating.games_played
    });

    // Check for tier changes
    const winnerOldTier = getRankTier(winnerRating.current_rating);
    const winnerNewTier = getRankTier(eloResult.winnerNewRating);
    const loserOldTier = getRankTier(loserRating.current_rating);
    const loserNewTier = getRankTier(eloResult.loserNewRating);

    // Create match record
    const match: RankedMatch = {
      id: crypto.randomUUID(),
      player1Id: winnerId,
      player2Id: loserId,
      winnerId,
      player1RatingBefore: winnerRating.current_rating,
      player2RatingBefore: loserRating.current_rating,
      player1RatingAfter: eloResult.winnerNewRating,
      player2RatingAfter: eloResult.loserNewRating,
      ratingChange: eloResult.ratingChange,
      matchDuration: matchStats.duration,
      roundsPlayed: matchStats.roundsPlayed,
      player1RoundsWon: matchStats.winnerRoundsWon,
      player2RoundsWon: matchStats.loserRoundsWon,
      createdAt: new Date()
    };

    // Save match to database
    await this.saveMatch(match);

    // Update winner rating
    const winnerUpdates = {
      current_rating: eloResult.winnerNewRating,
      peak_rating: Math.max(winnerRating.peak_rating, eloResult.winnerNewRating),
      games_played: winnerRating.games_played + 1,
      wins: winnerRating.wins + 1,
      win_streak: winnerRating.win_streak + 1,
      loss_streak: 0,
      placement_matches_remaining: Math.max(0, winnerRating.placement_matches_remaining - 1),
      last_game_at: new Date().toISOString()
    };

    // Update loser rating
    const loserUpdates = {
      current_rating: eloResult.loserNewRating,
      games_played: loserRating.games_played + 1,
      losses: loserRating.losses + 1,
      win_streak: 0,
      loss_streak: loserRating.loss_streak + 1,
      placement_matches_remaining: Math.max(0, loserRating.placement_matches_remaining - 1),
      last_game_at: new Date().toISOString()
    };

    // Apply updates to database
    await Promise.all([
      this.updateRatingInDatabase(winnerId, winnerUpdates),
      this.updateRatingInDatabase(loserId, loserUpdates)
    ]);

    // Create update payloads
    const winnerUpdate: RatingUpdatePayload = {
      userId: winnerId,
      oldRating: winnerRating.current_rating,
      newRating: eloResult.winnerNewRating,
      ratingChange: eloResult.ratingChange,
      oldTier: winnerOldTier,
      newTier: winnerNewTier,
      isPromotion: isPromotion(winnerRating.current_rating, eloResult.winnerNewRating),
      isDemotion: isDemotion(winnerRating.current_rating, eloResult.winnerNewRating)
    };

    const loserUpdate: RatingUpdatePayload = {
      userId: loserId,
      oldRating: loserRating.current_rating,
      newRating: eloResult.loserNewRating,
      ratingChange: -eloResult.ratingChange,
      oldTier: loserOldTier,
      newTier: loserNewTier,
      isPromotion: isPromotion(loserRating.current_rating, eloResult.loserNewRating),
      isDemotion: isDemotion(loserRating.current_rating, eloResult.loserNewRating)
    };

    return { winnerUpdate, loserUpdate, match };
  }

  /**
   * Apply disconnect penalty
   */
  async applyDisconnectPenalty(userId: string): Promise<RatingUpdatePayload> {
    const rating = await this.getPlayerRating(userId);
    const oldRating = rating.current_rating;
    const newRating = Math.max(
      ELO_CONSTANTS.RATING_FLOOR,
      oldRating - ELO_CONSTANTS.DISCONNECT_PENALTY
    );

    const oldTier = getRankTier(oldRating);
    const newTier = getRankTier(newRating);

    await this.updateRatingInDatabase(userId, {
      current_rating: newRating,
      losses: rating.losses + 1,
      loss_streak: rating.loss_streak + 1,
      win_streak: 0
    });

    return {
      userId,
      oldRating,
      newRating,
      ratingChange: -ELO_CONSTANTS.DISCONNECT_PENALTY,
      oldTier,
      newTier,
      isPromotion: false,
      isDemotion: isDemotion(oldRating, newRating)
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100, offset: number = 0) {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('player_ratings')
      .select(`
        user_id,
        current_rating,
        games_played,
        wins,
        losses,
        peak_rating,
        users!inner(username)
      `)
      .order('current_rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get leaderboard: ${error.message}`);
    }

    return data.map((row, index) => ({
      rank: offset + index + 1,
      userId: row.user_id,
      username: (row as any).users.username,
      rating: row.current_rating,
      gamesPlayed: row.games_played,
      winRate: row.games_played > 0 ? (row.wins / row.games_played) * 100 : 0,
      tier: getRankTier(row.current_rating),
      peakRating: row.peak_rating
    }));
  }

  /**
   * Get player's match history
   */
  async getMatchHistory(userId: string, limit: number = 20) {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('ranked_matches')
      .select(`
        *,
        player1:users!player1_id(username),
        player2:users!player2_id(username)
      `)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get match history: ${error.message}`);
    }

    return data;
  }

  /**
   * Update rating in database
   */
  private async updateRatingInDatabase(userId: string, updates: any) {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { error } = await supabase
      .from('player_ratings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update rating: ${error.message}`);
    }
  }

  /**
   * Save match to database
   */
  private async saveMatch(match: RankedMatch) {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { error } = await supabase
      .from('ranked_matches')
      .insert(match);

    if (error) {
      throw new Error(`Failed to save match: ${error.message}`);
    }
  }

  /**
   * Get current season (if any)
   */
  async getCurrentSeason() {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get current season: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if players have played recently (for fair match prevention)
   */
  async havePlayedRecently(player1Id: string, player2Id: string, cooldownMinutes: number = 30): Promise<boolean> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const cutoffTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);

    const { data, error } = await supabase
      .from('ranked_matches')
      .select('id')
      .or(`and(player1_id.eq.${player1Id},player2_id.eq.${player2Id}),and(player1_id.eq.${player2Id},player2_id.eq.${player1Id})`)
      .gte('created_at', cutoffTime.toISOString())
      .limit(1);

    if (error) {
      console.error('Error checking recent matches:', error);
      return false;
    }

    return data && data.length > 0;
  }
}