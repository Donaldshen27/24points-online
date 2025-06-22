import React from 'react';
import socketService from '../../../services/socketService';
import type { BadgeUnlockNotification } from '../../../types/badges';
import { CLIENT_BADGE_DEFINITIONS } from '../../../data/badgeDefinitions';

export const BadgeNotificationTest: React.FC = () => {
  const simulateBadgeUnlock = (badgeId: string) => {
    const badge = CLIENT_BADGE_DEFINITIONS.find(b => b.id === badgeId);
    if (!badge) return;

    const notification: BadgeUnlockNotification = {
      badge,
      earnedAt: new Date()
    };

    // Simulate the socket event
    socketService.emit('badges-unlocked', [notification]);
  };

  const simulateMultipleBadges = () => {
    const badges = CLIENT_BADGE_DEFINITIONS.slice(0, 3);
    const notifications: BadgeUnlockNotification[] = badges.map(badge => ({
      badge,
      earnedAt: new Date()
    }));

    socketService.emit('badges-unlocked', notifications);
  };

  const simulateTierUpgrade = () => {
    const goldBadge = CLIENT_BADGE_DEFINITIONS.find(b => b.id === 'speed_demon_gold');
    if (!goldBadge) return;

    const notification: BadgeUnlockNotification = {
      badge: goldBadge,
      earnedAt: new Date(),
      isNewTier: true,
      previousTier: 'silver'
    };

    socketService.emit('badges-unlocked', [notification]);
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3>Badge Notification Test</h3>
      
      <button onClick={() => simulateBadgeUnlock('perfect_game')}>
        Unlock Perfect Game (Rare)
      </button>
      
      <button onClick={() => simulateBadgeUnlock('flawless_victory')}>
        Unlock Flawless Victory (Epic)
      </button>
      
      <button onClick={() => simulateBadgeUnlock('champion_diamond')}>
        Unlock Champion Diamond (Legendary)
      </button>
      
      <button onClick={simulateTierUpgrade}>
        Simulate Tier Upgrade
      </button>
      
      <button onClick={simulateMultipleBadges}>
        Unlock Multiple Badges
      </button>
    </div>
  );
};