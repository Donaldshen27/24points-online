/**
 * In-memory storage for puzzle records (replace with database in production)
 */

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

// In-memory storage
const puzzles: Map<string, PuzzleRecord> = new Map();
const solveRecords: Map<string, SolveRecord[]> = new Map();

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
export function trackPuzzle(cards: number[]): PuzzleRecord {
  const key = normalizePuzzleKey(cards);
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
export function recordSolveTime(
  cards: number[], 
  username: string, 
  solveTimeMs: number,
  solution?: string,
  userId?: string
): SolveRecord {
  const key = normalizePuzzleKey(cards);
  
  const record: SolveRecord = {
    puzzleKey: key,
    username,
    userId,
    solveTimeMs,
    solution,
    createdAt: new Date()
  };
  
  const records = solveRecords.get(key) || [];
  records.push(record);
  
  // Keep records sorted by solve time
  records.sort((a, b) => a.solveTimeMs - b.solveTimeMs);
  
  solveRecords.set(key, records);
  return record;
}

/**
 * Get puzzle statistics including occurrence count and best record
 */
export function getPuzzleStats(cards: number[]) {
  const key = normalizePuzzleKey(cards);
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
export function isNewRecord(cards: number[], solveTimeMs: number): boolean {
  const stats = getPuzzleStats(cards);
  return !stats.bestRecord || solveTimeMs < stats.bestRecord.solveTimeMs;
}

/**
 * Get all puzzles (for debugging/admin)
 */
export function getAllPuzzles(): PuzzleRecord[] {
  return Array.from(puzzles.values()).sort((a, b) => b.occurrenceCount - a.occurrenceCount);
}

/**
 * Clear all data (for testing)
 */
export function clearAllPuzzleData() {
  puzzles.clear();
  solveRecords.clear();
}