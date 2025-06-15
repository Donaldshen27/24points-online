const io = require('socket.io-client');

const testSuperModeFix = async () => {
  // Connect two clients
  const client1 = io('http://localhost:3024');
  const client2 = io('http://localhost:3024');

  console.log('Connecting clients...');

  await new Promise(resolve => client1.on('connect', resolve));
  await new Promise(resolve => client2.on('connect', resolve));

  console.log('Both clients connected');

  // Create names and join room
  const roomId = 'test-room-' + Date.now();
  
  client1.emit('create-room', { roomId, playerName: 'Player1', roomType: 'super' });
  
  await new Promise(resolve => {
    client1.on('room-created', (data) => {
      console.log('Room created:', data);
      resolve();
    });
  });

  client2.emit('join-room', { roomId, playerName: 'Player2' });

  await new Promise(resolve => {
    client2.on('game-state-updated', (state) => {
      if (state.state === 'waiting') {
        resolve();
      }
    });
  });

  // Start game
  client1.emit('start-game');

  // Wait for round to start
  await new Promise(resolve => {
    client1.on('round-started', (data) => {
      console.log('Round started with cards:', data.centerCards.map(c => c.value));
      resolve();
    });
  });

  // Listen for game state updates to get player IDs
  let player1Id = null;
  let centerCards = [];
  
  await new Promise(resolve => {
    client1.on('game-state-updated', (state) => {
      if (state.state === 'playing') {
        player1Id = state.players.find(p => p.name === 'Player1').id;
        centerCards = state.centerCards;
        console.log('Got player1 ID:', player1Id);
        console.log('Center cards:', centerCards.map(c => `${c.value} (${c.id})`));
        resolve();
      }
    });
  });

  // Wait a bit for game to stabilize
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Example solution using 3 cards: (10 - 1) * 3 - 3 = 24
  // We'll pick specific cards from the center
  const usedCards = [
    centerCards.find(c => c.value === 10),
    centerCards.find(c => c.value === 1),
    centerCards.find(c => c.value === 3),
    centerCards.slice().reverse().find(c => c.value === 3) // Get second 3
  ].filter(Boolean);

  if (usedCards.length < 4) {
    console.log('Could not find required cards for test solution');
    process.exit(1);
  }

  console.log('Using cards:', usedCards.map(c => `${c.value} (${c.id})`));

  // Build operations: (10 - 1) * 3 - 3 = 24
  const operations = [
    {
      operator: '-',
      left: 10,
      right: 1,
      result: 9
    },
    {
      operator: '*',
      left: 9,
      right: 3,
      result: 27
    },
    {
      operator: '-',
      left: 27,
      right: 3,
      result: 24
    }
  ];

  // Player 1 claims and submits solution
  client1.emit('claim-solution');
  
  await new Promise(resolve => setTimeout(resolve, 100));

  const solution = {
    cards: usedCards,
    operations: operations,
    result: 24
  };

  console.log('Submitting solution:', solution);
  client1.emit('submit-solution', { solution });

  // Listen for round result
  await new Promise(resolve => {
    client1.on('round-ended', (data) => {
      console.log('\n=== ROUND ENDED ===');
      console.log('Winner:', data.winnerId === player1Id ? 'Player1' : 'Player2');
      console.log('Correct:', data.correct);
      console.log('Reason:', data.reason);
      resolve();
    });
  });

  // Cleanup
  client1.disconnect();
  client2.disconnect();
  
  console.log('\nTest completed!');
  process.exit(0);
};

testSuperModeFix().catch(console.error);