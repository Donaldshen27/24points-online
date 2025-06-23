-- Migration: Fix ELO schema with correct table names
-- This migration adds missing columns to the actual ELO tables that exist

-- Add duration_seconds column to ranked_matches if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ranked_matches' 
                   AND column_name = 'duration_seconds') THEN
        ALTER TABLE ranked_matches ADD COLUMN duration_seconds INTEGER;
        
        -- Migrate data from match_duration if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ranked_matches' 
                   AND column_name = 'match_duration') THEN
            UPDATE ranked_matches 
            SET duration_seconds = match_duration 
            WHERE duration_seconds IS NULL AND match_duration IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Add player rating change columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ranked_matches' 
                   AND column_name = 'player1_rating_change') THEN
        ALTER TABLE ranked_matches ADD COLUMN player1_rating_change INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ranked_matches' 
                   AND column_name = 'player2_rating_change') THEN
        ALTER TABLE ranked_matches ADD COLUMN player2_rating_change INTEGER;
    END IF;
END $$;

-- Calculate and populate rating changes from existing data
DO $$
BEGIN
    -- Only update if the columns were just added (are all NULL)
    IF EXISTS (SELECT 1 FROM ranked_matches WHERE player1_rating_change IS NULL LIMIT 1) THEN
        UPDATE ranked_matches 
        SET 
            player1_rating_change = player1_rating_after - player1_rating_before,
            player2_rating_change = player2_rating_after - player2_rating_before
        WHERE player1_rating_change IS NULL OR player2_rating_change IS NULL;
    END IF;
END $$;

-- Create index on duration_seconds if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'ranked_matches' 
                   AND indexname = 'idx_ranked_matches_duration') THEN
        CREATE INDEX idx_ranked_matches_duration ON ranked_matches(duration_seconds);
    END IF;
END $$;

-- Migration completed successfully