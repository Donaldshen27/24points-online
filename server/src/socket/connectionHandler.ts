import { Server, Socket } from 'socket.io';
import roomManager from './RoomManager';
import { Solution, GameState } from '../types/game.types';

export const handleConnection = (io: Server, socket: Socket) => {
  console.log('New client connected:', socket.id);
  
  // Set io instance in RoomManager if not already set
  roomManager.setIo(io);

  socket.on('create-room', (data: { playerName: string }) => {
    const playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const room = roomManager.createRoom(playerId, socket.id, data.playerName);
    
    socket.join(room.id);
    socket.emit('room-created', { room, playerId });
    
    io.emit('rooms-updated', roomManager.getOpenRooms());
  });

  socket.on('join-room', (data: { roomId: string; playerName: string }) => {
    const playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const room = roomManager.joinRoom(data.roomId, playerId, socket.id, data.playerName);
    
    if (!room) {
      socket.emit('join-room-error', { message: 'Room not found or full' });
      return;
    }

    socket.join(data.roomId);
    socket.emit('room-joined', { room, playerId });
    
    io.to(data.roomId).emit('room-updated', room);
    io.emit('rooms-updated', roomManager.getOpenRooms());
  });

  socket.on('leave-room', () => {
    const { room, roomId } = roomManager.leaveRoom(socket.id);
    
    if (roomId) {
      socket.leave(roomId);
      
      if (room) {
        io.to(roomId).emit('room-updated', room);
        io.to(roomId).emit('player-left', { socketId: socket.id });
      }
      
      io.emit('rooms-updated', roomManager.getOpenRooms());
    }
  });

  socket.on('player-ready', (data: { isReady: boolean }) => {
    const room = roomManager.updatePlayerReady(socket.id, data.isReady);
    
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
                io.to(player.socketId).emit('game-state-updated', playerState);
              });
              
              io.to(room.id).emit('round-started', {
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

  socket.on('claim-solution', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    if (roomManager.claimSolution(room.id, player.id)) {
      io.to(room.id).emit('solution-claimed', { playerId: player.id, playerName: player.name });
      
      // Update game state for all players
      const gameState = roomManager.getGameState(room.id);
      if (gameState) {
        gameState.players.forEach(p => {
          const playerState = roomManager.getGameStateForPlayer(room.id, p.id);
          io.to(p.socketId).emit('game-state-updated', playerState);
        });
      }
    } else {
      socket.emit('claim-error', { message: 'Cannot claim solution at this time' });
    }
  });

  socket.on('submit-solution', (data: { solution: Solution }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    if (roomManager.submitSolution(room.id, player.id, data.solution)) {
      const gameState = roomManager.getGameState(room.id);
      if (!gameState) return;

      // Determine round result
      const isCorrect = data.solution.result === 24;
      const winnerId = isCorrect ? player.id : room.players.find(p => p.id !== player.id)?.id || null;
      const loserId = isCorrect ? room.players.find(p => p.id !== player.id)?.id || null : player.id;
      
      // Emit round result with proper reason
      io.to(room.id).emit('round-ended', {
        winnerId,
        loserId,
        solution: data.solution,
        correct: isCorrect,
        reason: isCorrect ? 'correct_solution' : 'incorrect_solution'
      });

      // Update game state for all players
      setTimeout(() => {
        const currentState = roomManager.getGameState(room.id);
        if (currentState) {
          // Always emit the updated game state first
          currentState.players.forEach(p => {
            const playerState = roomManager.getGameStateForPlayer(room.id, p.id);
            io.to(p.socketId).emit('game-state-updated', playerState);
          });

          if (currentState.state === 'game_over') {
            // Determine final winner based on card count
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
            
            io.to(room.id).emit('game-over', {
              winnerId: gameWinnerId,
              scores: currentState.scores,
              finalDecks: {
                [player1.id]: player1.deck.length,
                [player2.id]: player2.deck.length
              }
            });
          } else {
            currentState.players.forEach(p => {
              const playerState = roomManager.getGameStateForPlayer(room.id, p.id);
              io.to(p.socketId).emit('game-state-updated', playerState);
            });
            
            io.to(room.id).emit('round-started', {
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
          
          // If we're in playing state, announce the new round
          if (gameState.state === 'playing') {
            io.to(room.id).emit('round-started', {
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

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const { room, roomId } = roomManager.leaveRoom(socket.id);
    
    if (roomId && room) {
      io.to(roomId).emit('room-updated', room);
      io.to(roomId).emit('player-disconnected', { socketId: socket.id });
    }
    
    io.emit('rooms-updated', roomManager.getOpenRooms());
  });
};