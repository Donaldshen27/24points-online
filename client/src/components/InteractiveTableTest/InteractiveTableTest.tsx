import React from 'react';
import { InteractiveCenterTable } from '../InteractiveCenterTable/InteractiveCenterTable';
import type { Card } from '../../types/game.types';
import './InteractiveTableTest.css';

export const InteractiveTableTest: React.FC = () => {
  // Create test cards
  const testCards: Card[] = [
    { id: 'card1', value: 6, owner: 'player1' },
    { id: 'card2', value: 4, owner: 'player1' },
    { id: 'card3', value: 8, owner: 'player2' },
    { id: 'card4', value: 3, owner: 'player2' }
  ];

  const handleSolutionFound = (expression: string, result: number) => {
    console.log('Solution found!', { expression, result });
    alert(`Solution: ${expression} = ${result}`);
  };

  return (
    <div className="interactive-table-test">
      <h1>Interactive Table Test</h1>
      <p>Test the card interaction flow. Try to make 24!</p>
      
      <InteractiveCenterTable
        cards={testCards}
        onSolutionFound={handleSolutionFound}
        disabled={false}
        allowInteraction={true}
      />
      
      <div className="test-info">
        <h3>Instructions:</h3>
        <ol>
          <li>Click on a card to select it (blue border)</li>
          <li>Click on another card to select it (pink border)</li>
          <li>Choose an operation from the menu</li>
          <li>Cards will merge into one with the result</li>
          <li>Continue until you have one card with value 24</li>
          <li>Use the Undo button if you make a mistake</li>
        </ol>
      </div>
    </div>
  );
};