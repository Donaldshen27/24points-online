import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import socketService from '../../../services/socketService';
import { badgeService } from '../../../services/badgeService';
import type { 
  BadgeDefinition, 
  BadgeProgress,
  BadgeCategory,
  UserBadgeCollection
} from '../../../types/badges';
import BadgeCard from './BadgeCard';
import BadgeFilter from './BadgeFilter';
import BadgeDetailModal from './BadgeDetailModal';
import { CLIENT_BADGE_DEFINITIONS } from '../../../data/badgeDefinitions';
import { LevelIndicator } from '../BadgeProgress';
import './BadgeGallery.css';

interface BadgeGalleryProps {
  userId: string;
}

export const BadgeGallery: React.FC<BadgeGalleryProps> = ({ userId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);
  const [badgeDefinitions, setBadgeDefinitions] = useState<BadgeDefinition[]>(CLIENT_BADGE_DEFINITIONS);
  const [badgeCollection, setBadgeCollection] = useState<UserBadgeCollection>({
    earned: [],
    inProgress: [],
    statistics: {
      userId: userId,
      username: '',
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      currentWinStreak: 0,
      longestWinStreak: 0,
      totalRoundsPlayed: 0,
      totalFirstSolves: 0,
      totalCorrectSolutions: 0,
      totalIncorrectAttempts: 0,
      totalSolveTimeMs: 0,
      classicWins: 0,
      superModeWins: 0,
      extendedRangeWins: 0,
      soloPuzzlesCompleted: 0,
      consecutiveDaysPlayed: 0,
      weekendGames: 0,
      nightGames: 0,
      earlyGames: 0,
      uniqueOpponents: 0,
      gamesSpectated: 0,
      comebackWins: 0,
      underdogWins: 0,
      perfectGames: 0,
      flawlessVictories: 0,
      totalCardsWon: 0,
      totalCardsLost: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    totalPoints: 0,
    level: 1
  });

  useEffect(() => {
    fetchBadgeData();
    // Refresh badge definitions from API if needed
    if (user) {
      badgeService.refreshDefinitionsIfNeeded().then(() => {
        const cached = localStorage.getItem('badgeDefinitions');
        if (cached) {
          setBadgeDefinitions(JSON.parse(cached));
        }
      });
    }
  }, [userId, user]);

  const fetchBadgeData = async () => {
    setLoading(true);
    try {
      // For authenticated users, use the API
      if (user && user.id === userId) {
        const response = await badgeService.getUserBadges();
        
        // Calculate level from total points
        const totalPoints = response.badges.reduce((sum, badge) => {
          const definition = badgeDefinitions.find(d => d.id === badge.badgeId);
          return sum + (definition?.points || 0);
        }, 0);
        
        const levelInfo = badgeService.calculateLevel(totalPoints);
        
        setBadgeCollection({
          earned: response.badges,
          inProgress: response.progress || [],
          statistics: response.statistics || {
              userId: userId,
              username: '',
              gamesPlayed: 0,
              gamesWon: 0,
              gamesLost: 0,
              currentWinStreak: 0,
              longestWinStreak: 0,
              totalRoundsPlayed: 0,
              totalFirstSolves: 0,
              totalCorrectSolutions: 0,
              totalIncorrectAttempts: 0,
              totalSolveTimeMs: 0,
              classicWins: 0,
              superModeWins: 0,
              extendedRangeWins: 0,
              soloPuzzlesCompleted: 0,
              consecutiveDaysPlayed: 0,
              weekendGames: 0,
              nightGames: 0,
              earlyGames: 0,
              uniqueOpponents: 0,
              gamesSpectated: 0,
              comebackWins: 0,
              underdogWins: 0,
              perfectGames: 0,
              flawlessVictories: 0,
              totalCardsWon: 0,
              totalCardsLost: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            totalPoints: totalPoints,
            level: levelInfo.level
        });
        setLoading(false);
      } else {
        // For non-authenticated users or viewing others, use Socket.io
        socketService.emit('get-user-badges', { userId }, (response: any) => {
          if (response && response.success) {
            setBadgeCollection({
              earned: response.badges || [],
              inProgress: response.inProgress || [],
              statistics: response.statistics || badgeCollection.statistics,
              totalPoints: response.totalPoints || 0,
              level: response.level || 1
            });
          } else {
            console.warn('Invalid badge collection response:', response);
          }
          setLoading(false);
        });
      }
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
      const earnedIds = new Set((badgeCollection.earned || []).map(b => b.badgeId));
      badges = badges.filter(badge => earnedIds.has(badge.id));
    }

    return badges;
  }, [selectedCategory, badgeDefinitions, badgesByCategory, searchQuery, showEarnedOnly, badgeCollection.earned]);

  // Get badge status
  const getBadgeStatus = (badgeId: string): 'earned' | 'in-progress' | 'locked' => {
    if ((badgeCollection.earned || []).some(b => b.badgeId === badgeId)) {
      return 'earned';
    }
    if ((badgeCollection.inProgress || []).some(b => b.badgeId === badgeId)) {
      return 'in-progress';
    }
    return 'locked';
  };

  // Get badge progress
  const getBadgeProgress = (badgeId: string): BadgeProgress | undefined => {
    return (badgeCollection.inProgress || []).find(p => p.badgeId === badgeId);
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

    const earnedIds = new Set((badgeCollection.earned || []).map(b => b.badgeId));

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
        <p>{t('badges.loading', 'Loading badges...')}</p>
      </div>
    );
  }

  return (
    <div className="badge-gallery-container">
      <div className="badge-gallery-header">
        <h2 className="gallery-title">{t('badges.gallery.title', 'Badge Collection')}</h2>
      </div>
      
      <LevelIndicator
        currentPoints={badgeCollection.totalPoints}
        currentLevel={badgeCollection.level}
        size="medium"
        showDetails={true}
        animated={true}
      />

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
            <p>{t('badges.gallery.noBadgesFound', 'No badges found matching your criteria')}</p>
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