-- Seed data for 24 Points Game

-- Clear existing data
TRUNCATE TABLE player_badges CASCADE;
TRUNCATE TABLE badges CASCADE;
TRUNCATE TABLE match_replays CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE players CASCADE;

-- Insert sample players
INSERT INTO players (id, username, rating, matches_played, matches_won) VALUES
    ('11111111-1111-1111-1111-111111111111', 'alice', 1200, 10, 6),
    ('22222222-2222-2222-2222-222222222222', 'bob', 1150, 8, 3),
    ('33333333-3333-3333-3333-333333333333', 'charlie', 1050, 5, 2);

-- Insert badges
INSERT INTO badges (id, name, description, icon, category, tier, requirements, points) VALUES
    -- Achievement Badges
    ('first_win', '{"en": "First Victory", "zh": "首胜"}', '{"en": "Win your first game", "zh": "赢得第一场游戏"}', '🏆', 'achievement', 'bronze', '{"wins": 1}', 10),
    ('win_streak_3', '{"en": "Hat Trick", "zh": "三连胜"}', '{"en": "Win 3 games in a row", "zh": "连续赢得3场游戏"}', '🔥', 'achievement', 'silver', '{"streak": 3}', 30),
    ('win_streak_5', '{"en": "Unstoppable", "zh": "势不可挡"}', '{"en": "Win 5 games in a row", "zh": "连续赢得5场游戏"}', '💥', 'achievement', 'gold', '{"streak": 5}', 50),
    
    -- Speed Badges
    ('speed_demon', '{"en": "Speed Demon", "zh": "极速达人"}', '{"en": "Solve in under 5 seconds", "zh": "5秒内解答"}', '⚡', 'skill', 'silver', '{"solve_time": 5}', 25),
    ('lightning_fast', '{"en": "Lightning Fast", "zh": "闪电侠"}', '{"en": "Solve in under 3 seconds", "zh": "3秒内解答"}', '⚡', 'skill', 'gold', '{"solve_time": 3}', 40),
    
    -- Milestone Badges
    ('games_10', '{"en": "Regular Player", "zh": "常客"}', '{"en": "Play 10 games", "zh": "完成10场游戏"}', '🎮', 'milestone', 'bronze', '{"games": 10}', 15),
    ('games_50', '{"en": "Dedicated Player", "zh": "忠实玩家"}', '{"en": "Play 50 games", "zh": "完成50场游戏"}', '🎯', 'milestone', 'silver', '{"games": 50}', 35),
    ('games_100', '{"en": "Centurion", "zh": "百战老兵"}', '{"en": "Play 100 games", "zh": "完成100场游戏"}', '💯', 'milestone', 'gold', '{"games": 100}', 60),
    
    -- Special Badges
    ('perfectionist', '{"en": "Perfectionist", "zh": "完美主义者"}', '{"en": "Win 10 games without errors", "zh": "10场游戏无错误获胜"}', '✨', 'special', 'gold', '{"perfect_wins": 10}', 50),
    ('comeback_king', '{"en": "Comeback King", "zh": "逆转之王"}', '{"en": "Win after being down 0-3", "zh": "0-3落后时逆转获胜"}', '👑', 'special', 'gold', '{"comeback": true}', 45),
    
    -- Rating Badges
    ('rating_1100', '{"en": "Rising Star", "zh": "新星"}', '{"en": "Reach 1100 rating", "zh": "达到1100分"}', '⭐', 'rating', 'bronze', '{"rating": 1100}', 20),
    ('rating_1200', '{"en": "Expert", "zh": "专家"}', '{"en": "Reach 1200 rating", "zh": "达到1200分"}', '🌟', 'rating', 'silver', '{"rating": 1200}', 40),
    ('rating_1300', '{"en": "Master", "zh": "大师"}', '{"en": "Reach 1300 rating", "zh": "达到1300分"}', '💫', 'rating', 'gold', '{"rating": 1300}', 60),
    
    -- Mode Badges
    ('super_mode_win', '{"en": "Super Solver", "zh": "超级解题者"}', '{"en": "Win a Super Mode game", "zh": "赢得一场超级模式"}', '🚀', 'mode', 'silver', '{"super_wins": 1}', 30),
    ('extended_mode_win', '{"en": "Extended Master", "zh": "扩展大师"}', '{"en": "Win an Extended Mode game", "zh": "赢得一场扩展模式"}', '🎲', 'mode', 'silver', '{"extended_wins": 1}', 30);

-- Insert sample matches
INSERT INTO matches (id, player1_id, player2_id, winner_id, status, created_at, completed_at, final_score, game_mode) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completed', now() - interval '2 days', now() - interval '2 days' + interval '15 minutes', '{"player1": 5, "player2": 3}', 'classic'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'completed', now() - interval '1 day', now() - interval '1 day' + interval '20 minutes', '{"player1": 5, "player2": 2}', 'classic'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'completed', now() - interval '12 hours', now() - interval '12 hours' + interval '18 minutes', '{"player1": 5, "player2": 4}', 'classic');

-- Give alice some badges based on her stats
INSERT INTO player_badges (player_id, badge_id, earned_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'first_win', now() - interval '2 days'),
    ('11111111-1111-1111-1111-111111111111', 'games_10', now() - interval '1 day'),
    ('11111111-1111-1111-1111-111111111111', 'rating_1200', now() - interval '12 hours');

-- Give bob a badge
INSERT INTO player_badges (player_id, badge_id, earned_at) VALUES
    ('22222222-2222-2222-2222-222222222222', 'first_win', now() - interval '12 hours');

-- Add some sample replay data for the first match
INSERT INTO match_replays (match_id, player_id, round_number, action_type, action_data, center_cards) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 1, 'solve_attempt', '{"expression": "(8 + 4) * (6 / 3)", "result": 24, "success": true, "time_taken": 4.5}', '{"cards": [8, 4, 6, 3]}'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 2, 'solve_attempt', '{"expression": "(10 - 2) * 3 * 1", "result": 24, "success": true, "time_taken": 6.2}', '{"cards": [10, 2, 3, 1]}');

-- Output confirmation
SELECT 'Seed data inserted successfully!' as message;