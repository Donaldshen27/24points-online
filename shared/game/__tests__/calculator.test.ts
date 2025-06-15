import { Calculator, Expression } from '../calculator';

describe('Calculator', () => {
  describe('evaluate', () => {
    it('should evaluate simple expressions', () => {
      const expr: Expression = {
        left: 6,
        right: 4,
        operator: '*'
      };
      expect(Calculator.evaluate(expr)).toBe(24);
    });

    it('should evaluate nested expressions', () => {
      const expr: Expression = {
        left: {
          left: 8,
          right: 2,
          operator: '/'
        },
        right: 6,
        operator: '*'
      };
      expect(Calculator.evaluate(expr)).toBe(24);
    });

    it('should handle division by zero', () => {
      const expr: Expression = {
        left: 5,
        right: 0,
        operator: '/'
      };
      expect(() => Calculator.evaluate(expr)).toThrow('Division by zero');
    });
  });

  describe('isValidSolution', () => {
    it('should validate correct solution', () => {
      const cards = [3, 8, 8, 8];
      const expr: Expression = {
        left: 8,
        right: {
          left: 8,
          right: {
            left: 8,
            right: 3,
            operator: '-'
          },
          operator: '-'
        },
        operator: '/'
      };
      // 8 / (8 - 8 - 3) = 8 / (8 - 5) = 8 / 3 ≈ 2.67 (not 24)
      // Let's use a correct expression: 8 / (8 / 3) - 8 = 24
      const correctExpr: Expression = {
        left: {
          left: 8,
          right: {
            left: 8,
            right: 3,
            operator: '/'
          },
          operator: '/'
        },
        right: 8,
        operator: '-'
      };
      // Actually: 8 / (8 / 3) - 8 = 8 * 3/8 - 8 = 3 - 8 = -5 (not 24)
      // Let's use: (8 / (8 / 3)) * 8 = 3 * 8 = 24
      const actualExpr: Expression = {
        left: {
          left: 8,
          right: {
            left: 8,
            right: 3,
            operator: '/'
          },
          operator: '/'
        },
        right: 8,
        operator: '*'
      };
      expect(Calculator.isValidSolution(actualExpr, cards)).toBe(true);
    });

    it('should reject solution with wrong result', () => {
      const cards = [1, 2, 3, 4];
      const expr: Expression = {
        left: 1,
        right: 2,
        operator: '+'
      };
      expect(Calculator.isValidSolution(expr, cards)).toBe(false);
    });

    it('should reject solution not using all cards', () => {
      const cards = [6, 6, 6, 6];
      const expr: Expression = {
        left: 12,
        right: 12,
        operator: '+'
      };
      expect(Calculator.isValidSolution(expr, cards)).toBe(false);
    });
  });

  describe('hasSolution', () => {
    it('should find solution for solvable cards', () => {
      expect(Calculator.hasSolution([6, 6, 6, 6])).toBe(true); // 6 + 6 + 6 + 6 = 24
      expect(Calculator.hasSolution([8, 3, 8, 3])).toBe(true); // 8 / (3 - 8/3) = 24
      expect(Calculator.hasSolution([1, 2, 3, 4])).toBe(true); // 1 * 2 * 3 * 4 = 24
      expect(Calculator.hasSolution([2, 3, 4, 5])).toBe(true); // (5 + 3 - 2) * 4 = 24
    });

    it('should return false for unsolvable cards', () => {
      expect(Calculator.hasSolution([1, 1, 1, 1])).toBe(false);
      expect(Calculator.hasSolution([1, 1, 1, 2])).toBe(false);
    });

    it('should handle invalid input', () => {
      expect(Calculator.hasSolution([1, 2, 3])).toBe(false);
      expect(Calculator.hasSolution([1, 2, 3, 4, 5])).toBe(false);
    });
  });

  describe('generateSolvableCards', () => {
    it('should generate cards that have a solution', () => {
      for (let i = 0; i < 10; i++) {
        const cards = Calculator.generateSolvableCards();
        expect(cards).toHaveLength(4);
        expect(cards.every(card => card >= 1 && card <= 10)).toBe(true);
        expect(Calculator.hasSolution(cards)).toBe(true);
      }
    });
  });
});