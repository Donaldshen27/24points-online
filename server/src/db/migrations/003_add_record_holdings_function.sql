-- Create an efficient function to get record holdings per user
CREATE OR REPLACE FUNCTION get_record_holdings()
RETURNS TABLE (
  username VARCHAR(50),
  record_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH best_records AS (
    SELECT DISTINCT ON (puzzle_key) 
      puzzle_key, 
      username, 
      solve_time_ms
    FROM solve_records
    ORDER BY puzzle_key, solve_time_ms ASC, created_at ASC
  )
  SELECT 
    br.username,
    COUNT(*)::BIGINT as record_count
  FROM best_records br
  GROUP BY br.username
  ORDER BY record_count DESC, br.username ASC;
END;
$$ LANGUAGE plpgsql;