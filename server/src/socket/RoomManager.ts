import { Server, Socket } from 'socket.io';
import { GameRoom, Player, GameState, Solution } from '../types/game.types';
import { DeckManager } from '../game/DeckManager';
import { GameStateManager, GameEvent, RoundResult } from '../game/GameStateManager';
import { getRoomTypeConfig } from '../config/roomTypes';
import { RoomCreationOptions } from '../types/roomTypes';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private gameManagers: Map<string, GameStateManager> = new Map();
  private playerToRoom: Map<string, string> = new Map();
  private io: Server | null = null;
  private totalGamesPlayed: number = 0;

  setIo(io: Server): void {
    this.io = io;
  }
  
  generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  createRoom(playerId: string, socketId: string, playerName: string, roomType: string = 'classic'): GameRoom {
    const config = getRoomTypeConfig(roomType);
    if (!config) {
      throw new Error(`Invalid room type: ${roomType}`);
    }

    const roomId = this.generateRoomId();
    const player: Player = {
      id: playerId,
      socketId,
      name: playerName,
      deck: [],
      isReady: false
    };

    const room: GameRoom = {
      id: roomId,
      players: [player],
      state: GameState.WAITING,
      centerCards: [],
      currentRound: 0,
      scores: {
        [playerId]: 0
      },
      roomType
    };

    this.rooms.set(roomId, room);
    
    // Create appropriate game manager based on room type
    const GameManagerClass = this.getGameManagerClass(roomType);
    const gameManager = new GameManagerClass(room, config);
    
    // Set up redeal callback
    gameManager.setOnRedealCallback(() => {
      if (this.io) {
        this.io.to(roomId).emit('cards-redealing', {
          message: 'No solution found, redealing cards...'
        });
      }
    });
    
    // Set up replay end callback
    gameManager.setOnReplayEndCallback(() => {
      this.handleReplayEnd(roomId);
    });
    
    // Set up game over callback
    gameManager.setOnGameOverCallback(() => {
      this.checkGameState(roomId);
    });
    
    this.gameManagers.set(roomId, gameManager);
    this.playerToRoom.set(socketId, roomId);
    
    return room;
  }

  joinRoom(roomId: string, playerId: string, socketId: string, playerName: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }

    // Check if this is a reconnection - look for disconnected player with same name
    const disconnectedPlayer = room.players.find(p => !p.socketId && p.name === playerName);
    
    if (disconnectedPlayer) {
      // Reconnection - update existing player
      console.log(`[RoomManager] Player ${playerName} reconnecting to room ${roomId}`);
      disconnectedPlayer.socketId = socketId;
      this.playerToRoom.set(socketId, roomId);
      
      // Handle reconnection in game manager
      this.handleReconnect(roomId, disconnectedPlayer.id, socketId);
      
      return room;
    }

    // Not a reconnection - check if room is full
    if (room.players.length >= 2) {
      return null;
    }

    // New player joining
    const player: Player = {
      id: playerId,
      socketId,
      name: playerName,
      deck: [],
      isReady: false
    };

    room.players.push(player);
    room.scores[playerId] = 0;
    this.playerToRoom.set(socketId, roomId);

    if (room.players.length === 2) {
      room.state = GameState.PLAYING;
    }

    return room;
  }

  leaveRoom(socketId: string): { room: GameRoom | null; roomId: string | null } {
    const roomId = this.playerToRoom.get(socketId);
    
    if (!roomId) {
      return { room: null, roomId: null };
    }

    const room = this.rooms.get(roomId);
    const gameManager = this.gameManagers.get(roomId);
    
    if (!room) {
      return { room: null, roomId: null };
    }

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) {
      return { room: null, roomId: null };
    }

    // Check if game is active
    const isGameActive = room.state === GameState.PLAYING || 
                        room.state === GameState.SOLVING || 
                        room.state === GameState.ROUND_END ||
                        room.state === GameState.REPLAY;

    if (isGameActive && gameManager) {
      // Game is active - just disconnect, don't remove
      gameManager.handleDisconnect(player.id);
      player.socketId = ''; // Clear socket but keep player
      this.playerToRoom.delete(socketId);
      
      // Check if all players are disconnected
      const hasActivePlayer = room.players.some(p => p.socketId);
      if (!hasActivePlayer) {
        // No active players left - delete room after a delay
        setTimeout(() => {
          // Check again in case someone reconnected
          const stillNoActivePlayers = room.players.every(p => !p.socketId);
          if (stillNoActivePlayers) {
            this.rooms.delete(roomId);
            this.gameManagers.delete(roomId);
          }
        }, 35000); // Wait slightly longer than forfeit timer
      }
      
      return { room, roomId };
    } else {
      // Game not active - remove player completely
      room.players = room.players.filter(p => p.socketId !== socketId);
      this.playerToRoom.delete(socketId);

      if (room.players.length === 0) {
        // No players left - delete room immediately
        this.rooms.delete(roomId);
        this.gameManagers.delete(roomId);
        return { room: null, roomId };
      }

      // Reset to waiting if players remain
      room.state = GameState.WAITING;
      return { room, roomId };
    }
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomBySocketId(socketId: string): GameRoom | null {
    const roomId = this.playerToRoom.get(socketId);
    
    if (!roomId) {
      return null;
    }

    return this.rooms.get(roomId) || null;
  }

  getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  getOpenRooms(): GameRoom[] {
    return this.getAllRooms().filter(room => {
      // Show rooms with less than 2 players
      if (room.players.length < 2) return true;
      
      // Also show rooms where a player has disconnected (empty socketId)
      // This allows reconnection
      const hasDisconnectedPlayer = room.players.some(p => !p.socketId);
      return hasDisconnectedPlayer;
    });
  }

  updatePlayerReady(socketId: string, isReady: boolean): GameRoom | null {
    const room = this.getRoomBySocketId(socketId);
    
    if (!room) {
      return null;
    }

    const player = room.players.find(p => p.socketId === socketId);
    
    if (player) {
      player.isReady = isReady;
    }

    return room;
  }

  areAllPlayersReady(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    
    if (!room || room.players.length < 2) {
      return false;
    }

    return room.players.every(player => player.isReady);
  }

  initializeGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    const gameManager = this.gameManagers.get(roomId);
    
    if (!room || !gameManager || room.players.length !== 2) {
      return false;
    }

    try {
      gameManager.initializeGame(room.players[0], room.players[1]);
      return true;
    } catch (error) {
      console.error('Failed to initialize game:', error);
      return false;
    }
  }

  startGame(roomId: string): boolean {
    const gameManager = this.gameManagers.get(roomId);
    
    if (!gameManager) {
      return false;
    }

    try {
      gameManager.startGame();
      this.totalGamesPlayed++;
      console.log(`Game started! Total games played: ${this.totalGamesPlayed}`);
      return true;
    } catch (error) {
      console.error('Failed to start game:', error);
      return false;
    }
  }

  claimSolution(roomId: string, playerId: string): boolean {
    const gameManager = this.gameManagers.get(roomId);
    
    if (!gameManager) {
      return false;
    }

    try {
      gameManager.claimSolution(playerId);
      return true;
    } catch (error) {
      console.error('Failed to claim solution:', error);
      return false;
    }
  }

  submitSolution(roomId: string, playerId: string, solution: Solution): boolean {
    const gameManager = this.gameManagers.get(roomId);
    
    if (!gameManager) {
      return false;
    }

    try {
      gameManager.submitSolution(playerId, solution);
      return true;
    } catch (error) {
      console.error('Failed to submit solution:', error);
      return false;
    }
  }

  getGameState(roomId: string): GameRoom | null {
    const gameManager = this.gameManagers.get(roomId);
    
    if (!gameManager) {
      return null;
    }

    return gameManager.getState();
  }

  getGameStateForPlayer(roomId: string, playerId: string): any {
    const gameManager = this.gameManagers.get(roomId);
    
    if (!gameManager) {
      return null;
    }

    return gameManager.getStateForPlayer(playerId);
  }

  resetGame(roomId: string): boolean {
    const gameManager = this.gameManagers.get(roomId);
    
    if (!gameManager) {
      return false;
    }

    try {
      gameManager.resetGame();
      return true;
    } catch (error) {
      console.error('Failed to reset game:', error);
      return false;
    }
  }

  handleReconnect(roomId: string, playerId: string, socketId: string): boolean {
    const gameManager = this.gameManagers.get(roomId);
    
    if (!gameManager) {
      return false;
    }

    try {
      gameManager.handleReconnect(playerId, socketId);
      this.playerToRoom.set(socketId, roomId);
      return true;
    } catch (error) {
      console.error('Failed to handle reconnect:', error);
      return false;
    }
  }

  getLastRoundResult(roomId: string): any {
    const gameManager = this.gameManagers.get(roomId);
    
    if (!gameManager) {
      return null;
    }

    return gameManager.getLastRoundResult();
  }

  getGameOverResult(roomId: string): any {
    const gameManager = this.gameManagers.get(roomId);
    
    if (!gameManager) {
      return null;
    }

    return gameManager.getGameOverResult();
  }

  requestSkipReplay(roomId: string, playerId: string): boolean {
    const gameManager = this.gameManagers.get(roomId);
    
    if (!gameManager) {
      return false;
    }

    return gameManager.requestSkipReplay(playerId);
  }

  private handleReplayEnd(roomId: string): void {
    console.log('[RoomManager] Handling replay end for room:', roomId);
    
    if (!this.io) return;
    
    const gameState = this.getGameState(roomId);
    if (!gameState) return;
    
    // Emit updated game state to all players
    gameState.players.forEach(p => {
      const playerState = this.getGameStateForPlayer(roomId, p.id);
      this.io!.to(p.socketId).emit('game-state-updated', playerState);
    });
    
    // If we're now in playing state, emit round started
    if (gameState.state === GameState.PLAYING) {
      console.log('[RoomManager] Emitting round-started for round:', gameState.currentRound);
      this.io.to(roomId).emit('round-started', {
        round: gameState.currentRound,
        centerCards: gameState.centerCards
      });
    }
  }

  checkGameState(roomId: string): void {
    if (!this.io) return;
    
    const gameState = this.getGameState(roomId);
    const gameOverResult = this.getGameOverResult(roomId);
    
    if (!gameState) return;
    
    // Always emit updated game state to all players first
    gameState.players.forEach(p => {
      if (p.socketId) {
        const playerState = this.getGameStateForPlayer(roomId, p.id);
        this.io!.to(p.socketId).emit('game-state-updated', playerState);
      }
    });
    
    // If game is over, emit game-over event with proper details
    if (gameState.state === GameState.GAME_OVER && gameOverResult) {
      console.log('[RoomManager] Emitting game-over event:', gameOverResult);
      this.io.to(roomId).emit('game-over', {
        winnerId: gameOverResult.winnerId,
        reason: gameOverResult.reason,
        scores: gameOverResult.finalScores,
        finalDecks: gameOverResult.finalDecks
      });
    }
  }

  private getGameManagerClass(roomType: string): typeof GameStateManager {
    // For now, return the standard GameStateManager
    // We'll create SuperGameStateManager next
    return GameStateManager;
  }

  getRoomInfo(roomId: string): any {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    const config = room.roomType ? getRoomTypeConfig(room.roomType) : null;
    
    return {
      id: room.id,
      roomType: room.roomType || 'classic',
      config,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        isReady: p.isReady,
        isConnected: !!p.socketId,
        deckSize: p.deck.length
      })),
      state: room.state,
      currentRound: room.currentRound
    };
  }

  getTotalGamesPlayed(): number {
    return this.totalGamesPlayed;
  }
}

export default new RoomManager();