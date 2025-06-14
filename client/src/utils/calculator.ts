import type { Card, Operation } from '../types/game.types';

export class Calculator {
  /**
   * Evaluates a single operation
   */
  static evaluate(left: number, operator: string, right: number): number {
    switch (operator) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
      case '×':
        return left * right;
      case '/':
      case '÷':
        if (right === 0) {
          throw new Error('Division by zero');
        }
        return left / right;
      default:
        throw new Error(`Invalid operator: ${operator}`);
    }
  }

  /**
   * Validates if a sequence of operations results in 24
   */
  static validateSolution(cards: Card[], operations: Operation[]): {
    isValid: boolean;
    result: number;
    error?: string;
  } {
    try {
      // Check if we have exactly 4 cards and 3 operations
      if (cards.length !== 4) {
        return { isValid: false, result: 0, error: 'Must use exactly 4 cards' };
      }
      
      if (operations.length !== 3) {
        return { isValid: false, result: 0, error: 'Must have exactly 3 operations' };
      }

      // Validate each operation
      for (const op of operations) {
        const result = Calculator.evaluate(op.left, op.operator, op.right);
        if (Math.abs(result - op.result) > 0.0001) {
          return { 
            isValid: false, 
            result: 0, 
            error: `Operation ${op.left} ${op.operator} ${op.right} does not equal ${op.result}` 
          };
        }
      }

      // Check if final result is 24
      const finalResult = operations[operations.length - 1].result;
      const isValid = Math.abs(finalResult - 24) < 0.0001;

      return {
        isValid,
        result: finalResult,
        error: isValid ? undefined : `Result is ${finalResult}, not 24`
      };
    } catch (error) {
      return {
        isValid: false,
        result: 0,
        error: error instanceof Error ? error.message : 'Invalid solution'
      };
    }
  }

  /**
   * Formats a number for display (removes unnecessary decimals)
   */
  static formatNumber(num: number): string {
    // If it's close to an integer, display as integer
    if (Math.abs(num - Math.round(num)) < 0.0001) {
      return Math.round(num).toString();
    }
    // Otherwise, show up to 2 decimal places
    return num.toFixed(2).replace(/\.?0+$/, '');
  }

  /**
   * Creates an operation object
   */
  static createOperation(left: number, operator: string, right: number): Operation {
    const result = Calculator.evaluate(left, operator, right);
    return {
      operator: operator as '+' | '-' | '*' | '/',
      left,
      right,
      result
    };
  }

  /**
   * Validates if an operation is valid (no division by zero, etc)
   */
  static isValidOperation(left: number, operator: string, right: number): boolean {
    try {
      if (operator === '/' || operator === '÷') {
        if (right === 0) return false;
        // Also check if result would be a reasonable number
        const result = left / right;
        if (!isFinite(result)) return false;
      }
      Calculator.evaluate(left, operator, right);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets all valid operations for two numbers
   */
  static getValidOperations(left: number, right: number): string[] {
    const operators = ['+', '-', '×', '÷'];
    return operators.filter(op => Calculator.isValidOperation(left, op, right));
  }

  /**
   * Finds all possible solutions for a set of 4 cards
   */
  static findAllSolutions(cards: number[]): string[] {
    const solutions: string[] = [];
    const operators = ['+', '-', '*', '/'];

    // Generate all permutations of cards
    const permutations = Calculator.getPermutations(cards);

    for (const perm of permutations) {
      // Try all combinations of operators
      for (const op1 of operators) {
        for (const op2 of operators) {
          for (const op3 of operators) {
            // Try different groupings (parentheses)
            const expressions = [
              // ((a op1 b) op2 c) op3 d
              `((${perm[0]} ${op1} ${perm[1]}) ${op2} ${perm[2]}) ${op3} ${perm[3]}`,
              // (a op1 (b op2 c)) op3 d
              `(${perm[0]} ${op1} (${perm[1]} ${op2} ${perm[2]})) ${op3} ${perm[3]}`,
              // a op1 ((b op2 c) op3 d)
              `${perm[0]} ${op1} ((${perm[1]} ${op2} ${perm[2]}) ${op3} ${perm[3]})`,
              // a op1 (b op2 (c op3 d))
              `${perm[0]} ${op1} (${perm[1]} ${op2} (${perm[2]} ${op3} ${perm[3]}))`,
              // (a op1 b) op2 (c op3 d)
              `(${perm[0]} ${op1} ${perm[1]}) ${op2} (${perm[2]} ${op3} ${perm[3]})`
            ];

            for (const expr of expressions) {
              try {
                const result = Calculator.evaluateExpression(expr);
                if (Math.abs(result - 24) < 0.0001) {
                  solutions.push(expr);
                }
              } catch {
                // Skip invalid expressions (like division by zero)
              }
            }
          }
        }
      }
    }

    // Remove duplicates
    return [...new Set(solutions)];
  }

  /**
   * Evaluates a mathematical expression string
   */
  static evaluateExpression(expression: string): number {
    // Remove spaces
    expression = expression.replace(/\s/g, '');
    
    // Replace × and ÷ with * and /
    expression = expression.replace(/×/g, '*').replace(/÷/g, '/');
    
    // Use Function constructor for safe evaluation
    try {
      // Validate expression contains only allowed characters
      if (!/^[\d+\-*/().]+$/.test(expression)) {
        throw new Error('Invalid characters in expression');
      }
      
      // Create a function that returns the result
      const func = new Function('return ' + expression);
      return func();
    } catch (error) {
      throw new Error('Invalid expression');
    }
  }

  /**
   * Generate all permutations of an array
   */
  private static getPermutations(arr: number[]): number[][] {
    if (arr.length <= 1) return [arr];
    
    const result: number[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
      const remainingPerms = Calculator.getPermutations(remaining);
      
      for (const perm of remainingPerms) {
        result.push([current, ...perm]);
      }
    }
    
    return result;
  }

  /**
   * Checks if a solution exists for given cards
   */
  static hasSolution(cards: number[]): boolean {
    return Calculator.findAllSolutions(cards).length > 0;
  }

  /**
   * Gets a hint for the given cards
   */
  static getHint(cards: number[]): string | null {
    const solutions = Calculator.findAllSolutions(cards);
    if (solutions.length === 0) {
      return null;
    }
    
    // Return a random solution
    return solutions[Math.floor(Math.random() * solutions.length)];
  }

  /**
   * Checks if cards can make 24 (quick check without finding all solutions)
   */
  static canMake24(cards: number[]): boolean {
    // This is a simplified check - in practice, you might want to implement
    // a more efficient algorithm or cache results
    const operators = ['+', '-', '*', '/'];
    
    // Try a few common patterns
    for (const a of cards) {
      for (const b of cards) {
        if (a === b) continue;
        for (const c of cards) {
          if (c === a || c === b) continue;
          for (const d of cards) {
            if (d === a || d === b || d === c) continue;
            
            // Try (a op b) op (c op d)
            for (const op1 of operators) {
              for (const op2 of operators) {
                for (const op3 of operators) {
                  try {
                    const ab = Calculator.evaluate(a, op1, b);
                    const cd = Calculator.evaluate(c, op2, d);
                    const result = Calculator.evaluate(ab, op3, cd);
                    if (Math.abs(result - 24) < 0.0001) {
                      return true;
                    }
                  } catch {
                    // Continue on division by zero or other errors
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return false;
  }
}