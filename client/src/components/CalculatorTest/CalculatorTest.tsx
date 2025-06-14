import React, { useState } from 'react';
import { Calculator } from '../../utils/calculator';
import type { Card, Operation } from '../../types/game.types';
import { SolutionBuilder } from '../SolutionBuilder/SolutionBuilder';
import './CalculatorTest.css';

export const CalculatorTest: React.FC = () => {
  const [testCards] = useState<Card[]>([
    { id: '1', value: 3, owner: 'player1' },
    { id: '2', value: 8, owner: 'player1' },
    { id: '3', value: 8, owner: 'player2' },
    { id: '4', value: 3, owner: 'player2' }
  ]);
  
  const [showBuilder, setShowBuilder] = useState(false);
  const [result, setResult] = useState<string>('');
  const [customCards, setCustomCards] = useState<string>('3,8,8,3');

  const handleTestCalculation = () => {
    const values = testCards.map(c => c.value);
    const solutions = Calculator.findAllSolutions(values);
    
    if (solutions.length > 0) {
      setResult(`Found ${solutions.length} solutions!\nExample: ${solutions[0]}`);
    } else {
      setResult('No solutions found for these cards.');
    }
  };

  const handleCustomTest = () => {
    try {
      const values = customCards.split(',').map(v => parseInt(v.trim()));
      if (values.length !== 4 || values.some(v => isNaN(v) || v < 1 || v > 10)) {
        setResult('Please enter 4 valid numbers between 1 and 10');
        return;
      }
      
      const solutions = Calculator.findAllSolutions(values);
      if (solutions.length > 0) {
        setResult(`Found ${solutions.length} solutions!\nFirst 3 examples:\n${solutions.slice(0, 3).join('\n')}`);
      } else {
        setResult('No solutions found for these cards.');
      }
    } catch (error) {
      setResult('Invalid input format');
    }
  };

  const handleSolutionSubmit = (operations: Operation[]) => {
    const validation = Calculator.validateSolution(testCards, operations);
    if (validation.isValid) {
      setResult(`✓ Correct! Your solution equals ${validation.result}`);
    } else {
      setResult(`✗ ${validation.error}`);
    }
    setShowBuilder(false);
  };

  const testCases = [
    { cards: '1,2,3,4', solution: '(1+2+3)×4 = 24' },
    { cards: '2,3,4,5', solution: '(5-2)×3×4 = 24' },
    { cards: '3,3,8,8', solution: '8÷(3-8÷3) = 24' },
    { cards: '4,4,10,10', solution: '(10×10-4)÷4 = 24' },
    { cards: '1,5,5,5', solution: '5×(5-1÷5) = 24' }
  ];

  return (
    <div className="calculator-test">
      <h2>24-Point Calculator Test</h2>
      
      <div className="test-section">
        <h3>Test with Cards: {testCards.map(c => c.value).join(', ')}</h3>
        <div className="test-actions">
          <button onClick={handleTestCalculation}>Find Solutions</button>
          <button onClick={() => setShowBuilder(!showBuilder)}>
            {showBuilder ? 'Hide' : 'Show'} Solution Builder
          </button>
        </div>
      </div>

      {showBuilder && (
        <SolutionBuilder
          cards={testCards}
          onSubmit={handleSolutionSubmit}
          onCancel={() => setShowBuilder(false)}
        />
      )}

      <div className="test-section">
        <h3>Custom Test</h3>
        <div className="custom-input">
          <input
            type="text"
            value={customCards}
            onChange={(e) => setCustomCards(e.target.value)}
            placeholder="Enter 4 numbers (e.g., 3,8,8,3)"
          />
          <button onClick={handleCustomTest}>Test</button>
        </div>
      </div>

      <div className="test-section">
        <h3>Example Solutions</h3>
        <div className="examples">
          {testCases.map((test, index) => (
            <div key={index} className="example">
              <span className="cards">{test.cards}:</span>
              <span className="solution">{test.solution}</span>
            </div>
          ))}
        </div>
      </div>

      {result && (
        <div className="result-section">
          <h3>Result:</h3>
          <pre>{result}</pre>
        </div>
      )}

      <div className="test-section">
        <h3>Calculator Features</h3>
        <ul>
          <li>✓ Validates mathematical expressions</li>
          <li>✓ Checks if all 4 cards are used exactly once</li>
          <li>✓ Handles all arithmetic operations (+, -, ×, ÷)</li>
          <li>✓ Finds all possible solutions for a card set</li>
          <li>✓ Validates operation precedence</li>
          <li>✓ Provides hints when requested</li>
        </ul>
      </div>
    </div>
  );
};