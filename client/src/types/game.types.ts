export interface Card {
  value: number;
  owner: 'player1' | 'player2';
  id: string;
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  deck: Card[];
  isReady: boolean;
}

export interface GameRoom {
  id: string;
  players: Player[];
  state: GameState;
  centerCards: Card[];
  currentRound: number;
  scores: {
    [playerId: string]: number;
  };
  // Battle statistics
  roundTimes?: { [playerId: string]: number[] }; // Array of solve times per player
  firstSolves?: { [playerId: string]: number }; // Count of who solved first
  correctSolutions?: { [playerId: string]: number }; // Count of correct solutions
  incorrectAttempts?: { [playerId: string]: number }; // Count of incorrect attempts
  // Room type support
  roomType?: string;
  config?: any;
  // Solo practice mode
  isSoloPractice?: boolean;
  // Puzzle records
  currentPuzzleStats?: {
    occurrenceCount: number;
    bestRecord?: {
      username: string;
      timeSeconds: number;
    } | null;
  };
  newRecordSet?: boolean;
}

export const GameState = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  SOLVING: 'solving',
  ROUND_END: 'round_end',
  REPLAY: 'replay',
  GAME_OVER: 'game_over'
} as const;

export type GameState = typeof GameState[keyof typeof GameState];

export interface Solution {
  cards: Card[];
  operations: Operation[];
  result: number;
}

export interface Operation {
  operator: '+' | '-' | '*' | '/';
  left: number;
  right: number;
  result: number;
}