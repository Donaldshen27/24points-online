import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import socketService from '../../services/socketService';
import './Leaderboard.css';

interface LeaderboardEntry {
  username: string;
  recordCount: number;
  rank: number;
}

interface LeaderboardData {
  recordHoldings: LeaderboardEntry[];
  totalPuzzles: number;
}

type ViewMode = 'records' | 'elo';

export const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('records');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string>('');

  useEffect(() => {
    // Get current username from localStorage or auth
    const storedUsername = localStorage.getItem('playerName') || '';
    setCurrentUsername(storedUsername);

    // Fetch leaderboard data
    const fetchLeaderboard = () => {
      socketService.emit('get-leaderboard-data', (data: LeaderboardData) => {
        setLeaderboardData(data);
        setLoading(false);
      });
    };

    fetchLeaderboard();

    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPercentage = (recordCount: number) => {
    if (!leaderboardData || leaderboardData.totalPuzzles === 0) return 0;
    return ((recordCount / leaderboardData.totalPuzzles) * 100).toFixed(1);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-container">
        <h2 className="leaderboard-title">{t('app.nav.leaderboard')}</h2>
        <div className="loading-spinner">{t('app.loading')}</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">{t('app.nav.leaderboard')}</h2>
      
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'records' ? 'active' : ''}`}
          onClick={() => setViewMode('records')}
        >
          {t('leaderboard.recordHoldings')}
        </button>
        <button
          className={`toggle-btn ${viewMode === 'elo' ? 'active' : ''} disabled`}
          onClick={() => setViewMode('elo')}
          disabled
        >
          {t('leaderboard.eloRank')}
        </button>
      </div>

      {viewMode === 'records' && leaderboardData && (
        <div className="leaderboard-content">
          <div className="leaderboard-header">
            <p className="total-puzzles">
              {t('leaderboard.totalPuzzles', { count: leaderboardData.totalPuzzles })}
            </p>
          </div>

          <div className="leaderboard-list">
            {leaderboardData.recordHoldings.length === 0 ? (
              <div className="empty-state">
                {t('leaderboard.noRecordsYet')}
              </div>
            ) : (
              leaderboardData.recordHoldings.map((entry) => (
                <div
                  key={entry.username}
                  className={`leaderboard-entry ${entry.username === currentUsername ? 'current-user' : ''}`}
                >
                  <div className="rank-column">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="username-column">
                    <span className="username">{entry.username}</span>
                    {entry.username === currentUsername && (
                      <span className="you-badge">{t('leaderboard.you')}</span>
                    )}
                  </div>
                  <div className="records-column">
                    <span className="record-count">{entry.recordCount}</span>
                    <span className="record-label">{t('leaderboard.records')}</span>
                  </div>
                  <div className="percentage-column">
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill"
                        style={{ width: `${getPercentage(entry.recordCount)}%` }}
                      />
                      <span className="percentage-text">
                        {getPercentage(entry.recordCount)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === 'elo' && (
        <div className="coming-soon">
          <div className="coming-soon-icon">🏗️</div>
          <h3>{t('leaderboard.comingSoon')}</h3>
          <p>{t('leaderboard.eloDescription')}</p>
        </div>
      )}
    </div>
  );
};