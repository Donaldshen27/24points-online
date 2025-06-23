-- Migration: Fix ELO schema with safe column checks
-- This migration safely adds/renames columns by checking if they exist first

-- Add duration_seconds column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'elo_history' 
                   AND column_name = 'duration_seconds') THEN
        ALTER TABLE elo_history ADD COLUMN duration_seconds INTEGER;
    END IF;
END $$;

-- Add cards_used column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'elo_history' 
                   AND column_name = 'cards_used') THEN
        ALTER TABLE elo_history ADD COLUMN cards_used INTEGER[];
    END IF;
END $$;

-- Add solution column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'elo_history' 
                   AND column_name = 'solution') THEN
        ALTER TABLE elo_history ADD COLUMN solution TEXT;
    END IF;
END $$;

-- Rename duration to duration_seconds if duration exists and duration_seconds doesn't
-- (This handles the case where duration exists but wasn't renamed yet)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'elo_history' 
               AND column_name = 'duration') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'elo_history' 
                       AND column_name = 'duration_seconds') THEN
        ALTER TABLE elo_history RENAME COLUMN duration TO duration_seconds;
    END IF;
END $$;

-- If duration column still exists after rename attempt, drop it
-- (This handles the case where both columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'elo_history' 
               AND column_name = 'duration') 
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'elo_history' 
                   AND column_name = 'duration_seconds') THEN
        -- Copy data if needed
        UPDATE elo_history 
        SET duration_seconds = duration::INTEGER 
        WHERE duration_seconds IS NULL AND duration IS NOT NULL;
        
        -- Drop the old column
        ALTER TABLE elo_history DROP COLUMN duration;
    END IF;
END $$;

-- Add solved column to game_sessions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'game_sessions' 
                   AND column_name = 'solved') THEN
        ALTER TABLE game_sessions ADD COLUMN solved BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add solver_player_id column to game_sessions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'game_sessions' 
                   AND column_name = 'solver_player_id') THEN
        ALTER TABLE game_sessions ADD COLUMN solver_player_id UUID REFERENCES players(id);
    END IF;
END $$;

-- Add solution_time column to game_sessions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'game_sessions' 
                   AND column_name = 'solution_time') THEN
        ALTER TABLE game_sessions ADD COLUMN solution_time TIMESTAMP;
    END IF;
END $$;

-- Add game_session_id column to elo_history if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'elo_history' 
                   AND column_name = 'game_session_id') THEN
        ALTER TABLE elo_history ADD COLUMN game_session_id UUID REFERENCES game_sessions(id);
    END IF;
END $$;

-- Create index on game_session_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'elo_history' 
                   AND indexname = 'idx_elo_history_game_session') THEN
        CREATE INDEX idx_elo_history_game_session ON elo_history(game_session_id);
    END IF;
END $$;

-- Update the migration version
INSERT INTO schema_migrations (version, name, applied_at)
VALUES (16, 'fix_elo_schema_safe', NOW())
ON CONFLICT (version) DO NOTHING;