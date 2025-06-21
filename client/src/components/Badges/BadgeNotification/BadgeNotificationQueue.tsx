import React, { useState, useEffect, useCallback } from 'react';
import socketService from '../../../services/socketService';
import { BadgeUnlockNotification as BadgeUnlock } from '../../../types/badges';
import { BadgeUnlockNotification } from './BadgeUnlockNotification';
import './BadgeNotificationQueue.css';

interface BadgeNotificationQueueProps {
  onShowBadgeDetails?: (badgeId: string) => void;
}

export const BadgeNotificationQueue: React.FC<BadgeNotificationQueueProps> = ({
  onShowBadgeDetails
}) => {
  const [notificationQueue, setNotificationQueue] = useState<BadgeUnlock[]>([]);
  const [currentNotification, setCurrentNotification] = useState<BadgeUnlock | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Listen for badge unlock events
  useEffect(() => {
    const handleBadgesUnlocked = (badges: BadgeUnlock[]) => {
      console.log('Badges unlocked:', badges);
      setNotificationQueue(prev => [...prev, ...badges]);
    };

    socketService.on('badges-unlocked', handleBadgesUnlocked);

    return () => {
      socketService.off('badges-unlocked', handleBadgesUnlocked);
    };
  }, []);

  // Process notification queue
  useEffect(() => {
    if (!isProcessing && notificationQueue.length > 0 && !currentNotification) {
      setIsProcessing(true);
      const [nextNotification, ...remainingQueue] = notificationQueue;
      setCurrentNotification(nextNotification);
      setNotificationQueue(remainingQueue);
    }
  }, [notificationQueue, currentNotification, isProcessing]);

  const handleNotificationClose = useCallback(() => {
    setCurrentNotification(null);
    setIsProcessing(false);
  }, []);

  const handleShowDetails = useCallback(() => {
    if (currentNotification && onShowBadgeDetails) {
      onShowBadgeDetails(currentNotification.badge.id);
      handleNotificationClose();
    }
  }, [currentNotification, onShowBadgeDetails, handleNotificationClose]);

  if (!currentNotification) {
    return null;
  }

  return (
    <div className="badge-notification-queue">
      <BadgeUnlockNotification
        notification={currentNotification}
        onClose={handleNotificationClose}
        onShowDetails={onShowBadgeDetails ? handleShowDetails : undefined}
      />
      
      {/* Show queue count if there are more badges waiting */}
      {notificationQueue.length > 0 && (
        <div className="queue-indicator">
          <span className="queue-count">+{notificationQueue.length}</span>
          <span className="queue-text">more badges</span>
        </div>
      )}
    </div>
  );
};