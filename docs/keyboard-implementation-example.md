# Keyboard Implementation Example

## Updated Card Component

```tsx
// Card.tsx
interface CardProps {
  card: Card;
  keyboardNumber?: number;
  showKeyboardHint?: boolean;
  // ... other props
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  keyboardNumber,
  showKeyboardHint = true,
  ...props 
}) => {
  return (
    <div className={`card ${props.className}`}>
      {showKeyboardHint && keyboardNumber && (
        <span className="keyboard-hint">{keyboardNumber === 10 ? '0' : keyboardNumber}</span>
      )}
      <div className="card-value">{card.value}</div>
      {card.expression && (
        <div className="card-expression">{card.expression}</div>
      )}
    </div>
  );
};
```

## CSS for Keyboard Hints

```css
.keyboard-hint {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 0.75rem;
  color: #999;
  font-weight: 500;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.card:hover .keyboard-hint {
  opacity: 1;
  color: #666;
}

.card.selected .keyboard-hint {
  color: #2196F3;
  font-weight: 600;
}

/* Keyboard focus indicator */
.card.keyboard-focused {
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.3);
  animation: pulse 0.5s ease-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

## Help Overlay Component

```tsx
const KeyboardHelp: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="keyboard-help-overlay" onClick={onClose}>
      <div className="keyboard-help-content" onClick={e => e.stopPropagation()}>
        <h3>Keyboard Shortcuts</h3>
        
        <div className="help-section">
          <h4>Card Selection</h4>
          <div className="help-item"><kbd>1</kbd> - <kbd>9</kbd> Select cards by number</div>
          <div className="help-item"><kbd>0</kbd> Select 10th card</div>
        </div>

        <div className="help-section">
          <h4>Operations</h4>
          <div className="help-item"><kbd>+</kbd> or <kbd>=</kbd> Addition</div>
          <div className="help-item"><kbd>-</kbd> Subtraction</div>
          <div className="help-item"><kbd>*</kbd> or <kbd>x</kbd> Multiplication</div>
          <div className="help-item"><kbd>/</kbd> or <kbd>?</kbd> Division</div>
        </div>

        <div className="help-section">
          <h4>Actions</h4>
          <div className="help-item"><kbd>Enter</kbd> or <kbd>Space</kbd> Confirm operation</div>
          <div className="help-item"><kbd>Backspace</kbd> or <kbd>U</kbd> Undo</div>
          <div className="help-item"><kbd>R</kbd> Reset all</div>
          <div className="help-item"><kbd>Esc</kbd> Cancel selection</div>
          <div className="help-item"><kbd>H</kbd> Toggle this help</div>
        </div>

        <button className="close-help" onClick={onClose}>Close (ESC)</button>
      </div>
    </div>
  );
};
```

## Integration in InteractiveCenterTable

```tsx
const InteractiveCenterTable: React.FC<Props> = ({ cards, onSolutionFound }) => {
  // ... existing state
  
  const { showHelp, setShowHelp, cardNumberMap } = useKeyboardControls({
    cards,
    onCardSelect: handleCardClick,
    onOperatorSelect: (op) => {
      if (selectedCard && secondCard) {
        handleOperationSelect(op);
      }
    },
    onConfirm: () => {
      if (selectedCard && secondCard && selectedOperator) {
        handleCalculate();
      }
    },
    onUndo: handleReset,
    onReset: () => {
      setSelectedCard(null);
      setSecondCard(null);
      setOperationMenuPosition(null);
    },
    enabled: allowInteraction
  });

  return (
    <>
      <div className="interactive-center-table">
        {/* Show keyboard hint in header */}
        <div className="keyboard-hint-text">
          Press <kbd>H</kbd> for keyboard shortcuts
        </div>
        
        {/* Cards with keyboard numbers */}
        {cards.map((card, index) => (
          <Card
            key={card.id}
            card={card}
            keyboardNumber={index + 1}
            showKeyboardHint={true}
            // ... other props
          />
        ))}
      </div>
      
      <KeyboardHelp show={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
};
```

## Benefits Implementation

1. **Speed Test Mode**: Track completion times with keyboard vs mouse
2. **Tutorial**: Interactive keyboard tutorial for new players
3. **Settings**: Toggle keyboard shortcuts on/off in preferences
4. **Mobile**: Show virtual keyboard overlay for touch devices