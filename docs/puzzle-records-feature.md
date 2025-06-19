# Puzzle Records Feature

## Overview
Display historical records during game rounds to motivate users to beat previous best times.

## Feature Description
During each round, show:
- "This problem emerged [x] times"
- "[username] once did it in [x] seconds"

## Implementation Plan

### 1. Database Schema (records-1.1)
- **puzzles** table:
  - id (primary key)
  - cards (array of 4 numbers, normalized/sorted)
  - occurrence_count
  - created_at
  - updated_at

- **puzzle_records** table:
  - id (primary key)
  - puzzle_id (foreign key)
  - user_id (foreign key)
  - solve_time_ms (milliseconds)
  - solution_steps (JSON)
  - created_at

### 2. Record Tracking System (records-1.2)
- Track each puzzle combination when it appears
- Store fastest solve time per puzzle
- Update occurrence count
- Cache frequently appearing puzzles

### 3. UI Display (records-1.3)
- Show record info when round starts
- Display below the center table
- Format: "Appeared 47 times • Record: john123 in 3.2s"
- Animate when current player beats the record

### 4. Real-time Updates (records-1.4)
- Emit socket event when record is broken
- Show celebration animation
- Update display for all players in room

## Benefits
- Motivates competitive play
- Adds historical context to puzzles
- Encourages speed improvement
- Creates memorable moments when records are broken

## Technical Considerations
- Need to normalize card combinations (e.g., [1,2,3,4] = [4,3,2,1])
- Cache popular puzzles to reduce database queries
- Consider showing top 3 records, not just the best
- Track records per game mode (classic, super, extended)