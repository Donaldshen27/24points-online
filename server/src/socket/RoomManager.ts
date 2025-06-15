import { Server, Socket } from 'socket.io';
import { GameRoom, Player, GameState, Solution } from '../types/game.types';
import { DeckManager } from '../game/DeckManager';
import { GameStateManager, GameEvent, RoundResult } from '../game/GameStateManager';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private gameManagers: Map<string, GameStateManager> = new Map();
  private playerToRoom: Map<string, string> = new Map();
  private io: Server | null = null;

  setIo(io: Server): void {
    this.io = io;
  }
  
  generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  createRoom(playerId: string, socketId: string, playerName: string): GameRoom {
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
      }
    };

    this.rooms.set(roomId, room);
    const gameManager = new GameStateManager(room);
    
    // Set up redeal callback
    gameManager.setOnRedealCallback(() => {
      if (this.io) {
        this.io.to(roomId).emit('cards-redealing', {
          message: 'No solution found, redealing cards...'
        });
      }
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

    if (room.players.length >= 2) {
      return null;
    }

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
    if (player && gameManager) {
      gameManager.handleDisconnect(player.id);
    }

    room.players = room.players.filter(player => player.socketId !== socketId);
    this.playerToRoom.delete(socketId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      this.gameManagers.delete(roomId);
      return { room: null, roomId };
    }

    room.state = GameState.WAITING;
    
    return { room, roomId };
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
    return this.getAllRooms().filter(room => room.players.length < 2);
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
}

export default new RoomManager();