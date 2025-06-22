import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { BadgeShowcase } from '../Badges/BadgeShowcase';
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

export const Profile: React.FC<ProfileProps> = ({ userId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const profileUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    if (profileUserId) {
      loadPlayerStats();
    }
  }, [profileUserId]);

  const loadPlayerStats = async () => {
    // TODO: Load stats from server
    // For now, using placeholder data
    setStats({
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      averageSolveTime: 0,
      fastestSolve: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
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