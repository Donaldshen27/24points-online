import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import socketService from '../../../services/socketService';
import type { UserBadge, BadgeRarity, BadgeTier } from '../../../../../shared/types/badges';
import './BadgeShowcase.css';

// Extended UserBadge type with badge details from server
interface EnrichedUserBadge extends UserBadge {
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: BadgeRarity;
  points: number;
  tier?: BadgeTier;
  featured?: boolean;
}

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
  const [featuredBadges, setFeaturedBadges] = useState<EnrichedUserBadge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [allBadges, setAllBadges] = useState<EnrichedUserBadge[]>([]);
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
        const featured = response.badges.filter((badge: EnrichedUserBadge) => badge.featured);
        setFeaturedBadges(featured.slice(0, 5)); // Max 5 featured badges
        
        // Calculate total points and level
        const points = response.badges.reduce((sum: number, badge: EnrichedUserBadge) => {
          const rarityPoints = getRarityPoints(badge.rarity);
          const tierMultiplier = getTierMultiplier(badge.tier);
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

  const getTierMultiplier = (tier?: BadgeTier): number => {
    if (!tier) return 1;
    const tierMap: Record<BadgeTier, number> = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
      diamond: 5
    };
    return tierMap[tier] || 1;
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

  const handleSaveFeatured = (selectedBadges: EnrichedUserBadge[]) => {
    // Update featured status
    socketService.emit('update-featured-badges', {
      userId,
      badgeIds: selectedBadges.map(b => b.badgeId)
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
          <span className="points-indicator">{totalPoints} {t('badges.points', 'Points')}</span>
        </div>
        <div className="featured-badges-row">
          {featuredBadges.length > 0 ? (
            featuredBadges.map(badge => (
              <div key={badge.badgeId} className={`showcase-badge ${badge.rarity}`}>
                <span className="badge-emoji">{badge.icon}</span>
                {badge.tier && (
                  <span className="tier-indicator">{badge.tier}</span>
                )}
              </div>
            ))
          ) : (
            <span className="no-badges">{t('badges.noFeaturedBadges', 'No featured badges selected')}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="badge-showcase">
      <div className="showcase-header">
        <h3>{t('badges.featuredBadges', 'Featured Badges')}</h3>
        {isOwnProfile && user?.id === userId && (
          <button className="edit-button" onClick={handleEditClick}>
            {t('badges.edit', 'Edit')}
          </button>
        )}
      </div>

      <div className="player-stats">
        <div className="stat-item">
          <span className="stat-label">{t('badges.level', 'Level')}</span>
          <span className="stat-value level">Lv.{playerLevel}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('badges.totalPoints', 'Total Points')}</span>
          <span className="stat-value points">{totalPoints}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('badges.totalBadges', 'Total Badges')}</span>
          <span className="stat-value">{allBadges.length}</span>
        </div>
      </div>

      <div className="featured-badges-grid">
        {featuredBadges.length > 0 ? (
          featuredBadges.map(badge => (
            <div key={badge.badgeId} className={`featured-badge ${badge.rarity}`}>
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-info">
                <div className="badge-name">{badge.name}</div>
                {badge.tier && (
                  <div className="badge-tier">Tier {badge.tier}</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-showcase">
            <p>{t('badges.noFeaturedBadges', 'No featured badges selected')}</p>
            {isOwnProfile && user?.id === userId && (
              <button className="select-badges-button" onClick={handleEditClick}>
                {t('badges.selectBadges', 'Select Badges')}
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
  allBadges: EnrichedUserBadge[];
  selectedBadges: EnrichedUserBadge[];
  onSave: (badges: EnrichedUserBadge[]) => void;
  onCancel: () => void;
}

const BadgeSelector: React.FC<BadgeSelectorProps> = ({
  allBadges,
  selectedBadges,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<EnrichedUserBadge[]>(selectedBadges);

  const toggleBadge = (badge: EnrichedUserBadge) => {
    if (selected.find(b => b.badgeId === badge.badgeId)) {
      setSelected(selected.filter(b => b.badgeId !== badge.badgeId));
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
        <h3>{t('badges.selectFeaturedBadges', 'Select Featured Badges')}</h3>
        <p className="selector-hint">
          {t('badges.selectUpTo', 'Select up to 5 badges to feature on your profile', { count: 5 })} ({selected.length}/5)
        </p>

        <div className="badge-grid">
          {allBadges.map(badge => (
            <div
              key={badge.badgeId}
              className={`selectable-badge ${badge.rarity} ${
                selected.find(b => b.badgeId === badge.badgeId) ? 'selected' : ''
              }`}
              onClick={() => toggleBadge(badge)}
            >
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-name">{badge.name}</div>
              {badge.tier && (
                <div className="badge-tier">T{badge.tier}</div>
              )}
              <div className="selection-indicator">
                {selected.find(b => b.badgeId === badge.badgeId) && '✓'}
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