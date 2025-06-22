import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BadgeCategory } from '../../../types/badges';

interface BadgeFilterProps {
  selectedCategory: BadgeCategory | 'all';
  onCategoryChange: (category: BadgeCategory | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showEarnedOnly: boolean;
  onEarnedOnlyChange: (show: boolean) => void;
  categoryStats: Record<BadgeCategory | 'all', { total: number; earned: number }>;
}

const BadgeFilter: React.FC<BadgeFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  showEarnedOnly,
  onEarnedOnlyChange,
  categoryStats
}) => {
  const { t } = useTranslation();

  const categories: Array<{ id: BadgeCategory | 'all'; icon: string }> = [
    { id: 'all', icon: '🏆' },
    { id: 'skill', icon: '⚡' },
    { id: 'progression', icon: '📈' },
    { id: 'mode', icon: '🎮' },
    { id: 'social', icon: '👥' },
    { id: 'unique', icon: '⭐' },
    { id: 'seasonal', icon: '🎉' }
  ];

  return (
    <div className="badge-filter-container">
      <div className="badge-search">
        <input
          type="text"
          className="badge-search-input"
          placeholder={t('badges.filter.searchPlaceholder', 'Search badges...')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="badge-categories">
        {categories.map(category => {
          const stats = categoryStats[category.id];
          const percentage = stats.total > 0 
            ? Math.round((stats.earned / stats.total) * 100) 
            : 0;

          return (
            <button
              key={category.id}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => onCategoryChange(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">
                {t(`badges.categories.${category.id}`, (() => {
                  switch(category.id) {
                    case 'all': return 'All';
                    case 'skill': return 'Skill';
                    case 'progression': return 'Progression';
                    case 'mode': return 'Game Modes';
                    case 'social': return 'Social';
                    case 'unique': return 'Unique';
                    case 'seasonal': return 'Seasonal';
                    default: return 'Unknown';
                  }
                })())}
              </span>
              <div className="category-stats">
                <span className="earned-count">{stats.earned}</span>
                <span className="separator">/</span>
                <span className="total-count">{stats.total}</span>
              </div>
              <div className="category-progress">
                <div 
                  className="progress-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="badge-filter-options">
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showEarnedOnly}
            onChange={(e) => onEarnedOnlyChange(e.target.checked)}
          />
          <span>{t('badges.filter.showEarnedOnly', 'Show earned badges only')}</span>
        </label>
      </div>
    </div>
  );
};

export default BadgeFilter;