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
  points?: number; // For point-based scoring in Extended Range mode
  isAI?: boolean; // For solo practice mode
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
  rematchRequests?: Set<string>;
  // Battle statistics
  roundTimes?: { [playerId: string]: number[] };
  firstSolves?: { [playerId: string]: number };
  correctSolutions?: { [playerId: string]: number };
  // Room type support
  roomType?: string;
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
  // Ranked game support
  isRanked?: boolean;
  createdAt: number;
  ratingUpdates?: {
    [playerId: string]: any; // RatingUpdatePayload
  };
  // Badge tracking
  lastMinimalOperationsSolver?: string; // Track who solved with minimal operations last
  scoreHistory?: { round: number; scores: { [playerId: string]: number } }[]; // Track score progression
  lowestScoreByPlayer?: { [playerId: string]: number }; // Track lowest score each player reached
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