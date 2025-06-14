# Card System Documentation

## Overview
The card system manages the core game elements including card creation, deck management, shuffling, dealing, and hand management for the 24 Points game.

## Components

### Data Structure

#### Card Interface
```typescript
interface Card {
  value: number;        // Card value (1-10)
  owner: 'player1' | 'player2';  // Card ownership
  id: string;          // Unique identifier
}
```

### Server-Side Components

#### CardUtils (`server/src/utils/cardUtils.ts`)
Utility class for card operations:
- **createDeck**: Creates a deck of 10 cards (values 1-10) for a player
- **shuffleDeck**: Implements Fisher-Yates shuffle algorithm
- **drawCards**: Draws specified number of cards from deck
- **initializePlayerDecks**: Creates and shuffles decks for both players
- **dealInitialCards**: Deals 2 cards from each player to center
- **transferCards**: Changes ownership of cards
- **validateCardSet**: Validates if cards form valid set for solving

#### DeckManager (`server/src/game/DeckManager.ts`)
Manages deck operations within a game room:
- **initializeDecks**: Sets up initial decks for both players
- **dealNewRound**: Deals 2 cards from each player to center
- **transferCenterCardsToPlayer**: Moves center cards to winner/loser
- **checkGameEnd**: Determines if game is over and who won
- **getPlayerStats**: Returns current card counts and game state

### Client-Side Components

#### CardUtils (`client/src/utils/cardUtils.ts`)
Client-side utilities matching server functionality plus:
- **getCardDisplay**: Returns display text for card
- **getCardColor**: Returns color based on card owner

#### Card Component (`client/src/components/Card/Card.tsx`)
Visual card representation with:
- Multiple size variants (small, medium, large)
- Selection state
- Owner indication
- Click handling
- Smooth animations

#### PlayerHand Component (`client/src/components/PlayerHand/PlayerHand.tsx`)
Displays a player's hand:
- Shows card count
- Displays cards for current player
- Hides opponent's cards
- Sorted card display

#### CenterTable Component (`client/src/components/CenterTable/CenterTable.tsx`)
Displays the 4 center cards:
- Green felt table appearance
- Card dealing animations
- Selection handling
- Responsive grid layout

#### useDeckManager Hook (`client/src/hooks/useDeckManager.ts`)
React hook for managing deck state:
- Initialize decks
- Deal new rounds
- Select/deselect cards
- Transfer cards between players
- Sync with server state

## Game Flow

### Initial Setup
1. When both players ready up, server initializes decks
2. Each player gets 10 shuffled cards (1-10)
3. Game state updates to PLAYING

### Round Flow
1. Server deals 2 cards from each player to center (4 total)
2. Players see center cards and can select them
3. After round resolution, cards transfer to winner/loser
4. Loser's deck is shuffled after receiving cards

### Card Transfer Rules
- Correct solution: Opponent takes all 4 center cards
- Incorrect solution: Attempting player takes all 4 cards
- Transferred cards change ownership
- Cards are shuffled back into recipient's deck

### Game End Conditions
1. **Player wins**: When they have 0 cards
2. **Player loses**: When they have all 20 cards
3. **Draw prevention**: Game ends if neither player has 2+ cards

## Visual Design

### Card Colors
- Player 1: Blue (#2196F3)
- Player 2: Red (#f44336)

### Animations
- Card dealing: Slide in from sides with rotation
- Selection: Elevation and highlight
- Hover: Subtle lift effect

### Responsive Design
- Cards resize on smaller screens
- Table adjusts to viewport
- Touch-friendly on mobile

## Testing
A DeckTest component is provided for testing card system functionality:
- Initialize and reset decks
- Deal rounds
- Select cards
- Transfer cards between players
- View current game state

## Security Considerations
- All card operations validated server-side
- Client cannot modify deck state directly
- Card IDs include timestamp and random components
- Shuffling uses cryptographically secure randomness