import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import socketService from '../../services/socketService';
import { RankDisplay } from '../Rank/RankDisplay';
import { RoomTypeSelector } from '../RoomTypeSelector/RoomTypeSelector';
import type { GameRoom } from '../../types/game.types';
import type { AuthUser } from '../../services/authService';
import './RankedLobby.css';

interface RankedLobbyProps {
  onRoomJoined: (room: GameRoom, playerId: string, isReconnection?: boolean) => void;
  authUser?: AuthUser | null;
  onAuthRequired: () => void;
}

interface PlayerRating {
  currentRating: number;
  peakRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  placementMatchesRemaining: number;
}

interface QueueStatus {
  isQueuing: boolean;
  queueTime: number;
  estimatedWaitTime: number;
  searchRange: number;
}

interface MatchHistory {
  matchId: string;
  opponentName: string;
  opponentRating: number;
  result: 'win' | 'loss';
  ratingChange: number;
  timestamp: string;
  gameMode: string;
}

export const RankedLobby: React.FC<RankedLobbyProps> = ({ onRoomJoined, authUser, onAuthRequired }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'ranked' | 'casual'>('ranked');
  const [selectedGameMode, setSelectedGameMode] = useState('classic');
  const [playerRating, setPlayerRating] = useState<PlayerRating | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    isQueuing: false,
    queueTime: 0,
    estimatedWaitTime: 0,
    searchRange: 50
  });
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [queueStartTime, setQueueStartTime] = useState<number | null>(null);
  const [queueTimer, setQueueTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  // Fetch player rating on mount and when auth changes
  useEffect(() => {
    if (authUser) {
      socketService.emit('ranked:get-rating');
      socketService.emit('ranked:get-match-history', { limit: 5 });
    }
  }, [authUser]);

  // Set up socket event listeners
  useEffect(() => {
    const handleRating = (rating: PlayerRating | null) => {
      if (rating) {
        setPlayerRating(rating);
      }
    };

    const handleMatchHistory = (history: MatchHistory[]) => {
      setMatchHistory(history);
    };

    const handleQueueJoined = (data: { gameMode: string; estimatedWaitTime: number }) => {
      setQueueStatus(prev => ({
        ...prev,
        isQueuing: true,
        estimatedWaitTime: data.estimatedWaitTime
      }));
      setQueueStartTime(Date.now());
    };

    const handleQueueLeft = () => {
      setQueueStatus(prev => ({
        ...prev,
        isQueuing: false,
        queueTime: 0,
        estimatedWaitTime: 0,
        searchRange: 50
      }));
      setQueueStartTime(null);
    };

    const handleQueueStatus = (status: { 
      isQueuing: boolean; 
      queueTime: number; 
      estimatedWaitTime: number; 
      searchRange: number 
    }) => {
      setQueueStatus(status);
    };

    const handleMatchFound = (data: { 
      roomId: string; 
      opponent: { username: string; rating: number };
      matchId?: string;
    }) => {
      // Cancel queue timer
      if (queueTimer) {
        clearInterval(queueTimer);
        setQueueTimer(null);
      }
      
      // Reset queue status
      handleQueueLeft();
      
      // Show match found notification
      console.log(`Match found! Opponent: ${data.opponent.username} (${data.opponent.rating})`);
      
      // The server will handle room creation and joining
      // We'll receive a room-joined event shortly
    };

    const handleRoomJoined = (data: { room: GameRoom; playerId: string }) => {
      onRoomJoined(data.room, data.playerId, false);
    };

    const handleError = (data: { message: string }) => {
      alert(data.message);
      handleQueueLeft();
    };

    // Register event handlers
    socketService.on('ranked:rating', handleRating);
    socketService.on('ranked:match-history', handleMatchHistory);
    socketService.on('ranked:queue-joined', handleQueueJoined);
    socketService.on('ranked:queue-left', handleQueueLeft);
    socketService.on('ranked:queue-status', handleQueueStatus);
    socketService.on('ranked:match-found', handleMatchFound);
    socketService.on('ranked:error', handleError);
    
    socketService.on('casual:queue-joined', handleQueueJoined);
    socketService.on('casual:queue-left', handleQueueLeft);
    socketService.on('casual:queue-status', handleQueueStatus);
    socketService.on('casual:match-found', handleMatchFound);
    socketService.on('casual:error', handleError);
    
    socketService.on('room-joined', handleRoomJoined);

    return () => {
      socketService.off('ranked:rating', handleRating);
      socketService.off('ranked:match-history', handleMatchHistory);
      socketService.off('ranked:queue-joined', handleQueueJoined);
      socketService.off('ranked:queue-left', handleQueueLeft);
      socketService.off('ranked:queue-status', handleQueueStatus);
      socketService.off('ranked:match-found', handleMatchFound);
      socketService.off('ranked:error', handleError);
      
      socketService.off('casual:queue-joined', handleQueueJoined);
      socketService.off('casual:queue-left', handleQueueLeft);
      socketService.off('casual:queue-status', handleQueueStatus);
      socketService.off('casual:match-found', handleMatchFound);
      socketService.off('casual:error', handleError);
      
      socketService.off('room-joined', handleRoomJoined);
    };
  }, [onRoomJoined, queueTimer]);

  // Update queue timer
  useEffect(() => {
    if (queueStatus.isQueuing && queueStartTime) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - queueStartTime) / 1000);
        setQueueStatus(prev => ({ ...prev, queueTime: elapsed }));
        
        // Request updated queue status every 5 seconds
        if (elapsed % 5 === 0) {
          socketService.emit(activeTab === 'ranked' ? 'ranked:queue-status' : 'casual:queue-status');
        }
      }, 1000);
      
      setQueueTimer(timer);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [queueStatus.isQueuing, queueStartTime, activeTab]);

  const handleJoinQueue = useCallback(() => {
    if (activeTab === 'ranked' && !authUser) {
      onAuthRequired();
      return;
    }

    const event = activeTab === 'ranked' ? 'ranked:join-queue' : 'casual:join-queue';
    socketService.emit(event, { gameMode: selectedGameMode });
  }, [activeTab, authUser, onAuthRequired, selectedGameMode]);

  const handleLeaveQueue = useCallback(() => {
    const event = activeTab === 'ranked' ? 'ranked:leave-queue' : 'casual:leave-queue';
    socketService.emit(event);
  }, [activeTab]);

  const formatQueueTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('ranked.justNow');
    if (diffMins < 60) return t('ranked.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('ranked.hoursAgo', { count: diffHours });
    return t('ranked.daysAgo', { count: diffDays });
  };

  return (
    <div className="ranked-lobby">
      <div className="ranked-lobby-header">
        <h1>{t('ranked.title')}</h1>
        <div className="queue-tabs">
          <button 
            className={`queue-tab ${activeTab === 'ranked' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranked')}
          >
            {t('ranked.rankedMode')}
          </button>
          <button 
            className={`queue-tab ${activeTab === 'casual' ? 'active' : ''}`}
            onClick={() => setActiveTab('casual')}
          >
            {t('ranked.casualMode')}
          </button>
        </div>
      </div>

      {activeTab === 'ranked' && authUser && playerRating && (
        <div className="player-stats-section">
          <RankDisplay
            rating={playerRating.currentRating}
            peakRating={playerRating.peakRating}
            wins={playerRating.wins}
            losses={playerRating.losses}
            variant="full"
            className="player-rank-display"
          />
          
          {playerRating.placementMatchesRemaining > 0 && (
            <div className="placement-notice">
              {t('ranked.placementMatches', { count: playerRating.placementMatchesRemaining })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ranked' && !authUser && (
        <div className="auth-required-notice">
          <p>{t('ranked.authRequired')}</p>
          <button className="auth-button" onClick={onAuthRequired}>
            {t('ranked.signIn')}
          </button>
        </div>
      )}

      <div className="game-mode-section">
        <h3>{t('ranked.selectGameMode')}</h3>
        <RoomTypeSelector
          selectedType={selectedGameMode}
          onTypeSelect={setSelectedGameMode}
          disabled={queueStatus.isQueuing}
        />
      </div>

      <div className="queue-section">
        {!queueStatus.isQueuing ? (
          <button 
            className="queue-button join-queue"
            onClick={handleJoinQueue}
            disabled={activeTab === 'ranked' && !authUser}
          >
            {activeTab === 'ranked' ? t('ranked.joinRankedQueue') : t('ranked.joinCasualQueue')}
          </button>
        ) : (
          <div className="queue-status">
            <div className="queue-info">
              <div className="queue-time">
                <span className="queue-label">{t('ranked.queueTime')}</span>
                <span className="queue-value">{formatQueueTime(queueStatus.queueTime)}</span>
              </div>
              <div className="search-range">
                <span className="queue-label">{t('ranked.searchRange')}</span>
                <span className="queue-value">±{queueStatus.searchRange}</span>
              </div>
              <div className="estimated-wait">
                <span className="queue-label">{t('ranked.estimatedWait')}</span>
                <span className="queue-value">
                  {queueStatus.estimatedWaitTime > 0 
                    ? t('ranked.estimatedSeconds', { seconds: queueStatus.estimatedWaitTime })
                    : t('ranked.calculating')}
                </span>
              </div>
            </div>
            <button 
              className="queue-button leave-queue"
              onClick={handleLeaveQueue}
            >
              {t('ranked.leaveQueue')}
            </button>
            <div className="queue-animation">
              <div className="queue-pulse"></div>
              <div className="queue-pulse"></div>
              <div className="queue-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'ranked' && authUser && matchHistory.length > 0 && (
        <div className="match-history-section">
          <h3>{t('ranked.recentMatches')}</h3>
          <div className="match-history-list">
            {matchHistory.map((match) => (
              <div key={match.matchId} className={`match-history-item ${match.result}`}>
                <div className="match-opponent">
                  <span className="opponent-name">{match.opponentName}</span>
                  <span className="opponent-rating">({match.opponentRating})</span>
                </div>
                <div className="match-result">
                  <span className={`result-badge ${match.result}`}>
                    {match.result === 'win' ? t('ranked.win') : t('ranked.loss')}
                  </span>
                  <span className={`rating-change ${match.ratingChange > 0 ? 'positive' : 'negative'}`}>
                    {match.ratingChange > 0 ? '+' : ''}{match.ratingChange}
                  </span>
                </div>
                <div className="match-time">{formatTimestamp(match.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};