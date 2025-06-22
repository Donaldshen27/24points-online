import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { BadgeDetectionService } from '../badges/BadgeDetectionService';
import { StatisticsService } from '../badges/StatisticsService';
import { supabase } from '../db/supabase';

const router = Router();
const badgeService = new BadgeDetectionService();
const statsService = new StatisticsService();

// Get user's badges and statistics
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    if (!supabase) {
      return res.status(503).json({ 
        error: 'Badge service unavailable',
        badges: [],
        statistics: null 
      });
    }

    // Get user's badges
    const { data: badges, error: badgesError } = await supabase
      .from('user_badges')
      .select('*, badge:badge_definitions(*)')
      .eq('user_id', userId)
      .order('id', { ascending: false }); // Order by id instead of earned_at

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return res.status(500).json({ error: 'Failed to fetch badges' });
    }
    
    console.log('[BadgeRoute] Fetched badges for user:', userId, 'Count:', badges?.length);
    if (badges && badges.length > 0) {
      console.log('[BadgeRoute] Sample badge structure:', JSON.stringify(badges[0], null, 2));
    }

    // Get user's statistics
    const { data: stats, error: statsError } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // Not found is ok
      console.error('Error fetching statistics:', statsError);
    }

    // Get badge progress
    const { data: progress, error: progressError } = await supabase
      .from('badge_progress')
      .select('*')
      .eq('user_id', userId);

    if (progressError) {
      console.error('Error fetching badge progress:', progressError);
    }

    // Transform badges to match frontend expectations
    const transformedBadges = (badges || []).map(b => ({
      id: b.id,
      userId: b.user_id,
      badgeId: b.badge_id,
      earnedAt: b.earned_at || new Date().toISOString(),
      progress: b.progress || {},
      isFeatured: b.is_featured || false,
      badge: b.badge // Keep the joined badge definition
    }));
    
    res.json({
      badges: transformedBadges,
      statistics: stats || null,
      progress: progress || []
    });
  } catch (error) {
    console.error('Error in badges endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all badge definitions
router.get('/definitions', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ 
        error: 'Badge service unavailable',
        definitions: [] 
      });
    }

    const { data: definitions, error } = await supabase
      .from('badge_definitions')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('points', { ascending: true });

    if (error) {
      console.error('Error fetching badge definitions:', error);
      return res.status(500).json({ error: 'Failed to fetch badge definitions' });
    }

    res.json({ definitions: definitions || [] });
  } catch (error) {
    console.error('Error in badge definitions endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update featured badges
router.put('/featured', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { badgeIds } = req.body;

    if (!Array.isArray(badgeIds) || badgeIds.length > 3) {
      return res.status(400).json({ error: 'Invalid badge IDs. Maximum 3 badges allowed.' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Badge service unavailable' });
    }

    // Verify user owns these badges
    const { data: userBadges, error: verifyError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
      .in('badge_id', badgeIds);

    if (verifyError || !userBadges || userBadges.length !== badgeIds.length) {
      return res.status(400).json({ error: 'Invalid badges selected' });
    }

    // Update user's featured badges in statistics
    const { error: updateError } = await supabase
      .from('user_statistics')
      .update({ featured_badges: badgeIds })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating featured badges:', updateError);
      return res.status(500).json({ error: 'Failed to update featured badges' });
    }

    res.json({ success: true, featuredBadges: badgeIds });
  } catch (error) {
    console.error('Error updating featured badges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard with badge counts
router.get('/leaderboard', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ 
        error: 'Badge service unavailable',
        leaderboard: [] 
      });
    }

    // Get top players by badge points
    const { data: leaderboard, error } = await supabase
      .rpc('get_badge_leaderboard', { limit_count: 100 });

    if (error) {
      console.error('Error fetching badge leaderboard:', error);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }

    res.json({ leaderboard: leaderboard || [] });
  } catch (error) {
    console.error('Error in badge leaderboard endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;