// Jest tests for ELO calculation system
import {
  calculateELO,
  getKFactor,
  getRankTier,
  getRankTierInfo,
  getTierProgress,
  isPromotion,
  isDemotion,
  applyRankProtection,
  applyInactivityDecay,
  getMatchmakingRange,
  canMatch,
  calculateSeasonReset,
  getPlacementProgress,
  estimatePlacementRating
} from '../elo';
import { ELO_CONSTANTS } from '../../types/elo';

describe('ELO Calculation System', () => {
  describe('calculateELO', () => {
    it('should calculate correct rating changes for equal ratings', () => {
      const result = calculateELO({
        winnerRating: 1500,
        loserRating: 1500,
        winnerGamesPlayed: 50,
        loserGamesPlayed: 50
      });
      
      expect(result.winnerNewRating).toBe(1510); // +10 for K=20
      expect(result.loserNewRating).toBe(1490); // -10 for K=20
      expect(result.ratingChange).toBe(10);
    });
    
    it('should give smaller gains when winner is higher rated', () => {
      const result = calculateELO({
        winnerRating: 1800,
        loserRating: 1500,
        winnerGamesPlayed: 50,
        loserGamesPlayed: 50
      });
      
      expect(result.ratingChange).toBeLessThan(10);
      expect(result.winnerNewRating).toBeLessThan(1810);
      expect(result.loserNewRating).toBeGreaterThan(1490);
    });
    
    it('should give larger gains when winner is lower rated', () => {
      const result = calculateELO({
        winnerRating: 1200,
        loserRating: 1500,
        winnerGamesPlayed: 50,
        loserGamesPlayed: 50
      });
      
      expect(result.ratingChange).toBeGreaterThan(10);
      expect(result.winnerNewRating).toBeGreaterThan(1210);
      expect(result.loserNewRating).toBeLessThan(1490);
    });
    
    it('should respect rating floor', () => {
      const result = calculateELO({
        winnerRating: 500,
        loserRating: 410,
        winnerGamesPlayed: 100,
        loserGamesPlayed: 100
      });
      
      expect(result.loserNewRating).toBeGreaterThanOrEqual(ELO_CONSTANTS.RATING_FLOOR);
    });
    
    it('should respect rating ceiling', () => {
      const result = calculateELO({
        winnerRating: 2990,
        loserRating: 2900,
        winnerGamesPlayed: 500,
        loserGamesPlayed: 500
      });
      
      expect(result.winnerNewRating).toBeLessThanOrEqual(ELO_CONSTANTS.RATING_CEILING);
    });
    
    it('should handle extreme rating differences', () => {
      // Very high rated player vs very low rated player
      const result = calculateELO({
        winnerRating: 2800,
        loserRating: 400,
        winnerGamesPlayed: 500,
        loserGamesPlayed: 10
      });
      
      // High rated player should gain minimal points
      expect(result.ratingChange).toBeLessThanOrEqual(1);
      // Low rated player should lose minimal points due to floor
      expect(result.loserNewRating).toBe(ELO_CONSTANTS.RATING_FLOOR);
    });
    
    it('should handle upset wins with extreme rating differences', () => {
      // Low rated player beats high rated player
      const result = calculateELO({
        winnerRating: 600,
        loserRating: 2600,
        winnerGamesPlayed: 20,
        loserGamesPlayed: 500
      });
      
      // Low rated player should gain maximum possible points
      expect(result.ratingChange).toBeGreaterThanOrEqual(29); // K=30 for new player
      // High rated player should lose significant points
      expect(result.loserNewRating).toBeLessThanOrEqual(2585);
    });
    
    it('should handle players at exact floor and ceiling', () => {
      const floorResult = calculateELO({
        winnerRating: 400,
        loserRating: 500,
        winnerGamesPlayed: 50,
        loserGamesPlayed: 50
      });
      
      expect(floorResult.winnerNewRating).toBeGreaterThanOrEqual(ELO_CONSTANTS.RATING_FLOOR);
      
      const ceilingResult = calculateELO({
        winnerRating: 3000,
        loserRating: 2950,
        winnerGamesPlayed: 500,
        loserGamesPlayed: 500
      });
      
      expect(ceilingResult.winnerNewRating).toBe(ELO_CONSTANTS.RATING_CEILING);
    });
    
    it('should handle negative game counts gracefully', () => {
      // Should treat negative as 0 (placement matches)
      const result = calculateELO({
        winnerRating: 1500,
        loserRating: 1500,
        winnerGamesPlayed: -5,
        loserGamesPlayed: -10
      });
      
      // Should use placement K-factor (40)
      expect(result.ratingChange).toBe(20); // K=40, 50% expected = 20 points
    });
  });
  
  describe('getKFactor', () => {
    it('should return placement K-factor for first 10 games', () => {
      expect(getKFactor(0)).toBe(40);
      expect(getKFactor(5)).toBe(40);
      expect(getKFactor(9)).toBe(40);
    });
    
    it('should return new player K-factor for games 10-29', () => {
      expect(getKFactor(10)).toBe(30);
      expect(getKFactor(20)).toBe(30);
      expect(getKFactor(29)).toBe(30);
    });
    
    it('should return regular K-factor for games 30-99', () => {
      expect(getKFactor(30)).toBe(20);
      expect(getKFactor(50)).toBe(20);
      expect(getKFactor(99)).toBe(20);
    });
    
    it('should return experienced K-factor for 100+ games', () => {
      expect(getKFactor(100)).toBe(15);
      expect(getKFactor(500)).toBe(15);
      expect(getKFactor(1000)).toBe(15);
    });
  });
  
  describe('getRankTier', () => {
    it('should return correct tier for each rating range', () => {
      expect(getRankTier(400)).toBe('iron');
      expect(getRankTier(1199)).toBe('iron');
      expect(getRankTier(1200)).toBe('bronze');
      expect(getRankTier(1399)).toBe('bronze');
      expect(getRankTier(1400)).toBe('silver');
      expect(getRankTier(1599)).toBe('silver');
      expect(getRankTier(1600)).toBe('gold');
      expect(getRankTier(1799)).toBe('gold');
      expect(getRankTier(1800)).toBe('platinum');
      expect(getRankTier(1999)).toBe('platinum');
      expect(getRankTier(2000)).toBe('diamond');
      expect(getRankTier(2199)).toBe('diamond');
      expect(getRankTier(2200)).toBe('master');
      expect(getRankTier(2399)).toBe('master');
      expect(getRankTier(2400)).toBe('grandmaster');
      expect(getRankTier(3000)).toBe('grandmaster');
    });
  });
  
  describe('getTierProgress', () => {
    it('should calculate correct progress within tier', () => {
      expect(getTierProgress(1200)).toBe(0); // Start of bronze
      expect(getTierProgress(1300)).toBe(50); // Middle of bronze
      expect(getTierProgress(1399)).toBe(100); // End of bronze
      
      expect(getTierProgress(1600)).toBe(0); // Start of gold
      expect(getTierProgress(1700)).toBe(50); // Middle of gold
    });
    
    it('should return 100% for grandmaster', () => {
      expect(getTierProgress(2400)).toBe(100);
      expect(getTierProgress(2800)).toBe(100);
    });
  });
  
  describe('isPromotion and isDemotion', () => {
    it('should detect promotions correctly', () => {
      expect(isPromotion(1399, 1400)).toBe(true); // Bronze to Silver
      expect(isPromotion(1599, 1600)).toBe(true); // Silver to Gold
      expect(isPromotion(2399, 2400)).toBe(true); // Master to Grandmaster
      
      expect(isPromotion(1300, 1350)).toBe(false); // Within bronze
      expect(isPromotion(1400, 1399)).toBe(false); // Demotion
    });
    
    it('should detect demotions correctly', () => {
      expect(isDemotion(1400, 1399)).toBe(true); // Silver to Bronze
      expect(isDemotion(1600, 1599)).toBe(true); // Gold to Silver
      expect(isDemotion(2400, 2399)).toBe(true); // Grandmaster to Master
      
      expect(isDemotion(1300, 1350)).toBe(false); // Within bronze
      expect(isDemotion(1399, 1400)).toBe(false); // Promotion
    });
  });
  
  describe('applyRankProtection', () => {
    it('should prevent demotion on first game after promotion', () => {
      const protectedRating = applyRankProtection(1395, 1405, true);
      expect(protectedRating).toBe(1400); // Kept at silver floor
    });
    
    it('should not affect non-demotion losses after promotion', () => {
      const protectedRating = applyRankProtection(1410, 1420, true);
      expect(protectedRating).toBe(1410); // No protection needed
    });
    
    it('should not protect when not first game after promotion', () => {
      const unprotectedRating = applyRankProtection(1395, 1405, false);
      expect(unprotectedRating).toBe(1395); // Demotion happens
    });
  });
  
  describe('applyInactivityDecay', () => {
    it('should not decay before threshold', () => {
      expect(applyInactivityDecay(1500, 20)).toBe(1500);
      expect(applyInactivityDecay(1500, 27)).toBe(1500);
    });
    
    it('should decay after threshold', () => {
      expect(applyInactivityDecay(1500, 28)).toBe(1475); // -25
      expect(applyInactivityDecay(1500, 56)).toBe(1450); // -50 (2 periods)
      expect(applyInactivityDecay(1500, 84)).toBe(1425); // -75 (3 periods)
    });
    
    it('should respect rating floor', () => {
      expect(applyInactivityDecay(420, 56)).toBe(400); // Can't go below floor
    });
  });
  
  describe('getMatchmakingRange', () => {
    it('should expand range based on queue time', () => {
      expect(getMatchmakingRange(5)).toBe(50);
      expect(getMatchmakingRange(15)).toBe(100);
      expect(getMatchmakingRange(45)).toBe(200);
      expect(getMatchmakingRange(90)).toBe(400);
      expect(getMatchmakingRange(150)).toBe(600);
    });
  });
  
  describe('canMatch', () => {
    it('should allow matches within range', () => {
      expect(canMatch(1500, 1540, 50)).toBe(true);
      expect(canMatch(1500, 1460, 50)).toBe(true);
      expect(canMatch(1500, 1550, 50)).toBe(true);
    });
    
    it('should prevent matches outside range', () => {
      expect(canMatch(1500, 1551, 50)).toBe(false);
      expect(canMatch(1500, 1449, 50)).toBe(false);
    });
  });
  
  describe('calculateSeasonReset', () => {
    it('should compress ratings toward 1500', () => {
      expect(calculateSeasonReset(2000)).toBe(1875); // 75% of 500 above center
      expect(calculateSeasonReset(1000)).toBe(1125); // 75% of 500 below center
      expect(calculateSeasonReset(1500)).toBe(1500); // No change at center
    });
    
    it('should respect rating bounds', () => {
      expect(calculateSeasonReset(3000)).toBeLessThanOrEqual(ELO_CONSTANTS.RATING_CEILING);
      expect(calculateSeasonReset(400)).toBeGreaterThanOrEqual(ELO_CONSTANTS.RATING_FLOOR);
    });
  });
  
  describe('getPlacementProgress', () => {
    it('should show correct placement match progress', () => {
      expect(getPlacementProgress(10)).toBe('Placement Match 1/10');
      expect(getPlacementProgress(5)).toBe('Placement Match 6/10');
      expect(getPlacementProgress(1)).toBe('Placement Match 10/10');
    });
  });
  
  describe('estimatePlacementRating', () => {
    it('should estimate rating based on placement performance', () => {
      expect(estimatePlacementRating(5, 5)).toBe(1200); // 50% win rate
      expect(estimatePlacementRating(10, 0)).toBe(1700); // 100% win rate
      expect(estimatePlacementRating(0, 10)).toBe(700); // 0% win rate
      expect(estimatePlacementRating(7, 3)).toBe(1400); // 70% win rate
      expect(estimatePlacementRating(3, 7)).toBe(1000); // 30% win rate
    });
  });
});