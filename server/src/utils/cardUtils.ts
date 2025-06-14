import { Card } from '../types/game.types';

export class CardUtils {
  static createDeck(owner: 'player1' | 'player2'): Card[] {
    const deck: Card[] = [];
    
    // Create cards 1-10 for the player
    for (let value = 1; value <= 10; value++) {
      deck.push({
        value,
        owner,
        id: `${owner}-card-${value}-${Date.now()}`
      });
    }
    
    return deck;
  }

  static shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  static drawCards(deck: Card[], count: number): { drawn: Card[], remaining: Card[] } {
    if (count > deck.length) {
      throw new Error('Not enough cards in deck');
    }
    
    const drawn = deck.slice(0, count);
    const remaining = deck.slice(count);
    
    return { drawn, remaining };
  }

  static initializePlayerDecks(): { player1Deck: Card[], player2Deck: Card[] } {
    const player1Deck = CardUtils.shuffleDeck(CardUtils.createDeck('player1'));
    const player2Deck = CardUtils.shuffleDeck(CardUtils.createDeck('player2'));
    
    return { player1Deck, player2Deck };
  }

  static dealInitialCards(player1Deck: Card[], player2Deck: Card[]): {
    centerCards: Card[],
    player1Remaining: Card[],
    player2Remaining: Card[]
  } {
    const { drawn: player1Cards, remaining: player1Remaining } = CardUtils.drawCards(player1Deck, 2);
    const { drawn: player2Cards, remaining: player2Remaining } = CardUtils.drawCards(player2Deck, 2);
    
    const centerCards = [...player1Cards, ...player2Cards];
    
    return {
      centerCards,
      player1Remaining,
      player2Remaining
    };
  }

  static transferCards(cards: Card[], toOwner: 'player1' | 'player2'): Card[] {
    return cards.map(card => ({
      ...card,
      owner: toOwner,
      id: `${toOwner}-card-${card.value}-${Date.now()}-${Math.random()}`
    }));
  }

  static sortCardsByValue(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => a.value - b.value);
  }

  static getCardsByOwner(cards: Card[], owner: 'player1' | 'player2'): Card[] {
    return cards.filter(card => card.owner === owner);
  }

  static countCardsByOwner(cards: Card[]): { player1: number, player2: number } {
    return cards.reduce((acc, card) => {
      if (card.owner === 'player1') {
        acc.player1++;
      } else {
        acc.player2++;
      }
      return acc;
    }, { player1: 0, player2: 0 });
  }

  static validateCardSet(cards: Card[]): boolean {
    // Check if we have exactly 4 cards
    if (cards.length !== 4) {
      return false;
    }
    
    // Check if all cards have valid values (1-10)
    return cards.every(card => card.value >= 1 && card.value <= 10);
  }
}