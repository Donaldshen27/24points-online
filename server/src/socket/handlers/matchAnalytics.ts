import { Socket } from 'socket.io';
import { MatchAnalyticsService } from '../../services/MatchAnalyticsService';

export const registerMatchAnalyticsHandlers = (socket: Socket) => {
  const analyticsService = MatchAnalyticsService.getInstance();

  // Get player match history
  socket.on('match:getHistory', async (data: {
    userId: string;
    limit?: number;
    offset?: number;
    gameMode?: string;
    startDate?: string;
    endDate?: string;
  }, callback) => {
    try {
      const matches = await analyticsService.getPlayerMatchHistory(data.userId, {
        limit: data.limit,
        offset: data.offset,
        gameMode: data.gameMode,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined
      });

      callback({ success: true, matches });
    } catch (error) {
      console.error('Error getting match history:', error);
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get match history' 
      });
    }
  });

  // Get player performance stats
  socket.on('match:getPerformanceStats', async (data: {
    userId: string;
  }, callback) => {
    try {
      const stats = await analyticsService.getPlayerPerformanceStats(data.userId);
      callback({ success: true, stats });
    } catch (error) {
      console.error('Error getting performance stats:', error);
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get performance stats' 
      });
    }
  });

  // Get head-to-head stats
  socket.on('match:getHeadToHead', async (data: {
    player1Id: string;
    player2Id: string;
  }, callback) => {
    try {
      const stats = await analyticsService.getHeadToHeadStats(data.player1Id, data.player2Id);
      callback({ success: true, stats });
    } catch (error) {
      console.error('Error getting head-to-head stats:', error);
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get head-to-head stats' 
      });
    }
  });

  // Get performance trends
  socket.on('match:getPerformanceTrends', async (data: {
    userId: string;
    days?: number;
  }, callback) => {
    try {
      const trends = await analyticsService.getPerformanceTrends(
        data.userId, 
        data.days || 30
      );
      callback({ success: true, trends });
    } catch (error) {
      console.error('Error getting performance trends:', error);
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get performance trends' 
      });
    }
  });
};