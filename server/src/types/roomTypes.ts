export interface RoomTypeConfig {
  id: string;
  displayName: string;
  description: string;
  playerCount: number;
  cardsPerPlayer: number;
  cardsPerDraw: number;
  teamBased: boolean;
  minPlayers: number;
  maxPlayers: number;
  rules: RuleConfiguration;
  features: RoomFeatures;
}

export interface RuleConfiguration {
  turnTimeLimit: number;
  solutionTimeLimit: number;
  scoringSystem: 'classic' | 'speed' | 'complexity' | 'extended';
  winCondition: 'no_cards' | 'all_cards' | 'point_limit' | 'time_limit' | 'round_limit';
  winConditionValue?: number;
  allowSpectators: boolean;
  requireExactMatch: boolean;
}

export interface RoomFeatures {
  hasTimer: boolean;
  hasChat: boolean;
  hasVoice: boolean;
  hasReplay: boolean;
  hasStatistics: boolean;
  hasTournamentMode: boolean;
}

export interface RoomCreationOptions {
  isPrivate?: boolean;
  password?: string;
  tags?: string[];
}