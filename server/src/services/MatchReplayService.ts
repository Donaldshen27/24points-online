import { supabase } from '../db/supabase';
import { GameRoom, Solution } from '../types/game.types';
import { RankedMatch } from '../../../shared/types/elo';

export interface RoundReplay {
  roundNumber: number;
  centerCards: any[];
  solution: Solution;
  solverId: string;
  solveTimeMs: number;
  gameStateBefore?: any;
  gameStateAfter?: any;
}

export interface MatchReplay {
  matchData: {
    id: string;
    player1: {
      id: string;
      username: string;
      ratingBefore: number;
      ratingAfter: number;
      roundsWon: number;
    };
    player2: {
      id: string;
      username: string;
      ratingBefore: number;
      ratingAfter: number;
      roundsWon: number;
    };
    winnerId: string;
    gameMode: string;
    duration: number;
    totalRounds: number;
    createdAt: Date;
    finalState?: any;
  };
  rounds: RoundReplay[];
}

export interface ReplayListItem {
  matchId: string;
  opponentId: string;
  opponentName: string;
  won: boolean;
  gameMode: string;
  roundsPlayed: number;
  ratingChange: number;
  createdAt: Date;
}

export class MatchReplayService {
  private static instance: MatchReplayService;
  private currentMatchReplays: Map<string, RoundReplay[]> = new Map();

  private constructor() {}

  static getInstance(): MatchReplayService {
    if (!MatchReplayService.instance) {
      MatchReplayService.instance = new MatchReplayService();
    }
    return MatchReplayService.instance;
  }

  /**
   * Start recording replays for a match
   */
  startRecording(matchId: string): void {
    this.currentMatchReplays.set(matchId, []);
  }

  /**
   * Record a round for replay
   */
  async recordRound(
    matchId: string,
    roundNumber: number,
    centerCards: any[],
    solution: Solution,
    solverId: string,
    solveTimeMs: number,
    gameStateBefore?: any,
    gameStateAfter?: any
  ): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized');

    // Store in memory for batch saving
    const replays = this.currentMatchReplays.get(matchId);
    if (replays) {
      replays.push({
        roundNumber,
        centerCards,
        solution,
        solverId,
        solveTimeMs,
        gameStateBefore,
        gameStateAfter
      });
    }

    // Also save to database immediately for reliability
    try {
      const { error } = await supabase.rpc('save_round_replay', {
        p_match_id: matchId,
        p_round_number: roundNumber,
        p_center_cards: centerCards,
        p_solution: solution,
        p_solver_id: solverId,
        p_solve_time_ms: solveTimeMs,
        p_game_state_before: gameStateBefore,
        p_game_state_after: gameStateAfter
      });

      if (error) {
        console.error('Failed to save round replay:', error);
      }
    } catch (err) {
      console.error('Error recording round replay:', err);
    }
  }

  /**
   * Finalize match replay with final game state
   */
  async finalizeMatchReplay(matchId: string, finalGameState: any): Promise<void> {
    if (!supabase) throw new Error('Supabase not initialized');

    try {
      // Update the match with final game state
      const { error } = await supabase
        .from('ranked_matches')
        .update({
          final_game_state: finalGameState,
          has_replay: true
        })
        .eq('id', matchId);

      if (error) {
        console.error('Failed to finalize match replay:', error);
      }

      // Clean up memory
      this.currentMatchReplays.delete(matchId);
    } catch (err) {
      console.error('Error finalizing match replay:', err);
    }
  }

  /**
   * Get full replay data for a match
   */
  async getMatchReplay(matchId: string): Promise<MatchReplay | null> {
    if (!supabase) throw new Error('Supabase not initialized');

    try {
      const { data, error } = await supabase.rpc('get_match_replay', {
        p_match_id: matchId
      });

      if (error) {
        throw new Error(`Failed to get match replay: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];
      return {
        matchData: result.match_data,
        rounds: result.rounds || []
      };
    } catch (err) {
      console.error('Error getting match replay:', err);
      return null;
    }
  }

  /**
   * Get list of available replays for a player
   */
  async getPlayerReplays(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<ReplayListItem[]> {
    if (!supabase) throw new Error('Supabase not initialized');

    try {
      const { data, error } = await supabase.rpc('get_player_replays', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        throw new Error(`Failed to get player replays: ${error.message}`);
      }

      return data.map((item: any) => ({
        matchId: item.match_id,
        opponentId: item.opponent_id,
        opponentName: item.opponent_name,
        won: item.won,
        gameMode: item.game_mode,
        roundsPlayed: item.rounds_played,
        ratingChange: item.rating_change,
        createdAt: new Date(item.created_at)
      }));
    } catch (err) {
      console.error('Error getting player replays:', err);
      return [];
    }
  }

  /**
   * Convert game room state to replay-safe format
   */
  private sanitizeGameState(room: GameRoom): any {
    return {
      id: room.id,
      state: room.state,
      currentRound: room.currentRound,
      scores: room.scores,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        deckSize: p.deck.length,
        isReady: p.isReady,
        points: p.points
      })),
      centerCards: room.centerCards,
      roomType: room.roomType
    };
  }

  /**
   * Record a round from GameStateManager
   */
  async recordGameRound(
    matchId: string,
    room: GameRoom,
    roundNumber: number,
    solution: Solution,
    solverId: string,
    solveTimeMs: number
  ): Promise<void> {
    const gameStateBefore = this.sanitizeGameState(room);
    
    await this.recordRound(
      matchId,
      roundNumber,
      room.centerCards,
      solution,
      solverId,
      solveTimeMs,
      gameStateBefore,
      null // gameStateAfter will be recorded at the start of next round
    );
  }
}