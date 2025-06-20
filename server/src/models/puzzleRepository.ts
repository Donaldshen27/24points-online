/**
 * Puzzle records repository with database and in-memory fallback
 */

import { supabase, isDatabaseConfigured, PuzzleRecord as DbPuzzleRecord, SolveRecord as DbSolveRecord } from '../db/supabase';

interface PuzzleRecord {
  puzzleKey: string;  // Normalized card combination (e.g., "1,2,3,4")
  cards: number[];    // Original card array
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
}

interface SolveRecord {
  puzzleKey: string;
  username: string;
  userId?: string;
  solveTimeMs: number;
  solution?: string;
  createdAt: Date;
}

// In-memory storage (fallback when database not configured)
const puzzles: Map<string, PuzzleRecord> = new Map();
const solveRecords: Map<string, SolveRecord[]> = new Map();

// Export for access in connection handler
export { solveRecords };

/**
 * Normalize card combination to create a unique key
 * Cards are sorted to ensure [1,2,3,4] and [4,3,2,1] map to same key
 */
export function normalizePuzzleKey(cards: number[]): string {
  return [...cards].sort((a, b) => a - b).join(',');
}

/**
 * Track a puzzle occurrence
 */
export async function trackPuzzle(cards: number[]): Promise<PuzzleRecord> {
  const key = normalizePuzzleKey(cards);
  
  if (isDatabaseConfigured() && supabase) {
    try {
      // Try database first
      const { data: existing, error: fetchError } = await supabase
        .from('puzzles')
        .select('*')
        .eq('puzzle_key', key)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        throw fetchError;
      }
      
      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('puzzles')
          .update({
            occurrence_count: existing.occurrence_count + 1,
            last_seen: new Date().toISOString()
          })
          .eq('puzzle_key', key)
          .select()
          .single();
        
        if (error) throw error;
        
        return {
          puzzleKey: data.puzzle_key,
          cards: data.cards,
          occurrenceCount: data.occurrence_count,
          firstSeen: new Date(data.first_seen),
          lastSeen: new Date(data.last_seen)
        };
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('puzzles')
          .insert({
            puzzle_key: key,
            cards: [...cards],
            occurrence_count: 1
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return {
          puzzleKey: data.puzzle_key,
          cards: data.cards,
          occurrenceCount: data.occurrence_count,
          firstSeen: new Date(data.first_seen),
          lastSeen: new Date(data.last_seen)
        };
      }
    } catch (error) {
      console.error('Database error, falling back to in-memory:', error);
    }
  }
  
  // Fallback to in-memory
  const existing = puzzles.get(key);
  
  if (existing) {
    existing.occurrenceCount++;
    existing.lastSeen = new Date();
    return existing;
  }
  
  const newRecord: PuzzleRecord = {
    puzzleKey: key,
    cards: [...cards],
    occurrenceCount: 1,
    firstSeen: new Date(),
    lastSeen: new Date()
  };
  
  puzzles.set(key, newRecord);
  return newRecord;
}

/**
 * Record a solve time for a puzzle
 */
export async function recordSolveTime(
  cards: number[], 
  username: string, 
  solveTimeMs: number,
  solution?: string,
  userId?: string
): Promise<SolveRecord> {
  const key = normalizePuzzleKey(cards);
  
  const record: SolveRecord = {
    puzzleKey: key,
    username,
    userId,
    solveTimeMs,
    solution,
    createdAt: new Date()
  };
  
  if (isDatabaseConfigured() && supabase) {
    try {
      // Insert into database
      const { data, error } = await supabase
        .from('solve_records')
        .insert({
          puzzle_key: key,
          username,
          solve_time_ms: solveTimeMs,
          solution
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        puzzleKey: data.puzzle_key,
        username: data.username,
        solveTimeMs: data.solve_time_ms,
        solution: data.solution,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Database error, falling back to in-memory:', error);
    }
  }
  
  // Fallback to in-memory
  const records = solveRecords.get(key) || [];
  records.push(record);
  
  // Keep records sorted by solve time
  records.sort((a, b) => a.solveTimeMs - b.solveTimeMs);
  
  // Keep only top 10 records per puzzle to save memory
  const topRecords = records.slice(0, 10);
  
  solveRecords.set(key, topRecords);
  return record;
}

/**
 * Get puzzle statistics including occurrence count and best record
 */
export async function getPuzzleStats(cards: number[]) {
  const key = normalizePuzzleKey(cards);
  
  if (isDatabaseConfigured() && supabase) {
    try {
      // Get puzzle info
      const { data: puzzle } = await supabase
        .from('puzzles')
        .select('*')
        .eq('puzzle_key', key)
        .single();
      
      // Get top records
      const { data: records, error: recordsError } = await supabase
        .from('solve_records')
        .select('*')
        .eq('puzzle_key', key)
        .order('solve_time_ms', { ascending: true })
        .limit(5);
      
      if (recordsError) {
        console.error('[getPuzzleStats] Error fetching solve records:', recordsError);
      }
      
      const solveRecords = records?.map(r => ({
        puzzleKey: r.puzzle_key,
        username: r.username,
        solveTimeMs: r.solve_time_ms,
        solution: r.solution,
        createdAt: new Date(r.created_at)
      })) || [];
      
      return {
        puzzleKey: key,
        occurrenceCount: puzzle?.occurrence_count || 0,
        firstSeen: puzzle ? new Date(puzzle.first_seen) : undefined,
        lastSeen: puzzle ? new Date(puzzle.last_seen) : undefined,
        bestRecord: solveRecords[0] || null,
        topRecords: solveRecords
      };
    } catch (error) {
      console.error('Database error, falling back to in-memory:', error);
    }
  }
  
  // Fallback to in-memory
  const puzzle = puzzles.get(key);
  const records = solveRecords.get(key) || [];
  
  return {
    puzzleKey: key,
    occurrenceCount: puzzle?.occurrenceCount || 0,
    firstSeen: puzzle?.firstSeen,
    lastSeen: puzzle?.lastSeen,
    bestRecord: records[0] || null,
    topRecords: records.slice(0, 5)
  };
}

/**
 * Check if a new solve time beats the current record
 */
export async function isNewRecord(cards: number[], solveTimeMs: number): Promise<boolean> {
  const stats = await getPuzzleStats(cards);
  return !stats.bestRecord || solveTimeMs < stats.bestRecord.solveTimeMs;
}

/**
 * Get all puzzles (for debugging/admin)
 */
export async function getAllPuzzles(): Promise<PuzzleRecord[]> {
  if (isDatabaseConfigured() && supabase) {
    try {
      // Get all puzzles with their top records in a single query
      const { data: puzzles, error } = await supabase
        .from('puzzles')
        .select('*')
        .order('occurrence_count', { ascending: false });
      
      if (error) throw error;
      
      // Get ALL best records in a single query
      const { data: allRecords, error: recordsError } = await supabase
        .from('solve_records')
        .select('*')
        .order('puzzle_key')
        .order('solve_time_ms');
      
      if (recordsError) throw recordsError;
      
      // Group records by puzzle_key efficiently
      const recordsByPuzzle = new Map<string, any[]>();
      allRecords?.forEach(record => {
        if (!recordsByPuzzle.has(record.puzzle_key)) {
          recordsByPuzzle.set(record.puzzle_key, []);
        }
        const puzzleRecords = recordsByPuzzle.get(record.puzzle_key)!;
        if (puzzleRecords.length < 10) { // Keep only top 10
          puzzleRecords.push(record);
        }
      });
      
      // Store in memory for connection handler access
      recordsByPuzzle.forEach((records, puzzleKey) => {
        solveRecords.set(puzzleKey, records.map(r => ({
          puzzleKey: r.puzzle_key,
          username: r.username,
          solveTimeMs: r.solve_time_ms,
          solution: r.solution,
          createdAt: new Date(r.created_at)
        })));
      });
      
      // Build final result
      const puzzleRecords: PuzzleRecord[] = puzzles?.map(puzzle => ({
        puzzleKey: puzzle.puzzle_key,
        cards: puzzle.cards,
        occurrenceCount: puzzle.occurrence_count,
        firstSeen: new Date(puzzle.first_seen),
        lastSeen: new Date(puzzle.last_seen)
      })) || [];
      
      return puzzleRecords;
    } catch (error) {
      console.error('Database error, falling back to in-memory:', error);
    }
  }
  
  // Fallback to in-memory
  return Array.from(puzzles.values()).sort((a, b) => b.occurrenceCount - a.occurrenceCount);
}

/**
 * Clear all data (for testing)
 */
export async function clearAllPuzzleData() {
  if (isDatabaseConfigured() && supabase) {
    try {
      await supabase.from('solve_records').delete().neq('id', 0);
      await supabase.from('puzzles').delete().neq('puzzle_key', '');
    } catch (error) {
      console.error('Database error:', error);
    }
  }
  
  puzzles.clear();
  solveRecords.clear();
}