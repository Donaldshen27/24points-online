import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import socketService from '../../../services/socketService';
import { 
  BadgeDefinition, 
  UserBadge, 
  BadgeProgress,
  BadgeCategory,
  UserBadgeCollection
} from '../../../types/badges';
import BadgeCard from './BadgeCard';
import BadgeFilter from './BadgeFilter';
import BadgeDetailModal from './BadgeDetailModal';
import { CLIENT_BADGE_DEFINITIONS } from '../../../data/badgeDefinitions';
import './BadgeGallery.css';

interface BadgeGalleryProps {
  userId: string;
}

export const BadgeGallery: React.FC<BadgeGalleryProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);
  const [badgeCollection, setBadgeCollection] = useState<UserBadgeCollection>({
    earned: [],
    inProgress: [],
    totalPoints: 0,
    level: 1
  });

  // Use client-side badge definitions
  const badgeDefinitions = CLIENT_BADGE_DEFINITIONS;

  useEffect(() => {
    fetchBadgeData();
  }, [userId]);

  const fetchBadgeData = async () => {
    setLoading(true);
    try {
      // Fetch user's badge collection
      socketService.emit('get-user-badges', { userId }, (collection: UserBadgeCollection) => {
        setBadgeCollection(collection);
        setLoading(false);
      });
    } catch (error) {
      console.error('Error fetching badge data:', error);
      setLoading(false);
    }
  };

  // Group badges by category
  const badgesByCategory = useMemo(() => {
    const grouped: Record<BadgeCategory, BadgeDefinition[]> = {
      skill: [],
      progression: [],
      mode: [],
      social: [],
      unique: [],
      seasonal: []
    };

    badgeDefinitions.forEach(badge => {
      grouped[badge.category].push(badge);
    });

    return grouped;
  }, [badgeDefinitions]);

  // Filter badges based on search and filters
  const filteredBadges = useMemo(() => {
    let badges = selectedCategory === 'all' 
      ? badgeDefinitions 
      : badgesByCategory[selectedCategory] || [];

    // Filter by search query
    if (searchQuery) {
      badges = badges.filter(badge => 
        badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by earned status
    if (showEarnedOnly) {
      const earnedIds = new Set(badgeCollection.earned.map(b => b.badgeId));
      badges = badges.filter(badge => earnedIds.has(badge.id));
    }

    return badges;
  }, [selectedCategory, badgeDefinitions, badgesByCategory, searchQuery, showEarnedOnly, badgeCollection.earned]);

  // Get badge status
  const getBadgeStatus = (badgeId: string): 'earned' | 'in-progress' | 'locked' => {
    if (badgeCollection.earned.some(b => b.badgeId === badgeId)) {
      return 'earned';
    }
    if (badgeCollection.inProgress.some(b => b.badgeId === badgeId)) {
      return 'in-progress';
    }
    return 'locked';
  };

  // Get badge progress
  const getBadgeProgress = (badgeId: string): BadgeProgress | undefined => {
    return badgeCollection.inProgress.find(p => p.badgeId === badgeId);
  };

  // Calculate category stats
  const categoryStats = useMemo(() => {
    const stats: Record<BadgeCategory | 'all', { total: number; earned: number }> = {
      all: { total: badgeDefinitions.length, earned: 0 },
      skill: { total: 0, earned: 0 },
      progression: { total: 0, earned: 0 },
      mode: { total: 0, earned: 0 },
      social: { total: 0, earned: 0 },
      unique: { total: 0, earned: 0 },
      seasonal: { total: 0, earned: 0 }
    };

    const earnedIds = new Set(badgeCollection.earned.map(b => b.badgeId));

    badgeDefinitions.forEach(badge => {
      stats[badge.category].total++;
      stats.all.total = badgeDefinitions.length;
      
      if (earnedIds.has(badge.id)) {
        stats[badge.category].earned++;
        stats.all.earned++;
      }
    });

    return stats;
  }, [badgeDefinitions, badgeCollection.earned]);

  if (loading) {
    return (
      <div className="badge-gallery-loading">
        <div className="loading-spinner"></div>
        <p>{t('badges.loading')}</p>
      </div>
    );
  }

  return (
    <div className="badge-gallery-container">
      <div className="badge-gallery-header">
        <h2 className="gallery-title">{t('badges.gallery.title')}</h2>
        <div className="player-level-info">
          <div className="level-badge">
            <span className="level-label">{t('badges.level')}</span>
            <span className="level-number">{badgeCollection.level}</span>
          </div>
          <div className="points-info">
            <span className="points-value">{badgeCollection.totalPoints}</span>
            <span className="points-label">{t('badges.points')}</span>
          </div>
        </div>
      </div>

      <BadgeFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showEarnedOnly={showEarnedOnly}
        onEarnedOnlyChange={setShowEarnedOnly}
        categoryStats={categoryStats}
      />

      <div className="badge-gallery-grid">
        {filteredBadges.length === 0 ? (
          <div className="no-badges-message">
            <p>{t('badges.gallery.noBadgesFound')}</p>
          </div>
        ) : (
          filteredBadges.map(badge => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              status={getBadgeStatus(badge.id)}
              progress={getBadgeProgress(badge.id)}
              onClick={() => setSelectedBadge(badge)}
            />
          ))
        )}
      </div>

      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          status={getBadgeStatus(selectedBadge.id)}
          progress={getBadgeProgress(selectedBadge.id)}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};