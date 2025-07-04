import { Server, Socket } from 'socket.io';
import roomManager from './RoomManager';
import { Solution, GameState } from '../types/game.types';
import { authService } from '../auth/authService';
import { badgeDetectionService } from '../badges/BadgeDetectionService';
import { statisticsService } from '../badges/StatisticsService';
import { setupRankedHandlers } from './rankedHandler';
import { registerMatchAnalyticsHandlers } from './handlers/matchAnalytics';
import { registerMatchReplayHandlers } from './handlers/matchReplay';

// Rate limiting for claims
const claimCooldowns = new Map<string, number>();
const CLAIM_COOLDOWN_MS = 100;

// Helper function to broadcast game state to spectators
function broadcastToSpectators(io: Server, roomId: string, event: string, data: any) {
  const spectatorRoomId = `spectators-${roomId}`;
  io.to(spectatorRoomId).emit(event, data);
}

export const handleConnection = (io: Server, socket: Socket) => {
  console.log('New client connected:', socket.id, 'Transport:', socket.conn.transport.name);
  
  // Log connection details
  socket.on('error', (error) => {
    console.error('Socket error for', socket.id, ':', error);
  });
  
  // Set io instance in RoomManager if not already set
  roomManager.setIo(io);
  
  // Set up ranked game handlers
  setupRankedHandlers(io, socket);
  
  // Set up match analytics handlers
  registerMatchAnalyticsHandlers(socket);
  
  // Set up match replay handlers
  registerMatchReplayHandlers(socket);

  socket.on('create-room', async (data: { playerName: string; roomType?: string; isSoloPractice?: boolean }) => {
    // For authenticated users, use their actual user ID for badge tracking
    let playerId: string;
    if ((socket as any).isAuthenticated && (socket as any).userId) {
      playerId = (socket as any).userId;
    } else {
      // Guest player - generate temporary ID
      playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    const roomType = data.roomType || 'classic';
    
    // Use authenticated username if available, otherwise validate guest name
    let playerName: string;
    console.log('[ConnectionHandler] Auth check:', {
      isAuthenticated: (socket as any).isAuthenticated,
      username: (socket as any).username,
      userId: (socket as any).userId,
      providedName: data.playerName
    });
    
    if ((socket as any).isAuthenticated && (socket as any).username) {
      playerName = (socket as any).username;
    } else {
      playerName = data.playerName;
      
      // Check if guest is trying to use a registered username
      if (!data.isSoloPractice) {
        const isRegistered = await authService.checkUsernameAvailability(playerName);
        if (isRegistered) {
          socket.emit('room-creation-error', { 
            message: 'This username is registered. Please sign in or choose a different name.' 
          });
          return;
        }
      }
    }
    
    console.log('[ConnectionHandler] Creating room:', {
      playerName,
      isAuthenticated: (socket as any).isAuthenticated,
      roomType,
      isSoloPractice: data.isSoloPractice,
      playerId,
      socketId: socket.id
    });
    
    try {
      const room = roomManager.createRoom(playerId, socket.id, playerName, roomType, data.isSoloPractice);
      
      socket.join(room.id);
      socket.emit('room-created', { 
        room: roomManager.getRoomInfo(room.id), 
        playerId 
      });
      
      console.log('[ConnectionHandler] Room created:', {
        roomId: room.id,
        players: room.players.length,
        isSoloPractice: room.isSoloPractice
      });
      
      // If solo practice mode, add a bot player immediately
      if (data.isSoloPractice) {
        console.log('[ConnectionHandler] Adding practice bot to room:', room.id);
        const botId = `bot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const botSocketId = `bot-socket-${Math.random().toString(36).substring(2, 9)}`;
        const botRoom = roomManager.joinRoom(room.id, botId, botSocketId, 'Practice Bot', false);
        
        if (botRoom) {
          console.log('[ConnectionHandler] Bot joined successfully:', {
            roomId: room.id,
            botId,
            players: botRoom.players.map(p => ({ id: p.id, name: p.name }))
          });
          
          // Notify the room about the bot joining
          io.to(room.id).emit('room-updated', roomManager.getRoomInfo(room.id));
          
          // Auto-ready the bot after a short delay
          setTimeout(() => {
            console.log('[ConnectionHandler] Auto-readying bot:', botId);
            roomManager.updatePlayerReady(room.id, botId, true);
            io.to(room.id).emit('room-updated', roomManager.getRoomInfo(room.id));
          }, 500);
        } else {
          console.error('[ConnectionHandler] Failed to add bot to room:', room.id);
        }
      }
      
      io.emit('rooms-updated', roomManager.getOpenRooms());
    } catch (error: any) {
      socket.emit('room-creation-error', { message: error.message });
    }
  });

  socket.on('join-room', async (data: { roomId: string; playerName: string; isSpectator?: boolean }) => {
    console.log('[Server] join-room received:', data);
    
    // Use authenticated username if available, otherwise validate guest name
    let playerName: string;
    console.log('[ConnectionHandler] Join room auth check:', {
      isAuthenticated: (socket as any).isAuthenticated,
      username: (socket as any).username,
      userId: (socket as any).userId,
      providedName: data.playerName,
      isSpectator: data.isSpectator
    });
    
    if ((socket as any).isAuthenticated && (socket as any).username) {
      playerName = (socket as any).username;
    } else {
      playerName = data.playerName;
      
      // Check if guest is trying to use a registered username (except for spectators)
      if (!data.isSpectator) {
        const isRegistered = await authService.checkUsernameAvailability(playerName);
        if (isRegistered) {
          socket.emit('join-room-error', { 
            message: 'This username is registered. Please sign in or choose a different name.' 
          });
          return;
        }
      }
    }
    
    // Check if this is a reconnection first
    const room = roomManager.getRoom(data.roomId);
    const existingPlayer = room?.players.find(p => !p.socketId && p.name === playerName);
    
    let playerId: string;
    if (existingPlayer) {
      // Reconnection - use existing player ID
      playerId = existingPlayer.id;
      console.log(`[ConnectionHandler] Reconnection detected for player ${playerName}`);
    } else {
      // For authenticated users, use their actual user ID for badge tracking
      if ((socket as any).isAuthenticated && (socket as any).userId) {
        playerId = (socket as any).userId;
      } else {
        // Guest player - generate temporary ID
        playerId = `${data.isSpectator ? 'spectator' : 'player'}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
    }
    
    const joinedRoom = roomManager.joinRoom(data.roomId, playerId, socket.id, playerName, data.isSpectator);
    
    if (!joinedRoom) {
      socket.emit('join-room-error', { message: 'Room not found or full' });
      return;
    }

    socket.join(data.roomId);
    
    // If spectator, also join the spectator-specific room
    if (data.isSpectator) {
      const spectatorRoomId = `spectators-${data.roomId}`;
      socket.join(spectatorRoomId);
      console.log(`[Server] Spectator ${socket.id} joined rooms: ${data.roomId} and ${spectatorRoomId}`);
    } else {
      console.log(`[Server] Socket ${socket.id} joined room ${data.roomId}`);
    }
    
    if (existingPlayer) {
      // Reconnection - send game state
      const playerState = roomManager.getGameStateForPlayer(data.roomId, playerId);
      socket.emit('reconnected-to-game', { room: playerState, playerId });
      
      // Also emit game-state-updated to ensure hooks are synced
      socket.emit('game-state-updated', playerState);
      
      // Notify other players
      socket.to(data.roomId).emit('player-reconnected', { 
        playerId: playerId,
        playerName: data.playerName 
      });
    } else {
      // New player or spectator
      if (data.isSpectator) {
        console.log('[Server] Emitting spectator-joined');
        
        // Get the full game state for spectator
        const gameState = roomManager.getGameState(data.roomId);
        console.log('[Server] Game state for spectator:', {
          hasGameState: !!gameState,
          state: gameState?.state,
          playerCount: gameState?.players?.length,
          centerCardsCount: gameState?.centerCards?.length
        });
        
        if (gameState) {
          socket.emit('spectator-joined', { room: gameState, playerId });
          
          // Send game-state-updated after a small delay to ensure event handlers are ready
          setTimeout(() => {
            console.log('[Server] Sending game-state-updated to spectator');
            socket.emit('game-state-updated', gameState);
          }, 100);
        } else {
          socket.emit('spectator-joined', { room: joinedRoom, playerId });
        }
      } else {
        console.log('[Server] Emitting room-joined for player');
        socket.emit('room-joined', { room: joinedRoom, playerId });
      }
    }
    
    io.to(data.roomId).emit('room-updated', joinedRoom);
    io.emit('rooms-updated', roomManager.getOpenRooms());
    
    // Update spectators
    broadcastToSpectators(io, data.roomId, 'spectator-room-updated', { room: joinedRoom });
  });

  socket.on('leave-room', () => {
    // Get the room and player info before leaving
    const currentRoom = roomManager.getRoomBySocketId(socket.id);
    const leavingPlayer = currentRoom?.players.find(p => p.socketId === socket.id);
    const roomId = currentRoom?.id;
    
    const isGameActive = currentRoom && (
      currentRoom.state === GameState.PLAYING || 
      currentRoom.state === GameState.SOLVING || 
      currentRoom.state === GameState.ROUND_END ||
      currentRoom.state === GameState.REPLAY
    );
    
    // Emit disconnect notification BEFORE leaving room
    if (roomId && currentRoom && leavingPlayer && isGameActive) {
      // Send to all players in room except the leaving one
      socket.to(roomId).emit('player-disconnected-active-game', { 
        playerId: leavingPlayer.id,
        playerName: leavingPlayer.name,
        timeoutSeconds: 30
      });
    }
    
    // Now leave the room
    const { room } = roomManager.leaveRoom(socket.id);
    
    if (roomId) {
      socket.leave(roomId);
      
      // If spectator, also leave spectator room
      const spectatorRoomId = `spectators-${roomId}`;
      socket.leave(spectatorRoomId);
      
      if (room) {
        io.to(roomId).emit('room-updated', room);
        if (!isGameActive) {
          io.to(roomId).emit('player-left', { socketId: socket.id });
        }
      }
      
      io.emit('rooms-updated', roomManager.getOpenRooms());
    }
  });

  socket.on('player-ready', (data: { isReady: boolean }) => {
    const currentRoom = roomManager.getRoomBySocketId(socket.id);
    if (!currentRoom) return;
    
    const player = currentRoom.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    const room = roomManager.updatePlayerReady(currentRoom.id, player.id, data.isReady);
    
    if (room) {
      io.to(room.id).emit('room-updated', room);
      
      if (roomManager.areAllPlayersReady(room.id) && room.players.length === 2) {
        io.to(room.id).emit('game-starting', { countdown: 3 });
        
        // Initialize game after countdown
        setTimeout(() => {
          if (roomManager.initializeGame(room.id) && roomManager.startGame(room.id)) {
            const gameState = roomManager.getGameState(room.id);
            if (gameState) {
              // Send personalized state to each player
              gameState.players.forEach(player => {
                const playerState = roomManager.getGameStateForPlayer(room.id, player.id);
                // Skip bot players (they don't have real socket connections)
                if (!player.id.startsWith('bot-')) {
                  console.log('[ConnectionHandler] Sending game-state-updated to player:', player.id);
                  console.log('[ConnectionHandler] Player state includes:', {
                    state: playerState.state,
                    currentRound: playerState.currentRound,
                    hasPuzzleStats: !!playerState.currentPuzzleStats,
                    puzzleStats: playerState.currentPuzzleStats
                  });
                  io.to(player.socketId).emit('game-state-updated', playerState);
                }
              });
              
              // Send full game state to spectators
              const spectatorRoomId = `spectators-${room.id}`;
              io.to(spectatorRoomId).emit('game-state-updated', gameState);
              
              io.to(room.id).emit('round-started', {
                round: gameState.currentRound,
                centerCards: gameState.centerCards
              });
              
              // Also send round-started to spectators
              io.to(spectatorRoomId).emit('round-started', {
                round: gameState.currentRound,
                centerCards: gameState.centerCards
              });
            }
          }
        }, 3000);
      }
    }
  });

  socket.on('get-rooms', () => {
    socket.emit('rooms-list', roomManager.getOpenRooms());
  });

  socket.on('get-all-rooms', () => {
    socket.emit('all-rooms-list', roomManager.getAllRooms().filter(room => !room.isSoloPractice));
  });

  socket.on('claim-solution', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    // Rate limit claim attempts
    const now = Date.now();
    const lastClaimTime = claimCooldowns.get(player.id) || 0;
    if (now - lastClaimTime < CLAIM_COOLDOWN_MS) {
      socket.emit('claim-error', { message: 'Too many claim attempts. Please wait.' });
      return;
    }
    claimCooldowns.set(player.id, now);

    if (roomManager.claimSolution(room.id, player.id)) {
      io.to(room.id).emit('solution-claimed', { playerId: player.id, playerName: player.name });
      
      // Update game state for all players
      const gameState = roomManager.getGameState(room.id);
      if (gameState) {
        gameState.players.forEach(p => {
          const playerState = roomManager.getGameStateForPlayer(room.id, p.id);
          io.to(p.socketId).emit('game-state-updated', playerState);
        });
        
        // Send full game state to spectators
        const spectatorRoomId = `spectators-${room.id}`;
        io.to(spectatorRoomId).emit('game-state-updated', gameState);
      }
    } else {
      socket.emit('claim-error', { message: 'Cannot claim solution at this time' });
    }
  });

  socket.on('submit-solution', async (data: { solution: Solution }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    if (await roomManager.submitSolution(room.id, player.id, data.solution)) {
      const gameState = roomManager.getGameState(room.id);
      if (!gameState) return;

      // Get the round result which includes solve time
      const roundResult = roomManager.getLastRoundResult(room.id);
      if (!roundResult) return;

      // Determine round result
      const isCorrect = data.solution.result === 24;
      const winnerId = isCorrect ? player.id : room.players.find(p => p.id !== player.id)?.id || null;
      const loserId = isCorrect ? room.players.find(p => p.id !== player.id)?.id || null : player.id;
      
      // Emit round result with proper reason and solve time
      io.to(room.id).emit('round-ended', {
        winnerId,
        loserId,
        solution: data.solution,
        correct: isCorrect,
        reason: isCorrect ? 'correct_solution' : 'incorrect_solution',
        solveTime: roundResult.solveTime
      });
      
      // Also send round-ended to spectators
      broadcastToSpectators(io, room.id, 'round-ended', {
        winnerId,
        loserId,
        solution: data.solution,
        correct: isCorrect,
        reason: isCorrect ? 'correct_solution' : 'incorrect_solution',
        solveTime: roundResult.solveTime
      });

      // Update game state for all players
      setTimeout(async () => {
        const currentState = roomManager.getGameState(room.id);
        if (currentState) {
          // Always emit the updated game state first
          currentState.players.forEach(p => {
            const playerState = roomManager.getGameStateForPlayer(room.id, p.id);
            io.to(p.socketId).emit('game-state-updated', playerState);
          });
          
          // Send full game state to spectators
          const spectatorRoomId = `spectators-${room.id}`;
          io.to(spectatorRoomId).emit('game-state-updated', currentState);
          
          // Check for badges after each round in solo practice
          if (room.isSoloPractice && isCorrect) {
            const humanPlayer = room.players.find(p => !p.isAI);
            if (humanPlayer) {
              // Initialize stats if needed
              await statisticsService.initializeUserStats(humanPlayer.id, humanPlayer.name);
              
              // Check for new badges
              const newBadges = await badgeDetectionService.checkBadgesAfterGame(humanPlayer.id);
              
              // Notify player of new badges
              if (newBadges.length > 0) {
                io.to(humanPlayer.socketId).emit('badges-unlocked', newBadges);
              }
            }
          }

          if (currentState.state === 'game_over') {
            // Get the game over result from the game manager
            const gameOverResult = roomManager.getGameOverResult(room.id);
            
            if (gameOverResult) {
              const gameOverData = {
                winnerId: gameOverResult.winnerId,
                reason: gameOverResult.reason,
                scores: gameOverResult.finalScores,
                finalDecks: gameOverResult.finalDecks
              };
              
              io.to(room.id).emit('game-over', gameOverData);
              
              // Also send game-over to spectators
              const spectatorRoomId = `spectators-${room.id}`;
              io.to(spectatorRoomId).emit('game-over', gameOverData);
              
              // Check for new badges after game
              if (gameOverResult) {
                const players = currentState.players;
                
                // In solo practice, only check badges for the human player
                const playersToCheck = room.isSoloPractice 
                  ? players.filter(p => !p.isAI)
                  : players;
                
                for (const player of playersToCheck) {
                  // Initialize stats if needed
                  await statisticsService.initializeUserStats(player.id, player.name);
                  
                  // Check for new badges
                  const newBadges = await badgeDetectionService.checkBadgesAfterGame(player.id);
                  
                  // Notify player of new badges
                  if (newBadges.length > 0) {
                    io.to(player.socketId).emit('badges-unlocked', newBadges);
                  }
                }
              }
            } else {
              // Fallback to old logic if no game over result
              const player1 = currentState.players[0];
              const player2 = currentState.players[1];
              let gameWinnerId: string;
              
              if (player1.deck.length === 0) {
                gameWinnerId = player1.id;
              } else if (player2.deck.length === 0) {
                gameWinnerId = player2.id;
              } else if (player1.deck.length === 20) {
                gameWinnerId = player2.id;
              } else {
                gameWinnerId = player1.id;
              }
              
              const gameOverData = {
                winnerId: gameWinnerId,
                scores: currentState.scores,
                finalDecks: {
                  [player1.id]: player1.deck.length,
                  [player2.id]: player2.deck.length
                }
              };
              
              io.to(room.id).emit('game-over', gameOverData);
              
              // Also send game-over to spectators
              const spectatorRoomId = `spectators-${room.id}`;
              io.to(spectatorRoomId).emit('game-over', gameOverData);
              
              // Check for new badges after game
              if (gameOverResult) {
                const players = currentState.players;
                
                // In solo practice, only check badges for the human player
                const playersToCheck = room.isSoloPractice 
                  ? players.filter(p => !p.isAI)
                  : players;
                
                for (const player of playersToCheck) {
                  // Initialize stats if needed
                  await statisticsService.initializeUserStats(player.id, player.name);
                  
                  // Check for new badges
                  const newBadges = await badgeDetectionService.checkBadgesAfterGame(player.id);
                  
                  // Notify player of new badges
                  if (newBadges.length > 0) {
                    io.to(player.socketId).emit('badges-unlocked', newBadges);
                  }
                }
              }
            }
          } else {
            currentState.players.forEach(p => {
              const playerState = roomManager.getGameStateForPlayer(room.id, p.id);
              io.to(p.socketId).emit('game-state-updated', playerState);
            });
            
            // Send full game state to spectators for new round
            const spectatorRoomId = `spectators-${room.id}`;
            io.to(spectatorRoomId).emit('game-state-updated', currentState);
            
            io.to(room.id).emit('round-started', {
              round: currentState.currentRound,
              centerCards: currentState.centerCards
            });
            
            // Also send round-started to spectators
            io.to(spectatorRoomId).emit('round-started', {
              round: currentState.currentRound,
              centerCards: currentState.centerCards
            });
          }
        }
      }, 3000);
    } else {
      socket.emit('submit-error', { message: 'Failed to submit solution' });
    }
  });

  socket.on('request-hint', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const gameState = roomManager.getGameState(room.id);
    if (!gameState || gameState.state !== 'playing') return;

    // This is where we could use the Calculator.getHint method
    // For now, just acknowledge the request
    socket.emit('hint-response', { message: 'Hint system not yet implemented' });
  });

  socket.on('skip-replay', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    const bothSkipped = roomManager.requestSkipReplay(room.id, player.id);
    
    if (bothSkipped) {
      // Both players skipped, notify them
      io.to(room.id).emit('replay-skipped');
      
      // Give the game state manager time to transition and start new round
      setTimeout(() => {
        const gameState = roomManager.getGameState(room.id);
        if (gameState) {
          // Send updated game state
          gameState.players.forEach(p => {
            const playerState = roomManager.getGameStateForPlayer(room.id, p.id);
            io.to(p.socketId).emit('game-state-updated', playerState);
          });
          
          // Update spectators
          broadcastToSpectators(io, room.id, 'spectator-room-updated', { room: gameState });
          
          // If we're in playing state, announce the new round
          if (gameState.state === 'playing') {
            io.to(room.id).emit('round-started', {
              round: gameState.currentRound,
              centerCards: gameState.centerCards
            });
            
            // Also to spectators
            broadcastToSpectators(io, room.id, 'round-started', {
              round: gameState.currentRound,
              centerCards: gameState.centerCards
            });
          }
        }
      }, 600);
    } else {
      // Notify others that this player wants to skip
      socket.to(room.id).emit('player-wants-skip', { playerId: player.id });
    }
  });

  socket.on('reset-game', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    if (roomManager.resetGame(room.id)) {
      const gameState = roomManager.getGameState(room.id);
      if (gameState) {
        io.to(room.id).emit('game-reset', gameState);
      }
    }
  });

  socket.on('request-rematch', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room || room.state !== GameState.GAME_OVER) return;

    // Prevent rematch in ranked games
    if (room.isRanked) {
      socket.emit('rematch-error', { message: 'Rematch is not allowed in ranked games' });
      return;
    }

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    // Track rematch request
    if (!room.rematchRequests) {
      room.rematchRequests = new Set();
    }
    
    room.rematchRequests.add(player.id);
    
    // Notify other player
    const otherPlayer = room.players.find(p => p.id !== player.id);
    if (otherPlayer) {
      io.to(otherPlayer.socketId).emit('opponent-wants-rematch', { playerId: player.id });
    }

    // Check if both players want rematch
    if (room.rematchRequests.size === 2) {
      // Reset game
      room.rematchRequests.clear();
      if (roomManager.resetGame(room.id)) {
        const gameState = roomManager.getGameState(room.id);
        if (gameState) {
          io.to(room.id).emit('game-reset', gameState);
          io.to(room.id).emit('rematch-started');
        }
      }
    }
  });

  socket.on('reconnect-to-game', (data: { roomId: string; playerId: string }) => {
    const room = roomManager.getRoom(data.roomId);
    if (!room) {
      socket.emit('reconnect-error', { message: 'Room not found' });
      return;
    }

    const player = room.players.find(p => p.id === data.playerId);
    if (!player) {
      socket.emit('reconnect-error', { message: 'Player not found in room' });
      return;
    }

    // Handle reconnection
    if (roomManager.handleReconnect(data.roomId, data.playerId, socket.id)) {
      socket.join(data.roomId);
      
      // Send current game state to reconnected player
      const playerState = roomManager.getGameStateForPlayer(data.roomId, data.playerId);
      socket.emit('reconnected-to-game', { 
        room: playerState,
        playerId: data.playerId 
      });
      
      // Notify other players
      socket.to(data.roomId).emit('player-reconnected', { 
        playerId: data.playerId,
        playerName: player.name 
      });
    } else {
      socket.emit('reconnect-error', { message: 'Failed to reconnect' });
    }
  });

  socket.on('get-room-types', (callback) => {
    const { ROOM_TYPE_CONFIGS } = require('../config/roomTypes');
    const roomTypes = Object.values(ROOM_TYPE_CONFIGS).map((config: any) => ({
      id: config.id,
      displayName: config.displayName,
      description: config.description,
      playerCount: config.playerCount,
      teamBased: config.teamBased,
      features: config.features
    }));
    
    callback(roomTypes);
  });

  socket.on('get-game-count', (callback) => {
    const count = roomManager.getTotalGamesPlayed();
    callback({ count });
  });

  socket.on('get-online-users', (callback) => {
    const count = io.engine.clientsCount || 0;
    callback({ count });
  });

  socket.on('get-puzzle-records', async (callback) => {
    try {
      const { getAllPuzzles } = require('../models/puzzleRepository');
      const allPuzzles = await getAllPuzzles();
      
      // Transform data for client
      const records = allPuzzles.map(puzzle => {
        const { solveRecords } = require('../models/puzzleRepository');
        const records = solveRecords.get(puzzle.puzzleKey) || [];
        const bestRecord = records[0]; // Already sorted by time
        
        return {
          puzzleKey: puzzle.puzzleKey,
          cards: puzzle.puzzleKey.split(',').map(Number),
          occurrenceCount: puzzle.occurrenceCount,
          bestRecord: bestRecord ? {
            username: bestRecord.username,
            solveTimeMs: bestRecord.solveTimeMs,
            solution: bestRecord.solution
          } : undefined
        };
      });
      
      callback({ records });
    } catch (error) {
      console.error('Error fetching puzzle records:', error);
      callback({ records: [] });
    }
  });

  socket.on('get-leaderboard-data', async (callback) => {
    try {
      const { getAllPuzzles, solveRecords } = require('../models/puzzleRepository');
      const { supabase, isDatabaseConfigured } = require('../db/supabase');
      
      let recordHoldings: { 
        username: string; 
        recordCount: number; 
        rank: number;
        badgeCount?: number;
        badgePoints?: number;
        level?: number;
        legendaryBadges?: number;
        epicBadges?: number;
        rareBadges?: number;
      }[] = [];
      let totalPuzzles = 0;
      
      if (isDatabaseConfigured() && supabase) {
        // Use efficient SQL query for database
        const { data, error } = await supabase.rpc('get_record_holdings');
        
        if (!error && data) {
          recordHoldings = data.map((entry: any, index: number) => ({
            username: entry.username,
            recordCount: entry.record_count,
            rank: index + 1
          }));
        } else {
          // Fallback query if RPC function doesn't exist
          const { data: recordsData, error: recordsError } = await supabase
            .from('solve_records')
            .select('puzzle_key, username, solve_time_ms')
            .order('puzzle_key')
            .order('solve_time_ms');
          
          if (!recordsError && recordsData) {
            // Process to find best record per puzzle
            const bestRecordsByPuzzle = new Map<string, string>();
            let currentPuzzle = '';
            
            recordsData.forEach(record => {
              if (record.puzzle_key !== currentPuzzle) {
                currentPuzzle = record.puzzle_key;
                bestRecordsByPuzzle.set(record.puzzle_key, record.username);
              }
            });
            
            // Count records per username
            const recordCounts = new Map<string, number>();
            bestRecordsByPuzzle.forEach(username => {
              recordCounts.set(username, (recordCounts.get(username) || 0) + 1);
            });
            
            // Convert to sorted array
            recordHoldings = Array.from(recordCounts.entries())
              .map(([username, count]) => ({ username, recordCount: count, rank: 0 }))
              .sort((a, b) => b.recordCount - a.recordCount)
              .map((entry, index) => ({ ...entry, rank: index + 1 }));
          }
        }
        
        // Get total puzzles count
        const { count } = await supabase
          .from('puzzles')
          .select('*', { count: 'exact', head: true });
        totalPuzzles = count || 0;
        
      } else {
        // In-memory fallback
        const allPuzzles = await getAllPuzzles();
        totalPuzzles = allPuzzles.length;
        
        // Count records per username
        const recordCounts = new Map<string, number>();
        
        allPuzzles.forEach(puzzle => {
          const records = solveRecords.get(puzzle.puzzleKey) || [];
          if (records.length > 0) {
            const bestRecord = records[0]; // Already sorted by time
            recordCounts.set(bestRecord.username, (recordCounts.get(bestRecord.username) || 0) + 1);
          }
        });
        
        // Convert to sorted array
        recordHoldings = Array.from(recordCounts.entries())
          .map(([username, count]) => ({ username, recordCount: count, rank: 0 }))
          .sort((a, b) => b.recordCount - a.recordCount)
          .map((entry, index) => ({ ...entry, rank: index + 1 }));
      }
      
      // Fetch badge statistics for leaderboard users if database is configured
      if (isDatabaseConfigured() && supabase && recordHoldings.length > 0) {
        try {
          // Get all usernames from the leaderboard
          const usernames = recordHoldings.slice(0, 100).map(entry => entry.username);
          
          // First, get user IDs for these usernames
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, username')
            .in('username', usernames);
          
          if (!userError && userData && userData.length > 0) {
            console.log(`[Badge Leaderboard] Found ${userData.length} users with usernames`);
            
            // Create username to user_id mapping
            const usernameToId = new Map<string, string>();
            userData.forEach(user => {
              usernameToId.set(user.username, user.id);
            });
            
            // Get user IDs for badge query
            const userIds = userData.map(user => user.id);
            
            // Fetch badge data for all users
            const { data: badgeData, error: badgeError } = await supabase
              .from('user_badges')
              .select('*')
              .in('user_id', userIds);
          
          if (!badgeError && badgeData) {
            console.log(`[Badge Leaderboard] Found ${badgeData.length} badge records`);
            
            // Count badges by user and rarity
            const badgeStats = new Map<string, {
              badgeCount: number;
              badgePoints: number;
              legendaryBadges: number;
              epicBadges: number;
              rareBadges: number;
            }>();
            
            // Initialize stats only for users that exist in the database
            userData.forEach(user => {
              badgeStats.set(user.username, {
                badgeCount: 0,
                badgePoints: 0,
                legendaryBadges: 0,
                epicBadges: 0,
                rareBadges: 0
              });
            });
            
            // Process badge data
            for (const userBadge of badgeData) {
              // Find username for this user_id
              let username: string | null = null;
              for (const [uname, uid] of usernameToId.entries()) {
                if (uid === userBadge.user_id) {
                  username = uname;
                  break;
                }
              }
              
              const stats = username ? badgeStats.get(username) : null;
              if (stats) {
                stats.badgeCount++;
                
                // Get badge definition to calculate points and rarity
                const { getBadgeById } = require('../badges/badgeDefinitions');
                const badge = getBadgeById(userBadge.badge_id);
                if (badge) {
                  stats.badgePoints += badge.points * (userBadge.tier || 1);
                  
                  // Count by rarity
                  switch (badge.rarity) {
                    case 'legendary':
                      stats.legendaryBadges++;
                      break;
                    case 'epic':
                      stats.epicBadges++;
                      break;
                    case 'rare':
                      stats.rareBadges++;
                      break;
                  }
                }
              }
            }
            
            // Merge badge stats with record holdings
            recordHoldings = recordHoldings.map(entry => {
              const stats = badgeStats.get(entry.username);
              if (stats) {
                const level = Math.floor(stats.badgePoints / 100) + 1;
                // Only log if user has badges
                if (stats.badgeCount > 0) {
                  console.log(`[Badge Stats] ${entry.username}: points=${stats.badgePoints}, level=${level}, badges=${stats.badgeCount}`);
                }
                return {
                  ...entry,
                  ...stats,
                  level
                };
              }
              // User not in database, don't add badge stats
              return entry;
            });
          }
          } // Close the userData check
        } catch (error) {
          console.error('Error fetching badge statistics for leaderboard:', error);
          // Continue without badge data
        }
      }
      
      callback({
        recordHoldings: recordHoldings.slice(0, 100), // Top 100 players
        totalPuzzles
      });
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      callback({ recordHoldings: [], totalPuzzles: 0 });
    }
  });

  // Badge system handlers
  socket.on('get-user-badges', async (data: { userId: string }, callback: (badges: any) => void) => {
    try {
      const result = await badgeDetectionService.getUserBadges(data.userId);
      callback(result);
    } catch (error) {
      console.error('Error fetching user badges:', error);
      callback({ success: false, badges: [], inProgress: [], totalPoints: 0, level: 1 });
    }
  });

  socket.on('get-user-statistics', async (data: { userId: string }, callback: (stats: any) => void) => {
    try {
      const stats = await statisticsService.getUserStats(data.userId);
      callback(stats);
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      callback(null);
    }
  });

  socket.on('track-special-badge-event', async (data: { userId: string; eventType: string; eventData?: any }) => {
    try {
      const newBadges = await badgeDetectionService.trackSpecialEvent(
        data.userId,
        data.eventType,
        data.eventData
      );
      
      if (newBadges.length > 0) {
        socket.emit('badges-unlocked', newBadges);
      }
    } catch (error) {
      console.error('Error tracking special badge event:', error);
    }
  });

  socket.on('update-featured-badges', async (data: { userId: string; badgeIds: string[] }, callback: (response: any) => void) => {
    try {
      // Validate that user is updating their own badges
      const socketUserId = (socket as any).userId;
      console.log('[Featured Badges] Update request - socketUserId:', socketUserId, 'targetUserId:', data.userId);
      
      // For authenticated users, verify they're updating their own badges
      if ((socket as any).isAuthenticated) {
        if (socketUserId !== data.userId) {
          console.log('[Featured Badges] Unauthorized - user trying to update another user\'s badges');
          callback({ success: false, error: 'Unauthorized' });
          return;
        }
      } else {
        // For guest users, allow updates if they have a consistent userId
        if (!data.userId) {
          console.log('[Featured Badges] No userId provided');
          callback({ success: false, error: 'User ID required' });
          return;
        }
      }

      // Update featured badges (limit to 5)
      const featuredBadgeIds = data.badgeIds.slice(0, 5);
      const success = await badgeDetectionService.updateFeaturedBadges(data.userId, featuredBadgeIds);
      
      callback({ success });
    } catch (error) {
      console.error('Error updating featured badges:', error);
      callback({ success: false, error: 'Failed to update featured badges' });
    }
  });

  // ELO Test handlers
  socket.on('get-test-players', async (callback: (data: { players: any[] }) => void) => {
    try {
      const { supabase, isDatabaseConfigured } = require('../db/supabase');
      
      if (!isDatabaseConfigured() || !supabase) {
        console.log('[get-test-players] Database not configured');
        callback({ players: [] });
        return;
      }
      
      // Try both 'users' and 'players' tables to see which one exists
      let players: any[] = [];
      
      // First try the 'players' table
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, username, rating')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!playersError && playersData) {
        console.log('[get-test-players] Found players in "players" table:', playersData.length);
        players = playersData;
      } else {
        // If that fails, try the 'users' table (without rating column)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!usersError && usersData) {
          console.log('[get-test-players] Found players in "users" table:', usersData.length);
          // Add default rating of 1000 to each user
          players = usersData.map(user => ({
            ...user,
            rating: 1000
          }));
        } else {
          console.error('[get-test-players] Error fetching from both tables:', {
            playersError,
            usersError
          });
        }
      }
      
      // Make sure our test user is in the list
      const testUserId = '594e1ba2-d563-4cdf-8f1f-16ea3604ac2d';
      const hasTestUser = players.some(p => p.id === testUserId);
      
      if (!hasTestUser) {
        // Add a mock test user if not found
        players.unshift({
          id: testUserId,
          username: 'Test User',
          rating: 1000
        });
      }
      
      console.log('[get-test-players] Returning players:', players);
      callback({ players });
    } catch (error) {
      console.error('Error in get-test-players:', error);
      callback({ players: [] });
    }
  });

  socket.on('test-elo-update', async (data: {
    player1Id: string;
    player2Id: string;
    winnerId: string;
    gameMode: string;
    finalScore: any;
    roundsPlayed: number;
    duration: number;
  }, callback: (response: any) => void) => {
    try {
      console.log('[test-elo-update] Received data:', data);
      
      // Validate required fields
      if (!data.player1Id || !data.player2Id || !data.winnerId) {
        callback({ 
          success: false, 
          error: `Missing required player IDs. Got: player1Id=${data.player1Id}, player2Id=${data.player2Id}, winnerId=${data.winnerId}` 
        });
        return;
      }
      
      // Check if user is authenticated
      if (!(socket as any).isAuthenticated) {
        callback({ success: false, error: 'Authentication required' });
        return;
      }
      
      const { RatingService } = require('../services/RatingService');
      const ratingService = new RatingService();
      
      // Determine winner and loser
      const loserId = data.winnerId === data.player1Id ? data.player2Id : data.player1Id;
      
      // Calculate rounds won by each player
      const winnerScore = data.finalScore[data.winnerId] || 0;
      const loserScore = data.finalScore[loserId] || 0;
      
      // Update ratings using the correct method signature
      const result = await ratingService.updateRatingsAfterMatch(
        data.winnerId,
        loserId,
        data.gameMode as 'classic' | 'super' | 'extended',
        {
          duration: Math.floor(data.duration / 1000), // Convert to seconds
          roundsPlayed: data.roundsPlayed,
          winnerRoundsWon: winnerScore,
          loserRoundsWon: loserScore
        }
      );
      
      console.log('[test-elo-update] Result:', JSON.stringify(result, null, 2));
      
      // Format the response - map winner/loser back to player1/player2
      const player1IsWinner = data.player1Id === data.winnerId;
      
      callback({
        success: true,
        newRatings: {
          player1: player1IsWinner ? {
            before: result.winnerUpdate.oldRating,
            after: result.winnerUpdate.newRating,
            change: result.winnerUpdate.ratingChange
          } : {
            before: result.loserUpdate.oldRating,
            after: result.loserUpdate.newRating,
            change: result.loserUpdate.ratingChange
          },
          player2: player1IsWinner ? {
            before: result.loserUpdate.oldRating,
            after: result.loserUpdate.newRating,
            change: result.loserUpdate.ratingChange
          } : {
            before: result.winnerUpdate.oldRating,
            after: result.winnerUpdate.newRating,
            change: result.winnerUpdate.ratingChange
          }
        }
      });
    } catch (error) {
      console.error('Error in test-elo-update:', error);
      callback({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  socket.on('test-reset-ratings', async (data: {
    player1Id: string;
    player2Id: string;
    newRating: number;
  }, callback: (response: any) => void) => {
    try {
      console.log('[test-reset-ratings] Received data:', data);
      
      // Check if user is authenticated
      if (!(socket as any).isAuthenticated) {
        callback({ success: false, error: 'Authentication required' });
        return;
      }
      
      const { supabase, isDatabaseConfigured } = require('../db/supabase');
      
      if (!isDatabaseConfigured() || !supabase) {
        callback({ success: false, error: 'Database not configured' });
        return;
      }
      
      // Reset both players' ratings
      const resetRating = data.newRating || 1200;
      
      // Update player_ratings table for both players
      const updates = await Promise.all([
        supabase
          .from('player_ratings')
          .update({ 
            current_rating: resetRating,
            peak_rating: resetRating,
            games_played: 0,
            wins: 0,
            losses: 0,
            win_streak: 0,
            loss_streak: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', data.player1Id),
        supabase
          .from('player_ratings')
          .update({ 
            current_rating: resetRating,
            peak_rating: resetRating,
            games_played: 0,
            wins: 0,
            losses: 0,
            win_streak: 0,
            loss_streak: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', data.player2Id)
      ]);
      
      // Check for errors
      const errors = updates.filter(result => result.error);
      if (errors.length > 0) {
        console.error('[test-reset-ratings] Errors:', errors);
        callback({ 
          success: false, 
          error: 'Failed to reset one or more ratings' 
        });
        return;
      }
      
      callback({ 
        success: true, 
        message: `Both players' ratings have been reset to ${resetRating}!` 
      });
      
    } catch (error) {
      console.error('Error in test-reset-ratings:', error);
      callback({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Get the room and player info before leaving
    const currentRoom = roomManager.getRoomBySocketId(socket.id);
    const disconnectedPlayer = currentRoom?.players.find(p => p.socketId === socket.id);
    const roomId = currentRoom?.id;
    
    const isGameActive = currentRoom && (
      currentRoom.state === GameState.PLAYING || 
      currentRoom.state === GameState.SOLVING || 
      currentRoom.state === GameState.ROUND_END ||
      currentRoom.state === GameState.REPLAY
    );
    
    // Emit disconnect notification BEFORE leaving room so other players get notified
    if (roomId && currentRoom && disconnectedPlayer) {
      // If game is active, notify about disconnect with auto-forfeit timer
      if (isGameActive) {
        // Send to all players in room except the disconnecting one
        socket.to(roomId).emit('player-disconnected-active-game', { 
          playerId: disconnectedPlayer.id,
          playerName: disconnectedPlayer.name,
          timeoutSeconds: 30
        });
      } else {
        socket.to(roomId).emit('player-disconnected', { 
          playerId: disconnectedPlayer.id,
          socketId: socket.id 
        });
      }
    }
    
    // Now leave the room
    const { room } = roomManager.leaveRoom(socket.id);
    
    // Clean up rate limiting data
    if (disconnectedPlayer) {
      claimCooldowns.delete(disconnectedPlayer.id);
    }
    
    if (roomId && room) {
      io.to(roomId).emit('room-updated', room);
    }
    
    io.emit('rooms-updated', roomManager.getOpenRooms());
  });
};