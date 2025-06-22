import React from 'react';
import { BadgeGallery } from './BadgeGallery/BadgeGallery';
import './BadgesPage.css';
import './badges-theme-fix.css';

interface BadgesPageProps {
  userId?: string;
}

export const BadgesPage: React.FC<BadgesPageProps> = ({ userId }) => {
  // For demo purposes, use a default user ID if none provided
  const currentUserId = userId || 'demo-user-123';

  return (
    <div className="badges-page">
      <BadgeGallery userId={currentUserId} />
    </div>
  );
};