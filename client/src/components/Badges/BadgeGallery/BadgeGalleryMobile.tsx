import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { badgeService } from '../../../services/badgeService';
import type { 
  BadgeDefinition, 
  BadgeCategory,
  UserBadgeCollection
} from '../../../types/badges';
import { CLIENT_BADGE_DEFINITIONS } from '../../../data/badgeDefinitions';
import './BadgeGalleryMobile.css';

interface BadgeGalleryMobileProps {
  userId: string;
}

export const BadgeGalleryMobile: React.FC<BadgeGalleryMobileProps> = ({ userId }) => {
  const { t } = useTranslation();
  const { user: _user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);
  const [badgeDefinitions] = useState<BadgeDefinition[]>(CLIENT_BADGE_DEFINITIONS);
  const [badgeCollection, setBadgeCollection] = useState<UserBadgeCollection | null>(null);

  useEffect(() => {
    fetchBadgeData();
  }, [userId]);

  const fetchBadgeData = async () => {
    try {
      const response = await badgeService.getUserBadges();
      const collection: UserBadgeCollection = {
        earned: response.badges,
        inProgress: response.progress,
        statistics: response.statistics || {
          userId,
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
        totalPoints: response.statistics?.totalCardsWon || 0,
        level: badgeService.calculateLevel(response.statistics?.totalCardsWon || 0).level
      };
      setBadgeCollection(collection);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeIds = useMemo(() => 
    new Set(badgeCollection?.earned.map(b => b.badgeId) || []),
    [badgeCollection?.earned]
  );

  const filteredBadges = useMemo(() => {
    let badges = badgeDefinitions;

    if (selectedCategory !== 'all') {
      badges = badges.filter(b => b.category === selectedCategory);
    }

    if (showEarnedOnly) {
      badges = badges.filter(b => earnedBadgeIds.has(b.id));
    }

    return badges;
  }, [badgeDefinitions, selectedCategory, showEarnedOnly, earnedBadgeIds]);

  const categories: (BadgeCategory | 'all')[] = [
    'all',
    'skill',
    'progression',
    'mode',
    'social',
    'unique',
    'seasonal'
  ];

  const categoryColors = {
    all: '#666',
    skill: '#8B5CF6',
    progression: '#3B82F6',
    mode: '#10B981',
    social: '#F59E0B',
    unique: '#EF4444',
    seasonal: '#EC4899'
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <div className="mobile-badge-loading">
        <div className="mobile-loading-spinner" />
        <p>{t('loadingBadges')}</p>
      </div>
    );
  }

  return (
    <div className="mobile-badge-gallery">
      {/* Header */}
      <div className="mobile-badge-header">
        <div className="mobile-badge-stats">
          <div className="mobile-level-display">
            <span className="mobile-level-label">Level</span>
            <span className="mobile-level-value">{badgeCollection?.level || 1}</span>
          </div>
          <div className="mobile-points-display">
            <span className="mobile-points-value">{badgeCollection?.totalPoints || 0}</span>
            <span className="mobile-points-label">Points</span>
          </div>
        </div>
        
        <button 
          className="mobile-filter-button"
          onClick={() => setShowFilter(!showFilter)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 4h18M7 8h10M10 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Category Pills */}
      <div className="mobile-category-scroll">
        {categories.map(category => (
          <motion.button
            key={category}
            className={`mobile-category-pill ${selectedCategory === category ? 'active' : ''}`}
            style={{
              backgroundColor: selectedCategory === category ? categoryColors[category] : 'transparent',
              borderColor: categoryColors[category]
            }}
            onClick={() => setSelectedCategory(category)}
            whileTap={{ scale: 0.95 }}
          >
            {t(`badge.category.${category}`, category)}
          </motion.button>
        ))}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            className="mobile-filter-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <label className="mobile-filter-option">
              <input
                type="checkbox"
                checked={showEarnedOnly}
                onChange={(e) => setShowEarnedOnly(e.target.checked)}
              />
              <span>{t('showEarnedOnly')}</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge Grid */}
      <div className="mobile-badge-grid">
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge.id);
            const progress = badgeCollection?.inProgress.find(p => p.badgeId === badge.id);
            
            return (
              <motion.div
                key={badge.id}
                className={`mobile-badge-card ${isEarned ? 'earned' : 'locked'}`}
                onClick={() => setSelectedBadge(badge)}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  borderColor: getRarityColor(badge.rarity)
                }}
              >
                <div className="mobile-badge-icon">
                  <span className="mobile-badge-emoji">{badge.icon}</span>
                  {badge.tier && isEarned && (
                    <div className="mobile-tier-badge">
                      {badge.tier}
                    </div>
                  )}
                </div>
                
                <h3 className="mobile-badge-name">{badge.name}</h3>
                
                {progress && (
                  <div className="mobile-badge-progress">
                    <div className="mobile-progress-bar">
                      <div 
                        className="mobile-progress-fill"
                        style={{ 
                          width: `${(progress.currentValue / progress.targetValue) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="mobile-progress-text">
                      {progress.currentValue} / {progress.targetValue}
                    </span>
                  </div>
                )}
                
                <div className="mobile-badge-points">
                  {badge.points} pts
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            className="mobile-badge-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              className="mobile-badge-detail"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-detail-handle" />
              
              <div className="mobile-detail-header">
                <div className="mobile-detail-icon">
                  {selectedBadge.icon}
                </div>
                <h2 className="mobile-detail-name">{selectedBadge.name}</h2>
                <span 
                  className="mobile-detail-rarity"
                  style={{ color: getRarityColor(selectedBadge.rarity) }}
                >
                  {selectedBadge.rarity}
                </span>
              </div>

              <p className="mobile-detail-description">
                {selectedBadge.description}
              </p>

              <div className="mobile-detail-requirements">
                <h3>{t('requirements')}</h3>
                <p>{JSON.stringify(selectedBadge.requirements)}</p>
              </div>

              {selectedBadge.tier && (
                <div className="mobile-detail-tiers">
                  <h3>{t('tier')}</h3>
                  <div className="mobile-tier-info">
                    <span className="mobile-tier-level">
                      {selectedBadge.tier}
                    </span>
                    <span className="mobile-tier-points">
                      {selectedBadge.points} pts
                    </span>
                  </div>
                </div>
              )}

              <button 
                className="mobile-detail-close"
                onClick={() => setSelectedBadge(null)}
              >
                {t('close')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};