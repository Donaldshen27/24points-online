import { Socket } from 'socket.io';
import { MatchReplayService } from '../../services/MatchReplayService';

export const registerMatchReplayHandlers = (socket: Socket) => {
  const replayService = MatchReplayService.getInstance();

  // Get full replay data for a match
  socket.on('replay:getMatch', async (data: {
    matchId: string;
  }, callback) => {
    try {
      const replay = await replayService.getMatchReplay(data.matchId);
      
      if (!replay) {
        callback({ 
          success: false, 
          error: 'Replay not found' 
        });
        return;
      }

      callback({ success: true, replay });
    } catch (error) {
      console.error('Error getting match replay:', error);
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get match replay' 
      });
    }
  });

  // Get list of available replays for a player
  socket.on('replay:getPlayerReplays', async (data: {
    userId: string;
    limit?: number;
    offset?: number;
  }, callback) => {
    try {
      const replays = await replayService.getPlayerReplays(
        data.userId,
        data.limit || 10,
        data.offset || 0
      );

      callback({ success: true, replays });
    } catch (error) {
      console.error('Error getting player replays:', error);
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get player replays' 
      });
    }
  });

  // Watch a replay (join replay room for real-time playback)
  socket.on('replay:watch', async (data: {
    matchId: string;
  }, callback) => {
    try {
      const replay = await replayService.getMatchReplay(data.matchId);
      
      if (!replay) {
        callback({ 
          success: false, 
          error: 'Replay not found' 
        });
        return;
      }

      // Join a replay-specific room for synchronized playback
      const replayRoomId = `replay-${data.matchId}`;
      socket.join(replayRoomId);

      callback({ 
        success: true, 
        replay,
        roomId: replayRoomId 
      });
    } catch (error) {
      console.error('Error watching replay:', error);
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to watch replay' 
      });
    }
  });

  // Leave replay room
  socket.on('replay:stop', (data: {
    matchId: string;
  }) => {
    const replayRoomId = `replay-${data.matchId}`;
    socket.leave(replayRoomId);
  });
};