import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import socketService from '../../../services/socketService';
import type { UserBadge } from '../../../../../shared/types/badges';
import './BadgeShowcase.css';

interface BadgeShowcaseProps {
  userId: string;
  isOwnProfile?: boolean;
  compact?: boolean;
}

export const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({
  userId,
  isOwnProfile = false,
  compact = false
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [featuredBadges, setFeaturedBadges] = useState<UserBadge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [allBadges, setAllBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadgeData();
  }, [userId]);

  const loadBadgeData = () => {
    setLoading(true);
    
    // Get user's badges
    socketService.emit('get-user-badges', { userId }, (response: any) => {
      if (response.success && response.badges) {
        setAllBadges(response.badges);
        
        // Filter featured badges
        const featured = response.badges.filter(badge => badge.featured);
        setFeaturedBadges(featured.slice(0, 5)); // Max 5 featured badges
        
        // Calculate total points and level
        const points = response.badges.reduce((sum, badge) => {
          const rarityPoints = getRarityPoints(badge.rarity);
          const tierMultiplier = badge.tier || 1;
          return sum + (rarityPoints * tierMultiplier);
        }, 0);
        
        setTotalPoints(points);
        setPlayerLevel(calculateLevel(points));
      }
      setLoading(false);
    });
  };

  const getRarityPoints = (rarity: string): number => {
    const rarityPointMap: Record<string, number> = {
      common: 10,
      rare: 25,
      epic: 50,
      legendary: 100
    };
    return rarityPointMap[rarity] || 10;
  };

  const calculateLevel = (points: number): number => {
    // Simple level calculation: 100 points per level
    return Math.floor(points / 100) + 1;
  };

  const handleEditClick = () => {
    if (isOwnProfile && user?.id === userId) {
      setIsEditing(true);
    }
  };

  const handleSaveFeatured = (selectedBadges: UserBadge[]) => {
    // Update featured status
    socketService.emit('update-featured-badges', {
      userId,
      badgeIds: selectedBadges.map(b => b.badge_id)
    }, (response: any) => {
      if (response.success) {
        setFeaturedBadges(selectedBadges);
        setIsEditing(false);
        loadBadgeData(); // Reload to ensure sync
      }
    });
  };

  if (loading) {
    return <div className="badge-showcase loading">{t('loading')}</div>;
  }

  if (compact) {
    return (
      <div className="badge-showcase compact">
        <div className="showcase-header">
          <span className="level-indicator">Lv.{playerLevel}</span>
          <span className="points-indicator">{totalPoints} pts</span>
        </div>
        <div className="featured-badges-row">
          {featuredBadges.length > 0 ? (
            featuredBadges.map(badge => (
              <div key={badge.badge_id} className={`showcase-badge ${badge.rarity}`}>
                <span className="badge-emoji">{badge.icon}</span>
                {badge.tier && badge.tier > 1 && (
                  <span className="tier-indicator">{badge.tier}</span>
                )}
              </div>
            ))
          ) : (
            <span className="no-badges">{t('badges.noFeaturedBadges')}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="badge-showcase">
      <div className="showcase-header">
        <h3>{t('badges.featuredBadges')}</h3>
        {isOwnProfile && user?.id === userId && (
          <button className="edit-button" onClick={handleEditClick}>
            {t('badges.edit')}
          </button>
        )}
      </div>

      <div className="player-stats">
        <div className="stat-item">
          <span className="stat-label">{t('badges.level')}</span>
          <span className="stat-value level">Lv.{playerLevel}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('badges.totalPoints')}</span>
          <span className="stat-value points">{totalPoints}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('badges.totalBadges')}</span>
          <span className="stat-value">{allBadges.length}</span>
        </div>
      </div>

      <div className="featured-badges-grid">
        {featuredBadges.length > 0 ? (
          featuredBadges.map(badge => (
            <div key={badge.badge_id} className={`featured-badge ${badge.rarity}`}>
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-info">
                <div className="badge-name">{badge.name}</div>
                {badge.tier && badge.tier > 1 && (
                  <div className="badge-tier">Tier {badge.tier}</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-showcase">
            <p>{t('badges.noFeaturedBadges')}</p>
            {isOwnProfile && user?.id === userId && (
              <button className="select-badges-button" onClick={handleEditClick}>
                {t('badges.selectBadges')}
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <BadgeSelector
          allBadges={allBadges}
          selectedBadges={featuredBadges}
          onSave={handleSaveFeatured}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};

// Badge Selector Component (in same file for now)
interface BadgeSelectorProps {
  allBadges: UserBadge[];
  selectedBadges: UserBadge[];
  onSave: (badges: UserBadge[]) => void;
  onCancel: () => void;
}

const BadgeSelector: React.FC<BadgeSelectorProps> = ({
  allBadges,
  selectedBadges,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<UserBadge[]>(selectedBadges);

  const toggleBadge = (badge: UserBadge) => {
    if (selected.find(b => b.badge_id === badge.badge_id)) {
      setSelected(selected.filter(b => b.badge_id !== badge.badge_id));
    } else if (selected.length < 5) {
      setSelected([...selected, badge]);
    }
  };

  const handleSave = () => {
    onSave(selected);
  };

  return (
    <div className="badge-selector-modal">
      <div className="modal-backdrop" onClick={onCancel}></div>
      <div className="modal-content">
        <h3>{t('badges.selectFeaturedBadges')}</h3>
        <p className="selector-hint">
          {t('badges.selectUpTo', { count: 5 })} ({selected.length}/5)
        </p>

        <div className="badge-grid">
          {allBadges.map(badge => (
            <div
              key={badge.badge_id}
              className={`selectable-badge ${badge.rarity} ${
                selected.find(b => b.badge_id === badge.badge_id) ? 'selected' : ''
              }`}
              onClick={() => toggleBadge(badge)}
            >
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-name">{badge.name}</div>
              {badge.tier && badge.tier > 1 && (
                <div className="badge-tier">T{badge.tier}</div>
              )}
              <div className="selection-indicator">
                {selected.find(b => b.badge_id === badge.badge_id) && '✓'}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="cancel-button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button className="save-button" onClick={handleSave}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadgeShowcase;