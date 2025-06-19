import { Card, GameRoom, Player, Solution } from '../../types/game.types';
import { BaseGameRules, WinResult } from './BaseGameRules';
import { Calculator } from '../../utils/calculator';

export class ExtendedGameRules extends BaseGameRules {

  initializeDecks(players: Player[]): void {
    players.forEach(player => {
      player.deck = [];
      player.points = 0; // Initialize points for Extended Range mode
      // Extended mode: cards from 1-20
      for (let i = 1; i <= 20; i++) {
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
    // Extended scoring: bonus points for using higher cards
    const baseScore = 1;
    const highCardBonus = solution.cards.filter(c => c.value > 10).length * 0.5;
    return baseScore + highCardBonus;
  }
  
  checkWinCondition(room: GameRoom): WinResult | null {
    // Check if any player has reached 4 points (wins)
    const winner = room.players.find(p => (p.points || 0) >= 4);
    if (winner) {
      return { winnerId: winner.id, reason: 'reached_4_points' };
    }
    
    return null;
  }
}