import { BadgeDefinition, BadgeCategory, BadgeTier, BadgeRarity } from '../../../shared/types/badges';

// Helper function to create tiered badges
function createTieredBadge(
  baseId: string,
  category: BadgeCategory,
  baseName: string,
  baseDescription: string,
  statKey: string,
  tiers: { tier: BadgeTier; value: number; rarity: BadgeRarity; points: number }[]
): BadgeDefinition[] {
  return tiers.map(({ tier, value, rarity, points }) => ({
    id: `${baseId}_${tier}`,
    category,
    name: `${baseName} ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
    description: baseDescription.replace('{value}', 
      statKey === 'fastestSolveMs' ? (value / 1000).toString() : value.toString()
    ),
    tier,
    rarity,
    points,
    requirements: {
      type: 'simple' as const,
      stat: statKey as any,
      value,
      comparison: statKey === 'fastestSolveMs' ? 'lte' as const : 'gte' as const
    },
    isActive: true
  }));
}


// All badge definitions
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ===== SKILL-BASED BADGES =====
  
  // Speed Demon badges (solve puzzles quickly)
  ...createTieredBadge(
    'speed_demon',
    'skill',
    'Speed Demon',
    'Solve a puzzle in under {value} seconds',
    'fastestSolveMs',
    [
      { tier: 'bronze', value: 10000, rarity: 'common', points: 10 },
      { tier: 'silver', value: 7000, rarity: 'common', points: 20 },
      { tier: 'gold', value: 5000, rarity: 'rare', points: 40 },
      { tier: 'platinum', value: 4000, rarity: 'epic', points: 80 },
      { tier: 'diamond', value: 3000, rarity: 'legendary', points: 150 }
    ]
  ),

  // Lightning Reflexes badges (first to solve)
  ...createTieredBadge(
    'lightning_reflexes',
    'skill',
    'Lightning Reflexes',
    'Be first to solve in {value} rounds',
    'totalFirstSolves',
    [
      { tier: 'bronze', value: 10, rarity: 'common', points: 10 },
      { tier: 'silver', value: 25, rarity: 'common', points: 25 },
      { tier: 'gold', value: 50, rarity: 'rare', points: 50 },
      { tier: 'platinum', value: 100, rarity: 'epic', points: 100 },
      { tier: 'diamond', value: 250, rarity: 'legendary', points: 250 }
    ]
  ),

  // Flawless Victory badge
  {
    id: 'flawless_victory',
    category: 'skill',
    name: 'Flawless Victory',
    description: 'Win 10-0 (opponent gets all 20 cards)',
    rarity: 'epic',
    points: 100,
    requirements: {
      type: 'simple',
      stat: 'flawlessVictories' as any,
      value: 1,
      comparison: 'gte'
    },
    isActive: true
  },

  // ===== PROGRESSION BADGES =====
  
  // Games Played badges
  ...createTieredBadge(
    'veteran',
    'progression',
    'Veteran',
    'Play {value} games',
    'gamesPlayed',
    [
      { tier: 'bronze', value: 10, rarity: 'common', points: 5 },
      { tier: 'silver', value: 50, rarity: 'common', points: 15 },
      { tier: 'gold', value: 100, rarity: 'common', points: 30 },
      { tier: 'platinum', value: 500, rarity: 'rare', points: 75 },
      { tier: 'diamond', value: 1000, rarity: 'epic', points: 150 }
    ]
  ),

  // Victory badges
  ...createTieredBadge(
    'champion',
    'progression',
    'Champion',
    'Win {value} games',
    'gamesWon',
    [
      { tier: 'bronze', value: 10, rarity: 'common', points: 10 },
      { tier: 'silver', value: 50, rarity: 'common', points: 25 },
      { tier: 'gold', value: 100, rarity: 'rare', points: 50 },
      { tier: 'platinum', value: 500, rarity: 'epic', points: 125 },
      { tier: 'diamond', value: 1000, rarity: 'legendary', points: 250 }
    ]
  ),

  // Win Streak badges
  ...createTieredBadge(
    'unstoppable',
    'progression',
    'Unstoppable',
    'Win {value} games in a row',
    'longestWinStreak',
    [
      { tier: 'bronze', value: 3, rarity: 'common', points: 15 },
      { tier: 'silver', value: 5, rarity: 'common', points: 30 },
      { tier: 'gold', value: 10, rarity: 'rare', points: 60 },
      { tier: 'platinum', value: 15, rarity: 'epic', points: 120 },
      { tier: 'diamond', value: 20, rarity: 'legendary', points: 200 }
    ]
  ),

  // Daily Devotion badges
  ...createTieredBadge(
    'daily_devotion',
    'progression',
    'Daily Devotion',
    'Play for {value} consecutive days',
    'consecutiveDaysPlayed',
    [
      { tier: 'bronze', value: 7, rarity: 'common', points: 20 },
      { tier: 'silver', value: 30, rarity: 'rare', points: 50 },
      { tier: 'gold', value: 100, rarity: 'epic', points: 150 },
      { tier: 'platinum', value: 365, rarity: 'legendary', points: 500 }
    ]
  ),

  // Weekend Warrior badge
  {
    id: 'weekend_warrior',
    category: 'progression',
    name: 'Weekend Warrior',
    description: 'Play 50 games on weekends',
    rarity: 'common',
    points: 25,
    requirements: {
      type: 'simple',
      stat: 'weekendGames' as any,
      value: 50,
      comparison: 'gte'
    },
    isActive: true
  },

  // ===== MODE-SPECIFIC BADGES =====
  
  {
    id: 'classic_master',
    category: 'mode',
    name: 'Classic Master',
    description: 'Win 100 games in Classic mode',
    rarity: 'rare',
    points: 50,
    requirements: {
      type: 'simple',
      stat: 'classicWins' as any,
      value: 100,
      comparison: 'gte'
    },
    isActive: true
  },

  {
    id: 'super_mode_champion',
    category: 'mode',
    name: 'Super Mode Champion',
    description: 'Win 50 games in Super Mode (8 cards)',
    rarity: 'epic',
    points: 75,
    requirements: {
      type: 'simple',
      stat: 'superModeWins' as any,
      value: 50,
      comparison: 'gte'
    },
    isActive: true
  },

  {
    id: 'extended_range_expert',
    category: 'mode',
    name: 'Extended Range Expert',
    description: 'Win 50 games in Extended Range mode',
    rarity: 'epic',
    points: 75,
    requirements: {
      type: 'simple',
      stat: 'extendedRangeWins' as any,
      value: 50,
      comparison: 'gte'
    },
    isActive: true
  },

  {
    id: 'solo_practice_guru',
    category: 'mode',
    name: 'Solo Practice Guru',
    description: 'Complete 500 solo practice puzzles',
    rarity: 'rare',
    points: 40,
    requirements: {
      type: 'simple',
      stat: 'soloPuzzlesCompleted' as any,
      value: 500,
      comparison: 'gte'
    },
    isActive: true
  },

  {
    id: 'mode_explorer',
    category: 'mode',
    name: 'Mode Explorer',
    description: 'Win at least once in each game mode',
    rarity: 'common',
    points: 30,
    requirements: {
      type: 'and',
      conditions: [
        { type: 'simple', stat: 'classicWins' as any, value: 1, comparison: 'gte' },
        { type: 'simple', stat: 'superModeWins' as any, value: 1, comparison: 'gte' },
        { type: 'simple', stat: 'extendedRangeWins' as any, value: 1, comparison: 'gte' }
      ]
    },
    isActive: true
  },

  // ===== SOCIAL & COMMUNITY BADGES =====
  
  {
    id: 'friendly_rival',
    category: 'social',
    name: 'Friendly Rival',
    description: 'Play 50 games with the same opponent',
    rarity: 'rare',
    points: 40,
    requirements: {
      type: 'custom',
      customType: 'same_opponent_games',
      params: { count: 50 }
    },
    isActive: true
  },

  {
    id: 'spectator_sport',
    category: 'social',
    name: 'Spectator Sport',
    description: 'Watch 100 games as a spectator',
    rarity: 'common',
    points: 20,
    requirements: {
      type: 'simple',
      stat: 'gamesSpectated' as any,
      value: 100,
      comparison: 'gte'
    },
    isActive: true
  },

  // Record Breaker badges
  ...createTieredBadge(
    'record_breaker',
    'social',
    'Record Breaker',
    'Hold {value} puzzle records',
    'puzzleRecords',
    [
      { tier: 'bronze', value: 1, rarity: 'common', points: 20 },
      { tier: 'silver', value: 10, rarity: 'rare', points: 50 },
      { tier: 'gold', value: 50, rarity: 'epic', points: 100 },
      { tier: 'platinum', value: 100, rarity: 'legendary', points: 200 }
    ]
  ),

  // ===== UNIQUE ACHIEVEMENT BADGES =====
  
  {
    id: 'comeback_king',
    category: 'unique',
    name: 'Comeback King',
    description: 'Win after being down 0-5',
    rarity: 'epic',
    points: 100,
    requirements: {
      type: 'simple',
      stat: 'comebackWins' as any,
      value: 1,
      comparison: 'gte'
    },
    isActive: true
  },

  {
    id: 'underdog',
    category: 'unique',
    name: 'Underdog',
    description: 'Beat an opponent with 500+ more games played',
    rarity: 'rare',
    points: 50,
    requirements: {
      type: 'simple',
      stat: 'underdogWins' as any,
      value: 1,
      comparison: 'gte'
    },
    isActive: true
  },

  {
    id: 'night_owl',
    category: 'unique',
    name: 'Night Owl',
    description: 'Play 50 games between midnight and 6am',
    rarity: 'common',
    points: 25,
    requirements: {
      type: 'simple',
      stat: 'nightGames' as any,
      value: 50,
      comparison: 'gte'
    },
    isActive: true
  },

  {
    id: 'early_bird',
    category: 'unique',
    name: 'Early Bird',
    description: 'Play 50 games between 5am and 8am',
    rarity: 'common',
    points: 25,
    requirements: {
      type: 'simple',
      stat: 'earlyGames' as any,
      value: 50,
      comparison: 'gte'
    },
    isActive: true
  },

  {
    id: 'marathon_runner',
    category: 'unique',
    name: 'Marathon Runner',
    description: 'Play for 3+ hours straight',
    rarity: 'rare',
    points: 40,
    requirements: {
      type: 'custom',
      customType: 'marathon_session',
      params: { hours: 3 }
    },
    isActive: true
  },

  {
    id: 'quick_thinker',
    category: 'unique',
    name: 'Quick Thinker',
    description: 'Solve 10 puzzles under 1 second each',
    rarity: 'legendary',
    points: 200,
    requirements: {
      type: 'custom',
      customType: 'sub_second_solves',
      params: { count: 10 }
    },
    isActive: true
  },

  {
    id: 'mathematical_genius',
    category: 'unique',
    name: 'Mathematical Genius',
    description: 'Use all 4 operations (+, -, ×, ÷) in one solution',
    rarity: 'rare',
    points: 40,
    requirements: {
      type: 'custom',
      customType: 'all_operations_used'
    },
    isActive: true
  },

  {
    id: 'minimalist',
    category: 'unique',
    name: 'Minimalist',
    description: 'Win a game using only addition and subtraction',
    rarity: 'rare',
    points: 50,
    requirements: {
      type: 'custom',
      customType: 'minimal_operations_win'
    },
    isActive: true
  },

  {
    id: 'international_player',
    category: 'unique',
    name: 'International Player',
    description: 'Play games in both English and Chinese',
    rarity: 'common',
    points: 20,
    requirements: {
      type: 'custom',
      customType: 'multiple_languages'
    },
    isActive: true
  },

  // ===== SEASONAL/EVENT BADGES =====
  
  {
    id: 'launch_week_pioneer',
    category: 'seasonal',
    name: 'Launch Week Pioneer',
    description: 'Played during the first week of launch',
    rarity: 'legendary',
    points: 100,
    requirements: {
      type: 'custom',
      customType: 'launch_week_player'
    },
    isActive: false // Will be activated during launch week
  },

  {
    id: 'beta_tester',
    category: 'seasonal',
    name: 'Beta Tester',
    description: 'Participated in beta testing new features',
    rarity: 'epic',
    points: 75,
    requirements: {
      type: 'custom',
      customType: 'beta_tester'
    },
    isActive: false
  }
];

// Badge categories for UI organization
export const BADGE_CATEGORIES = {
  skill: {
    name: 'Skill & Performance',
    description: 'Badges earned through skillful play',
    icon: '⚡'
  },
  progression: {
    name: 'Progression',
    description: 'Badges earned through consistent play',
    icon: '📈'
  },
  mode: {
    name: 'Game Modes',
    description: 'Badges for mastering different game modes',
    icon: '🎮'
  },
  social: {
    name: 'Social & Community',
    description: 'Badges for community engagement',
    icon: '👥'
  },
  unique: {
    name: 'Unique Achievements',
    description: 'Special and unusual achievements',
    icon: '⭐'
  },
  seasonal: {
    name: 'Seasonal & Events',
    description: 'Limited-time and event badges',
    icon: '🎉'
  }
};

// Rarity colors and labels
export const BADGE_RARITIES = {
  common: { color: '#9CA3AF', label: 'Common', points: 1 },
  rare: { color: '#3B82F6', label: 'Rare', points: 2 },
  epic: { color: '#8B5CF6', label: 'Epic', points: 4 },
  legendary: { color: '#F59E0B', label: 'Legendary', points: 8 }
};

// Tier metals
export const BADGE_TIERS = {
  bronze: { color: '#CD7F32', label: 'Bronze' },
  silver: { color: '#C0C0C0', label: 'Silver' },
  gold: { color: '#FFD700', label: 'Gold' },
  platinum: { color: '#E5E4E2', label: 'Platinum' },
  diamond: { color: '#B9F2FF', label: 'Diamond' }
};

// Helper function to get badge by ID
export function getBadgeById(badgeId: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(badge => badge.id === badgeId);
}

// Helper function to get badges by category
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(badge => badge.category === category);
}

// Helper function to calculate total possible points
export function getTotalPossiblePoints(): number {
  return BADGE_DEFINITIONS.reduce((total, badge) => total + badge.points, 0);
}

// Helper function to calculate player level from points
export function calculateLevel(points: number): number {
  // Level calculation: every 100 points = 1 level
  return Math.floor(points / 100) + 1;
}

// Helper function to calculate points needed for next level
export function pointsToNextLevel(currentPoints: number): number {
  const nextLevelPoints = (Math.floor(currentPoints / 100) + 1) * 100;
  return nextLevelPoints - currentPoints;
}