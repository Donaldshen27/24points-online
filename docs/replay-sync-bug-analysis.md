# Replay Synchronization Bug Analysis

## Problem
When one player skips the solution replay animation, they can see the next problem while the other player is still watching the replay. This creates unfair gameplay where one player gets a head start.

## Current Behavior
1. Player A solves correctly
2. Both players see the replay start
3. Player B skips the replay
4. Player B sees the new round immediately
5. Player A is still watching the replay
6. Player B has extra time to think about the solution

## Root Cause
The replay is handled entirely client-side with no server synchronization. Each client independently:
- Shows the replay
- Handles skip actions
- Proceeds to the next round

## Solution Options

### Option 1: Server-Controlled Replay State (Recommended)
**Approach**: Add replay state to the game server
- Server tracks when replay should be shown
- Server controls when the next round starts
- Clients can request to skip, but server waits for both

**Pros**:
- Perfect synchronization
- No unfair advantages
- Server has full control

**Cons**:
- More complex implementation
- Additional server state

### Option 2: Client-Side Synchronization
**Approach**: Clients communicate skip status
- When a player skips, notify the other player
- Show "Opponent skipped replay" message
- Auto-skip for both players

**Pros**:
- Simpler implementation
- Less server changes

**Cons**:
- Still some timing differences
- Relies on client messages

### Option 3: Forced Replay Duration
**Approach**: Disable skip or make it skip for both
- Remove skip button entirely, OR
- When one skips, both skip

**Pros**:
- Simplest solution
- Guaranteed fairness

**Cons**:
- Less user control
- Might annoy experienced players

## Recommended Implementation

Use **Option 1** with these changes:

1. Add `REPLAY` state to GameState enum
2. Server controls replay duration (7 seconds)
3. Add skip voting system:
   - Both players must skip to end early
   - Otherwise, wait full duration
4. Only start next round after replay completes

This ensures perfect synchronization while still allowing skip if both players agree.