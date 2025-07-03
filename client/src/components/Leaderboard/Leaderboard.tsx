import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import socketService from '../../services/socketService';
import { leaderboardCache } from '../../services/puzzleRecordsCache';
import { RankBadge } from '../Rank/RankBadge';
import type { AuthUser } from '../../services/authService';
import './Leaderboard.css';

interface LeaderboardEntry {
  username: string;
  recordCount: number;
  rank: number;
  badgeCount?: number;
  badgePoints?: number;
  level?: number;
  legendaryBadges?: number;
  epicBadges?: number;
  rareBadges?: number;
}

interface RankedLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  rating: number;
  gamesPlayed: number;
  winRate: number;
  tier: string;
  peakRating: number;
}

interface LeaderboardData {
  recordHoldings: LeaderboardEntry[];
  totalPuzzles: number;
}

type ViewMode = 'records' | 'elo' | 'badges';
type BadgeSortMode = 'points' | 'count' | 'legendary' | 'epic' | 'rare';
type RankedRegion = 'global' | 'na' | 'eu' | 'asia';

interface LeaderboardProps {
  authUser?: AuthUser | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ authUser }) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('records');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [badgeSortMode, setBadgeSortMode] = useState<BadgeSortMode>('points');
  const [rankedLeaderboard, setRankedLeaderboard] = useState<RankedLeaderboardEntry[]>([]);
  const [rankedRegion, setRankedRegion] = useState<RankedRegion>('global');
  const [rankedLoading, setRankedLoading] = useState(false);
  const [rankedPage, setRankedPage] = useState(0);
  const [hasMoreRanked, setHasMoreRanked] = useState(true);
  const [rankedError, setRankedError] = useState<string | null>(null);

  useEffect(() => {
    // Get current username from localStorage or auth
    const storedUsername = localStorage.getItem('playerName') || '';
    setCurrentUsername(storedUsername);

    // Check cache first
    const cachedData = leaderboardCache.get('leaderboard-data');
    if (cachedData) {
      setLeaderboardData(cachedData);
      setLoading(false);
      
      // Still fetch fresh data in background for next time
      fetchLeaderboardInBackground();
    } else {
      // No cache, fetch immediately
      fetchLeaderboard();
    }

    // Refresh every 60 seconds (less frequent than puzzle records)
    const interval = setInterval(fetchLeaderboardInBackground, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch ranked leaderboard when tab is selected
  useEffect(() => {
    if (viewMode === 'elo' && rankedLeaderboard.length === 0) {
      fetchRankedLeaderboard(0);
    }
  }, [viewMode]);

  const fetchLeaderboard = () => {
    socketService.emit('get-leaderboard-data', (data: LeaderboardData) => {
      setLeaderboardData(data);
      leaderboardCache.set('leaderboard-data', data);
      setLoading(false);
    });
  };

  const fetchLeaderboardInBackground = () => {
    socketService.emit('get-leaderboard-data', (data: LeaderboardData) => {
      leaderboardCache.set('leaderboard-data', data);
      
      // Only update state if data changed
      setLeaderboardData(prevData => {
        if (JSON.stringify(prevData) !== JSON.stringify(data)) {
          return data;
        }
        return prevData;
      });
    });
  };

  const getPercentage = (recordCount: number) => {
    if (!leaderboardData || leaderboardData.totalPuzzles === 0) return 0;
    return ((recordCount / leaderboardData.totalPuzzles) * 100).toFixed(1);
  };

  const sortBadgeEntries = (entries: LeaderboardEntry[]) => {
    const filtered = entries.filter(entry => entry.badgeCount && entry.badgeCount > 0);
    
    switch (badgeSortMode) {
      case 'points':
        return filtered.sort((a, b) => (b.badgePoints || 0) - (a.badgePoints || 0));
      case 'count':
        return filtered.sort((a, b) => (b.badgeCount || 0) - (a.badgeCount || 0));
      case 'legendary':
        return filtered.sort((a, b) => (b.legendaryBadges || 0) - (a.legendaryBadges || 0));
      case 'epic':
        return filtered.sort((a, b) => (b.epicBadges || 0) - (a.epicBadges || 0));
      case 'rare':
        return filtered.sort((a, b) => (b.rareBadges || 0) - (a.rareBadges || 0));
      default:
        return filtered;
    }
  };

  const fetchRankedLeaderboard = (page: number = 0, append: boolean = false) => {
    setRankedLoading(true);
    setRankedError(null);
    const limit = 50;
    const offset = page * limit;

    // Add timeout to handle no response
    const timeoutId = setTimeout(() => {
      setRankedLoading(false);
      setRankedError(t('leaderboard.connectionError'));
    }, 10000);

    socketService.emit('ranked:get-leaderboard', { limit, offset }, (data: RankedLeaderboardEntry[]) => {
      clearTimeout(timeoutId);
      
      // Check if data is valid
      if (!Array.isArray(data)) {
        setRankedError(t('leaderboard.databaseError'));
        setRankedLoading(false);
        return;
      }
      
      if (append) {
        setRankedLeaderboard(prev => [...prev, ...data]);
      } else {
        setRankedLeaderboard(data);
      }
      setHasMoreRanked(data.length === limit);
      setRankedLoading(false);
    });
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
        <div className="loading-spinner">
          <span className="loading-text">{t('app.loading')}</span>
          <span className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
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
          className={`toggle-btn ${viewMode === 'badges' ? 'active' : ''}`}
          onClick={() => setViewMode('badges')}
        >
          {t('leaderboard.badges')}
        </button>
        <button
          className={`toggle-btn ${viewMode === 'elo' ? 'active' : ''}`}
          onClick={() => setViewMode('elo')}
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
                    {entry.level && entry.level > 1 && (
                      <span className="level-badge">Lv.{entry.level}</span>
                    )}
                    {entry.legendaryBadges && entry.legendaryBadges > 0 && (
                      <span className="rarity-indicator legendary">👑</span>
                    )}
                    {!entry.legendaryBadges && entry.epicBadges && entry.epicBadges > 0 && (
                      <span className="rarity-indicator epic">💎</span>
                    )}
                    {!entry.legendaryBadges && !entry.epicBadges && entry.rareBadges && entry.rareBadges > 0 && (
                      <span className="rarity-indicator rare">⭐</span>
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

      {viewMode === 'badges' && leaderboardData && (
        <div className="leaderboard-content">
          <div className="leaderboard-header">
            <p className="total-puzzles">
              {t('leaderboard.badgeLeaderboard')}
            </p>
            <div className="badge-sort-controls">
              <label>{t('leaderboard.sortBy')}:</label>
              <select 
                value={badgeSortMode} 
                onChange={(e) => setBadgeSortMode(e.target.value as BadgeSortMode)}
                className="sort-select"
              >
                <option value="points">{t('leaderboard.sortByPoints')}</option>
                <option value="count">{t('leaderboard.sortByCount')}</option>
                <option value="legendary">{t('leaderboard.sortByLegendary')}</option>
                <option value="epic">{t('leaderboard.sortByEpic')}</option>
                <option value="rare">{t('leaderboard.sortByRare')}</option>
              </select>
            </div>
          </div>

          <div className="leaderboard-list">
            {leaderboardData.recordHoldings.length === 0 ? (
              <div className="empty-state">
                {t('leaderboard.noBadgesYet')}
              </div>
            ) : (
              sortBadgeEntries(leaderboardData.recordHoldings)
                .map((entry, index) => (
                  <div
                    key={entry.username}
                    className={`leaderboard-entry ${entry.username === currentUsername ? 'current-user' : ''}`}
                  >
                    <div className="rank-column">
                      {getRankIcon(index + 1)}
                    </div>
                    <div className="username-column">
                      <span className="username">{entry.username}</span>
                      {entry.username === currentUsername && (
                        <span className="you-badge">{t('leaderboard.you')}</span>
                      )}
                      {entry.level && entry.level > 1 && (
                        <span className="level-badge">Lv.{entry.level}</span>
                      )}
                    </div>
                    <div className="badge-stats-column">
                      <div className="badge-count">
                        <span className="badge-count-number">{entry.badgeCount || 0}</span>
                        <span className="badge-count-label">{t('leaderboard.badgesEarned')}</span>
                      </div>
                      <div className="badge-rarity-breakdown">
                        {entry.legendaryBadges && entry.legendaryBadges > 0 && (
                          <span className="rarity-count legendary">👑 {entry.legendaryBadges}</span>
                        )}
                        {entry.epicBadges && entry.epicBadges > 0 && (
                          <span className="rarity-count epic">💎 {entry.epicBadges}</span>
                        )}
                        {entry.rareBadges && entry.rareBadges > 0 && (
                          <span className="rarity-count rare">⭐ {entry.rareBadges}</span>
                        )}
                      </div>
                    </div>
                    <div className="points-column">
                      <span className="points-value">{entry.badgePoints || 0}</span>
                      <span className="points-label">{t('leaderboard.points')}</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {viewMode === 'elo' && (
        <div className="leaderboard-content">
          <div className="leaderboard-header">
            <p className="total-puzzles">
              {t('leaderboard.rankedLeaderboard')}
            </p>
            {!authUser && (
              <p className="elo-signup-prompt">
                {t('leaderboard.signUpForElo')}
              </p>
            )}
            <div className="region-filter">
              <label>{t('leaderboard.region')}:</label>
              <select 
                value={rankedRegion} 
                onChange={(e) => {
                  setRankedRegion(e.target.value as RankedRegion);
                  setRankedPage(0);
                  fetchRankedLeaderboard(0);
                }}
                className="region-select"
              >
                <option value="global">{t('leaderboard.global')}</option>
                <option value="na">{t('leaderboard.northAmerica')}</option>
                <option value="eu">{t('leaderboard.europe')}</option>
                <option value="asia">{t('leaderboard.asia')}</option>
              </select>
            </div>
          </div>

          <div className="leaderboard-list ranked-list">
            {rankedError ? (
              <div className="error-state">
                <p className="error-message">{rankedError}</p>
                <p className="error-hint">{t('leaderboard.databaseHint')}</p>
                <button 
                  className="retry-btn"
                  onClick={() => fetchRankedLeaderboard(rankedPage)}
                >
                  {t('leaderboard.retry')}
                </button>
              </div>
            ) : rankedLoading && rankedLeaderboard.length === 0 ? (
              <div className="loading-spinner">
          <span className="loading-text">{t('app.loading')}</span>
          <span className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
            ) : rankedLeaderboard.length === 0 ? (
              <div className="empty-state">
                {t('leaderboard.noRankedPlayers')}
              </div>
            ) : (
              <>
                {rankedLeaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`leaderboard-entry ranked-entry ${entry.username === currentUsername ? 'current-user' : ''}`}
                  >
                    <div className="rank-column">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="username-column">
                      <RankBadge tier={entry.tier as any} rating={entry.rating} size="small" />
                      <span className="username">{entry.username}</span>
                      {entry.username === currentUsername && (
                        <span className="you-badge">{t('leaderboard.you')}</span>
                      )}
                    </div>
                    <div className="rating-column">
                      <span className="rating-value">{entry.rating}</span>
                      <span className="rating-label">{t('leaderboard.rating')}</span>
                      {entry.peakRating > entry.rating && (
                        <span className="peak-rating">
                          {t('leaderboard.peak')}: {entry.peakRating}
                        </span>
                      )}
                    </div>
                    <div className="stats-column">
                      <div className="games-played">
                        <span className="stat-value">{entry.gamesPlayed}</span>
                        <span className="stat-label">{t('leaderboard.games')}</span>
                      </div>
                      <div className="win-rate">
                        <span className="stat-value">{entry.winRate.toFixed(1)}%</span>
                        <span className="stat-label">{t('leaderboard.winRate')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMoreRanked && (
                  <div className="load-more-container">
                    <button
                      className="load-more-btn"
                      onClick={() => {
                        const nextPage = rankedPage + 1;
                        setRankedPage(nextPage);
                        fetchRankedLeaderboard(nextPage, true);
                      }}
                      disabled={rankedLoading}
                    >
                      {rankedLoading ? t('leaderboard.loading') : t('leaderboard.loadMore')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};