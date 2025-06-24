-- Add icon column to badge_definitions table
-- This column stores the emoji/unicode icon for badges

ALTER TABLE badge_definitions 
ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '🏆';

-- Update existing badges with appropriate icons
UPDATE badge_definitions SET icon = CASE
  -- Skill badges
  WHEN id LIKE 'speed_demon%' THEN '⚡'
  WHEN id LIKE 'accuracy_master%' THEN '🎯'
  WHEN id LIKE 'lightning_reflexes%' THEN '🏃'
  WHEN id LIKE 'consistent_player%' THEN '📊'
  
  -- Progression badges
  WHEN id LIKE 'first_win' THEN '🎉'
  WHEN id LIKE 'winner%' THEN '🏆'
  WHEN id LIKE 'veteran%' THEN '🎖️'
  WHEN id LIKE 'rounds_played%' THEN '🎮'
  WHEN id LIKE 'puzzles_solved%' THEN '🧩'
  
  -- Mode badges
  WHEN id LIKE 'classic_specialist%' THEN '♠️'
  WHEN id LIKE 'super_mode_expert%' THEN '💎'
  WHEN id LIKE 'extended_master%' THEN '🌟'
  WHEN id LIKE 'solo_champion%' THEN '🎯'
  
  -- Social badges
  WHEN id LIKE 'friendly_competitor%' THEN '🤝'
  WHEN id LIKE 'comeback_king%' THEN '👑'
  WHEN id LIKE 'winning_streak%' THEN '🔥'
  
  -- Unique badges
  WHEN id LIKE 'perfect_game' THEN '💯'
  WHEN id LIKE 'early_bird' THEN '🌅'
  WHEN id LIKE 'night_owl' THEN '🦉'
  WHEN id LIKE 'weekend_warrior' THEN '⚔️'
  WHEN id LIKE 'marathon_player' THEN '🏃'
  WHEN id LIKE 'all_operations_master' THEN '🧮'
  WHEN id LIKE 'no_parentheses_pro' THEN '🎯'
  WHEN id LIKE 'one_operation_wonder' THEN '1️⃣'
  WHEN id LIKE 'instant_solver' THEN '⚡'
  WHEN id LIKE 'dedicated_player' THEN '🌟'
  
  -- Seasonal badges
  WHEN id LIKE 'new_year%' THEN '🎊'
  WHEN id LIKE 'summer%' THEN '☀️'
  WHEN id LIKE 'halloween%' THEN '🎃'
  WHEN id LIKE 'winter%' THEN '❄️'
  
  -- Default
  ELSE '🏆'
END
WHERE icon IS NULL;