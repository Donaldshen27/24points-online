# Game Board Layout Documentation

## Overview
The 24 Points game features a responsive, visually appealing game board layout designed for real-time multiplayer gameplay. The layout accommodates two players, center table cards, game status information, and interactive elements.

## Layout Structure

### 1. Game Screen Container
- **Component**: `GameScreen.tsx`
- **Layout**: Vertical flex container filling the viewport
- **Styling**: Dark gradient background (#1a1a2e to #0f0f1e)
- **Sections**:
  - Game Header (top)
  - Opponent Area
  - Game Board (center - flex-grow)
  - Player Area (bottom)

### 2. Game Header
- **Content**:
  - Room information (Room ID, Round number)
  - Game status and timer (centered)
  - Leave game button (right)
- **Features**:
  - Responsive design - stacks vertically on mobile
  - Timer with visual states (normal, urgent with pulse animation)
  - Status messages for game state feedback

### 3. Player Areas

#### Opponent Area (Top)
- **Component**: `PlayerHand` with hidden cards
- **Display**: Card backs with "?" symbol
- **Information**: Player name, card count
- **Styling**: Purple gradient card backs

#### Player Area (Bottom)  
- **Component**: `PlayerHand` with visible cards
- **Display**: Full card values
- **Features**: Card selection, hover effects
- **Information**: Player name, card count

### 4. Game Board (Center)
- **Layout**: Centered flex container
- **Components**:
  - `CenterTable`: 2x2 grid for 4 cards
  - "I know it!" button below the table
- **Features**:
  - Green felt table with gold border
  - Card dealing animations
  - Interactive card selection

## Component Details

### Card Component
- **Sizes**: Small (60x90px), Medium (80x120px), Large (100x150px)
- **Features**:
  - Owner-based border colors (player1: blue, player2: red)
  - Selection state with glow effect
  - Hover animations
  - Disabled state for non-interactive cards

### CenterTable Component
- **Layout**: 2x2 grid with 20px gap
- **Styling**: Green background (#2d5a2d), gold border
- **Animations**: Staggered card dealing effect
- **Interaction**: Card selection for solution building

### PlayerHand Component
- **Layout**: Horizontal flex with wrap
- **Features**:
  - Automatic card arrangement
  - Shows/hides cards based on ownership
  - Card count display
  - Responsive sizing

## Responsive Design

### Desktop (>768px)
- Full layout with optimal spacing
- Large card sizes
- Side-by-side header elements

### Mobile (≤768px)
- Stacked header layout
- Reduced card sizes
- Smaller buttons and text
- Maintained touch-friendly tap targets

### Breakpoints
- Primary: 768px (tablet/mobile threshold)
- Card sizes adjust automatically
- Font sizes scale appropriately

## Visual Design

### Color Scheme
- **Background**: Dark purple gradient
- **Cards**: White with colored borders
- **Table**: Green felt (#2d5a2d)
- **Accents**: Gold (#ffd700), Teal (#4ecdc4)
- **Buttons**: Pink gradient (action), Blue gradient (secondary)

### Typography
- Primary font: System font stack
- Monospace for timers and numbers
- Font sizes scale with viewport

### Animations
- Card dealing: Staggered fade-in with translation
- Hover effects: Scale and shadow
- Button glow: Pulsing shadow animation
- Timer urgency: Opacity pulse at <10 seconds
- Modals: Zoom-in entrance

## Accessibility Features
- High contrast colors
- Clear visual hierarchy
- Large touch targets (minimum 44px)
- Visible focus states
- Status announcements for screen readers

## Performance Optimizations
- CSS transforms for animations (GPU accelerated)
- Minimal repaints during gameplay
- Efficient component re-renders
- Lazy loading of heavy components

## Implementation Status
✅ Complete responsive layout structure
✅ All player areas implemented
✅ Center table with card grid
✅ Interactive elements (buttons, cards)
✅ Mobile-responsive design
✅ Smooth animations and transitions
✅ Visual feedback for all interactions

## Future Enhancements (Optional)
- Landscape mode optimization for mobile
- Customizable themes/color schemes
- Accessibility mode with reduced animations
- Card size preferences
- Sound effect integration indicators