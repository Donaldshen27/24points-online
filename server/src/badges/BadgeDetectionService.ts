import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  BadgeDefinition, 
  UserStatistics, 
  BadgeRequirement,
  SimpleBadgeRequirement,
  ComplexBadgeRequirement,
  CustomBadgeRequirement,
  UserBadge,
  BadgeProgress,
  BadgeUnlockNotification
} from '../../../shared/types/badges';
import { BADGE_DEFINITIONS, getBadgeById } from './badgeDefinitions';
import { statisticsService } from './StatisticsService';
import { getBadgeIcon } from './badgeIconMapping';

export class BadgeDetectionService {
  private supabase!: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not found. Badge detection disabled.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Check for new badge unlocks after a game
   */
  async checkBadgesAfterGame(userId: string): Promise<BadgeUnlockNotification[]> {
    if (!this.supabase) return [];

    console.log(`[BadgeDetection] Checking badges for user ${userId}`);

    try {
      // Get user's current statistics
      const stats = await statisticsService.getUserStats(userId);
      if (!stats) {
        console.log(`[BadgeDetection] No stats found for user ${userId}`);
        return [];
      }
      
      console.log(`[BadgeDetection] User stats:`, {
        userId: stats.userId,
        fastestSolveMs: stats.fastestSolveMs,
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon
      });

      // Get user's current badges
      const { data: earnedBadges } = await this.supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      const earnedBadgeIds = new Set(earnedBadges?.map(b => b.badge_id) || []);
      const newBadges: BadgeUnlockNotification[] = [];

      // Check each badge definition
      for (const badge of BADGE_DEFINITIONS) {
        if (!badge.isActive) continue;
        
        // Skip if already earned (unless it's a tiered badge we can upgrade)
        if (earnedBadgeIds.has(badge.id)) {
          // Check if this is a tiered badge that can be upgraded
          if (badge.tier) {
            const higherTier = this.checkForTierUpgrade(badge, earnedBadgeIds);
            if (higherTier) {
              const isEarned = await this.checkBadgeRequirements(higherTier, stats, userId);
              if (isEarned) {
                await this.awardBadge(userId, higherTier.id);
                newBadges.push({
                  badge: higherTier,
                  earnedAt: new Date(),
                  isNewTier: true,
                  previousTier: badge.tier
                });
              }
            }
          }
          continue;
        }

        // Check if requirements are met
        const isEarned = await this.checkBadgeRequirements(badge, stats, userId);
        if (isEarned) {
          console.log(`[BadgeDetection] Badge earned: ${badge.id} for user ${userId}`);
          await this.awardBadge(userId, badge.id);
          newBadges.push({
            badge,
            earnedAt: new Date()
          });
        } else {
          // Update progress for this badge
          await this.updateBadgeProgress(userId, badge, stats);
        }
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }

  /**
   * Check if a badge's requirements are met
   */
  private async checkBadgeRequirements(
    badge: BadgeDefinition, 
    stats: UserStatistics,
    userId: string
  ): Promise<boolean> {
    return this.evaluateRequirement(badge.requirements, stats, userId);
  }

  /**
   * Evaluate a badge requirement recursively
   */
  private async evaluateRequirement(
    requirement: BadgeRequirement,
    stats: UserStatistics,
    userId: string
  ): Promise<boolean> {
    switch (requirement.type) {
      case 'simple':
        return this.evaluateSimpleRequirement(requirement as SimpleBadgeRequirement, stats);
      
      case 'and':
        const andReq = requirement as ComplexBadgeRequirement;
        for (const condition of andReq.conditions) {
          if (!await this.evaluateRequirement(condition, stats, userId)) {
            return false;
          }
        }
        return true;
      
      case 'or':
        const orReq = requirement as ComplexBadgeRequirement;
        for (const condition of orReq.conditions) {
          if (await this.evaluateRequirement(condition, stats, userId)) {
            return true;
          }
        }
        return false;
      
      case 'custom':
        return this.evaluateCustomRequirement(requirement as CustomBadgeRequirement, stats, userId);
      
      default:
        return false;
    }
  }

  /**
   * Evaluate a simple stat comparison
   */
  private evaluateSimpleRequirement(
    requirement: SimpleBadgeRequirement,
    stats: UserStatistics
  ): boolean {
    const statValue = stats[requirement.stat as keyof UserStatistics] as number;
    if (statValue === undefined || statValue === null) return false;

    switch (requirement.comparison) {
      case 'eq': return statValue === requirement.value;
      case 'gte': return statValue >= requirement.value;
      case 'lte': return statValue <= requirement.value;
      case 'gt': return statValue > requirement.value;
      case 'lt': return statValue < requirement.value;
      default: return false;
    }
  }

  /**
   * Evaluate custom requirements
   */
  private async evaluateCustomRequirement(
    requirement: CustomBadgeRequirement,
    stats: UserStatistics,
    userId: string
  ): Promise<boolean> {
    switch (requirement.customType) {

      case 'puzzle_records':
        // Query puzzle records from database
        const { data: records } = await this.supabase
          .from('solve_records')
          .select('puzzle_key')
          .eq('username', stats.username)
          .eq('solve_time_ms', this.supabase.rpc('get_min_solve_time_for_puzzle'));
        
        return (records?.length || 0) >= (requirement.params?.count || 0);

      case 'same_opponent_games':
        // This would require tracking opponent history
        // For now, return false
        return false;

      case 'sub_second_solves':
        // Count puzzles solved in under 1 second
        // This would require detailed solve history
        return false;

      case 'marathon_session':
        // Check for 3+ hour continuous play session
        // This would require session tracking
        return false;

      case 'all_operations_used':
        // Check if all 4 operations were used in a solution
        // This is tracked during gameplay
        return false;

      case 'minimal_operations_win':
        // Win using only addition and subtraction
        // This is tracked during gameplay
        return false;

      case 'multiple_languages':
        // Check if player has used both English and Chinese
        // This would require language usage tracking
        return false;

      case 'launch_week_player':
        // Check if player joined during launch week
        const launchDate = new Date('2025-01-01'); // TODO: Update with actual launch date
        const joinDate = stats.createdAt;
        const weekLater = new Date(launchDate);
        weekLater.setDate(weekLater.getDate() + 7);
        return joinDate >= launchDate && joinDate <= weekLater;

      default:
        return false;
    }
  }

  /**
   * Check if a higher tier of a badge is available
   */
  private checkForTierUpgrade(
    currentBadge: BadgeDefinition,
    earnedBadgeIds: Set<string>
  ): BadgeDefinition | null {
    if (!currentBadge.tier) return null;

    const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentTierIndex = tiers.indexOf(currentBadge.tier);
    
    if (currentTierIndex === -1 || currentTierIndex === tiers.length - 1) {
      return null; // No higher tier
    }

    // Find the next tier badge
    const baseId = currentBadge.id.replace(`_${currentBadge.tier}`, '');
    const nextTier = tiers[currentTierIndex + 1];
    const nextBadgeId = `${baseId}_${nextTier}`;

    // Check if next tier exists and isn't earned yet
    if (!earnedBadgeIds.has(nextBadgeId)) {
      return getBadgeById(nextBadgeId) || null;
    }

    return null;
  }

  /**
   * Award a badge to a user
   */
  private async awardBadge(userId: string, badgeId: string): Promise<void> {
    if (!this.supabase) {
      console.error('Supabase client not initialized in awardBadge');
      return;
    }

    console.log(`[BadgeDetection] Attempting to award badge ${badgeId} to user ${userId}`);

    try {
      // First check if tables exist
      const { data: tableCheck, error: tableError } = await this.supabase
        .from('user_badges')
        .select('id')
        .limit(1);
      
      if (tableError && tableError.code === '42P01') {
        console.error('[BadgeDetection] user_badges table does not exist! Run migrations first.');
        return;
      }

      const { data, error } = await this.supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId
          // earned_at is handled by database default
        })
        .select();

      if (error) {
        console.error(`[BadgeDetection] Error awarding badge ${badgeId} to user ${userId}:`, error);
        console.error('[BadgeDetection] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Check if it's a duplicate key error
        if (error.code === '23505') {
          console.log(`[BadgeDetection] User ${userId} already has badge ${badgeId}`);
        }
      } else {
        console.log(`[BadgeDetection] Badge awarded successfully: ${badgeId} to user ${userId}`, data);
      }
    } catch (error) {
      console.error('[BadgeDetection] Exception in awardBadge:', error);
    }
  }

  /**
   * Update progress tracking for a badge
   */
  private async updateBadgeProgress(
    userId: string,
    badge: BadgeDefinition,
    stats: UserStatistics
  ): Promise<void> {
    if (!this.supabase) return;

    // Only track progress for simple requirements
    if (badge.requirements.type !== 'simple') return;

    const requirement = badge.requirements as SimpleBadgeRequirement;
    const currentValue = stats[requirement.stat as keyof UserStatistics] as number || 0;
    const targetValue = requirement.value;

    try {
      await this.supabase
        .from('badge_progress')
        .upsert({
          user_id: userId,
          badge_id: badge.id,
          current_value: currentValue,
          target_value: targetValue,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,badge_id'
        });
    } catch (error) {
      console.error('Error updating badge progress:', error);
    }
  }

  /**
   * Get user's badge collection
   */
  async getUserBadges(userId: string): Promise<{
    success: boolean;
    badges: UserBadge[];
    inProgress: BadgeProgress[];
    totalPoints: number;
    level: number;
  }> {
    if (!this.supabase) {
      return { success: false, badges: [], inProgress: [], totalPoints: 0, level: 1 };
    }

    try {
      // Get earned badges with icon URLs from badge_definitions
      const { data: earnedBadges } = await this.supabase
        .from('user_badges')
        .select(`
          *,
          badge_definition:badge_definitions!badge_id(icon_url)
        `)
        .eq('user_id', userId);

      // Get badge progress
      const { data: badgeProgress } = await this.supabase
        .from('badge_progress')
        .select('*')
        .eq('user_id', userId);

      // Enrich badge data with definitions
      const enrichedBadges: UserBadge[] = [];
      let totalPoints = 0;
      
      for (const userBadge of (earnedBadges || [])) {
        const badge = getBadgeById(userBadge.badge_id);
        if (badge) {
          totalPoints += badge.points * (userBadge.tier || 1);
          
          // Get icon URL from joined data
          const iconUrl = userBadge.badge_definition?.icon_url || undefined;
          
          enrichedBadges.push({
            ...userBadge,
            name: badge.name,
            description: badge.description,
            category: badge.category,
            rarity: badge.rarity,
            points: badge.points,
            icon: badge.icon || getBadgeIcon(userBadge.badge_id),
            iconUrl: iconUrl,
            featured: userBadge.is_featured || false
          } as any);
        }
      }

      // Calculate level (100 points per level)
      const level = Math.floor(totalPoints / 100) + 1;

      return {
        success: true,
        badges: enrichedBadges,
        inProgress: badgeProgress as BadgeProgress[] || [],
        totalPoints,
        level
      };
    } catch (error) {
      console.error('Error getting user badges:', error);
      return { success: false, badges: [], inProgress: [], totalPoints: 0, level: 1 };
    }
  }

  /**
   * Update featured badges for a user
   */
  async updateFeaturedBadges(userId: string, badgeIds: string[]): Promise<boolean> {
    if (!this.supabase) {
      console.log('[Featured Badges] Supabase not configured');
      return false;
    }

    try {
      console.log('[Featured Badges] Updating for user:', userId, 'with badges:', badgeIds);
      
      // First, reset all featured flags for this user
      const resetResult = await this.supabase
        .from('user_badges')
        .update({ is_featured: false })
        .eq('user_id', userId);
      
      console.log('[Featured Badges] Reset result:', resetResult.error ? 'Error' : 'Success');
      if (resetResult.error) {
        console.error('[Featured Badges] Reset error:', resetResult.error);
      }

      // Then set featured flag for selected badges
      if (badgeIds.length > 0) {
        const updateResult = await this.supabase
          .from('user_badges')
          .update({ is_featured: true })
          .eq('user_id', userId)
          .in('badge_id', badgeIds);
        
        console.log('[Featured Badges] Update result:', updateResult.error ? 'Error' : 'Success');
        if (updateResult.error) {
          console.error('[Featured Badges] Update error:', updateResult.error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating featured badges:', error);
      return false;
    }
  }

  /**
   * Check for badges that need special event tracking
   */
  async trackSpecialEvent(
    userId: string,
    eventType: string,
    eventData?: any
  ): Promise<BadgeUnlockNotification[]> {
    if (!this.supabase) return [];

    const newBadges: BadgeUnlockNotification[] = [];

    try {
      switch (eventType) {
        case 'all_operations_used':
          // Check if Mathematical Genius badge should be awarded
          const mathBadge = BADGE_DEFINITIONS.find(b => b.id === 'mathematical_genius');
          if (mathBadge) {
            const { data: hasBadge } = await this.supabase
              .from('user_badges')
              .select('badge_id')
              .eq('user_id', userId)
              .eq('badge_id', mathBadge.id)
              .single();

            if (!hasBadge) {
              await this.awardBadge(userId, mathBadge.id);
              newBadges.push({
                badge: mathBadge,
                earnedAt: new Date()
              });
            }
          }
          break;

        case 'minimal_operations_win':
          // Check if Minimalist badge should be awarded
          const minBadge = BADGE_DEFINITIONS.find(b => b.id === 'minimalist');
          if (minBadge) {
            const { data: hasBadge } = await this.supabase
              .from('user_badges')
              .select('badge_id')
              .eq('user_id', userId)
              .eq('badge_id', minBadge.id)
              .single();

            if (!hasBadge) {
              await this.awardBadge(userId, minBadge.id);
              newBadges.push({
                badge: minBadge,
                earnedAt: new Date()
              });
            }
          }
          break;
      }

      return newBadges;
    } catch (error) {
      console.error('Error tracking special event:', error);
      return [];
    }
  }
}

// Singleton instance
export const badgeDetectionService = new BadgeDetectionService();