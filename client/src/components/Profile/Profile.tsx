import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { BadgeShowcase } from '../Badges/BadgeShowcase';
import { LevelIndicator } from '../Badges/BadgeProgress';
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

export const Profile: React.FC<ProfileProps> = ({ userId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [badgeData, setBadgeData] = useState<BadgeData>({
    totalPoints: 0,
    level: 1,
    badgeCount: 0
  });
  const [loading, setLoading] = useState(true);

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

      <LevelIndicator
        currentPoints={badgeData.totalPoints}
        currentLevel={badgeData.level}
        size="large"
        showDetails={true}
        animated={true}
      />

      <BadgeShowcase 
        userId={profileUserId} 
        isOwnProfile={isOwnProfile}
      />

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

      <div className="profile-recent-games">
        <h2>{t('profile.recentGames')}</h2>
        <div className="no-games">
          {t('profile.noRecentGames')}
        </div>
      </div>
    </div>
  );
};

export default Profile;