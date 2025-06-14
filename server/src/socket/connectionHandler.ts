import { Server, Socket } from 'socket.io';
import roomManager from './RoomManager';
import { Solution } from '../types/game.types';

export const handleConnection = (io: Server, socket: Socket) => {
  console.log('New client connected:', socket.id);

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

      // Emit round result
      io.to(room.id).emit('round-ended', {
        winnerId: data.solution.result === 24 ? player.id : room.players.find(p => p.id !== player.id)?.id,
        loserId: data.solution.result === 24 ? room.players.find(p => p.id !== player.id)?.id : player.id,
        solution: data.solution,
        correct: data.solution.result === 24
      });

      // Update game state for all players
      setTimeout(() => {
        const currentState = roomManager.getGameState(room.id);
        if (currentState) {
          if (currentState.state === 'game_over') {
            io.to(room.id).emit('game-over', {
              winnerId: currentState.scores[player.id] > currentState.scores[room.players.find(p => p.id !== player.id)?.id || ''] ? player.id : room.players.find(p => p.id !== player.id)?.id,
              scores: currentState.scores
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