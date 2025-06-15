import React, { useEffect, useState } from 'react';
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
  const [roomTypes, setRoomTypes] = useState<RoomTypeInfo[]>([]);
  
  useEffect(() => {
    socketService.getRoomTypes((types) => {
      setRoomTypes(types);
    });
  }, []);
  
  return (
    <div className="room-type-selector">
      <h2>Choose Game Mode</h2>
      <div className="room-type-grid">
        {roomTypes.map(type => (
          <div
            key={type.id}
            className={`room-type-card ${selectedType === type.id ? 'selected' : ''} ${type.id}`}
            onClick={() => onSelectType(type.id)}
          >
            <div className="card-header">
              <div className="icon-wrapper">
                {type.id === 'classic' && (
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="5" width="14" height="14" rx="2" />
                    <path d="M9 9h6m-6 6h6" />
                  </svg>
                )}
                {type.id === 'super' && (
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
              </div>
              <h3>{type.displayName}</h3>
            </div>
            
            <div className="card-content">
              <p className="description">{type.description}</p>
              
              <div className="mode-details">
                <div className="detail-item">
                  <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>{type.playerCount} Players</span>
                </div>
                
                {type.id === 'super' && (
                  <div className="detail-item">
                    <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="9" rx="1" />
                      <rect x="14" y="3" width="7" height="9" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    <span>8 Cards</span>
                  </div>
                )}
              </div>
              
              <div className="features">
                {type.features.hasTournamentMode && (
                  <span className="feature-tag">Tournaments</span>
                )}
                {type.id === 'super' && (
                  <span className="feature-tag">Complexity Scoring</span>
                )}
              </div>
            </div>
            
            <div className="card-footer">
              <button className="select-button">
                {selectedType === type.id ? 'Selected' : 'Select Mode'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};