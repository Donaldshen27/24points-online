import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';
import './ELOTest.css';

interface TestPlayer {
  id: string;
  username: string;
  rating: number;
}

export function ELOTest() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<TestPlayer[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch test players
    socketService.emit('get-test-players', (data: { players: TestPlayer[] }) => {
      setPlayers(data.players);
    });
  }, []);

  const handleTestMatch = (isWin: boolean) => {
    if (!user || !selectedOpponent) {
      setTestResult('Please select an opponent');
      return;
    }

    setLoading(true);
    
    socketService.emit('test-elo-update', {
      player1Id: user.id,
      player2Id: selectedOpponent,
      winnerId: isWin ? user.id : selectedOpponent,
      gameMode: 'classic',
      finalScore: {
        [user.id]: isWin ? 5 : 0,
        [selectedOpponent]: isWin ? 0 : 5
      },
      roundsPlayed: 5,
      duration: 300000 // 5 minutes
    }, (response: { success: boolean; error?: string; newRatings?: any }) => {
      setLoading(false);
      
      if (response.success) {
        setTestResult(`ELO updated successfully! New ratings: 
          You: ${response.newRatings.player1.before} → ${response.newRatings.player1.after} (${response.newRatings.player1.change > 0 ? '+' : ''}${response.newRatings.player1.change})
          Opponent: ${response.newRatings.player2.before} → ${response.newRatings.player2.after} (${response.newRatings.player2.change > 0 ? '+' : ''}${response.newRatings.player2.change})`);
      } else {
        setTestResult(`Error: ${response.error}`);
      }
    });
  };

  const handleResetRatings = () => {
    if (!user || !selectedOpponent) {
      setTestResult('Please select an opponent to reset');
      return;
    }

    setLoading(true);
    
    socketService.emit('test-reset-ratings', {
      player1Id: user.id,
      player2Id: selectedOpponent,
      newRating: 1200
    }, (response: { success: boolean; error?: string; message?: string }) => {
      setLoading(false);
      
      if (response.success) {
        setTestResult(response.message || 'Ratings reset successfully to 1200!');
        // Refresh the player list to show updated ratings
        socketService.emit('get-test-players', (data: { players: TestPlayer[] }) => {
          setPlayers(data.players);
        });
      } else {
        setTestResult(`Error: ${response.error}`);
      }
    });
  };

  if (!user) {
    return (
      <div className="elo-test">
        <h2>ELO Test Mode</h2>
        <p>Please sign in to test ELO updates</p>
      </div>
    );
  }

  return (
    <div className="elo-test">
      <h2>ELO Test Mode</h2>
      
      <div className="test-info">
        <p>Current User: {user.username} (ID: {user.id})</p>
      </div>

      <div className="test-controls">
        <div className="opponent-selector">
          <label>Select Opponent:</label>
          <select 
            value={selectedOpponent} 
            onChange={(e) => setSelectedOpponent(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Select a player --</option>
            {players.filter(p => p.id !== user.id).map(player => (
              <option key={player.id} value={player.id}>
                {player.username} (Rating: {player.rating})
              </option>
            ))}
          </select>
        </div>

        <div className="test-actions">
          <button 
            onClick={() => handleTestMatch(true)} 
            disabled={loading || !selectedOpponent}
            className="win-button"
          >
            Simulate Win
          </button>
          <button 
            onClick={() => handleTestMatch(false)} 
            disabled={loading || !selectedOpponent}
            className="lose-button"
          >
            Simulate Loss
          </button>
          <button 
            onClick={handleResetRatings} 
            disabled={loading || !selectedOpponent}
            className="reset-button"
          >
            Reset Both to 1200
          </button>
        </div>

        {testResult && (
          <div className="test-result">
            <pre>{testResult}</pre>
          </div>
        )}
      </div>

      <div className="test-notes">
        <h3>Test Notes:</h3>
        <ul>
          <li>This simulates a ranked match result</li>
          <li>ELO changes are calculated based on player ratings</li>
          <li>Higher rated players gain less from wins against lower rated players</li>
          <li>K-factor is 32 for players under 30 games, 16 otherwise</li>
        </ul>
      </div>
    </div>
  );
}