-- Puzzle Records Schema for Supabase
-- Run this in your Supabase SQL editor after creating a project

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS solve_records;
DROP TABLE IF EXISTS puzzles;

-- Puzzle occurrences table
CREATE TABLE puzzles (
  puzzle_key VARCHAR(20) PRIMARY KEY,  -- Normalized card combination (e.g., "1,2,3,4")
  cards INTEGER[] NOT NULL,            -- Original card array
  occurrence_count INTEGER DEFAULT 1,   -- How many times this puzzle appeared
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solve records table (top 10 fastest solves per puzzle)
CREATE TABLE solve_records (
  id SERIAL PRIMARY KEY,
  puzzle_key VARCHAR(20) NOT NULL REFERENCES puzzles(puzzle_key) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  solve_time_ms INTEGER NOT NULL,
  solution TEXT,                       -- JSON string of the solution steps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast queries
CREATE INDEX idx_puzzle_time ON solve_records(puzzle_key, solve_time_ms);
CREATE INDEX idx_username ON solve_records(username);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE solve_records ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (read-only for puzzle records)
CREATE POLICY "Allow anonymous read access to puzzles" ON puzzles
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to solve_records" ON solve_records
  FOR SELECT USING (true);

-- Create a function to maintain only top 10 records per puzzle
CREATE OR REPLACE FUNCTION maintain_top_records()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete records beyond the top 10 for this puzzle
  DELETE FROM solve_records
  WHERE puzzle_key = NEW.puzzle_key
  AND id NOT IN (
    SELECT id FROM solve_records
    WHERE puzzle_key = NEW.puzzle_key
    ORDER BY solve_time_ms ASC, created_at ASC
    LIMIT 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain top 10 records
CREATE TRIGGER maintain_top_records_trigger
AFTER INSERT ON solve_records
FOR EACH ROW
EXECUTE FUNCTION maintain_top_records();