# Room Type Frontend UI/UX Design

## Overview
This document outlines the frontend design for room type selection and game mode features in the 24 Points game.

## UI Components

### 1. Room Type Selector Component

```typescript
// client/src/components/RoomTypeSelector/RoomTypeSelector.tsx
interface RoomTypeSelectorProps {
  onSelectType: (typeId: string) => void;
  selectedType?: string;
}

const RoomTypeSelector: React.FC<RoomTypeSelectorProps> = ({ onSelectType, selectedType }) => {
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
          <RoomTypeCard
            key={type.id}
            type={type}
            isSelected={selectedType === type.id}
            onClick={() => onSelectType(type.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### 2. Room Type Card Design

```typescript
// client/src/components/RoomTypeCard/RoomTypeCard.tsx
interface RoomTypeCardProps {
  type: RoomTypeInfo;
  isSelected: boolean;
  onClick: () => void;
}

const RoomTypeCard: React.FC<RoomTypeCardProps> = ({ type, isSelected, onClick }) => {
  return (
    <div 
      className={`room-type-card ${isSelected ? 'selected' : ''} ${type.id}`}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="icon-wrapper">
          {type.id === 'classic' && <ClassicIcon />}
          {type.id === 'team2v2' && <TeamIcon />}
          {type.id === 'super' && <SuperIcon />}
        </div>
        <h3>{type.displayName}</h3>
      </div>
      
      <div className="card-content">
        <p className="description">{type.description}</p>
        
        <div className="mode-details">
          <div className="detail-item">
            <UsersIcon />
            <span>{type.playerCount} Players</span>
          </div>
          
          {type.teamBased && (
            <div className="detail-item">
              <TeamFlagIcon />
              <span>Team Battle</span>
            </div>
          )}
        </div>
        
        <div className="features">
          {type.features.hasVoice && <span className="feature-tag">Voice Chat</span>}
          {type.features.hasTournamentMode && <span className="feature-tag">Tournaments</span>}
        </div>
      </div>
      
      <div className="card-footer">
        <button className="select-button">
          {isSelected ? 'Selected' : 'Select Mode'}
        </button>
      </div>
    </div>
  );
};
```

### 3. Enhanced Lobby Component

```typescript
// client/src/components/Lobby/Lobby.tsx (Updated)
const Lobby: React.FC = () => {
  const [selectedRoomType, setSelectedRoomType] = useState<string>('classic');
  const [showRoomOptions, setShowRoomOptions] = useState(false);
  const [roomOptions, setRoomOptions] = useState<RoomCreationOptions>({});
  
  const handleCreateRoom = () => {
    socketService.createRoom(
      playerName, 
      selectedRoomType,
      roomOptions,
      (response) => {
        if (response.success) {
          navigate(`/room/${response.room.id}`);
        }
      }
    );
  };
  
  const handleQuickMatch = () => {
    socketService.findMatch(
      selectedRoomType,
      { skillLevel: 'auto' },
      (response) => {
        if (response.success) {
          navigate(`/room/${response.roomId}`);
        }
      }
    );
  };
  
  return (
    <div className="lobby">
      <div className="lobby-header">
        <h1>24 Points Arena</h1>
      </div>
      
      <RoomTypeSelector
        selectedType={selectedRoomType}
        onSelectType={setSelectedRoomType}
      />
      
      <div className="lobby-actions">
        <button 
          className="quick-match-btn"
          onClick={handleQuickMatch}
        >
          <BoltIcon />
          Quick Match
        </button>
        
        <button 
          className="create-room-btn"
          onClick={() => setShowRoomOptions(true)}
        >
          <PlusIcon />
          Create Room
        </button>
        
        <button 
          className="browse-rooms-btn"
          onClick={() => navigate('/browse')}
        >
          <SearchIcon />
          Browse Rooms
        </button>
      </div>
      
      {showRoomOptions && (
        <RoomOptionsModal
          roomType={selectedRoomType}
          onConfirm={(options) => {
            setRoomOptions(options);
            handleCreateRoom();
          }}
          onCancel={() => setShowRoomOptions(false)}
        />
      )}
    </div>
  );
};
```

### 4. Room Browser with Filters

```typescript
// client/src/components/RoomBrowser/RoomBrowser.tsx
const RoomBrowser: React.FC = () => {
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [filters, setFilters] = useState({
    roomType: 'all',
    showFull: false,
    showPrivate: false,
  });
  
  return (
    <div className="room-browser">
      <div className="browser-header">
        <h2>Find a Game</h2>
        <RoomFilters 
          filters={filters}
          onChange={setFilters}
        />
      </div>
      
      <div className="rooms-list">
        {rooms.map(room => (
          <RoomListItem
            key={room.id}
            room={room}
            onJoin={() => handleJoinRoom(room.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### 5. Team Selection UI (for 2v2 mode)

```typescript
// client/src/components/TeamSelection/TeamSelection.tsx
const TeamSelection: React.FC<{ room: TypedGameRoom }> = ({ room }) => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  
  return (
    <div className="team-selection">
      <h2>Choose Your Team</h2>
      
      <div className="teams-container">
        {room.teams?.map(team => (
          <div 
            key={team.id}
            className={`team-card ${selectedTeam === team.id ? 'selected' : ''}`}
            style={{ borderColor: team.color }}
          >
            <h3 style={{ color: team.color }}>{team.name}</h3>
            
            <div className="team-players">
              {team.playerIds.map(playerId => {
                const player = room.players.find(p => p.id === playerId);
                return (
                  <div key={playerId} className="team-player">
                    <UserIcon />
                    <span>{player?.name || 'Empty Slot'}</span>
                  </div>
                );
              })}
              
              {/* Empty slots */}
              {Array(2 - team.playerIds.length).fill(0).map((_, i) => (
                <div key={`empty-${i}`} className="team-player empty">
                  <UserPlusIcon />
                  <span>Waiting for player...</span>
                </div>
              ))}
            </div>
            
            <button 
              className="join-team-btn"
              onClick={() => handleJoinTeam(team.id)}
              disabled={team.playerIds.length >= 2}
            >
              Join {team.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 6. Super Mode UI Enhancements

```typescript
// client/src/components/SuperModeTable/SuperModeTable.tsx
const SuperModeTable: React.FC<{ centerCards: Card[] }> = ({ centerCards }) => {
  return (
    <div className="super-mode-table">
      <div className="cards-grid super-grid">
        {centerCards.map((card, index) => (
          <Card
            key={card.id}
            card={card}
            index={index}
            className="super-card"
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          />
        ))}
      </div>
      
      <div className="super-mode-hint">
        <LightbulbIcon />
        <span>Use any combination of the 7 cards!</span>
      </div>
    </div>
  );
};
```

## CSS Styling

```css
/* Room Type Selector */
.room-type-selector {
  padding: 2rem;
  text-align: center;
}

.room-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  max-width: 1000px;
  margin: 2rem auto;
}

/* Room Type Cards */
.room-type-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.room-type-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

.room-type-card.selected {
  border-color: #00d4ff;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.room-type-card.classic::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 107, 107, 0.1) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}

.room-type-card.team2v2::before {
  background: radial-gradient(circle, rgba(78, 205, 196, 0.1) 0%, transparent 70%);
}

.room-type-card.super::before {
  background: radial-gradient(circle, rgba(255, 195, 0, 0.1) 0%, transparent 70%);
}

/* Team Selection */
.team-selection {
  padding: 2rem;
}

.teams-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

.team-card {
  background: rgba(26, 26, 46, 0.8);
  border: 3px solid;
  border-radius: 12px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.team-card.selected {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.team-players {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.team-player {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.team-player.empty {
  opacity: 0.5;
  border: 2px dashed rgba(255, 255, 255, 0.2);
}

/* Super Mode */
.super-mode-table {
  position: relative;
}

.cards-grid.super-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.super-grid .card:nth-child(7) {
  grid-column: 2 / 4;
  grid-row: 2;
}

.super-mode-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  color: #ffc107;
  font-size: 0.9rem;
}

/* Animations */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .room-type-grid {
    grid-template-columns: 1fr;
  }
  
  .teams-container {
    grid-template-columns: 1fr;
  }
  
  .cards-grid.super-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }
  
  .super-grid .card:nth-child(7) {
    grid-column: 2;
    grid-row: 3;
  }
}
```

## User Flow

### 1. Room Creation Flow
```
Main Menu → Select Game Mode → Quick Match / Create Room
                                    ↓              ↓
                              Auto-match    Room Options
                                    ↓              ↓
                               Join Game    Create & Wait
```

### 2. Team Mode Flow
```
Join Team Room → Team Selection → Waiting Room → Game Start
                      ↓
                 Auto-balance if needed
```

### 3. Super Mode Flow
```
Join Super Room → See 7-card layout → Special UI hints → Enhanced scoring display
```

## Benefits

1. **Clear Visual Hierarchy**: Easy to understand game modes
2. **Smooth Transitions**: Animated cards and selections
3. **Responsive Design**: Works on all screen sizes
4. **Intuitive Flow**: Natural progression through screens
5. **Visual Feedback**: Clear indication of selections and states