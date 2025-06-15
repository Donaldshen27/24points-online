import { Card, GameRoom, Player, Solution } from '../../types/game.types';
import { RoomTypeConfig } from '../../types/roomTypes';

export interface WinResult {
  winnerId: string;
  reason: string;
}

export abstract class BaseGameRules {
  constructor(protected config: RoomTypeConfig) {}
  
  abstract initializeDecks(players: Player[]): void;
  abstract dealCards(room: GameRoom): Card[];
  abstract validateSolution(solution: Solution, centerCards: Card[]): boolean;
  abstract calculateScore(solution: Solution, timeElapsed: number): number;
  abstract checkWinCondition(room: GameRoom): WinResult | null;
  
  // Common shuffle method
  protected shuffleDeck(cards: Card[]): void {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }
  
  // Common validation that solution uses exactly the center cards
  protected validateCardUsage(solution: Solution, centerCards: Card[]): boolean {
    const solutionCardIds = solution.cards.map(c => c.id).sort();
    const centerCardIds = centerCards.map(c => c.id).sort();
    
    return JSON.stringify(solutionCardIds) === JSON.stringify(centerCardIds);
  }
}