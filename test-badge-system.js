#!/usr/bin/env node

/**
 * Badge System Testing Script
 * 
 * This script tests all badge implementations by simulating game actions
 * and checking if badges are properly awarded.
 * 
 * Usage: node test-badge-system.js
 */

const io = require('socket.io-client');
const readline = require('readline');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3024';
const TEST_USER_PREFIX = 'BadgeTest_';

// Test state
let socket = null;
let currentRoom = null;
let playerId = null;
let playerName = null;

// Create readline interface for interactive testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper functions
function log(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

function generateTestUsername() {
  return TEST_USER_PREFIX + Math.random().toString(36).substr(2, 9);
}

// Socket connection
function connect() {
  log(`Connecting to ${SERVER_URL}...`);
  
  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true
  });

  // Socket event handlers
  socket.on('connect', () => {
    log('✓ Connected to server');
    showMenu();
  });

  socket.on('disconnect', () => {
    log('✗ Disconnected from server');
  });

  socket.on('error', (error) => {
    log(`Error: ${error}`);
  });

  socket.on('room-created', (data) => {
    log(`✓ Room created: ${data.room.id}`);
    currentRoom = data.room;
    playerId = data.playerId;
  });

  socket.on('game-started', (room) => {
    log('✓ Game started!');
    currentRoom = room;
    showGameMenu();
  });

  socket.on('round-started', (data) => {
    const cards = data.centerCards.map(c => c.value).join(', ');
    log(`\n🎯 Round ${data.round} started with cards: [${cards}]`);
    currentRoom.centerCards = data.centerCards;
  });

  socket.on('round-ended', (data) => {
    log(`Round ended. Winner: ${data.result.winnerId === playerId ? 'You!' : 'Opponent'}`);
  });

  socket.on('game-over', (data) => {
    log(`\n🏆 Game Over! Winner: ${data.winnerId === playerId ? 'You!' : 'Opponent'}`);
    currentRoom = null;
  });

  socket.on('badge-unlocked', (badges) => {
    log(`\n🎖️  BADGES UNLOCKED:`);
    badges.forEach(b => {
      log(`   - ${b.badge.name} (${b.badge.points} points)`);
      log(`     ${b.badge.description}`);
    });
  });
}

// Test functions
function createSoloPractice() {
  playerName = generateTestUsername();
  log(`Creating solo practice as ${playerName}...`);
  
  socket.emit('create-room', {
    playerName: playerName,
    roomType: 'classic',
    isSoloPractice: true
  });
}

function solveFast() {
  if (!currentRoom || !currentRoom.centerCards) {
    log('No active game or no cards dealt');
    return;
  }
  
  socket.emit('claim-solution', { roomId: currentRoom.id, playerId });
  
  setTimeout(() => {
    // Simple solution for speed
    const cards = currentRoom.centerCards;
    const solution = {
      cards: cards,
      operations: [
        { operator: '*', left: 6, right: 4, result: 24 }
      ],
      result: 24
    };
    
    socket.emit('submit-solution', {
      roomId: currentRoom.id,
      playerId,
      solution,
      solveTime: 0.5 // 500ms for sub-second solve
    });
    log('Submitted fast solution (0.5s) - Testing Quick Thinker badge');
  }, 100);
}

function solveWithAllOperations() {
  if (!currentRoom || !currentRoom.centerCards) {
    log('No active game or no cards dealt');
    return;
  }
  
  socket.emit('claim-solution', { roomId: currentRoom.id, playerId });
  
  setTimeout(() => {
    // Solution using all 4 operations
    const solution = {
      cards: currentRoom.centerCards,
      operations: [
        { operator: '+', left: 8, right: 2, result: 10 },
        { operator: '*', left: 10, right: 3, result: 30 },
        { operator: '/', left: 6, right: 1, result: 6 },
        { operator: '-', left: 30, right: 6, result: 24 }
      ],
      result: 24
    };
    
    socket.emit('submit-solution', {
      roomId: currentRoom.id,
      playerId,
      solution,
      solveTime: 2.0
    });
    log('Submitted solution with +, -, ×, ÷ - Testing Mathematical Genius badge');
  }, 100);
}

function solveMinimalOperations() {
  if (!currentRoom || !currentRoom.centerCards) {
    log('No active game or no cards dealt');
    return;
  }
  
  socket.emit('claim-solution', { roomId: currentRoom.id, playerId });
  
  setTimeout(() => {
    // Solution using only + and -
    const solution = {
      cards: currentRoom.centerCards,
      operations: [
        { operator: '+', left: 10, right: 10, result: 20 },
        { operator: '+', left: 20, right: 5, result: 25 },
        { operator: '-', left: 25, right: 1, result: 24 }
      ],
      result: 24
    };
    
    socket.emit('submit-solution', {
      roomId: currentRoom.id,
      playerId,
      solution,
      solveTime: 1.5
    });
    log('Submitted solution with only +/- - Testing Minimalist badge');
  }, 100);
}

function trackLanguageChange() {
  if (!playerId) {
    log('No player ID - create a game first');
    return;
  }
  
  // Track English
  socket.emit('track-language-usage', {
    userId: playerId,
    language: 'en'
  });
  log('Tracked English language usage');
  
  // Track Chinese after a delay
  setTimeout(() => {
    socket.emit('track-language-usage', {
      userId: playerId,
      language: 'zh'
    });
    log('Tracked Chinese language usage - Testing International Player badge');
  }, 1000);
}

// Menu system
function showMenu() {
  console.log('\n=== Badge Testing Menu ===');
  console.log('1. Create Solo Practice Room');
  console.log('2. Track Language Changes (International Player)');
  console.log('3. Exit');
  
  rl.question('\nSelect option: ', (answer) => {
    switch(answer) {
      case '1':
        createSoloPractice();
        break;
      case '2':
        trackLanguageChange();
        setTimeout(showMenu, 2000);
        break;
      case '3':
        process.exit(0);
        break;
      default:
        log('Invalid option');
        showMenu();
    }
  });
}

function showGameMenu() {
  console.log('\n=== In-Game Testing ===');
  console.log('1. Solve Fast (<1 second) - Quick Thinker');
  console.log('2. Solve with All Operations - Mathematical Genius');
  console.log('3. Solve with Only +/- - Minimalist');
  console.log('4. Skip Round');
  console.log('5. Return to Main Menu');
  
  rl.question('\nSelect option: ', (answer) => {
    switch(answer) {
      case '1':
        solveFast();
        break;
      case '2':
        solveWithAllOperations();
        break;
      case '3':
        solveMinimalOperations();
        break;
      case '4':
        log('Skipping round...');
        break;
      case '5':
        showMenu();
        break;
      default:
        log('Invalid option');
        showGameMenu();
    }
  });
}

// Start the test
console.log('=================================');
console.log('24 Points Badge System Tester');
console.log('=================================\n');
console.log('This tool helps test badge implementations.');
console.log('Make sure the server is running with the new badge tracking code.\n');

connect();