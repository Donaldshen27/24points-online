-- Badge Definitions Seed Data
-- This migration populates the badge_definitions table with all available badges

-- Clear existing badge definitions (for clean setup)
TRUNCATE TABLE badge_definitions CASCADE;

-- ===== SKILL-BASED BADGES =====

-- Speed Demon badges
INSERT INTO badge_definitions (id, category, name, description, tier, rarity, points, requirements, is_active) VALUES
('speed_demon_bronze', 'skill', 'Speed Demon Bronze', 'Solve a puzzle in under 10 seconds', 'bronze', 'common', 10, '{"type": "simple", "stat": "fastestSolveMs", "value": 10000, "comparison": "lte"}', true),
('speed_demon_silver', 'skill', 'Speed Demon Silver', 'Solve a puzzle in under 7 seconds', 'silver', 'common', 20, '{"type": "simple", "stat": "fastestSolveMs", "value": 7000, "comparison": "lte"}', true),
('speed_demon_gold', 'skill', 'Speed Demon Gold', 'Solve a puzzle in under 5 seconds', 'gold', 'rare', 40, '{"type": "simple", "stat": "fastestSolveMs", "value": 5000, "comparison": "lte"}', true),
('speed_demon_platinum', 'skill', 'Speed Demon Platinum', 'Solve a puzzle in under 3 seconds', 'platinum', 'epic', 80, '{"type": "simple", "stat": "fastestSolveMs", "value": 3000, "comparison": "lte"}', true),
('speed_demon_diamond', 'skill', 'Speed Demon Diamond', 'Solve a puzzle in under 2 seconds', 'diamond', 'legendary', 150, '{"type": "simple", "stat": "fastestSolveMs", "value": 2000, "comparison": "lte"}', true);

-- Accuracy Master badges
INSERT INTO badge_definitions (id, category, name, description, tier, rarity, points, requirements, is_active) VALUES
('accuracy_master_bronze', 'skill', 'Accuracy Master Bronze', 'Maintain 70% accuracy rate (min 50 attempts)', 'bronze', 'common', 15, '{"type": "and", "conditions": [{"type": "custom", "customType": "accuracy_rate", "params": {"rate": 0.7}}, {"type": "simple", "stat": "totalAttempts", "value": 50, "comparison": "gte"}]}', true),
('accuracy_master_silver', 'skill', 'Accuracy Master Silver', 'Maintain 80% accuracy rate (min 50 attempts)', 'silver', 'common', 30, '{"type": "and", "conditions": [{"type": "custom", "customType": "accuracy_rate", "params": {"rate": 0.8}}, {"type": "simple", "stat": "totalAttempts", "value": 50, "comparison": "gte"}]}', true),
('accuracy_master_gold', 'skill', 'Accuracy Master Gold', 'Maintain 90% accuracy rate (min 50 attempts)', 'gold', 'rare', 50, '{"type": "and", "conditions": [{"type": "custom", "customType": "accuracy_rate", "params": {"rate": 0.9}}, {"type": "simple", "stat": "totalAttempts", "value": 50, "comparison": "gte"}]}', true),
('accuracy_master_platinum', 'skill', 'Accuracy Master Platinum', 'Maintain 95% accuracy rate (min 50 attempts)', 'platinum', 'epic', 100, '{"type": "and", "conditions": [{"type": "custom", "customType": "accuracy_rate", "params": {"rate": 0.95}}, {"type": "simple", "stat": "totalAttempts", "value": 50, "comparison": "gte"}]}', true),
('accuracy_master_diamond', 'skill', 'Accuracy Master Diamond', 'Maintain 99% accuracy rate (min 50 attempts)', 'diamond', 'legendary', 200, '{"type": "and", "conditions": [{"type": "custom", "customType": "accuracy_rate", "params": {"rate": 0.99}}, {"type": "simple", "stat": "totalAttempts", "value": 50, "comparison": "gte"}]}', true);

-- Lightning Reflexes badges
INSERT INTO badge_definitions (id, category, name, description, tier, rarity, points, requirements, is_active) VALUES
('lightning_reflexes_bronze', 'skill', 'Lightning Reflexes Bronze', 'Be first to solve in 10 rounds', 'bronze', 'common', 10, '{"type": "simple", "stat": "totalFirstSolves", "value": 10, "comparison": "gte"}', true),
('lightning_reflexes_silver', 'skill', 'Lightning Reflexes Silver', 'Be first to solve in 25 rounds', 'silver', 'common', 25, '{"type": "simple", "stat": "totalFirstSolves", "value": 25, "comparison": "gte"}', true),
('lightning_reflexes_gold', 'skill', 'Lightning Reflexes Gold', 'Be first to solve in 50 rounds', 'gold', 'rare', 50, '{"type": "simple", "stat": "totalFirstSolves", "value": 50, "comparison": "gte"}', true),
('lightning_reflexes_platinum', 'skill', 'Lightning Reflexes Platinum', 'Be first to solve in 100 rounds', 'platinum', 'epic', 100, '{"type": "simple", "stat": "totalFirstSolves", "value": 100, "comparison": "gte"}', true),
('lightning_reflexes_diamond', 'skill', 'Lightning Reflexes Diamond', 'Be first to solve in 250 rounds', 'diamond', 'legendary', 250, '{"type": "simple", "stat": "totalFirstSolves", "value": 250, "comparison": "gte"}', true);

-- Individual skill badges
INSERT INTO badge_definitions (id, category, name, description, rarity, points, requirements, is_active) VALUES
('perfect_game', 'skill', 'Perfect Game', 'Win a game without any incorrect attempts', 'rare', 50, '{"type": "simple", "stat": "perfectGames", "value": 1, "comparison": "gte"}', true),
('flawless_victory', 'skill', 'Flawless Victory', 'Win 10-0 (opponent gets all 20 cards)', 'epic', 100, '{"type": "simple", "stat": "flawlessVictories", "value": 1, "comparison": "gte"}', true);

-- ===== PROGRESSION BADGES =====

-- Veteran badges (games played)
INSERT INTO badge_definitions (id, category, name, description, tier, rarity, points, requirements, is_active) VALUES
('veteran_bronze', 'progression', 'Veteran Bronze', 'Play 10 games', 'bronze', 'common', 5, '{"type": "simple", "stat": "gamesPlayed", "value": 10, "comparison": "gte"}', true),
('veteran_silver', 'progression', 'Veteran Silver', 'Play 50 games', 'silver', 'common', 15, '{"type": "simple", "stat": "gamesPlayed", "value": 50, "comparison": "gte"}', true),
('veteran_gold', 'progression', 'Veteran Gold', 'Play 100 games', 'gold', 'common', 30, '{"type": "simple", "stat": "gamesPlayed", "value": 100, "comparison": "gte"}', true),
('veteran_platinum', 'progression', 'Veteran Platinum', 'Play 500 games', 'platinum', 'rare', 75, '{"type": "simple", "stat": "gamesPlayed", "value": 500, "comparison": "gte"}', true),
('veteran_diamond', 'progression', 'Veteran Diamond', 'Play 1000 games', 'diamond', 'epic', 150, '{"type": "simple", "stat": "gamesPlayed", "value": 1000, "comparison": "gte"}', true);

-- Champion badges (games won)
INSERT INTO badge_definitions (id, category, name, description, tier, rarity, points, requirements, is_active) VALUES
('champion_bronze', 'progression', 'Champion Bronze', 'Win 10 games', 'bronze', 'common', 10, '{"type": "simple", "stat": "gamesWon", "value": 10, "comparison": "gte"}', true),
('champion_silver', 'progression', 'Champion Silver', 'Win 50 games', 'silver', 'common', 25, '{"type": "simple", "stat": "gamesWon", "value": 50, "comparison": "gte"}', true),
('champion_gold', 'progression', 'Champion Gold', 'Win 100 games', 'gold', 'rare', 50, '{"type": "simple", "stat": "gamesWon", "value": 100, "comparison": "gte"}', true),
('champion_platinum', 'progression', 'Champion Platinum', 'Win 500 games', 'platinum', 'epic', 125, '{"type": "simple", "stat": "gamesWon", "value": 500, "comparison": "gte"}', true),
('champion_diamond', 'progression', 'Champion Diamond', 'Win 1000 games', 'diamond', 'legendary', 250, '{"type": "simple", "stat": "gamesWon", "value": 1000, "comparison": "gte"}', true);

-- Unstoppable badges (win streaks)
INSERT INTO badge_definitions (id, category, name, description, tier, rarity, points, requirements, is_active) VALUES
('unstoppable_bronze', 'progression', 'Unstoppable Bronze', 'Win 3 games in a row', 'bronze', 'common', 15, '{"type": "simple", "stat": "longestWinStreak", "value": 3, "comparison": "gte"}', true),
('unstoppable_silver', 'progression', 'Unstoppable Silver', 'Win 5 games in a row', 'silver', 'common', 30, '{"type": "simple", "stat": "longestWinStreak", "value": 5, "comparison": "gte"}', true),
('unstoppable_gold', 'progression', 'Unstoppable Gold', 'Win 10 games in a row', 'gold', 'rare', 60, '{"type": "simple", "stat": "longestWinStreak", "value": 10, "comparison": "gte"}', true),
('unstoppable_platinum', 'progression', 'Unstoppable Platinum', 'Win 15 games in a row', 'platinum', 'epic', 120, '{"type": "simple", "stat": "longestWinStreak", "value": 15, "comparison": "gte"}', true),
('unstoppable_diamond', 'progression', 'Unstoppable Diamond', 'Win 20 games in a row', 'diamond', 'legendary', 200, '{"type": "simple", "stat": "longestWinStreak", "value": 20, "comparison": "gte"}', true);

-- Daily Devotion badges
INSERT INTO badge_definitions (id, category, name, description, tier, rarity, points, requirements, is_active) VALUES
('daily_devotion_bronze', 'progression', 'Daily Devotion Bronze', 'Play for 7 consecutive days', 'bronze', 'common', 20, '{"type": "simple", "stat": "consecutiveDaysPlayed", "value": 7, "comparison": "gte"}', true),
('daily_devotion_silver', 'progression', 'Daily Devotion Silver', 'Play for 30 consecutive days', 'silver', 'rare', 50, '{"type": "simple", "stat": "consecutiveDaysPlayed", "value": 30, "comparison": "gte"}', true),
('daily_devotion_gold', 'progression', 'Daily Devotion Gold', 'Play for 100 consecutive days', 'gold', 'epic', 150, '{"type": "simple", "stat": "consecutiveDaysPlayed", "value": 100, "comparison": "gte"}', true),
('daily_devotion_platinum', 'progression', 'Daily Devotion Platinum', 'Play for 365 consecutive days', 'platinum', 'legendary', 500, '{"type": "simple", "stat": "consecutiveDaysPlayed", "value": 365, "comparison": "gte"}', true);

-- Other progression badges
INSERT INTO badge_definitions (id, category, name, description, rarity, points, requirements, is_active) VALUES
('weekend_warrior', 'progression', 'Weekend Warrior', 'Play 50 games on weekends', 'common', 25, '{"type": "simple", "stat": "weekendGames", "value": 50, "comparison": "gte"}', true);

-- ===== MODE-SPECIFIC BADGES =====

INSERT INTO badge_definitions (id, category, name, description, rarity, points, requirements, is_active) VALUES
('classic_master', 'mode', 'Classic Master', 'Win 100 games in Classic mode', 'rare', 50, '{"type": "simple", "stat": "classicWins", "value": 100, "comparison": "gte"}', true),
('super_mode_champion', 'mode', 'Super Mode Champion', 'Win 50 games in Super Mode (8 cards)', 'epic', 75, '{"type": "simple", "stat": "superModeWins", "value": 50, "comparison": "gte"}', true),
('extended_range_expert', 'mode', 'Extended Range Expert', 'Win 50 games in Extended Range mode', 'epic', 75, '{"type": "simple", "stat": "extendedRangeWins", "value": 50, "comparison": "gte"}', true),
('solo_practice_guru', 'mode', 'Solo Practice Guru', 'Complete 500 solo practice puzzles', 'rare', 40, '{"type": "simple", "stat": "soloPuzzlesCompleted", "value": 500, "comparison": "gte"}', true),
('mode_explorer', 'mode', 'Mode Explorer', 'Win at least once in each game mode', 'common', 30, '{"type": "and", "conditions": [{"type": "simple", "stat": "classicWins", "value": 1, "comparison": "gte"}, {"type": "simple", "stat": "superModeWins", "value": 1, "comparison": "gte"}, {"type": "simple", "stat": "extendedRangeWins", "value": 1, "comparison": "gte"}]}', true);

-- ===== SOCIAL & COMMUNITY BADGES =====

INSERT INTO badge_definitions (id, category, name, description, rarity, points, requirements, is_active) VALUES
('friendly_rival', 'social', 'Friendly Rival', 'Play 50 games with the same opponent', 'rare', 40, '{"type": "custom", "customType": "same_opponent_games", "params": {"count": 50}}', true),
('spectator_sport', 'social', 'Spectator Sport', 'Watch 100 games as a spectator', 'common', 20, '{"type": "simple", "stat": "gamesSpectated", "value": 100, "comparison": "gte"}', true);

-- Record Breaker badges
INSERT INTO badge_definitions (id, category, name, description, tier, rarity, points, requirements, is_active) VALUES
('record_breaker_bronze', 'social', 'Record Breaker Bronze', 'Hold 1 puzzle record', 'bronze', 'common', 20, '{"type": "custom", "customType": "puzzle_records", "params": {"count": 1}}', true),
('record_breaker_silver', 'social', 'Record Breaker Silver', 'Hold 10 puzzle records', 'silver', 'rare', 50, '{"type": "custom", "customType": "puzzle_records", "params": {"count": 10}}', true),
('record_breaker_gold', 'social', 'Record Breaker Gold', 'Hold 50 puzzle records', 'gold', 'epic', 100, '{"type": "custom", "customType": "puzzle_records", "params": {"count": 50}}', true),
('record_breaker_platinum', 'social', 'Record Breaker Platinum', 'Hold 100 puzzle records', 'platinum', 'legendary', 200, '{"type": "custom", "customType": "puzzle_records", "params": {"count": 100}}', true);

-- ===== UNIQUE ACHIEVEMENT BADGES =====

INSERT INTO badge_definitions (id, category, name, description, rarity, points, requirements, is_active) VALUES
('comeback_king', 'unique', 'Comeback King', 'Win after being down 0-5', 'epic', 100, '{"type": "simple", "stat": "comebackWins", "value": 1, "comparison": "gte"}', true),
('underdog', 'unique', 'Underdog', 'Beat an opponent with 500+ more games played', 'rare', 50, '{"type": "simple", "stat": "underdogWins", "value": 1, "comparison": "gte"}', true),
('night_owl', 'unique', 'Night Owl', 'Play 50 games between midnight and 6am', 'common', 25, '{"type": "simple", "stat": "nightGames", "value": 50, "comparison": "gte"}', true),
('early_bird', 'unique', 'Early Bird', 'Play 50 games between 5am and 8am', 'common', 25, '{"type": "simple", "stat": "earlyGames", "value": 50, "comparison": "gte"}', true),
('marathon_runner', 'unique', 'Marathon Runner', 'Play for 3+ hours straight', 'rare', 40, '{"type": "custom", "customType": "marathon_session", "params": {"hours": 3}}', true),
('quick_thinker', 'unique', 'Quick Thinker', 'Solve 10 puzzles under 1 second each', 'legendary', 200, '{"type": "custom", "customType": "sub_second_solves", "params": {"count": 10}}', true),
('mathematical_genius', 'unique', 'Mathematical Genius', 'Use all 4 operations (+, -, ×, ÷) in one solution', 'rare', 40, '{"type": "custom", "customType": "all_operations_used"}', true),
('minimalist', 'unique', 'Minimalist', 'Win a game using only addition and subtraction', 'rare', 50, '{"type": "custom", "customType": "minimal_operations_win"}', true),
('international_player', 'unique', 'International Player', 'Play games in both English and Chinese', 'common', 20, '{"type": "custom", "customType": "multiple_languages"}', true);

-- ===== SEASONAL/EVENT BADGES =====

INSERT INTO badge_definitions (id, category, name, description, rarity, points, requirements, is_active) VALUES
('launch_week_pioneer', 'seasonal', 'Launch Week Pioneer', 'Played during the first week of launch', 'legendary', 100, '{"type": "custom", "customType": "launch_week_player"}', false),
('beta_tester', 'seasonal', 'Beta Tester', 'Participated in beta testing new features', 'epic', 75, '{"type": "custom", "customType": "beta_tester"}', false);