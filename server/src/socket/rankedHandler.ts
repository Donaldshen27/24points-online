import { Server, Socket } from 'socket.io';
import { MatchmakingService } from '../services/MatchmakingService';
import { RatingService } from '../services/RatingService';
import { MatchReplayService } from '../services/MatchReplayService';
import roomManager from './RoomManager';
import { v4 as uuidv4 } from 'uuid';
import { userService } from '../services/UserService';

export function setupRankedHandlers(io: Server, socket: Socket) {
  const matchmakingService = MatchmakingService.getInstance();
  const ratingService = RatingService.getInstance();

  // Set up match found callback
  matchmakingService.onMatchFound(async (match) => {
    console.log(`[RankedHandler] ${match.queueType} match found, creating room`);
    
    // Create a room with appropriate settings
    const room = roomManager.createRoom(match.roomId, 'classic', match.queueType === 'ranked');
    
    // Add both players to the room
    roomManager.joinRoom(match.roomId, match.player1.userId, match.player1.socketId, match.player1.username);
    roomManager.joinRoom(match.roomId, match.player2.userId, match.player2.socketId, match.player2.username);
    
    // Make both sockets join the room
    io.sockets.sockets.get(match.player1.socketId)?.join(match.roomId);
    io.sockets.sockets.get(match.player2.socketId)?.join(match.roomId);
    
    // For ranked matches, pre-create a match ID for replay recording
    let matchId: string | undefined;
    if (match.queueType === 'ranked' && room) {
      matchId = uuidv4();
      
      // Store the match ID in the room for later use
      (room as any).preMatchId = matchId;
      
      // Get the game manager and set the match ID
      const gameManager = roomManager.getGameManager(match.roomId);
      if (gameManager) {
        gameManager.setMatchId(matchId);
      }
    }
    
    // Notify both players
    const eventName = match.queueType === 'ranked' ? 'ranked:match-found' : 'casual:match-found';
    
    io.to(match.player1.socketId).emit(eventName, {
      roomId: match.roomId,
      queueType: match.queueType,
      opponent: {
        username: match.player2.username,
        rating: match.player2.rating
      },
      matchId // Include for ranked matches
    });
    
    io.to(match.player2.socketId).emit(eventName, {
      roomId: match.roomId,
      queueType: match.queueType,
      opponent: {
        username: match.player1.username,
        rating: match.player1.rating
      },
      matchId // Include for ranked matches
    });
  });

  // Join ranked queue
  socket.on('ranked:join-queue', async (data: { gameMode?: 'classic' | 'super' | 'extended'; region?: string }) => {
    try {
      // Check if user is authenticated
      if (!(socket as any).isAuthenticated || !(socket as any).userId) {
        socket.emit('ranked:error', { message: 'Must be logged in to play ranked' });
        return;
      }

      const userId = (socket as any).userId;
      const username = (socket as any).username;
      const gameMode = data.gameMode || 'classic';

      // Validate that user has a proper UUID (not a guest ID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        socket.emit('ranked:error', { message: 'Guest users cannot play ranked. Please create an account.' });
        return;
      }

      // Ensure user exists in the database for ranked play
      const userExists = await userService.ensureUserExists(userId, username);
      if (!userExists) {
        socket.emit('ranked:error', { message: 'Failed to create user account' });
        return;
      }

      // Join the matchmaking queue
      await matchmakingService.joinQueue(
        userId,
        socket.id,
        username,
        'ranked',
        gameMode,
        data.region
      );

      // Send initial queue status
      const status = matchmakingService.getQueueStatus(userId);
      socket.emit('ranked:queue-joined', {
        gameMode,
        estimatedWaitTime: status.estimatedWaitTime
      });

      // Join a room for queue updates
      socket.join(`queue:${userId}`);
      
      console.log(`[RankedHandler] Player ${username} joined ranked queue`);
    } catch (error) {
      console.error('[RankedHandler] Error joining queue:', error);
      socket.emit('ranked:error', { message: 'Failed to join queue' });
    }
  });

  // Leave ranked queue
  socket.on('ranked:leave-queue', () => {
    try {
      if (!(socket as any).userId) return;
      
      const userId = (socket as any).userId;
      const left = matchmakingService.leaveQueue(userId);
      
      if (left) {
        socket.leave(`queue:${userId}`);
        socket.emit('ranked:queue-left');
        console.log(`[RankedHandler] Player ${userId} left ranked queue`);
      }
    } catch (error) {
      console.error('[RankedHandler] Error leaving queue:', error);
    }
  });

  // Get queue status
  socket.on('ranked:queue-status', () => {
    try {
      if (!(socket as any).userId) return;
      
      const userId = (socket as any).userId;
      const status = matchmakingService.getQueueStatus(userId);
      
      socket.emit('ranked:queue-status', status);
    } catch (error) {
      console.error('[RankedHandler] Error getting queue status:', error);
    }
  });

  // Get player rating
  socket.on('ranked:get-rating', async () => {
    try {
      if (!(socket as any).userId) {
        socket.emit('ranked:rating', null);
        return;
      }

      const userId = (socket as any).userId;
      const username = (socket as any).username || 'Unknown';
      
      // Ensure user exists before getting rating
      await userService.ensureUserExists(userId, username);
      
      const rating = await ratingService.getPlayerRating(userId);
      
      socket.emit('ranked:rating', {
        currentRating: rating.current_rating,
        peakRating: rating.peak_rating,
        gamesPlayed: rating.games_played,
        wins: rating.wins,
        losses: rating.losses,
        winRate: rating.games_played > 0 ? (rating.wins / rating.games_played) * 100 : 0,
        placementMatchesRemaining: rating.placement_matches_remaining
      });
    } catch (error) {
      console.error('[RankedHandler] Error getting rating:', error);
      socket.emit('ranked:rating', null);
    }
  });

  // Get leaderboard
  socket.on('ranked:get-leaderboard', async (data: { limit?: number; offset?: number }, callback?: Function) => {
    try {
      const limit = data.limit || 100;
      const offset = data.offset || 0;
      
      const leaderboard = await ratingService.getLeaderboard(limit, offset);
      
      // Support both callback and event patterns
      if (callback) {
        callback(leaderboard);
      } else {
        socket.emit('ranked:leaderboard', leaderboard);
      }
    } catch (error) {
      console.error('[RankedHandler] Error getting leaderboard:', error);
      
      // Support both callback and event patterns
      if (callback) {
        callback([]);
      } else {
        socket.emit('ranked:leaderboard', []);
      }
    }
  });

  // Get match history
  socket.on('ranked:get-match-history', async (data: { userId?: string; limit?: number }) => {
    try {
      const targetUserId = data.userId || (socket as any).userId;
      if (!targetUserId) {
        socket.emit('ranked:match-history', []);
        return;
      }

      const limit = data.limit || 20;
      const history = await ratingService.getMatchHistory(targetUserId, limit);
      
      socket.emit('ranked:match-history', history);
    } catch (error) {
      console.error('[RankedHandler] Error getting match history:', error);
      socket.emit('ranked:match-history', []);
    }
  });

  // Join casual queue
  socket.on('casual:join-queue', async (data: { gameMode?: 'classic' | 'super' | 'extended'; region?: string }) => {
    try {
      // For casual mode, both authenticated and guest users can play
      let userId: string;
      let username: string;
      
      if ((socket as any).isAuthenticated && (socket as any).userId) {
        userId = (socket as any).userId;
        username = (socket as any).username;
      } else {
        // Generate temporary ID for guest users
        userId = `guest-${socket.id}`;
        username = `Guest-${Math.random().toString(36).substring(2, 7)}`;
      }
      
      const gameMode = data.gameMode || 'classic';

      // Ensure user exists in the database (even for casual)
      await userService.ensureUserExists(userId, username);

      // Join the casual matchmaking queue
      await matchmakingService.joinQueue(
        userId,
        socket.id,
        username,
        'casual',
        gameMode,
        data.region
      );

      // Send initial queue status
      const status = matchmakingService.getQueueStatus(userId);
      socket.emit('casual:queue-joined', {
        gameMode,
        estimatedWaitTime: status.estimatedWaitTime
      });

      // Join a room for queue updates
      socket.join(`queue:${userId}`);
      
      console.log(`[RankedHandler] Player ${username} joined casual queue`);
    } catch (error) {
      console.error('[RankedHandler] Error joining casual queue:', error);
      socket.emit('casual:error', { message: 'Failed to join queue' });
    }
  });

  // Leave casual queue
  socket.on('casual:leave-queue', () => {
    try {
      let userId: string;
      
      if ((socket as any).isAuthenticated && (socket as any).userId) {
        userId = (socket as any).userId;
      } else {
        userId = `guest-${socket.id}`;
      }
      
      const left = matchmakingService.leaveQueue(userId);
      
      if (left) {
        socket.leave(`queue:${userId}`);
        socket.emit('casual:queue-left');
        console.log(`[RankedHandler] Player ${userId} left casual queue`);
      }
    } catch (error) {
      console.error('[RankedHandler] Error leaving casual queue:', error);
    }
  });

  // Get casual queue status
  socket.on('casual:queue-status', () => {
    try {
      let userId: string;
      
      if ((socket as any).isAuthenticated && (socket as any).userId) {
        userId = (socket as any).userId;
      } else {
        userId = `guest-${socket.id}`;
      }
      
      const status = matchmakingService.getQueueStatus(userId);
      socket.emit('casual:queue-status', status);
    } catch (error) {
      console.error('[RankedHandler] Error getting casual queue status:', error);
    }
  });

  // Handle disconnect - remove from queue
  socket.on('disconnect', () => {
    if ((socket as any).userId) {
      const userId = (socket as any).userId;
      matchmakingService.leaveQueue(userId);
    } else {
      // Also handle guest users
      const guestId = `guest-${socket.id}`;
      matchmakingService.leaveQueue(guestId);
    }
  });
}

// Set up queue status broadcast interval
setInterval(() => {
  const matchmakingService = MatchmakingService.getInstance();
  const queuedPlayers = matchmakingService.getQueuedPlayers();
  
  // Broadcast queue size to all connected clients
  // This would need to be connected to the io instance
  // io.emit('ranked:queue-size', { total: queuedPlayers.length });
}, 5000);