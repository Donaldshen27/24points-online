import type { RoomTypeConfig } from '../types/roomTypes';

export const ROOM_TYPE_CONFIGS: Record<string, RoomTypeConfig> = {
  classic: {
    id: 'classic',
    displayName: 'Classic 1v1',
    description: 'Traditional 2-player 24 points game',
    playerCount: 2,
    cardsPerPlayer: 10,
    cardsPerDraw: 4,
    teamBased: false,
    minPlayers: 2,
    maxPlayers: 2,
    rules: {
      turnTimeLimit: 120,
      solutionTimeLimit: 30,
      scoringSystem: 'classic',
      winCondition: 'no_cards',
      allowSpectators: true,
      requireExactMatch: true,
    },
    features: {
      hasTimer: true,
      hasChat: true,
      hasVoice: false,
      hasReplay: true,
      hasStatistics: true,
      hasTournamentMode: false,
    }
  },
  super: {
    id: 'super',
    displayName: '7倍圣水',
    description: 'Advanced mode with 8 center cards',
    playerCount: 2,
    cardsPerPlayer: 14,
    cardsPerDraw: 8,
    teamBased: false,
    minPlayers: 2,
    maxPlayers: 2,
    rules: {
      turnTimeLimit: 150,
      solutionTimeLimit: 40,
      scoringSystem: 'complexity',
      winCondition: 'no_cards',
      allowSpectators: true,
      requireExactMatch: true,
    },
    features: {
      hasTimer: true,
      hasChat: true,
      hasVoice: false,
      hasReplay: true,
      hasStatistics: true,
      hasTournamentMode: true,
    }
  },
  extended: {
    id: 'extended',
    displayName: 'Extended Range',
    description: 'Extended mode with cards from 1-20',
    playerCount: 2,
    cardsPerPlayer: 20,
    cardsPerDraw: 4,
    teamBased: false,
    minPlayers: 2,
    maxPlayers: 2,
    rules: {
      turnTimeLimit: 150,
      solutionTimeLimit: 35,
      scoringSystem: 'extended',
      winCondition: 'no_cards',
      allowSpectators: true,
      requireExactMatch: true,
    },
    features: {
      hasTimer: true,
      hasChat: true,
      hasVoice: false,
      hasReplay: true,
      hasStatistics: true,
      hasTournamentMode: false,
    }
  }
};

export function getRoomTypeConfig(roomType: string): RoomTypeConfig | null {
  return ROOM_TYPE_CONFIGS[roomType] || null;
}

export function getAvailableRoomTypes(): string[] {
  return Object.keys(ROOM_TYPE_CONFIGS);
}