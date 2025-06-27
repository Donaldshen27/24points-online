-- Migration: Add new columns for complete badge tracking
-- Date: 2025-01-27

-- Add new columns to user_statistics for missing badge criteria
ALTER TABLE user_statistics 
ADD COLUMN IF NOT EXISTS session_start_time TIMESTAMP WITH TIME ZONE,  -- Track current session start
ADD COLUMN IF NOT EXISTS longest_session_minutes INTEGER DEFAULT 0,     -- Longest continuous play session
ADD COLUMN IF NOT EXISTS total_sub_second_solves INTEGER DEFAULT 0,    -- Count of solves under 1 second
ADD COLUMN IF NOT EXISTS all_operations_rounds INTEGER DEFAULT 0,      -- Rounds using all 4 operations
ADD COLUMN IF NOT EXISTS minimal_operations_wins INTEGER DEFAULT 0,    -- Wins using only + and -
ADD COLUMN IF NOT EXISTS languages_used TEXT[] DEFAULT '{}',           -- Track languages used
ADD COLUMN IF NOT EXISTS high_card_rounds INTEGER DEFAULT 0,           -- Rounds with 8+ cards won
ADD COLUMN IF NOT EXISTS total_cards_drawn INTEGER DEFAULT 0;          -- Total cards drawn from deck

-- Create opponent history table for tracking games with same opponents
CREATE TABLE IF NOT EXISTS user_opponent_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    opponent_id TEXT NOT NULL,
    games_played INTEGER DEFAULT 1,
    last_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, opponent_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_opponent_history_user ON user_opponent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_opponent_history_games ON user_opponent_history(games_played);

-- Create table for tracking sub-second solves
CREATE TABLE IF NOT EXISTS user_solve_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    solve_time_ms INTEGER NOT NULL,
    puzzle_key TEXT NOT NULL,
    game_mode TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_solve_history_user ON user_solve_history(user_id);
CREATE INDEX IF NOT EXISTS idx_solve_history_time ON user_solve_history(solve_time_ms);
CREATE INDEX IF NOT EXISTS idx_solve_history_created ON user_solve_history(created_at);

-- Create table for tracking comeback scenarios
CREATE TABLE IF NOT EXISTS game_comeback_tracking (
    id SERIAL PRIMARY KEY,
    game_room_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    opponent_id TEXT NOT NULL,
    min_score INTEGER NOT NULL,  -- Player's lowest score
    max_opponent_lead INTEGER NOT NULL,  -- Opponent's biggest lead
    final_won BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_comeback_tracking_player ON game_comeback_tracking(player_id);

-- Update RPC function to handle new stat fields
CREATE OR REPLACE FUNCTION increment_user_stat(
    p_user_id TEXT,
    p_stat_field TEXT,
    p_increment INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
    -- Use dynamic SQL to update the specified field
    EXECUTE format('UPDATE user_statistics SET %I = COALESCE(%I, 0) + $1 WHERE user_id = $2', 
                   p_stat_field, p_stat_field)
    USING p_increment, p_user_id;
EXCEPTION
    WHEN undefined_column THEN
        RAISE WARNING 'Column % does not exist in user_statistics', p_stat_field;
    WHEN OTHERS THEN
        RAISE WARNING 'Error updating stat % for user %: %', p_stat_field, p_user_id, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to update session tracking
CREATE OR REPLACE FUNCTION update_session_tracking(
    p_user_id TEXT,
    p_action TEXT  -- 'start' or 'end'
) RETURNS VOID AS $$
DECLARE
    v_session_start TIMESTAMP WITH TIME ZONE;
    v_session_minutes INTEGER;
BEGIN
    IF p_action = 'start' THEN
        UPDATE user_statistics 
        SET session_start_time = NOW()
        WHERE user_id = p_user_id;
    ELSIF p_action = 'end' THEN
        -- Get session start time
        SELECT session_start_time INTO v_session_start
        FROM user_statistics
        WHERE user_id = p_user_id;
        
        IF v_session_start IS NOT NULL THEN
            -- Calculate session duration in minutes
            v_session_minutes := EXTRACT(EPOCH FROM (NOW() - v_session_start)) / 60;
            
            -- Update longest session if this is longer
            UPDATE user_statistics
            SET longest_session_minutes = GREATEST(COALESCE(longest_session_minutes, 0), v_session_minutes),
                session_start_time = NULL
            WHERE user_id = p_user_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to track opponent games
CREATE OR REPLACE FUNCTION track_opponent_game(
    p_user_id TEXT,
    p_opponent_id TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_opponent_history (user_id, opponent_id, games_played)
    VALUES (p_user_id, p_opponent_id, 1)
    ON CONFLICT (user_id, opponent_id)
    DO UPDATE SET 
        games_played = user_opponent_history.games_played + 1,
        last_played_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get games with same opponent
CREATE OR REPLACE FUNCTION get_games_with_opponent(
    p_user_id TEXT,
    p_opponent_id TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_games INTEGER;
BEGIN
    SELECT games_played INTO v_games
    FROM user_opponent_history
    WHERE user_id = p_user_id AND opponent_id = p_opponent_id;
    
    RETURN COALESCE(v_games, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has played 50 games with any opponent
CREATE OR REPLACE FUNCTION has_friendly_rival(p_user_id TEXT) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_opponent_history 
        WHERE user_id = p_user_id 
        AND games_played >= 50
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get count of puzzle records held by a user
CREATE OR REPLACE FUNCTION get_user_puzzle_records(p_username TEXT) 
RETURNS TABLE(count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(DISTINCT sr.puzzle_key)::BIGINT
    FROM solve_records sr
    INNER JOIN (
        SELECT puzzle_key, MIN(solve_time_ms) as min_time
        FROM solve_records
        GROUP BY puzzle_key
    ) best ON sr.puzzle_key = best.puzzle_key 
           AND sr.solve_time_ms = best.min_time
    WHERE sr.username = p_username;
END;
$$ LANGUAGE plpgsql;