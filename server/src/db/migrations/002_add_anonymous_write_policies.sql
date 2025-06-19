-- Migration: Add write policies for anonymous users
-- This allows anonymous users to record their puzzle solving times

-- Allow anonymous users to insert solve records
CREATE POLICY "Allow anonymous insert to solve_records" ON solve_records
  FOR INSERT WITH CHECK (true);

-- Allow anonymous users to update puzzles table (for occurrence_count)
CREATE POLICY "Allow anonymous update to puzzles" ON puzzles
  FOR UPDATE USING (true);

-- Allow anonymous users to insert new puzzles
CREATE POLICY "Allow anonymous insert to puzzles" ON puzzles
  FOR INSERT WITH CHECK (true);

-- Add a comment explaining the policies
COMMENT ON POLICY "Allow anonymous insert to solve_records" ON solve_records IS 
  'Allows anonymous users to record their puzzle solving times without authentication';

COMMENT ON POLICY "Allow anonymous update to puzzles" ON puzzles IS 
  'Allows anonymous users to update puzzle occurrence counts';

COMMENT ON POLICY "Allow anonymous insert to puzzles" ON puzzles IS 
  'Allows anonymous users to add new puzzle configurations';