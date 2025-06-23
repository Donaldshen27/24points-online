// ELO Rating System Type Definitions

export type RankTier = 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster';

export interface RankTierInfo {
  tier: RankTier;
  minRating: number;
  maxRating: number;
  displayName: string;
  color: string;
  icon?: string;
}

export const RANK_TIERS: RankTierInfo[] = [
  { tier: 'iron', minRating: 400, maxRating: 1199, displayName: 'Iron', color: '#7C7C7C' },
  { tier: 'bronze', minRating: 1200, maxRating: 1399, displayName: 'Bronze', color: '#CD7F32' },
  { tier: 'silver', minRating: 1400, maxRating: 1599, displayName: 'Silver', color: '#C0C0C0' },
  { tier: 'gold', minRating: 1600, maxRating: 1799, displayName: 'Gold', color: '#FFD700' },
  { tier: 'platinum', minRating: 1800, maxRating: 1999, displayName: 'Platinum', color: '#E5E4E2' },
  { tier: 'diamond', minRating: 2000, maxRating: 2199, displayName: 'Diamond', color: '#B9F2FF' },
  { tier: 'master', minRating: 2200, maxRating: 2399, displayName: 'Master', color: '#9B30FF' },
  { tier: 'grandmaster', minRating: 2400, maxRating: 9999, displayName: 'Grandmaster', color: '#FF0000' }
];

// Player rating information
export interface PlayerRating {
  userId: string;
  currentRating: number;
  peakRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winStreak: number;
  lossStreak: number;
  lastGameAt?: Date;
  placementMatchesRemaining: number;
  createdAt: Date;
  updatedAt: Date;
}

// Seasonal rating information
export interface SeasonalRating {
  id: string;
  userId: string;
  seasonId: number;
  startingRating: number;
  currentRating: number;
  peakRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  finalRank?: number;
  rewardsClaimed: boolean;
}

// Season information
export interface Season {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

// Match history for ranked games
export interface RankedMatch {
  id: string;
  player1Id: string;
  player2Id: string;
  winnerId: string;
  player1RatingBefore: number;
  player2RatingBefore: number;
  player1RatingAfter: number;
  player2RatingAfter: number;
  ratingChange: number;
  matchDuration: number; // seconds
  roundsPlayed: number;
  player1RoundsWon: number;
  player2RoundsWon: number;
  seasonId?: number;
  createdAt: Date;
}

// Matchmaking queue entry
export interface MatchmakingEntry {
  userId: string;
  rating: number;
  queueTime: Date;
  searchRange: number;
  region?: string;
  gameMode: 'classic' | 'super' | 'extended';
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  rating: number;
  gamesPlayed: number;
  winRate: number;
  tier: RankTier;
  region?: string;
  lastUpdated: Date;
}

// ELO calculation parameters
export interface ELOCalculationParams {
  winnerRating: number;
  loserRating: number;
  winnerGamesPlayed: number;
  loserGamesPlayed: number;
}

// ELO calculation result
export interface ELOCalculationResult {
  winnerNewRating: number;
  loserNewRating: number;
  ratingChange: number;
}

// Matchmaking configuration
export interface MatchmakingConfig {
  initialSearchRange: number;
  searchRangeExpansion: {
    after10s: number;
    after30s: number;
    after60s: number;
    after120s: number;
  };
  maxSearchRange: number;
  recentOpponentCooldown: number; // minutes
}

// Rating update payload
export interface RatingUpdatePayload {
  userId: string;
  oldRating: number;
  newRating: number;
  ratingChange: number;
  oldTier: RankTier;
  newTier: RankTier;
  isPromotion: boolean;
  isDemotion: boolean;
}

// Season rewards
export interface SeasonReward {
  tier: RankTier;
  rewards: {
    avatarBorder?: string;
    title?: string;
    badge?: string;
    animated?: boolean;
  };
}

// Integrity checks
export interface IntegrityViolation {
  type: 'win_trading' | 'smurf' | 'disconnect_abuse' | 'report';
  userId: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  details: Record<string, any>;
}

// Constants
export const ELO_CONSTANTS = {
  BASE_RATING: 1200,
  RATING_FLOOR: 400,
  RATING_CEILING: 3000,
  PLACEMENT_MATCHES: 10,
  DISCONNECT_PENALTY: 30,
  INACTIVITY_DECAY_DAYS: 28,
  INACTIVITY_DECAY_AMOUNT: 25,
  K_FACTORS: {
    PLACEMENT: 40,
    NEW_PLAYER: 30,
    REGULAR: 20,
    EXPERIENCED: 15
  },
  GAMES_THRESHOLD: {
    NEW_PLAYER: 30,
    REGULAR: 100
  }
} as const;