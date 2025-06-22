-- Check if badge tables exist and their structure
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('badge_definitions', 'user_statistics', 'user_badges', 'badge_progress', 'badge_challenges')
ORDER BY table_name;

-- Check columns of user_badges table if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_badges'
ORDER BY ordinal_position;

-- Check if there are any badge definitions
SELECT COUNT(*) as badge_count FROM badge_definitions;

-- Check if there are any user badges
SELECT COUNT(*) as user_badge_count FROM user_badges;

-- Check recent badge unlock attempts (if any)
SELECT * FROM user_badges ORDER BY earned_at DESC LIMIT 10;