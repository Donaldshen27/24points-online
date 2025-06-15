import { Card, Player, GameRoom } from '../types/game.types';
import { CardUtils } from '../utils/cardUtils';
import { Calculator } from '../utils/calculator';

export class DeckManager {
  private room?: GameRoom;

  constructor(room?: GameRoom) {
    if (room) {
      this.room = room;
    }
  }

  initializeDecks(): { deck1: Card[], deck2: Card[] } {
    const { player1Deck, player2Deck } = CardUtils.initializePlayerDecks();
    
    return {
      deck1: player1Deck,
      deck2: player2Deck
    };
  }

  dealCards(deck1: Card[], deck2: Card[]): Card[] {
    // Check if both decks have enough cards
    if (deck1.length < 2 || deck2.length < 2) {
      throw new Error('Not enough cards to deal');
    }

    let attempts = 0;
    const maxAttempts = 100; // Increased attempts
    let centerCards: Card[] = [];
    
    // Create shuffled copies of the decks for random selection
    const deck1Copy = CardUtils.shuffleDeck([...deck1]);
    const deck2Copy = CardUtils.shuffleDeck([...deck2]);

    while (attempts < maxAttempts) {
      // Try different combinations by shuffling
      const shuffled1 = attempts % 10 === 0 ? CardUtils.shuffleDeck([...deck1]) : deck1Copy;
      const shuffled2 = attempts % 10 === 0 ? CardUtils.shuffleDeck([...deck2]) : deck2Copy;
      
      // Draw 2 cards from each deck
      const { drawn: p1Cards, remaining: p1Rem } = CardUtils.drawCards(shuffled1, 2);
      const { drawn: p2Cards, remaining: p2Rem } = CardUtils.drawCards(shuffled2, 2);
      
      centerCards = [...p1Cards, ...p2Cards];
      const cardValues = centerCards.map(c => c.value);
      
      // Check if these cards have a solution
      if (Calculator.hasSolution(cardValues)) {
        // Update the decks in place
        deck1.length = 0;
        deck1.push(...p1Rem);
        
        deck2.length = 0;
        deck2.push(...p2Rem);
        
        console.log(`Found solvable cards after ${attempts + 1} attempts:`, cardValues);
        return centerCards;
      }
      
      attempts++;
    }

    // If no solvable combination found after max attempts, 
    // fall back to the last combination (rare case)
    console.warn('Could not find solvable cards after', maxAttempts, 'attempts. Using last combination.');
    
    // Update the decks with the last attempt
    const { drawn: p1Cards, remaining: p1Rem } = CardUtils.drawCards(deck1, 2);
    const { drawn: p2Cards, remaining: p2Rem } = CardUtils.drawCards(deck2, 2);
    
    deck1.length = 0;
    deck1.push(...p1Rem);
    
    deck2.length = 0;
    deck2.push(...p2Rem);
    
    return [...p1Cards, ...p2Cards];
  }

  dealNewRound(): Card[] {
    if (!this.room || this.room.players.length !== 2) {
      throw new Error('Cannot deal cards without room and 2 players');
    }

    const player1 = this.room.players[0];
    const player2 = this.room.players[1];

    // Use the dealCards method
    const centerCards = this.dealCards(player1.deck, player2.deck);
    
    // Set center cards
    this.room.centerCards = centerCards;
    
    return this.room.centerCards;
  }

  transferCenterCardsToPlayer(playerId: string): void {
    if (!this.room) {
      throw new Error('Room not initialized');
    }
    const playerIndex = this.room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      throw new Error('Player not found');
    }

    const owner = playerIndex === 0 ? 'player1' : 'player2';
    const transferredCards = CardUtils.transferCards(this.room.centerCards, owner);
    
    // Add shuffled cards back to player's deck
    this.room.players[playerIndex].deck = CardUtils.shuffleDeck([
      ...this.room.players[playerIndex].deck,
      ...transferredCards
    ]);

    // Clear center cards
    this.room.centerCards = [];
  }

  checkGameEnd(): { 
    isGameOver: boolean; 
    winner?: Player; 
    reason?: string 
  } {
    if (!this.room) {
      throw new Error('Room not initialized');
    }
    const player1 = this.room.players[0];
    const player2 = this.room.players[1];

    // Check if any player has no cards (wins)
    if (player1.deck.length === 0) {
      return {
        isGameOver: true,
        winner: player1,
        reason: 'Player 1 ran out of cards!'
      };
    }

    if (player2.deck.length === 0) {
      return {
        isGameOver: true,
        winner: player2,
        reason: 'Player 2 ran out of cards!'
      };
    }

    // Check if any player has all 20 cards (loses)
    if (player1.deck.length === 20) {
      return {
        isGameOver: true,
        winner: player2,
        reason: 'Player 1 collected all cards!'
      };
    }

    if (player2.deck.length === 20) {
      return {
        isGameOver: true,
        winner: player1,
        reason: 'Player 2 collected all cards!'
      };
    }

    // Check if neither player has enough cards for next round
    if (player1.deck.length < 2 && player2.deck.length < 2) {
      // Determine winner by who has fewer cards
      const winner = player1.deck.length < player2.deck.length ? player1 : player2;
      return {
        isGameOver: true,
        winner,
        reason: 'Not enough cards for next round'
      };
    }

    return { isGameOver: false };
  }

  getPlayerStats(): {
    player1Cards: number;
    player2Cards: number;
    canContinue: boolean;
  } {
    if (!this.room) {
      return {
        player1Cards: 0,
        player2Cards: 0,
        canContinue: false
      };
    }
    const player1 = this.room.players[0];
    const player2 = this.room.players[1];

    return {
      player1Cards: player1?.deck.length || 0,
      player2Cards: player2?.deck.length || 0,
      canContinue: (player1?.deck.length || 0) >= 2 && (player2?.deck.length || 0) >= 2
    };
  }

  resetDecks(): void {
    this.initializeDecks();
    if (this.room) {
      this.room.centerCards = [];
    }
  }
}