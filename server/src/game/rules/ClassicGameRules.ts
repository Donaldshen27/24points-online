import { Card, GameRoom, Player, Solution } from '../../types/game.types';
import { BaseGameRules, WinResult } from './BaseGameRules';
import { Calculator } from '../../utils/calculator';

export class ClassicGameRules extends BaseGameRules {

  initializeDecks(players: Player[]): void {
    players.forEach(player => {
      player.deck = [];
      for (let i = 1; i <= this.config.cardsPerPlayer; i++) {
        player.deck.push({
          value: i,
          owner: player.id as any,
          id: `${player.id}-${i}`
        });
      }
      this.shuffleDeck(player.deck);
    });
  }
  
  dealCards(room: GameRoom): Card[] {
    const centerCards: Card[] = [];
    
    // Each player contributes cards based on cardsPerDraw
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
    // Check if all center cards are used
    if (!this.validateCardUsage(solution, centerCards)) {
      return false;
    }
    
    // Validate the mathematical operations
    try {
      const validation = Calculator.validateSolution(solution.cards, solution.operations);
      return validation.isValid && validation.result === 24;
    } catch {
      return false;
    }
  }
  
  calculateScore(solution: Solution, timeElapsed: number): number {
    // Classic scoring: 1 point per round won
    return 1;
  }
  
  checkWinCondition(room: GameRoom): WinResult | null {
    // Check if any player has no cards (wins)
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