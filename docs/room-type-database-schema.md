# Room Type Database Schema Design

## Overview
This document defines the database schema changes required to support multiple room types in the 24 Points game. The schema is designed to be flexible, scalable, and support future game modes.

## Database Tables

### 1. room_types
Stores the configuration for each room type.

```sql
CREATE TABLE room_types (
  id VARCHAR(50) PRIMARY KEY,           -- 'classic', 'team2v2', 'super'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  player_count INT NOT NULL,
  cards_per_player INT NOT NULL,
  cards_per_draw INT NOT NULL,
  team_based BOOLEAN DEFAULT FALSE,
  min_players INT NOT NULL,
  max_players INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,       -- Can disable room types
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initial data
INSERT INTO room_types VALUES
  ('classic', 'Classic 1v1', 'Traditional 2-player 24 points game', 2, 10, 2, FALSE, 2, 2, TRUE, NOW(), NOW()),
  ('team2v2', 'Team Battle 2v2', 'Team-based 4-player game', 4, 10, 2, TRUE, 4, 4, TRUE, NOW(), NOW()),
  ('super', 'Super Mode', 'Advanced mode with 7 center cards', 2, 14, 7, FALSE, 2, 2, TRUE, NOW(), NOW());
```

### 2. room_type_rules
Stores the rule configuration for each room type.

```sql
CREATE TABLE room_type_rules (
  room_type_id VARCHAR(50) PRIMARY KEY,
  turn_time_limit INT DEFAULT 120,              -- seconds
  solution_time_limit INT DEFAULT 30,           -- seconds
  scoring_system VARCHAR(20) DEFAULT 'classic', -- 'classic', 'speed', 'complexity'
  win_condition VARCHAR(20) DEFAULT 'no_cards', -- 'no_cards', 'all_cards', 'point_limit', etc
  win_condition_value INT,                      -- e.g., 100 for point_limit
  allow_spectators BOOLEAN DEFAULT FALSE,
  require_exact_match BOOLEAN DEFAULT TRUE,     -- Must equal exactly 24
  bonus_points_enabled BOOLEAN DEFAULT FALSE,
  penalty_points_enabled BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);

-- Initial rules
INSERT INTO room_type_rules VALUES
  ('classic', 120, 30, 'classic', 'no_cards', NULL, FALSE, TRUE, FALSE, TRUE),
  ('team2v2', 180, 45, 'speed', 'all_cards', NULL, TRUE, TRUE, TRUE, TRUE),
  ('super', 150, 40, 'complexity', 'point_limit', 100, TRUE, TRUE, TRUE, TRUE);
```

### 3. room_type_features
Stores available features for each room type.

```sql
CREATE TABLE room_type_features (
  room_type_id VARCHAR(50) PRIMARY KEY,
  has_timer BOOLEAN DEFAULT TRUE,
  has_chat BOOLEAN DEFAULT TRUE,
  has_voice BOOLEAN DEFAULT FALSE,
  has_replay BOOLEAN DEFAULT TRUE,
  has_statistics BOOLEAN DEFAULT TRUE,
  has_tournament_mode BOOLEAN DEFAULT FALSE,
  has_practice_mode BOOLEAN DEFAULT FALSE,
  has_power_cards BOOLEAN DEFAULT FALSE,        -- Special ability cards
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);

-- Initial features
INSERT INTO room_type_features VALUES
  ('classic', TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, TRUE, FALSE),
  ('team2v2', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE),
  ('super', TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE);
```

### 4. game_rooms (Updated)
Enhanced to support room types.

```sql
ALTER TABLE game_rooms ADD COLUMN room_type_id VARCHAR(50) DEFAULT 'classic';
ALTER TABLE game_rooms ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE game_rooms ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE game_rooms ADD COLUMN skill_level VARCHAR(20); -- 'beginner', 'intermediate', 'expert'
ALTER TABLE game_rooms ADD COLUMN max_spectators INT DEFAULT 0;
ALTER TABLE game_rooms ADD COLUMN tags JSON; -- ['casual', 'competitive', etc]

ALTER TABLE game_rooms 
  ADD CONSTRAINT fk_room_type 
  FOREIGN KEY (room_type_id) 
  REFERENCES room_types(id);
```

### 5. teams
For team-based games.

```sql
CREATE TABLE teams (
  id VARCHAR(36) PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),                    -- Hex color for UI
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE
);

CREATE INDEX idx_teams_room ON teams(room_id);
```

### 6. team_players
Maps players to teams.

```sql
CREATE TABLE team_players (
  team_id VARCHAR(36) NOT NULL,
  player_id VARCHAR(36) NOT NULL,
  is_captain BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, player_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);
```

### 7. room_type_statistics
Tracks statistics per room type.

```sql
CREATE TABLE room_type_statistics (
  player_id VARCHAR(36) NOT NULL,
  room_type_id VARCHAR(50) NOT NULL,
  games_played INT DEFAULT 0,
  games_won INT DEFAULT 0,
  total_score INT DEFAULT 0,
  fastest_solve_time INT,              -- milliseconds
  average_solve_time INT,
  perfect_rounds INT DEFAULT 0,        -- Rounds won without opponent attempt
  rating INT DEFAULT 1000,             -- ELO-style rating per room type
  PRIMARY KEY (player_id, room_type_id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);
```

### 8. matchmaking_queue
For the matchmaking system.

```sql
CREATE TABLE matchmaking_queue (
  id VARCHAR(36) PRIMARY KEY,
  player_id VARCHAR(36) NOT NULL,
  room_type_id VARCHAR(50) NOT NULL,
  skill_level VARCHAR(20),
  preferences JSON,                    -- { teamPreference, region, etc }
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'matched', 'cancelled'
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

CREATE INDEX idx_matchmaking_status ON matchmaking_queue(status, room_type_id);
CREATE INDEX idx_matchmaking_joined ON matchmaking_queue(joined_at);
```

### 9. room_type_achievements
Achievements specific to room types.

```sql
CREATE TABLE room_type_achievements (
  id VARCHAR(36) PRIMARY KEY,
  room_type_id VARCHAR(50),            -- NULL for global achievements
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(255),
  points INT DEFAULT 10,
  criteria JSON,                       -- { type: 'wins', value: 10 }
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);
```

### 10. player_achievements
Tracks player achievement progress.

```sql
CREATE TABLE player_achievements (
  player_id VARCHAR(36) NOT NULL,
  achievement_id VARCHAR(36) NOT NULL,
  progress INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  PRIMARY KEY (player_id, achievement_id),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES room_type_achievements(id) ON DELETE CASCADE
);
```

## Indexes for Performance

```sql
-- Game room queries
CREATE INDEX idx_game_rooms_type ON game_rooms(room_type_id, state);
CREATE INDEX idx_game_rooms_private ON game_rooms(is_private, state);

-- Statistics queries
CREATE INDEX idx_room_stats_rating ON room_type_statistics(room_type_id, rating DESC);
CREATE INDEX idx_room_stats_games ON room_type_statistics(room_type_id, games_played DESC);

-- Team queries
CREATE INDEX idx_team_players_player ON team_players(player_id);
```

## Migration Strategy

### Phase 1: Schema Creation
```sql
-- 1. Create new tables
-- 2. Add columns to existing tables with defaults
-- 3. Populate room_types data
-- 4. Set all existing rooms to 'classic' type
UPDATE game_rooms SET room_type_id = 'classic' WHERE room_type_id IS NULL;
```

### Phase 2: Data Migration
```sql
-- Migrate existing player statistics to room_type_statistics
INSERT INTO room_type_statistics (player_id, room_type_id, games_played, games_won, total_score)
SELECT player_id, 'classic', games_played, games_won, total_score
FROM player_statistics;
```

### Phase 3: Application Updates
1. Update backend to use new schema
2. Add room type selection to frontend
3. Update matchmaking logic
4. Deploy with feature flags

## Benefits

1. **Flexibility**: Easy to add new room types without code changes
2. **Configuration**: Rules and features stored in database
3. **Statistics**: Track performance per room type
4. **Matchmaking**: Support skill-based matching per type
5. **Achievements**: Room-type specific progression

## Future Considerations

1. **Seasonal Room Types**: Add start/end dates for limited-time modes
2. **Custom Rules**: Allow players to create custom room configurations
3. **Tournament Support**: Add tournament-specific tables
4. **Leaderboards**: Per room type and global rankings
5. **Analytics**: Track room type popularity and balance