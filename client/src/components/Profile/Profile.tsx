import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { BadgeShowcase } from '../Badges/BadgeShowcase';
import { LevelIndicator } from '../Badges/BadgeProgress';
import { RankDisplay } from '../Rank/RankDisplay';
import socketService from '../../services/socketService';
import './Profile.css';

interface ProfileProps {
  userId?: string;
}

interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  averageSolveTime: number;
  fastestSolve: number;
  longestWinStreak: number;
  currentWinStreak: number;
}

interface BadgeData {
  totalPoints: number;
  level: number;
  badgeCount: number;
}

interface RankedStats {
  currentRating: number;
  peakRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  placementMatchesRemaining: number;
}

interface MatchHistoryItem {
  matchId: string;
  opponentName: string;
  opponentRating: number;
  result: 'win' | 'loss';
  ratingChange: number;
  newRating: number;
  timestamp: string;
  gameMode: string;
  duration: number;
}

export const Profile: React.FC<ProfileProps> = ({ userId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [badgeData, setBadgeData] = useState<BadgeData>({
    totalPoints: 0,
    level: 1,
    badgeCount: 0
  });
  const [rankedStats, setRankedStats] = useState<RankedStats | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ranked' | 'badges'>('overview');

  const profileUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (profileUserId) {
      loadPlayerData();
    }
  }, [profileUserId]);

  const loadPlayerData = async () => {
    setLoading(true);
    
    // Load badge data
    socketService.emit('get-user-badges', { userId: profileUserId }, (response: any) => {
      if (response.success) {
        setBadgeData({
          totalPoints: response.totalPoints || 0,
          level: response.level || 1,
          badgeCount: response.badges?.length || 0
        });
      }
    });
    
    // Load stats from server
    socketService.emit('get-user-statistics', { userId: profileUserId }, (statsData: any) => {
      if (statsData) {
        const winRate = statsData.gamesPlayed > 0 
          ? Math.round((statsData.gamesWon / statsData.gamesPlayed) * 100) 
          : 0;
        const avgSolveTime = statsData.totalSolveTimeMs && statsData.totalCorrectSolutions > 0
          ? Math.round(statsData.totalSolveTimeMs / statsData.totalCorrectSolutions / 1000)
          : 0;
          
        setStats({
          gamesPlayed: statsData.gamesPlayed || 0,
          gamesWon: statsData.gamesWon || 0,
          winRate,
          averageSolveTime: avgSolveTime,
          fastestSolve: statsData.fastestSolveMs ? Math.round(statsData.fastestSolveMs / 1000) : 0,
          longestWinStreak: statsData.longestWinStreak || 0,
          currentWinStreak: statsData.currentWinStreak || 0
        });
      }
    });
    
    // Load ranked stats
    socketService.emit('ranked:get-rating', (ratingData: RankedStats | null) => {
      if (ratingData) {
        setRankedStats(ratingData);
      }
    });
    
    // Load match history
    socketService.emit('ranked:get-match-history', { userId: profileUserId, limit: 10 }, (history: MatchHistoryItem[]) => {
      setMatchHistory(history);
    });
    
    setLoading(false);
  };

  if (!profileUserId) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          {t('profile.notLoggedIn')}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{user?.username || 'Anonymous'}</h1>
          <p className="profile-joined">{t('profile.memberSince', { date: new Date().toLocaleDateString() })}</p>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {t('profile.tabs.overview')}
        </button>
        <button
          className={`profile-tab ${activeTab === 'ranked' ? 'active' : ''}`}
          onClick={() => setActiveTab('ranked')}
        >
          {t('profile.tabs.ranked')}
        </button>
        <button
          className={`profile-tab ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          {t('profile.tabs.badges')}
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="profile-content">
          <div className="profile-stats">
            <h2>{t('profile.statistics')}</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">{t('profile.gamesPlayed')}</div>
                <div className="stat-value">{stats?.gamesPlayed || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t('profile.gamesWon')}</div>
                <div className="stat-value">{stats?.gamesWon || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t('profile.winRate')}</div>
                <div className="stat-value">{stats?.winRate || 0}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t('profile.avgSolveTime')}</div>
                <div className="stat-value">{stats?.averageSolveTime || 0}s</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t('profile.fastestSolve')}</div>
                <div className="stat-value">{stats?.fastestSolve || 0}s</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{t('profile.longestStreak')}</div>
                <div className="stat-value">{stats?.longestWinStreak || 0}</div>
              </div>
            </div>
          </div>

          <LevelIndicator
            currentPoints={badgeData.totalPoints}
            currentLevel={badgeData.level}
            size="large"
            showDetails={true}
            animated={true}
          />
        </div>
      )}

      {activeTab === 'ranked' && (
        <div className="profile-content">
          {rankedStats ? (
            <>
              <RankDisplay
                rating={rankedStats.currentRating}
                peakRating={rankedStats.peakRating}
                wins={rankedStats.wins}
                losses={rankedStats.losses}
                variant="full"
                className="profile-rank-display"
              />

              {rankedStats.placementMatchesRemaining > 0 && (
                <div className="placement-notice">
                  {t('profile.placementMatches', { count: rankedStats.placementMatchesRemaining })}
                </div>
              )}

              <div className="match-history-section">
                <h2>{t('profile.matchHistory')}</h2>
                {matchHistory.length > 0 ? (
                  <div className="match-history-list">
                    {matchHistory.map((match) => (
                      <div key={match.matchId} className={`match-item ${match.result}`}>
                        <div className="match-info">
                          <div className="match-opponent">
                            <span className="vs-label">vs</span>
                            <span className="opponent-name">{match.opponentName}</span>
                            <span className="opponent-rating">({match.opponentRating})</span>
                          </div>
                          <div className="match-mode">{match.gameMode}</div>
                        </div>
                        <div className="match-result">
                          <span className={`result-badge ${match.result}`}>
                            {match.result === 'win' ? t('profile.win') : t('profile.loss')}
                          </span>
                          <span className={`rating-change ${match.ratingChange > 0 ? 'positive' : 'negative'}`}>
                            {match.ratingChange > 0 ? '+' : ''}{match.ratingChange}
                          </span>
                          <span className="new-rating">→ {match.newRating}</span>
                        </div>
                        <div className="match-meta">
                          <span className="match-duration">{Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, '0')}</span>
                          <span className="match-time">{new Date(match.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-matches">
                    {t('profile.noMatchHistory')}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-ranked-stats">
              {t('profile.noRankedStats')}
            </div>
          )}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="profile-content">
          <BadgeShowcase 
            userId={profileUserId} 
            isOwnProfile={isOwnProfile}
          />
        </div>
      )}
    </div>
  );
};

export default Profile;