import { Card, GameRoom, Player, Solution } from '../../types/game.types';
import { BaseGameRules, WinResult } from './BaseGameRules';
import { Calculator } from '../../utils/calculator';

export class SuperGameRules extends BaseGameRules {

  initializeDecks(players: Player[]): void {
    players.forEach(player => {
      player.deck = [];
      // Super mode: 14 cards per player (1-10, plus 4 extra cards)
      for (let i = 1; i <= 10; i++) {
        player.deck.push({
          value: i,
          owner: player.id as any,
          id: `${player.id}-${i}`
        });
      }
      // Add 4 extra cards (values 1-4) for variety
      for (let i = 1; i <= 4; i++) {
        player.deck.push({
          value: i,
          owner: player.id as any,
          id: `${player.id}-extra-${i}`
        });
      }
      this.shuffleDeck(player.deck);
    });
  }
  
  dealCards(room: GameRoom): Card[] {
    const centerCards: Card[] = [];
    
    // Super mode: Deal 8 cards total (4 from each player)
    const cardsPerPlayer = this.config.cardsPerDraw / room.players.length;
    
    room.players.forEach(player => {
      for (let i = 0; i < cardsPerPlayer; i++) {
        const card = player.deck.pop();
        if (card) {
          centerCards.push(card);
        }
      }
    });
    
    return centerCards;
  }
  
  validateSolution(solution: Solution, centerCards: Card[]): boolean {
    console.log('[SuperGameRules] Validating solution:');
    console.log('  Cards used:', solution.cards.length, 'cards with values:', solution.cards.map(c => c.value));
    console.log('  Operations:', solution.operations.length, 'operations');
    
    // In Super mode, players can use ANY combination of the 7 cards
    // They don't have to use all cards
    if (solution.cards.length < 2) {
      console.log('  INVALID: Less than 2 cards');
      return false; // Need at least 2 cards
    }
    
    // Check that all used cards are from center cards
    const centerCardIds = centerCards.map(c => c.id);
    const usedCardIds = solution.cards.map(c => c.id);
    
    for (const usedId of usedCardIds) {
      if (!centerCardIds.includes(usedId)) {
        console.log('  INVALID: Card not from center:', usedId);
        return false;
      }
    }
    
    // Check for duplicate usage
    const uniqueIds = new Set(usedCardIds);
    if (uniqueIds.size !== usedCardIds.length) {
      console.log('  INVALID: Duplicate card usage');
      return false;
    }
    
    // Validate the mathematical operations
    try {
      const validation = Calculator.validateSolution(solution.cards, solution.operations);
      console.log('  Calculator validation:', validation);
      return validation.isValid && validation.result === 24;
    } catch (error) {
      console.log('  INVALID: Calculator error:', error);
      return false;
    }
  }
  
  calculateScore(solution: Solution, timeElapsed: number): number {
    // Unified scoring: simple 1 point per correct solution
    return 1;
  }
  
  checkWinCondition(room: GameRoom): WinResult | null {
    // Same as classic: first to run out of cards wins
    const winner = room.players.find(p => p.deck.length === 0);
    if (winner) {
      return { winnerId: winner.id, reason: 'no_cards' };
    }
    
    // Check if any player has all cards (loses)
    const totalCards = this.config.cardsPerPlayer * room.players.length;
    const loser = room.players.find(p => p.deck.length === totalCards);
    if (loser) {
      const winnerId = room.players.find(p => p.id !== loser.id)?.id;
      return { winnerId: winnerId!, reason: 'opponent_all_cards' };
    }
    
    return null;
  }
}