-- Migration: Fix remaining ELO and replay issues

-- 1. Add missing solve_time_ms column to match_replays
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'match_replays' 
        AND column_name = 'solve_time_ms'
    ) THEN
        ALTER TABLE match_replays ADD COLUMN solve_time_ms integer;
    END IF;
END $$;

-- 2. Create the missing update_player_performance_after_match function
-- This function updates player performance statistics after a match
CREATE OR REPLACE FUNCTION update_player_performance_after_match(p_match_id uuid)
RETURNS void AS $$
DECLARE
    v_match RECORD;
    v_winner_stats RECORD;
    v_loser_stats RECORD;
BEGIN
    -- Get match details
    SELECT * INTO v_match
    FROM ranked_matches
    WHERE id = p_match_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Update winner stats
    UPDATE player_ratings
    SET 
        games_played = games_played + 1,
        wins = wins + 1,
        win_streak = win_streak + 1,
        loss_streak = 0,
        last_game_at = NOW(),
        updated_at = NOW()
    WHERE user_id = v_match.winner_id;
    
    -- Update loser stats
    UPDATE player_ratings
    SET 
        games_played = games_played + 1,
        losses = losses + 1,
        loss_streak = loss_streak + 1,
        win_streak = 0,
        last_game_at = NOW(),
        updated_at = NOW()
    WHERE user_id = (
        CASE 
            WHEN v_match.player1_id = v_match.winner_id THEN v_match.player2_id
            ELSE v_match.player1_id
        END
    );
    
    -- Update peak ratings if necessary
    UPDATE player_ratings
    SET peak_rating = current_rating
    WHERE user_id IN (v_match.player1_id, v_match.player2_id)
    AND current_rating > peak_rating;
    
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_player_performance_after_match TO service_role;
GRANT EXECUTE ON FUNCTION update_player_performance_after_match TO authenticated;