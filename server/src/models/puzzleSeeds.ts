/**
 * Seed some sample puzzle records for demonstration
 */
import { trackPuzzle, recordSolveTime } from './puzzleRepository';

export function seedPuzzleRecords() {
  // Common puzzle: 1, 5, 5, 5 (appeared many times)
  const puzzle1 = [1, 5, 5, 5];
  for (let i = 0; i < 47; i++) {
    trackPuzzle(puzzle1);
  }
  recordSolveTime(puzzle1, 'john123', 3200, '5 - 1 = 4, 5 × 4 = 20, 20 + 5 = 25, 25 - 1 = 24');
  recordSolveTime(puzzle1, 'speedmaster', 2800, '5 × 5 = 25, 25 - 1 = 24');
  recordSolveTime(puzzle1, 'mathpro', 4100, '5 + 5 = 10, 10 + 5 = 15, 15 + 1 = 16, 16 + 8 = 24');

  // Medium frequency puzzle: 3, 3, 8, 8
  const puzzle2 = [3, 3, 8, 8];
  for (let i = 0; i < 23; i++) {
    trackPuzzle(puzzle2);
  }
  recordSolveTime(puzzle2, 'alice99', 5600, '8 ÷ (3 - 8÷3) = 24');
  recordSolveTime(puzzle2, 'quickmaths', 4200, '8 × 3 = 24');

  // Rare puzzle: 1, 1, 1, 8
  const puzzle3 = [1, 1, 1, 8];
  for (let i = 0; i < 5; i++) {
    trackPuzzle(puzzle3);
  }
  recordSolveTime(puzzle3, 'genius2024', 8900, '(1 + 1 + 1) × 8 = 24');

  // Very common puzzle: 2, 3, 4, 6
  const puzzle4 = [2, 3, 4, 6];
  for (let i = 0; i < 156; i++) {
    trackPuzzle(puzzle4);
  }
  recordSolveTime(puzzle4, 'veteran', 1800, '6 × 4 = 24');
  recordSolveTime(puzzle4, 'speedking', 2100, '2 × 3 × 4 = 24');
  recordSolveTime(puzzle4, 'mathwhiz', 2500, '(6 - 2) × (4 + 3 - 1) = 24');

  console.log('Puzzle records seeded successfully');
}