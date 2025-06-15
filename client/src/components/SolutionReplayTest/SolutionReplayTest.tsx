import React, { useState } from 'react';
import { SolutionReplay } from '../SolutionReplay/SolutionReplay';
import type { Solution } from '../../types/game.types';

export const SolutionReplayTest: React.FC = () => {
  const [showReplay, setShowReplay] = useState(false);

  // Example solution: (5 - 1) * 3 * 2 = 4 * 3 * 2 = 12 * 2 = 24
  const testSolution: Solution = {
    cards: [
      { id: '1', value: 5, owner: 'player1' },
      { id: '2', value: 1, owner: 'player1' },
      { id: '3', value: 3, owner: 'player2' },
      { id: '4', value: 2, owner: 'player2' }
    ],
    operations: [
      { operator: '-', left: 5, right: 1, result: 4 },
      { operator: '*', left: 4, right: 3, result: 12 },
      { operator: '*', left: 12, right: 2, result: 24 }
    ],
    result: 24
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Solution Replay Test</h2>
      <button 
        onClick={() => setShowReplay(true)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Show Solution Replay
      </button>

      {showReplay && (
        <SolutionReplay
          solution={testSolution}
          onComplete={() => {
            console.log('Replay completed');
            setShowReplay(false);
          }}
          autoPlay={true}
          speed={1}
        />
      )}
    </div>
  );
};