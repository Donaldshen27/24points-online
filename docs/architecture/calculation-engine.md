# 24-Point Calculation Engine Documentation

## Overview
The calculation engine is the core mathematical component that validates player solutions, finds all possible solutions for a given set of cards, and ensures fair gameplay.

## Architecture

### Core Components

#### Calculator Class (`utils/calculator.ts`)
Main calculation utilities available on both client and server:

1. **evaluate(left, operator, right)**: Evaluates single operations
2. **validateSolution(cards, operations)**: Validates complete solutions
3. **findAllSolutions(cards)**: Finds all valid 24-point solutions
4. **evaluateExpression(expression)**: Safely evaluates math expressions
5. **getHint(cards)**: Provides a hint solution
6. **hasSolution(cards)**: Quick check if solution exists

#### ValidationService (`server/src/game/ValidationService.ts`)
Server-side validation and game logic:

1. **validatePlayerSolution**: Comprehensive solution validation
2. **checkSolvability**: Verifies cards have valid solutions
3. **validateOperation**: Real-time operation validation
4. **validateTiming**: Prevents cheating via timing checks
5. **calculateScore**: Awards points based on speed and complexity
6. **detectCheating**: Identifies suspicious behavior

#### SolutionBuilder Component (`client/src/components/SolutionBuilder`)
Interactive UI for building solutions step-by-step:

- Visual number selection
- Operation buttons
- Step tracking
- Real-time validation
- Undo/Reset functionality

## Mathematical Rules

### Valid Operations
- Addition (+)
- Subtraction (-)
- Multiplication (× or *)
- Division (÷ or /)

### Solution Requirements
1. Must use all 4 cards exactly once
2. Must use exactly 3 operations
3. Final result must equal 24 (±0.0001 for floating point)
4. Division by zero is invalid

### Operation Precedence
The engine supports multiple groupings via parentheses:
- `((a op b) op c) op d`
- `(a op (b op c)) op d`
- `a op ((b op c) op d)`
- `a op (b op (c op d))`
- `(a op b) op (c op d)`

## Algorithm Details

### Finding All Solutions
1. Generate all permutations of 4 cards (24 permutations)
2. Try all operator combinations (4³ = 64 combinations)
3. Test all valid parentheses groupings (5 patterns)
4. Total checks: 24 × 64 × 5 = 7,680 expressions
5. Filter for results equaling 24

### Solution Validation Process
1. **Card Validation**: Ensure exactly 4 cards from center
2. **Operation Count**: Verify exactly 3 operations
3. **Mathematical Accuracy**: Check each operation result
4. **Card Usage**: Confirm cards match operation values
5. **Final Result**: Verify equals 24

### Performance Optimizations
- Early termination on invalid operations
- Skip division by zero cases
- Cache common card combinations
- Use floating-point tolerance (0.0001)

## Security Features

### Anti-Cheating Measures
1. **Server-side validation**: All solutions verified on server
2. **Timing checks**: Detect impossibly fast solutions
3. **Pattern detection**: Identify memorized solutions
4. **Card verification**: Ensure only center cards used

### Validation Timing
- Minimum time: 1 second (prevents bots)
- Maximum time: 300 seconds (5 minutes)
- Suspicious threshold: <2 seconds for complex solutions

## Scoring System

### Base Score: 1000 points

### Modifiers:
- **Time Bonus**: (300 - seconds) × 2 points
- **Simplicity Bonus**: +50 for using only + and -
- **First Solver**: Winner gets full points
- **Failed Attempt**: -200 points

## Example Solutions

### Simple (using only + and -):
- Cards: 1,2,3,4 → `(1+2+3)×4 = 24`
- Cards: 6,6,6,6 → `6+6+6+6 = 24`

### Medium (mixed operations):
- Cards: 2,3,4,5 → `(5-2)×3×4 = 24`
- Cards: 1,3,4,6 → `6÷(1-3÷4) = 24`

### Complex (division-heavy):
- Cards: 3,3,8,8 → `8÷(3-8÷3) = 24`
- Cards: 4,4,10,10 → `(10×10-4)÷4 = 24`

## Testing

### CalculatorTest Component
Provides comprehensive testing interface:
- Test with predefined cards
- Custom card input
- Solution builder integration
- Multiple solution display
- Example solutions reference

### Validation Test Cases
1. **Valid solutions**: Various complexity levels
2. **Invalid solutions**: Wrong result, missing cards
3. **Edge cases**: Division by zero, very large numbers
4. **Timing tests**: Too fast/slow submissions

## Error Handling

### Common Errors:
1. "Must use exactly 4 cards"
2. "Must have exactly 3 operations"
3. "Division by zero"
4. "Result is X, not 24"
5. "Invalid card used"
6. "Time limit exceeded"

### Client-Side Feedback
- Real-time validation in SolutionBuilder
- Clear error messages
- Visual indicators for valid/invalid states
- Step-by-step progress tracking