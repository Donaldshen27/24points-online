import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RoomTypeInfo } from '../../types/roomTypes';
import socketService from '../../services/socketService';
import './RoomTypeSelector.css';

interface RoomTypeSelectorProps {
  onSelectType: (typeId: string) => void;
  selectedType?: string;
}

export const RoomTypeSelector: React.FC<RoomTypeSelectorProps> = ({ 
  onSelectType, 
  selectedType = 'classic' 
}) => {
  const { t } = useTranslation();
  const [roomTypes, setRoomTypes] = useState<RoomTypeInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    socketService.getRoomTypes((types) => {
      setRoomTypes(types);
      // Set initial index based on selected type
      const selectedIndex = types.findIndex(t => t.id === selectedType);
      if (selectedIndex !== -1) {
        setCurrentIndex(selectedIndex);
      }
    });
  }, [selectedType]);
  
  const handlePrevious = () => {
    if (isAnimating || roomTypes.length === 0) return;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
    
    const newIndex = currentIndex === 0 ? roomTypes.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onSelectType(roomTypes[newIndex].id);
  };
  
  const handleNext = () => {
    if (isAnimating || roomTypes.length === 0) return;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
    
    const newIndex = currentIndex === roomTypes.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    onSelectType(roomTypes[newIndex].id);
  };
  
  if (roomTypes.length === 0) {
    return <div className="room-type-selector">{t('roomTypeSelector.loading')}</div>;
  }
  
  const currentType = roomTypes[currentIndex];
  const prevIndex = currentIndex === 0 ? roomTypes.length - 1 : currentIndex - 1;
  const nextIndex = currentIndex === roomTypes.length - 1 ? 0 : currentIndex + 1;
  
  const getIcon = (typeId: string) => {
    switch (typeId) {
      case 'classic':
        return (
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" role="img" aria-label="Classic mode icon">
            <rect x="5" y="5" width="14" height="14" rx="2" />
            <path d="M9 9h6m-6 6h6" />
          </svg>
        );
      case 'super':
        return (
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" role="img" aria-label="Super mode icon">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      case 'extended':
        return (
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" role="img" aria-label="Extended mode icon">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
            <path d="M2 17L12 22L22 17" />
            <path d="M2 12L12 17L22 12" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  const getCardDetails = (type: RoomTypeInfo) => {
    const details = [];
    
    // Player count
    details.push(
      <div key="players" className="detail-item">
        <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" role="img" aria-label="Players icon">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>{t('roomTypeSelector.players', { count: type.playerCount })}</span>
      </div>
    );
    
    // Special details for different modes
    if (type.id === 'super') {
      details.push(
        <div key="cards" className="detail-item">
          <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" role="img" aria-label="Cards icon">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="9" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>{t('roomTypeSelector.cards', { count: 8 })}</span>
        </div>
      );
    } else if (type.id === 'extended') {
      details.push(
        <div key="range" className="detail-item">
          <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" role="img" aria-label="Card range icon">
            <line x1="2" y1="12" x2="22" y2="12" />
            <polyline points="12 2 22 12 12 22" />
          </svg>
          <span>{t('roomTypeSelector.cardsRange', { min: 1, max: 20 })}</span>
        </div>
      );
    }
    
    return details;
  };
  
  const getFeatureTags = (type: RoomTypeInfo) => {
    const tags = [];
    
    if (type.features.hasTournamentMode) {
      tags.push(<span key="tournament" className="feature-tag">{t('roomTypeSelector.features.tournaments')}</span>);
    }
    
    if (type.id === 'super') {
      tags.push(<span key="complexity" className="feature-tag">{t('roomTypeSelector.features.complexityScoring')}</span>);
    } else if (type.id === 'extended') {
      tags.push(<span key="bonus" className="feature-tag">{t('roomTypeSelector.features.highCardBonus')}</span>);
    }
    
    return tags;
  };
  
  return (
    <div className="room-type-selector">
      <h2>{t('roomTypeSelector.title')}</h2>
      
      <div className="carousel-container">
        <button 
          className="carousel-arrow left"
          onClick={handlePrevious}
          disabled={isAnimating}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" role="img" aria-label="Previous room type">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        
        <div className="carousel-track">
          {/* Previous card */}
          <div className={`room-type-card side-card prev ${roomTypes[prevIndex].id}`}>
            <div className="card-header">
              <div className="icon-wrapper">
                {getIcon(roomTypes[prevIndex].id)}
              </div>
              <h3>{roomTypes[prevIndex].displayName}</h3>
            </div>
          </div>
          
          {/* Current card */}
          <div className={`room-type-card current ${currentType.id} ${isAnimating ? 'animating' : ''}`}>
            <div className="card-header">
              <div className="icon-wrapper">
                {getIcon(currentType.id)}
              </div>
              <h3>{currentType.displayName}</h3>
            </div>
            
            <div className="card-content">
              <p className="description">{currentType.description}</p>
              
              <div className="mode-details">
                {getCardDetails(currentType)}
              </div>
              
              <div className="features">
                {getFeatureTags(currentType)}
              </div>
            </div>
            
            <div className="card-footer">
              <button className="select-button">
                {selectedType === currentType.id ? t('roomTypeSelector.buttons.selected') : t('roomTypeSelector.buttons.selectMode')}
              </button>
            </div>
          </div>
          
          {/* Next card */}
          <div className={`room-type-card side-card next ${roomTypes[nextIndex].id}`}>
            <div className="card-header">
              <div className="icon-wrapper">
                {getIcon(roomTypes[nextIndex].id)}
              </div>
              <h3>{roomTypes[nextIndex].displayName}</h3>
            </div>
          </div>
        </div>
        
        <button 
          className="carousel-arrow right"
          onClick={handleNext}
          disabled={isAnimating}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" role="img" aria-label="Next room type">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      
      <div className="carousel-indicators">
        {roomTypes.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              if (!isAnimating) {
                setCurrentIndex(index);
                onSelectType(roomTypes[index].id);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};