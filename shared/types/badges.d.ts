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
    iconUrl?: string;
    requirements: BadgeRequirement;
    isActive: boolean;
}
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
    customType: string;
    params?: Record<string, any>;
}
export type BadgeRequirement = SimpleBadgeRequirement | ComplexBadgeRequirement | CustomBadgeRequirement;
export interface UserStatistics {
    userId: string;
    username: string;
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    currentWinStreak: number;
    longestWinStreak: number;
    totalRoundsPlayed: number;
    totalFirstSolves: number;
    totalCorrectSolutions: number;
    totalIncorrectAttempts: number;
    fastestSolveMs?: number;
    totalSolveTimeMs: number;
    classicWins: number;
    superModeWins: number;
    extendedRangeWins: number;
    soloPuzzlesCompleted: number;
    consecutiveDaysPlayed: number;
    lastPlayedDate?: Date;
    weekendGames: number;
    nightGames: number;
    earlyGames: number;
    uniqueOpponents: number;
    gamesSpectated: number;
    comebackWins: number;
    underdogWins: number;
    perfectGames: number;
    flawlessVictories: number;
    totalCardsWon: number;
    totalCardsLost: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserBadge {
    id: number;
    userId: string;
    badgeId: string;
    earnedAt: Date;
    progress?: Record<string, any>;
    isFeatured: boolean;
}
export interface BadgeProgress {
    userId: string;
    badgeId: string;
    currentValue: number;
    targetValue: number;
    lastUpdated: Date;
}
export interface BadgeChallenge {
    id: number;
    badgeId: string;
    challengeType: 'daily' | 'weekly';
    multiplier: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
}
export interface BadgeUnlockNotification {
    badge: BadgeDefinition;
    earnedAt: Date;
    isNewTier?: boolean;
    previousTier?: BadgeTier;
}
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
//# sourceMappingURL=badges.d.ts.map