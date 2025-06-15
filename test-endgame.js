// Test script to simulate end game scenario
const io = require('socket.io-client');

const socket1 = io('http://localhost:3024');
const socket2 = io('http://localhost:3024');

let roomId = null;
let player1Id = null;
let player2Id = null;

socket1.on('connect', () => {
  console.log('Player 1 connected');
  socket1.emit('create-room', { playerName: 'Player1' });
});

socket1.on('room-created', (data) => {
  console.log('Room created:', data.roomId);
  roomId = data.roomId;
  player1Id = data.playerId;
  
  // Player 2 joins
  socket2.emit('join-room', { roomId, playerName: 'Player2' });
});

socket2.on('room-joined', (data) => {
  console.log('Player 2 joined room');
  player2Id = data.playerId;
  
  // Both players ready
  socket1.emit('toggle-ready');
  socket2.emit('toggle-ready');
});

socket1.on('game-started', () => {
  console.log('Game started!');
});

// Log all game state updates
socket1.on('game-state-updated', (state) => {
  console.log('P1 Game state:', {
    state: state.state,
    round: state.currentRound,
    p1Deck: state.players[0].deck.length,
    p2Deck: state.players[1].deck.length
  });
});

socket2.on('game-state-updated', (state) => {
  console.log('P2 Game state:', {
    state: state.state,
    round: state.currentRound,
    p1Deck: state.players[0].deck.length,
    p2Deck: state.players[1].deck.length
  });
});

// Log game over
socket1.on('game-over', (data) => {
  console.log('GAME OVER (P1):', data);
  process.exit(0);
});

socket2.on('game-over', (data) => {
  console.log('GAME OVER (P2):', data);
});

// Simulate playing rounds where Player 1 always wins
let roundCount = 0;
socket1.on('round-started', () => {
  roundCount++;
  console.log(`\n--- Round ${roundCount} started ---`);
  
  // Player 1 always claims and wins
  setTimeout(() => {
    console.log('Player 1 claiming solution...');
    socket1.emit('claim-solution');
  }, 1000);
});

socket1.on('solution-claimed', (data) => {
  if (data.playerId === player1Id) {
    console.log('Player 1 claimed, submitting correct solution...');
    setTimeout(() => {
      socket1.emit('submit-solution', {
        solution: {
          cards: [], // Server doesn't validate in test
          operations: [],
          result: 24 // Always correct
        }
      });
    }, 500);
  }
});

socket1.on('round-ended', (data) => {
  console.log('Round ended:', {
    winner: data.winnerId === player1Id ? 'Player1' : 'Player2',
    correct: data.correct
  });
});

// Error handling
socket1.on('error', (error) => console.error('P1 Error:', error));
socket2.on('error', (error) => console.error('P2 Error:', error));

// Cleanup on exit
process.on('SIGINT', () => {
  socket1.disconnect();
  socket2.disconnect();
  process.exit();
});