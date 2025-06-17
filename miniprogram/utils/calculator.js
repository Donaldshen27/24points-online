// 计算器工具类
class Calculator {
  // 计算单个运算
  static evaluate(left, operator, right) {
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
          throw new Error('除数不能为零');
        }
        return left / right;
      default:
        throw new Error(`无效的运算符: ${operator}`);
    }
  }

  // 验证解决方案是否等于24
  static validateSolution(cards, operations) {
    try {
      // 检查是否使用了4张牌和3个运算
      if (cards.length !== 4) {
        return { isValid: false, result: 0, error: '必须使用4张牌' };
      }
      
      if (operations.length !== 3) {
        return { isValid: false, result: 0, error: '必须有3个运算' };
      }

      // 验证每个运算
      for (const op of operations) {
        const result = Calculator.evaluate(op.left, op.operator, op.right);
        if (Math.abs(result - op.result) > 0.0001) {
          return { 
            isValid: false, 
            result: 0, 
            error: `运算 ${op.left} ${op.operator} ${op.right} 不等于 ${op.result}` 
          };
        }
      }

      // 检查最终结果是否为24
      const finalResult = operations[operations.length - 1].result;
      const isValid = Math.abs(finalResult - 24) < 0.0001;

      return {
        isValid,
        result: finalResult,
        error: isValid ? undefined : `结果是 ${finalResult}，不是 24`
      };
    } catch (error) {
      return {
        isValid: false,
        result: 0,
        error: error.message || '无效的解决方案'
      };
    }
  }

  // 格式化数字显示
  static formatNumber(num) {
    // 如果接近整数，显示为整数
    if (Math.abs(num - Math.round(num)) < 0.0001) {
      return Math.round(num).toString();
    }
    // 否则显示最多2位小数
    return num.toFixed(2).replace(/\.?0+$/, '');
  }

  // 创建运算对象
  static createOperation(left, operator, right) {
    const result = Calculator.evaluate(left, operator, right);
    return {
      operator,
      left,
      right,
      result
    };
  }

  // 验证运算是否有效
  static isValidOperation(left, operator, right) {
    try {
      if (operator === '/' || operator === '÷') {
        if (right === 0) return false;
        const result = left / right;
        if (!isFinite(result)) return false;
      }
      Calculator.evaluate(left, operator, right);
      return true;
    } catch {
      return false;
    }
  }

  // 获取两个数字的所有有效运算
  static getValidOperations(left, right) {
    const operators = ['+', '-', '×', '÷'];
    return operators.filter(op => Calculator.isValidOperation(left, op, right));
  }

  // 查找所有可能的解决方案
  static findAllSolutions(cards) {
    const solutions = [];
    const operators = ['+', '-', '*', '/'];

    // 生成所有排列
    const permutations = Calculator.getPermutations(cards);

    for (const perm of permutations) {
      // 尝试所有运算符组合
      for (const op1 of operators) {
        for (const op2 of operators) {
          for (const op3 of operators) {
            // 尝试不同的括号组合
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
                // 跳过无效表达式
              }
            }
          }
        }
      }
    }

    // 去重
    return [...new Set(solutions)];
  }

  // 计算表达式
  static evaluateExpression(expression) {
    // 移除空格
    expression = expression.replace(/\s/g, '');
    
    // 替换×和÷
    expression = expression.replace(/×/g, '*').replace(/÷/g, '/');
    
    // 安全计算
    try {
      // 验证表达式只包含允许的字符
      if (!/^[\d+\-*/().]+$/.test(expression)) {
        throw new Error('表达式包含无效字符');
      }
      
      // 使用Function构造函数计算
      const func = new Function('return ' + expression);
      return func();
    } catch (error) {
      throw new Error('无效的表达式');
    }
  }

  // 生成数组的所有排列
  static getPermutations(arr) {
    if (arr.length <= 1) return [arr];
    
    const result = [];
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

  // 检查是否有解决方案
  static hasSolution(cards) {
    return Calculator.findAllSolutions(cards).length > 0;
  }

  // 获取提示
  static getHint(cards) {
    const solutions = Calculator.findAllSolutions(cards);
    if (solutions.length === 0) {
      return null;
    }
    
    // 返回随机解决方案
    return solutions[Math.floor(Math.random() * solutions.length)];
  }

  // 查找解决方案的运算步骤
  static findSolutionOperations(cards) {
    if (cards.length !== 4) return null;
    
    const values = cards.map(c => c.value);
    const operators = ['+', '-', '*', '/'];
    
    // 尝试所有排列
    const permutations = Calculator.getPermutations(values);
    
    for (const perm of permutations) {
      const [a, b, c, d] = perm;
      
      // 尝试模式: ((a op1 b) op2 c) op3 d
      for (const op1 of operators) {
        for (const op2 of operators) {
          for (const op3 of operators) {
            try {
              const result1 = Calculator.evaluate(a, op1, b);
              const result2 = Calculator.evaluate(result1, op2, c);
              const result3 = Calculator.evaluate(result2, op3, d);
              
              if (Math.abs(result3 - 24) < 0.0001) {
                return [
                  { operator: op1, left: a, right: b, result: result1 },
                  { operator: op2, left: result1, right: c, result: result2 },
                  { operator: op3, left: result2, right: d, result: result3 }
                ];
              }
            } catch {
              // 继续尝试
            }
          }
        }
      }
      
      // 尝试模式: (a op1 b) op2 (c op3 d)
      for (const op1 of operators) {
        for (const op2 of operators) {
          for (const op3 of operators) {
            try {
              const result1 = Calculator.evaluate(a, op1, b);
              const result2 = Calculator.evaluate(c, op3, d);
              const result3 = Calculator.evaluate(result1, op2, result2);
              
              if (Math.abs(result3 - 24) < 0.0001) {
                return [
                  { operator: op1, left: a, right: b, result: result1 },
                  { operator: op3, left: c, right: d, result: result2 },
                  { operator: op2, left: result1, right: result2, result: result3 }
                ];
              }
            } catch {
              // 继续尝试
            }
          }
        }
      }
    }
    
    return null;
  }

  // 快速检查是否能组成24
  static canMake24(cards) {
    const operators = ['+', '-', '*', '/'];
    
    // 尝试一些常见模式
    for (const a of cards) {
      for (const b of cards) {
        if (a === b) continue;
        for (const c of cards) {
          if (c === a || c === b) continue;
          for (const d of cards) {
            if (d === a || d === b || d === c) continue;
            
            // 尝试 (a op b) op (c op d)
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
                    // 继续
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

module.exports = Calculator;