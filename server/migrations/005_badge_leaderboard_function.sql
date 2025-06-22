-- Function to get badge leaderboard with user statistics and badge counts

CREATE OR REPLACE FUNCTION get_badge_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  user_id VARCHAR(255),
  username VARCHAR(100),
  total_badges INTEGER,
  total_points INTEGER,
  legendary_count INTEGER,
  epic_count INTEGER,
  rare_count INTEGER,
  common_count INTEGER,
  games_won INTEGER,
  win_rate NUMERIC(5,2),
  is_guest BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH badge_counts AS (
    SELECT 
      ub.user_id,
      COUNT(*) as total_badges,
      SUM(bd.points) as total_points,
      COUNT(*) FILTER (WHERE bd.rarity = 'legendary') as legendary_count,
      COUNT(*) FILTER (WHERE bd.rarity = 'epic') as epic_count,
      COUNT(*) FILTER (WHERE bd.rarity = 'rare') as rare_count,
      COUNT(*) FILTER (WHERE bd.rarity = 'common') as common_count
    FROM user_badges ub
    JOIN badge_definitions bd ON ub.badge_id = bd.id
    GROUP BY ub.user_id
  )
  SELECT 
    us.user_id,
    us.username,
    COALESCE(bc.total_badges, 0)::INTEGER as total_badges,
    COALESCE(bc.total_points, 0)::INTEGER as total_points,
    COALESCE(bc.legendary_count, 0)::INTEGER as legendary_count,
    COALESCE(bc.epic_count, 0)::INTEGER as epic_count,
    COALESCE(bc.rare_count, 0)::INTEGER as rare_count,
    COALESCE(bc.common_count, 0)::INTEGER as common_count,
    us.games_won,
    CASE 
      WHEN us.games_played > 0 THEN ROUND((us.games_won::NUMERIC / us.games_played) * 100, 2)
      ELSE 0
    END as win_rate,
    us.is_guest
  FROM user_statistics us
  LEFT JOIN badge_counts bc ON us.user_id = bc.user_id
  WHERE us.games_played > 0  -- Only include users who have played at least one game
  ORDER BY 
    COALESCE(bc.total_points, 0) DESC,
    COALESCE(bc.legendary_count, 0) DESC,
    COALESCE(bc.epic_count, 0) DESC,
    us.games_won DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add featured_badges column to user_statistics if it doesn't exist
ALTER TABLE user_statistics 
  ADD COLUMN IF NOT EXISTS featured_badges VARCHAR(50)[] DEFAULT '{}';

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_badge_leaderboard TO anon, authenticated, service_role;

-- Create index for better performance on leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_statistics_games_played ON user_statistics(games_played DESC) WHERE games_played > 0;
CREATE INDEX IF NOT EXISTS idx_user_badges_user_points ON user_badges(user_id);

-- Comment on the function
COMMENT ON FUNCTION get_badge_leaderboard IS 'Returns the top players ranked by badge points, with badge rarity counts and game statistics';