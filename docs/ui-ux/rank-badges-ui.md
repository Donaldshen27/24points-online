# Rank Badges UI Components

## Overview
Visual components for displaying player ranks, ratings, and progression in the ELO ranking system. Features animated badges, progress bars, and comprehensive rank displays.

## Components

### RankBadge
Displays a player's rank tier with customizable size and styling.

```tsx
<RankBadge 
  tier="gold" 
  rating={1650} 
  size="medium" 
  animated 
/>
```

#### Props
- `tier`: RankTier - The rank tier to display
- `rating?`: number - Optional rating to show
- `size?`: 'small' | 'medium' | 'large' - Badge size
- `showTooltip?`: boolean - Show tooltip on hover
- `animated?`: boolean - Enable pulse animation
- `className?`: string - Additional CSS classes

#### Visual Design
- **Icons**: Chess pieces for lower ranks, special symbols for higher
  - Iron: ♟ (Pawn)
  - Bronze: ♜ (Rook)
  - Silver: ♞ (Knight)
  - Gold: ♝ (Bishop)
  - Platinum: ♛ (Queen)
  - Diamond: ♔ (King)
  - Master: ⚔ (Crossed swords)
  - Grandmaster: 👑 (Crown)

### RankProgressBar
Shows progression within current tier and distance to next rank.

```tsx
<RankProgressBar 
  currentRating={1650} 
  showNextTier 
  showLabels 
  animated 
/>
```

#### Props
- `currentRating`: number - Player's current rating
- `showNextTier?`: boolean - Display next tier badge
- `showLabels?`: boolean - Show rating labels
- `animated?`: boolean - Enable animations
- `className?`: string - Additional CSS classes

#### Features
- Progress bar fills based on tier completion
- Shows points needed for promotion
- Special display for max tier (Grandmaster)
- Animated shine effect on progress bar

### RankDisplay
Combined display showing badge, progress, and statistics.

```tsx
<RankDisplay 
  rating={1650} 
  peakRating={1700} 
  wins={45} 
  losses={30} 
  variant="full" 
/>
```

#### Props
- `rating`: number - Current rating
- `peakRating?`: number - Highest rating achieved
- `wins?`: number - Total wins
- `losses?`: number - Total losses
- `variant?`: 'compact' | 'detailed' | 'full' - Display variant
- `className?`: string - Additional CSS classes

#### Variants
1. **Compact**: Just the badge with rating
2. **Detailed**: Badge with win rate and games
3. **Full**: Complete display with progress bar and all stats

## Styling

### Color Scheme
Each tier has a distinctive color:
- Iron: #7C7C7C (Gray)
- Bronze: #CD7F32 (Bronze)
- Silver: #C0C0C0 (Silver)
- Gold: #FFD700 (Gold)
- Platinum: #E5E4E2 (Light gray)
- Diamond: #B9F2FF (Light blue)
- Master: #9B30FF (Purple)
- Grandmaster: #FF0000 (Red)

### Special Effects
- **Diamond**: Radial gradient sparkle animation
- **Grandmaster**: Diagonal shine sweep effect
- **All badges**: Hover lift and glow
- **Progress bars**: Moving shine animation

### Responsive Design
- Components scale appropriately on mobile
- Full variant switches to grid layout
- Text sizes adjust for readability

## Usage Examples

### In Game Screen
```tsx
// Show opponent's rank during match
<RankBadge tier={opponentTier} size="small" />
```

### In Profile
```tsx
// Full rank display with stats
<RankDisplay 
  rating={playerRating} 
  peakRating={playerPeak}
  wins={playerWins}
  losses={playerLosses}
  variant="full" 
/>
```

### In Leaderboard
```tsx
// Compact display for table rows
<RankDisplay 
  rating={entry.rating} 
  variant="compact" 
/>
```

### In Queue
```tsx
// Show current rank while matchmaking
<RankProgressBar 
  currentRating={myRating} 
  showNextTier={false} 
/>
```

## Accessibility
- Tooltips show rank name and rating
- High contrast borders for visibility
- Icons have semantic meaning
- Progress bars include text labels

## Performance
- CSS animations use GPU acceleration
- Minimal re-renders with React.memo
- Efficient color calculations
- Lazy loading for large badge sets

## Future Enhancements
1. **Seasonal Badges**: Special designs for seasons
2. **Rank Animations**: Promotion/demotion effects
3. **3D Effects**: WebGL-powered badge rendering
4. **Custom Themes**: User-selectable color schemes
5. **Achievement Integration**: Combined badge/achievement display