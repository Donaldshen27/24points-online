// ELO Rating Calculation Utilities

import { 
  ELOCalculationParams, 
  ELOCalculationResult, 
  RankTier, 
  RANK_TIERS, 
  ELO_CONSTANTS 
} from '../types/elo';

/**
 * Calculate new ELO ratings after a match
 * Uses standard ELO formula with variable K-factors based on games played
 */
export function calculateELO(params: ELOCalculationParams): ELOCalculationResult {
  const { winnerRating, loserRating, winnerGamesPlayed, loserGamesPlayed } = params;
  
  // Ensure ratings are within valid bounds before calculation
  const validWinnerRating = Math.max(ELO_CONSTANTS.RATING_FLOOR, Math.min(ELO_CONSTANTS.RATING_CEILING, winnerRating));
  const validLoserRating = Math.max(ELO_CONSTANTS.RATING_FLOOR, Math.min(ELO_CONSTANTS.RATING_CEILING, loserRating));
  
  // Calculate expected scores
  const expectedWinner = 1 / (1 + Math.pow(10, (validLoserRating - validWinnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (validWinnerRating - validLoserRating) / 400));
  
  // Get K-factors based on games played
  const kWinner = getKFactor(winnerGamesPlayed);
  const kLoser = getKFactor(loserGamesPlayed);
  
  // Calculate rating changes
  const winnerChange = Math.round(kWinner * (1 - expectedWinner));
  const loserChange = Math.round(kLoser * (0 - expectedLoser));
  
  // Calculate new ratings with floor/ceiling constraints
  let winnerNewRating = validWinnerRating + winnerChange;
  let loserNewRating = validLoserRating + loserChange;
  
  // Apply rating constraints
  winnerNewRating = Math.max(ELO_CONSTANTS.RATING_FLOOR, Math.min(ELO_CONSTANTS.RATING_CEILING, winnerNewRating));
  loserNewRating = Math.max(ELO_CONSTANTS.RATING_FLOOR, Math.min(ELO_CONSTANTS.RATING_CEILING, loserNewRating));
  
  return {
    winnerNewRating,
    loserNewRating,
    ratingChange: winnerChange // Positive value showing how much winner gained
  };
}

/**
 * Get K-factor based on number of games played
 * Higher K-factor for new players allows for faster rating adjustments
 */
export function getKFactor(gamesPlayed: number): number {
  const { K_FACTORS, GAMES_THRESHOLD, PLACEMENT_MATCHES } = ELO_CONSTANTS;
  
  // Handle negative or invalid game counts
  const validGamesPlayed = Math.max(0, gamesPlayed);
  
  if (validGamesPlayed < PLACEMENT_MATCHES) {
    return K_FACTORS.PLACEMENT;
  } else if (validGamesPlayed < GAMES_THRESHOLD.NEW_PLAYER) {
    return K_FACTORS.NEW_PLAYER;
  } else if (validGamesPlayed < GAMES_THRESHOLD.REGULAR) {
    return K_FACTORS.REGULAR;
  } else {
    return K_FACTORS.EXPERIENCED;
  }
}

/**
 * Get rank tier based on rating
 */
export function getRankTier(rating: number): RankTier {
  for (const tierInfo of RANK_TIERS) {
    if (rating >= tierInfo.minRating && rating <= tierInfo.maxRating) {
      return tierInfo.tier;
    }
  }
  // Default to iron if something goes wrong
  return 'iron';
}

/**
 * Get rank tier information
 */
export function getRankTierInfo(tier: RankTier) {
  return RANK_TIERS.find(t => t.tier === tier) || RANK_TIERS[0];
}

/**
 * Calculate progress within current tier (0-100%)
 */
export function getTierProgress(rating: number): number {
  const tier = getRankTier(rating);
  const tierInfo = getRankTierInfo(tier);
  
  // Grandmaster has no progress bar (no ceiling)
  if (tier === 'grandmaster') {
    return 100;
  }
  
  const range = tierInfo.maxRating - tierInfo.minRating + 1;
  const progress = rating - tierInfo.minRating;
  
  return Math.round((progress / range) * 100);
}

/**
 * Check if rating change results in tier promotion
 */
export function isPromotion(oldRating: number, newRating: number): boolean {
  const oldTier = getRankTier(oldRating);
  const newTier = getRankTier(newRating);
  
  const oldTierIndex = RANK_TIERS.findIndex(t => t.tier === oldTier);
  const newTierIndex = RANK_TIERS.findIndex(t => t.tier === newTier);
  
  return newTierIndex > oldTierIndex;
}

/**
 * Check if rating change results in tier demotion
 */
export function isDemotion(oldRating: number, newRating: number): boolean {
  const oldTier = getRankTier(oldRating);
  const newTier = getRankTier(newRating);
  
  const oldTierIndex = RANK_TIERS.findIndex(t => t.tier === oldTier);
  const newTierIndex = RANK_TIERS.findIndex(t => t.tier === newTier);
  
  return newTierIndex < oldTierIndex;
}

/**
 * Apply rank protection for newly promoted players
 * Players get 1 game of protection after promotion to prevent immediate demotion
 */
export function applyRankProtection(
  newRating: number, 
  oldRating: number, 
  isFirstGameAfterPromotion: boolean
): number {
  if (!isFirstGameAfterPromotion) {
    return newRating;
  }
  
  const oldTier = getRankTier(oldRating);
  const newTier = getRankTier(newRating);
  
  // If would be demoted on first game after promotion, keep at tier floor
  if (isDemotion(oldRating, newRating)) {
    const oldTierInfo = getRankTierInfo(oldTier);
    return oldTierInfo.minRating;
  }
  
  return newRating;
}

/**
 * Calculate rating after inactivity decay
 */
export function applyInactivityDecay(
  currentRating: number, 
  daysSinceLastGame: number
): number {
  const { INACTIVITY_DECAY_DAYS, INACTIVITY_DECAY_AMOUNT, RATING_FLOOR } = ELO_CONSTANTS;
  
  if (daysSinceLastGame < INACTIVITY_DECAY_DAYS) {
    return currentRating;
  }
  
  // Decay 25 rating for each 28-day period of inactivity
  const decayPeriods = Math.floor(daysSinceLastGame / INACTIVITY_DECAY_DAYS);
  const decayAmount = decayPeriods * INACTIVITY_DECAY_AMOUNT;
  
  return Math.max(RATING_FLOOR, currentRating - decayAmount);
}

/**
 * Calculate matchmaking rating range based on queue time
 */
export function getMatchmakingRange(queueTimeSeconds: number): number {
  if (queueTimeSeconds < 10) return 50;
  if (queueTimeSeconds < 30) return 100;
  if (queueTimeSeconds < 60) return 200;
  if (queueTimeSeconds < 120) return 400;
  return 600; // Max range
}

/**
 * Check if two players can be matched based on rating difference
 */
export function canMatch(
  player1Rating: number, 
  player2Rating: number, 
  maxRatingDiff: number
): boolean {
  return Math.abs(player1Rating - player2Rating) <= maxRatingDiff;
}

/**
 * Calculate season soft reset rating
 * Compresses ratings toward 1500 to reduce spread between seasons
 */
export function calculateSeasonReset(currentRating: number): number {
  const CENTER = 1500;
  const COMPRESSION_FACTOR = 0.75; // Keep 75% of distance from center
  
  const distanceFromCenter = currentRating - CENTER;
  const newDistance = Math.round(distanceFromCenter * COMPRESSION_FACTOR);
  
  const resetRating = CENTER + newDistance;
  
  // Ensure within bounds
  return Math.max(
    ELO_CONSTANTS.RATING_FLOOR, 
    Math.min(ELO_CONSTANTS.RATING_CEILING, resetRating)
  );
}

/**
 * Get placement match progress message
 */
export function getPlacementProgress(placementMatchesRemaining: number): string {
  const completed = ELO_CONSTANTS.PLACEMENT_MATCHES - placementMatchesRemaining;
  return `Placement Match ${completed + 1}/${ELO_CONSTANTS.PLACEMENT_MATCHES}`;
}

/**
 * Estimate initial rating after placement matches
 * Based on wins/losses during placement
 */
export function estimatePlacementRating(wins: number, losses: number): number {
  const BASE = ELO_CONSTANTS.BASE_RATING;
  const winRatio = wins / (wins + losses);
  
  // Each 10% win rate above/below 50% adjusts rating by ~100
  const adjustment = (winRatio - 0.5) * 1000;
  
  const estimatedRating = BASE + adjustment;
  
  return Math.max(
    ELO_CONSTANTS.RATING_FLOOR,
    Math.min(ELO_CONSTANTS.RATING_CEILING, Math.round(estimatedRating))
  );
}