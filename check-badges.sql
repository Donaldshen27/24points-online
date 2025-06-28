-- Badge System Verification Queries
-- Run these queries to check if badges are being properly awarded

-- 1. Check all badges earned by test users
SELECT 
    ub.user_id,
    ub.badge_id,
    ub.earned_at,
    ub.is_featured,
    bd.name,
    bd.description,
    bd.category,
    bd.rarity,
    bd.points
FROM user_badges ub
JOIN badge_definitions bd ON ub.badge_id = bd.id
WHERE ub.user_id LIKE '%BadgeTest%'
ORDER BY ub.earned_at DESC;

-- 2. Check user statistics for test users
SELECT 
    user_id,
    username,
    games_played,
    games_won,
    fastest_solve_ms,
    total_sub_second_solves,
    all_operations_rounds,
    minimal_operations_wins,
    languages_used,
    longest_session_minutes,
    consecutive_days_played
FROM user_statistics
WHERE username LIKE '%BadgeTest%';

-- 3. Check sub-second solve history
SELECT 
    user_id,
    COUNT(*) as sub_second_count,
    MIN(solve_time_ms) as fastest_ms,
    AVG(solve_time_ms) as avg_ms
FROM user_solve_history
WHERE solve_time_ms < 1000
  AND user_id LIKE '%BadgeTest%'
GROUP BY user_id;

-- 4. Check opponent history
SELECT 
    user_id,
    opponent_id,
    games_played,
    last_played_at
FROM user_opponent_history
WHERE user_id LIKE '%BadgeTest%' OR opponent_id LIKE '%BadgeTest%'
ORDER BY games_played DESC;

-- 5. Check badge progress
SELECT 
    bp.user_id,
    bp.badge_id,
    bp.current_value,
    bp.target_value,
    bp.last_updated,
    bd.name as badge_name
FROM badge_progress bp
JOIN badge_definitions bd ON bp.badge_id = bd.id
WHERE bp.user_id LIKE '%BadgeTest%';

-- 6. Check specific badge criteria
-- Mathematical Genius (all operations used)
SELECT user_id, all_operations_rounds 
FROM user_statistics 
WHERE all_operations_rounds > 0;

-- Minimalist (minimal operations wins)
SELECT user_id, minimal_operations_wins 
FROM user_statistics 
WHERE minimal_operations_wins > 0;

-- Quick Thinker (sub-second solves)
SELECT user_id, total_sub_second_solves 
FROM user_statistics 
WHERE total_sub_second_solves >= 10;

-- International Player (multiple languages)
SELECT user_id, languages_used 
FROM user_statistics 
WHERE array_length(languages_used, 1) >= 2;

-- Marathon Runner (3+ hour sessions)
SELECT user_id, longest_session_minutes 
FROM user_statistics 
WHERE longest_session_minutes >= 180;