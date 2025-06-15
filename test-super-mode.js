// Test script for Super Mode
const io = require('socket.io-client');

// Connect to server
const socket1 = io('http://localhost:3024');
const socket2 = io('http://localhost:3024');

let room1, room2;
let player1Id, player2Id;

socket1.on('connect', () => {
  console.log('Player 1 connected');
  
  // Get room types
  socket1.emit('get-room-types', (roomTypes) => {
    console.log('Available room types:', roomTypes.map(rt => rt.id));
    
    // Create a Super Mode room
    socket1.emit('create-room', { 
      playerName: 'Alice',
      roomType: 'super'
    });
  });
});

socket1.on('room-created', (data) => {
  console.log('Super Mode room created:', data.room);
  room1 = data.room;
  player1Id = data.playerId;
  
  // Player 2 joins
  socket2.emit('join-room', {
    roomId: room1.id,
    playerName: 'Bob'
  });
});

socket2.on('room-joined', (data) => {
  console.log('Player 2 joined Super Mode room');
  room2 = data.room;
  player2Id = data.playerId;
  
  // Both players ready up
  setTimeout(() => {
    socket1.emit('player-ready', { ready: true });
    socket2.emit('player-ready', { ready: true });
  }, 1000);
});

socket1.on('game-state-updated', (gameState) => {
  if (gameState.state === 'playing' && gameState.centerCards.length > 0) {
    console.log('\n=== SUPER MODE GAME STATE ===');
    console.log('Center cards count:', gameState.centerCards.length);
    console.log('Card values:', gameState.centerCards.map(c => c.value));
    console.log('Player 1 deck size:', gameState.myDeck.length);
    console.log('Player 2 deck size:', gameState.opponentDeck.length);
    
    // Try to claim solution after 2 seconds
    setTimeout(() => {
      console.log('\nPlayer 1 claiming solution...');
      socket1.emit('claim-solution');
    }, 2000);
  }
});

socket1.on('claim-accepted', () => {
  console.log('Claim accepted! Submitting solution...');
  
  // Submit a test solution (this might not be valid)
  const solution = {
    cards: room1.centerCards.slice(0, 4), // Use first 4 cards
    operations: [
      { operator: '+', left: 6, right: 6, result: 12 },
      { operator: '*', left: 12, right: 2, result: 24 }
    ],
    result: 24
  };
  
  socket1.emit('submit-solution', { solution });
});

socket1.on('submit-error', (error) => {
  console.log('Solution error:', error);
});

socket1.on('round-ended', (data) => {
  console.log('\nRound ended:', data);
  
  // Disconnect after first round
  setTimeout(() => {
    console.log('\nTest complete!');
    socket1.disconnect();
    socket2.disconnect();
    process.exit(0);
  }, 2000);
});

socket2.on('connect', () => {
  console.log('Player 2 connected');
});

// Error handling
socket1.on('error', console.error);
socket2.on('error', console.error);
socket1.on('room-creation-error', console.error);
socket2.on('join-room-error', console.error);