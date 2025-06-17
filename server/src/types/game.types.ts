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
  rematchRequests?: Set<string>;
  // Battle statistics
  roundTimes?: { [playerId: string]: number[] };
  firstSolves?: { [playerId: string]: number };
  correctSolutions?: { [playerId: string]: number };
  incorrectAttempts?: { [playerId: string]: number };
  // Room type support
  roomType?: string;
  // Solo practice mode
  isSoloPractice?: boolean;
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