// Badge System Type Definitions

export type BadgeCategory = 'skill' | 'progression' | 'mode' | 'social' | 'unique' | 'seasonal';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BadgeDefinition {
  id: string;
  category: BadgeCategory;
  name: string;
  description: string;
  tier?: BadgeTier;
  rarity: BadgeRarity;
  points: number;
  icon?: string;
  iconUrl?: string;
  requirements: BadgeRequirement;
  isActive: boolean;
}

// Badge requirement types
export type ComparisonOperator = 'eq' | 'gte' | 'lte' | 'gt' | 'lt';

export interface SimpleBadgeRequirement {
  type: 'simple';
  stat: keyof UserStatistics;
  value: number;
  comparison: ComparisonOperator;
}

export interface ComplexBadgeRequirement {
  type: 'and' | 'or';
  conditions: BadgeRequirement[];
}

export interface CustomBadgeRequirement {
  type: 'custom';
  customType: string; // e.g., 'comeback_from_0_5', 'all_operations_used'
  params?: Record<string, any>;
}

export type BadgeRequirement = SimpleBadgeRequirement | ComplexBadgeRequirement | CustomBadgeRequirement;

// User statistics for badge tracking
export interface UserStatistics {
  userId: string;
  username: string;
  
  // Game statistics
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  currentWinStreak: number;
  longestWinStreak: number;
  
  // Performance statistics
  totalRoundsPlayed: number;
  totalFirstSolves: number;
  totalCorrectSolutions: number;
  totalIncorrectAttempts: number;
  fastestSolveMs?: number;
  totalSolveTimeMs: number;
  
  // Mode-specific statistics
  classicWins: number;
  superModeWins: number;
  extendedRangeWins: number;
  soloPuzzlesCompleted: number;
  
  // Time-based statistics
  consecutiveDaysPlayed: number;
  lastPlayedDate?: Date;
  weekendGames: number;
  nightGames: number;        // Games between midnight-6am
  earlyGames: number;        // Games between 5am-8am
  
  // Social statistics
  uniqueOpponents: number;
  gamesSpectated: number;
  
  // Special achievements tracking
  comebackWins: number;      // Wins after being down 0-5
  underdogWins: number;      // Wins against higher-ranked players
  perfectGames: number;      // Games with no incorrect attempts
  flawlessVictories: number; // 10-0 wins
  
  // Aggregate statistics
  totalCardsWon: number;
  totalCardsLost: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// User's earned badge
export interface UserBadge {
  id: number;
  userId: string;
  badgeId: string;
  earnedAt: Date;
  progress?: Record<string, any>;
  isFeatured: boolean;
}

// Badge progress tracking
export interface BadgeProgress {
  userId: string;
  badgeId: string;
  currentValue: number;
  targetValue: number;
  lastUpdated: Date;
}

// Badge challenge
export interface BadgeChallenge {
  id: number;
  badgeId: string;
  challengeType: 'daily' | 'weekly';
  multiplier: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

// Badge notification payload
export interface BadgeUnlockNotification {
  badge: BadgeDefinition;
  earnedAt: Date;
  isNewTier?: boolean;
  previousTier?: BadgeTier;
}

// Badge system API responses
export interface UserBadgeCollection {
  earned: UserBadge[];
  inProgress: BadgeProgress[];
  statistics: UserStatistics;
  totalPoints: number;
  level: number;
}

export interface BadgeLeaderboardEntry {
  userId: string;
  username: string;
  totalBadges: number;
  totalPoints: number;
  level: number;
  raresBadges: number;
  epicBadges: number;
  legendaryBadges: number;
}