export type Operation = '+' | '-' | '*' | '/';

export interface Expression {
  left: number | Expression;
  right: number | Expression;
  operator: Operation;
}

export class Calculator {
  private static readonly EPSILON = 0.0001;
  private static readonly TARGET = 24;

  static evaluate(expr: Expression): number {
    const leftValue = typeof expr.left === 'number' ? expr.left : this.evaluate(expr.left);
    const rightValue = typeof expr.right === 'number' ? expr.right : this.evaluate(expr.right);

    switch (expr.operator) {
      case '+':
        return leftValue + rightValue;
      case '-':
        return leftValue - rightValue;
      case '*':
        return leftValue * rightValue;
      case '/':
        if (Math.abs(rightValue) < this.EPSILON) {
          throw new Error('Division by zero');
        }
        return leftValue / rightValue;
      default:
        throw new Error(`Invalid operator: ${expr.operator}`);
    }
  }

  static isValidSolution(expr: Expression, cards: number[]): boolean {
    try {
      const result = this.evaluate(expr);
      const usedNumbers = this.extractNumbers(expr);
      
      // Check if result is 24
      if (Math.abs(result - this.TARGET) >= this.EPSILON) {
        return false;
      }

      // Check if all cards are used exactly once
      const sortedCards = [...cards].sort((a, b) => a - b);
      const sortedUsed = [...usedNumbers].sort((a, b) => a - b);
      
      if (sortedCards.length !== sortedUsed.length) {
        return false;
      }

      for (let i = 0; i < sortedCards.length; i++) {
        if (sortedCards[i] !== sortedUsed[i]) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  private static extractNumbers(expr: Expression | number): number[] {
    if (typeof expr === 'number') {
      return [expr];
    }
    return [
      ...this.extractNumbers(expr.left),
      ...this.extractNumbers(expr.right)
    ];
  }

  static hasSolution(cards: number[]): boolean {
    if (cards.length !== 4) {
      return false;
    }

    // Try all permutations of cards
    const permutations = this.getPermutations(cards);
    
    for (const perm of permutations) {
      // Try all possible expression structures
      if (this.tryAllExpressions(perm)) {
        return true;
      }
    }

    return false;
  }

  private static tryAllExpressions(nums: number[]): boolean {
    const [a, b, c, d] = nums;
    const ops: Operation[] = ['+', '-', '*', '/'];

    // Try all combinations of operators and expression structures
    for (const op1 of ops) {
      for (const op2 of ops) {
        for (const op3 of ops) {
          // Structure: ((a op1 b) op2 c) op3 d
          if (this.tryExpression(a, b, c, d, op1, op2, op3, 'left')) return true;
          
          // Structure: (a op1 (b op2 c)) op3 d
          if (this.tryExpression(a, b, c, d, op1, op2, op3, 'middle-left')) return true;
          
          // Structure: a op1 ((b op2 c) op3 d)
          if (this.tryExpression(a, b, c, d, op1, op2, op3, 'middle-right')) return true;
          
          // Structure: a op1 (b op2 (c op3 d))
          if (this.tryExpression(a, b, c, d, op1, op2, op3, 'right')) return true;
          
          // Structure: (a op1 b) op2 (c op3 d)
          if (this.tryExpression(a, b, c, d, op1, op2, op3, 'balanced')) return true;
        }
      }
    }

    return false;
  }

  private static tryExpression(
    a: number, b: number, c: number, d: number,
    op1: Operation, op2: Operation, op3: Operation,
    structure: 'left' | 'middle-left' | 'middle-right' | 'right' | 'balanced'
  ): boolean {
    try {
      let result: number;

      switch (structure) {
        case 'left':
          // ((a op1 b) op2 c) op3 d
          result = this.applyOp(this.applyOp(this.applyOp(a, b, op1), c, op2), d, op3);
          break;
        case 'middle-left':
          // (a op1 (b op2 c)) op3 d
          result = this.applyOp(this.applyOp(a, this.applyOp(b, c, op2), op1), d, op3);
          break;
        case 'middle-right':
          // a op1 ((b op2 c) op3 d)
          result = this.applyOp(a, this.applyOp(this.applyOp(b, c, op2), d, op3), op1);
          break;
        case 'right':
          // a op1 (b op2 (c op3 d))
          result = this.applyOp(a, this.applyOp(b, this.applyOp(c, d, op3), op2), op1);
          break;
        case 'balanced':
          // (a op1 b) op2 (c op3 d)
          result = this.applyOp(this.applyOp(a, b, op1), this.applyOp(c, d, op3), op2);
          break;
        default:
          return false;
      }

      return Math.abs(result - this.TARGET) < this.EPSILON;
    } catch {
      return false;
    }
  }

  private static applyOp(a: number, b: number, op: Operation): number {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        if (Math.abs(b) < this.EPSILON) {
          throw new Error('Division by zero');
        }
        return a / b;
      default:
        throw new Error(`Invalid operator: ${op}`);
    }
  }

  private static getPermutations(arr: number[]): number[][] {
    if (arr.length <= 1) return [arr];
    
    const result: number[][] = [];
    
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const perms = this.getPermutations(remaining);
      
      for (const perm of perms) {
        result.push([current, ...perm]);
      }
    }
    
    return result;
  }

  static generateSolvableCards(): number[] {
    const maxAttempts = 1000;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const cards: number[] = [];
      
      // Generate 4 random cards between 1 and 10
      for (let i = 0; i < 4; i++) {
        cards.push(Math.floor(Math.random() * 10) + 1);
      }
      
      // Check if this combination has a solution
      if (this.hasSolution(cards)) {
        return cards;
      }
    }
    
    // Fallback to a known solvable combination
    return [6, 6, 6, 6]; // 6 + 6 + 6 + 6 = 24
  }
}