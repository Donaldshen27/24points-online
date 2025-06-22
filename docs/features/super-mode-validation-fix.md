# Super Mode Validation Bug Fix

## Issue Description
In Super Mode, when a player submitted a correct solution, it was being marked as invalid. This caused the wrong player to receive the cards - the player who found the correct solution would be penalized instead of rewarded.

## Root Cause
The `Calculator.validateSolution` method was hardcoded to only accept exactly 4 cards:

```typescript
if (cards.length !== 4) {
  return { isValid: false, result: 0, error: 'Must use exactly 4 cards' };
}
```

This validation was rejecting all Super Mode solutions, even valid ones, because Super Mode allows players to use 2-7 cards.

## Fix Applied

### 1. Updated Solution Validation
Changed the validation to accept variable number of cards:
- Minimum 2 cards required
- Operations must be exactly `cards.length - 1`
- Removed the hardcoded 4-card requirement

### 2. Enhanced Solution Checking
Updated `hasSolution` method to handle Super Mode:
- For 7 cards, checks all possible combinations (2, 3, 4 cards)
- Added `canMake24With2Cards` for simple 2-card solutions
- Added `canMake24With3Cards` for 3-card combinations
- Maintains backward compatibility with 4-card Classic mode

## Testing the Fix
1. Start a Super Mode game
2. Submit a valid solution using any number of cards (2-7)
3. Verify that:
   - Valid solutions are accepted
   - The winner takes no cards
   - The loser takes all 7 cards
   - Score is calculated based on complexity

## Example Valid Solutions in Super Mode
- 2 cards: `3 × 8 = 24`
- 3 cards: `(4 + 4) × 3 = 24`
- 4 cards: `(8 - 2) × (5 - 3) × 2 = 24`
- 5+ cards: Various combinations possible

## Impact
- Fixes incorrect card distribution in Super Mode
- Enables proper validation of variable-length solutions
- Maintains compatibility with Classic mode
- Improves Super Mode playability