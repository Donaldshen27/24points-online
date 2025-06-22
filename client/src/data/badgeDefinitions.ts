import type { BadgeDefinition, BadgeCategory, BadgeTier, BadgeRarity } from '../types/badges';

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


// Client-side badge definitions (subset for display)
export const CLIENT_BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ===== SKILL-BASED BADGES =====
  
  // Speed Demon badges
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

  // Lightning Reflexes badges
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

  // Individual skill badges
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

  // Add more badges as needed...
];

// Badge categories for UI
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