# Keyboard Interaction Design for 24 Points Game

## Overview
Implement keyboard shortcuts to enable faster gameplay by allowing players to select cards and operations without clicking.

## Keyboard Mapping

### Card Selection
- **Number Keys (1-9, 0)**: Select cards by their position
  - Cards are numbered from 1 to n (where n is the number of cards)
  - Numbers displayed in small grey font in top-right corner of each card
  - When cards merge, remaining cards are renumbered sequentially

### Operations
- **Operator Keys**:
  - `+` or `=`: Addition
  - `-` or `_`: Subtraction  
  - `*` or `x`: Multiplication
  - `/` or `?`: Division

### Special Actions
- **Enter/Space**: Confirm operation (calculate result)
- **Backspace/U**: Undo last operation
- **R**: Reset all operations
- **Escape**: Cancel current selection
- **H**: Show/hide keyboard shortcuts help

## User Flow

1. **First Card Selection**:
   - Press number key (e.g., `3`) to select third card
   - Card highlights with selection border
   - Status shows: "Card 3 selected, choose another card"

2. **Second Card Selection**:
   - Press another number key (e.g., `5`) to select fifth card
   - Both cards highlight
   - Status shows: "Cards selected, choose operation (+, -, *, /)"

3. **Operation Selection**:
   - Press operator key (e.g., `+`)
   - Operation preview shows: "3 + 5 = 8"
   - Press Enter/Space to confirm, or Escape to cancel

4. **After Merge**:
   - Cards merge with animation
   - Remaining cards renumber automatically
   - New merged card gets next available number

## Visual Design

### Card Numbering
```
┌─────────────┐
│      [1]    │  ← Small grey number in corner
│             │
│     10      │  ← Card value (large, centered)
│             │
└─────────────┘
```

### Selection States
- **Unselected**: Normal appearance with grey number
- **First Selected**: Blue border, number turns blue
- **Second Selected**: Green border, number turns green
- **Hover (keyboard)**: Subtle glow effect when pressing number

### Merged Card
```
┌─────────────┐
│      [3]    │  ← New number assigned
│             │
│     24      │  ← Result value
│  (10 + 14)  │  ← Expression shown below
└─────────────┘
```

## Implementation Details

### Dynamic Numbering Algorithm
```javascript
function assignCardNumbers(cards) {
  cards.forEach((card, index) => {
    card.keyboardNumber = index + 1;
  });
}
```

### Keyboard Event Handler
```javascript
function handleKeyPress(event) {
  const key = event.key;
  
  // Number keys (1-9, 0 for 10)
  if (key >= '1' && key <= '9') {
    selectCard(parseInt(key));
  } else if (key === '0') {
    selectCard(10);
  }
  
  // Operator keys
  else if (['+', '=', '-', '_', '*', 'x', '/', '?'].includes(key)) {
    selectOperator(normalizeOperator(key));
  }
  
  // Action keys
  else if (key === 'Enter' || key === ' ') {
    confirmOperation();
  } else if (key === 'Backspace' || key.toLowerCase() === 'u') {
    undoOperation();
  } else if (key.toLowerCase() === 'r') {
    resetAll();
  } else if (key === 'Escape') {
    cancelSelection();
  }
}
```

## Accessibility Considerations

1. **Visual Indicators**: 
   - Clear visual feedback for keyboard selections
   - High contrast numbers for visibility
   - Keyboard focus indicators

2. **Screen Reader Support**:
   - Announce card selections and operations
   - Provide audio feedback for actions

3. **Customization Options**:
   - Allow users to toggle keyboard shortcuts on/off
   - Option to customize key bindings

## Benefits

1. **Speed**: Experienced players can play much faster
2. **Ergonomics**: Less mouse movement reduces strain
3. **Flow**: Maintains hands on keyboard for uninterrupted play
4. **Accessibility**: Alternative input method for users with motor difficulties

## Future Enhancements

1. **Vim-style Navigation**: Use HJKL for card navigation
2. **Quick Actions**: Single key for common patterns (e.g., `d` for double)
3. **Macro Recording**: Record and replay operation sequences
4. **Competition Mode**: Keyboard-only mode for speed competitions