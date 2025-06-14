import { Card, Operation, Solution } from '../types/game.types';
import { Calculator } from '../utils/calculator';

export class ValidationService {
  /**
   * Validates a complete solution from a player
   */
  static validatePlayerSolution(
    centerCards: Card[],
    solution: Solution
  ): {
    isValid: boolean;
    error?: string;
  } {
    try {
      // Check if all cards are from center
      if (solution.cards.length !== 4) {
        return { isValid: false, error: 'Must use exactly 4 cards' };
      }

      const centerCardIds = new Set(centerCards.map(c => c.id));
      const solutionCardIds = new Set(solution.cards.map(c => c.id));

      // Check if all solution cards are from center cards
      for (const cardId of solutionCardIds) {
        if (!centerCardIds.has(cardId)) {
          return { isValid: false, error: 'Invalid card used' };
        }
      }

      // Check if all center cards are used
      if (solutionCardIds.size !== 4) {
        return { isValid: false, error: 'Must use all 4 cards exactly once' };
      }

      // Validate the mathematical solution
      const validation = Calculator.validateSolution(solution.cards, solution.operations);
      
      if (!validation.isValid) {
        return { isValid: false, error: validation.error };
      }

      // Validate card usage in operations
      if (!Calculator.validateCardUsage(solution.cards, solution.operations)) {
        return { isValid: false, error: 'Card values do not match operations' };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid solution'
      };
    }
  }

  /**
   * Checks if the current center cards have at least one valid solution
   */
  static async checkSolvability(centerCards: Card[]): Promise<boolean> {
    const values = centerCards.map(c => c.value);
    return Calculator.hasSolution(values);
  }

  /**
   * Validates a single operation in real-time
   */
  static validateOperation(operation: Operation): {
    isValid: boolean;
    error?: string;
  } {
    try {
      const calculatedResult = Calculator.evaluate(
        operation.left,
        operation.operator,
        operation.right
      );

      if (Math.abs(calculatedResult - operation.result) > 0.0001) {
        return {
          isValid: false,
          error: 'Incorrect calculation result'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid operation'
      };
    }
  }

  /**
   * Generates a hint for the current cards
   */
  static generateHint(centerCards: Card[]): string | null {
    const values = centerCards.map(c => c.value);
    return Calculator.getHint(values);
  }

  /**
   * Validates game timing constraints
   */
  static validateTiming(
    startTime: number,
    submissionTime: number,
    maxTimeSeconds: number = 300 // 5 minutes default
  ): {
    isValid: boolean;
    error?: string;
  } {
    const elapsedSeconds = (submissionTime - startTime) / 1000;
    
    if (elapsedSeconds > maxTimeSeconds) {
      return {
        isValid: false,
        error: 'Time limit exceeded'
      };
    }

    if (elapsedSeconds < 1) {
      return {
        isValid: false,
        error: 'Solution submitted too quickly'
      };
    }

    return { isValid: true };
  }

  /**
   * Calculates score based on solution speed and complexity
   */
  static calculateScore(
    elapsedSeconds: number,
    operations: Operation[]
  ): number {
    // Base score
    let score = 1000;

    // Time bonus (faster = more points)
    const timeBonus = Math.max(0, 300 - elapsedSeconds) * 2;
    score += timeBonus;

    // Complexity penalty (simpler solutions get small bonus)
    const complexityBonus = operations.some(op => op.operator === '*' || op.operator === '/')
      ? 0
      : 50; // Bonus for using only + and -
    score += complexityBonus;

    return Math.round(score);
  }

  /**
   * Checks if a player is trying to cheat
   */
  static detectCheating(
    solution: Solution,
    elapsedSeconds: number
  ): {
    isSuspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    // Check if solution was submitted impossibly fast
    if (elapsedSeconds < 2) {
      reasons.push('Solution submitted too quickly');
    }

    // Check if the solution matches known patterns exactly
    // (This could be expanded with a database of common solutions)
    const cardValues = solution.cards.map(c => c.value).sort().join(',');
    const knownInstantSolutions = [
      '1,2,3,4', // (1+2+3)*4 = 24
      '2,3,4,5', // (5-2)*3*4 = 24
      '3,3,8,8', // 8/(3-8/3) = 24
    ];

    if (knownInstantSolutions.includes(cardValues) && elapsedSeconds < 5) {
      reasons.push('Common solution submitted very quickly');
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons
    };
  }
}