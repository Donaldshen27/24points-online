import { Server, Socket } from 'socket.io';
import { GameRoom, Player, GameState, Solution } from '../types/game.types';
import { DeckManager } from '../game/DeckManager';
import { GameStateManager, GameEvent, RoundResult } from '../game/GameStateManager';
import { getRoomTypeConfig } from '../config/roomTypes';
import { RoomCreationOptions } from '../types/roomTypes';
import { badgeDetectionService } from '../badges/BadgeDetectionService';
import { statisticsService } from '../badges/StatisticsService';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private gameManagers: Map<string, GameStateManager> = new Map();
  private playerToRoom: Map<string, string> = new Map();
  private io: Server | null = null;
  private totalGamesPlayed: number = 0;
  public spectators: Map<string, Set<string>> = new Map();

  setIo(io: Server): void {
    this.io = io;
  }
  
  generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  createRoom(roomIdOrPlayerId: string, socketIdOrRoomType?: string, playerNameOrIsRanked?: string | boolean, roomType: string = 'classic', isSoloPractice: boolean = false): GameRoom {
    // Handle overloaded parameters
    let roomId: string;
    let playerId: string;
    let socketId: string;
    let playerName: string;
    let isRanked: boolean = false;

    // Check if this is being called from matchmaking (3 params: roomId, roomType, isRanked)
    if (typeof playerNameOrIsRanked === 'boolean' && socketIdOrRoomType && arguments.length === 3) {
      console.log('[RoomManager] Creating room from matchmaking:', { providedRoomId: roomIdOrPlayerId, roomType: socketIdOrRoomType, isRanked: playerNameOrIsRanked });
      roomId = roomIdOrPlayerId;
      roomType = socketIdOrRoomType;
      isRanked = playerNameOrIsRanked;
      // For matchmaking, players will be added later
      playerId = '';
      socketId = '';
      playerName = '';
    } else {
      // Original signature (5 params: playerId, socketId, playerName, roomType, isSoloPractice)
      roomId = this.generateRoomId();
      playerId = roomIdOrPlayerId;
      socketId = socketIdOrRoomType || '';
      playerName = playerNameOrIsRanked as string || '';
    }
    const config = getRoomTypeConfig(roomType);
    if (!config) {
      throw new Error(`Invalid room type: ${roomType}`);
    }

    const room: GameRoom = {
      id: roomId,
      players: [],
      state: GameState.WAITING,
      centerCards: [],
      currentRound: 0,
      scores: {},
      roomType,
      isSoloPractice,
      isRanked,
      createdAt: Date.now(),
      // Initialize battle statistics
      roundTimes: {},
      firstSolves: {},
      correctSolutions: {}
    };

    // Add initial player if provided (not from matchmaking)
    if (playerId && socketId && playerName) {
      const player: Player = {
        id: playerId,
        socketId,
        name: playerName,
        deck: [],
        isReady: false
      };
      room.players.push(player);
      room.scores[playerId] = 0;
      room.roundTimes![playerId] = [];
      room.firstSolves![playerId] = 0;
      room.correctSolutions![playerId] = 0;
    }

    this.rooms.set(roomId, room);
    console.log('[RoomManager] Room created and stored:', { roomId, totalRooms: this.rooms.size, isRanked });
    
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
    
    // Set up game state change callback (for redeals)
    gameManager.setOnGameStateChangeCallback(() => {
      this.broadcastGameState(roomId);
    });
    
    this.gameManagers.set(roomId, gameManager);
    
    // Only set playerToRoom if we have a socketId
    if (socketId) {
      this.playerToRoom.set(socketId, roomId);
    }
    
    return room;
  }

  joinRoom(roomId: string, playerId: string, socketId: string, playerName: string, isSpectator?: boolean): GameRoom | null {
    console.log('[RoomManager] joinRoom called:', { roomId, playerId, playerName, isSpectator });
    const room = this.rooms.get(roomId);
    
    if (!room) {
      console.log('[RoomManager] Room not found:', roomId);
      return null;
    }

    // If joining as spectator, add to spectators list instead of players
    if (isSpectator) {
      console.log('[RoomManager] Adding spectator to room:', roomId);
      // Add to spectators tracking
      if (!this.spectators.has(roomId)) {
        this.spectators.set(roomId, new Set());
      }
      this.spectators.get(roomId)!.add(socketId);
      this.playerToRoom.set(socketId, roomId);
      
      // Return room info without modifying players
      return room;
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
      isReady: false,
      isAI: playerName === 'Practice Bot' // Mark AI players
    };

    room.players.push(player);
    room.scores[playerId] = 0;
    
    // Initialize battle statistics for new player
    if (room.roundTimes) room.roundTimes[playerId] = [];
    if (room.firstSolves) room.firstSolves[playerId] = 0;
    if (room.correctSolutions) room.correctSolutions[playerId] = 0;
    
    this.playerToRoom.set(socketId, roomId);

    // Don't change state here - wait for players to be ready
    // The state will change when the game actually starts

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

    // Check if this is a spectator
    if (this.spectators.has(roomId) && this.spectators.get(roomId)!.has(socketId)) {
      this.spectators.get(roomId)!.delete(socketId);
      if (this.spectators.get(roomId)!.size === 0) {
        this.spectators.delete(roomId);
      }
      this.playerToRoom.delete(socketId);
      return { room, roomId };
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

  getGameManager(roomId: string): GameStateManager | undefined {
    return this.gameManagers.get(roomId);
  }

  getOpenRooms(): GameRoom[] {
    return this.getAllRooms().filter(room => {
      // Don't show solo practice rooms
      if (room.isSoloPractice) return false;
      
      // Show rooms with less than 2 players
      if (room.players.length < 2) return true;
      
      // Also show rooms where a player has disconnected (empty socketId)
      // This allows reconnection
      const hasDisconnectedPlayer = room.players.some(p => !p.socketId);
      return hasDisconnectedPlayer;
    });
  }

  updatePlayerReady(roomId: string, playerId: string, isReady: boolean): GameRoom | null {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }

    const player = room.players.find(p => p.id === playerId);
    
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

  async submitSolution(roomId: string, playerId: string, solution: Solution): Promise<boolean> {
    const gameManager = this.gameManagers.get(roomId);
    
    if (!gameManager) {
      return false;
    }

    try {
      await gameManager.submitSolution(playerId, solution);
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
    
    // Send full game state to spectators
    const spectatorRoomId = `spectators-${roomId}`;
    this.io!.to(spectatorRoomId).emit('game-state-updated', gameState);
    
    // If we're now in playing state, emit round started
    if (gameState.state === GameState.PLAYING) {
      console.log('[RoomManager] Emitting round-started for round:', gameState.currentRound);
      this.io.to(roomId).emit('round-started', {
        round: gameState.currentRound,
        centerCards: gameState.centerCards
      });
      
      // Also emit to spectators
      this.io!.to(spectatorRoomId).emit('round-started', {
        round: gameState.currentRound,
        centerCards: gameState.centerCards
      });
    }
  }

  private broadcastGameState(roomId: string): void {
    if (!this.io) return;
    
    const gameState = this.getGameState(roomId);
    if (!gameState) return;
    
    console.log('[RoomManager] Broadcasting game state after redeal');
    
    // Emit updated game state to all players
    gameState.players.forEach(p => {
      if (p.socketId) {
        const playerState = this.getGameStateForPlayer(roomId, p.id);
        this.io!.to(p.socketId).emit('game-state-updated', playerState);
      }
    });
    
    // Send full game state to spectators
    const spectatorRoomId = `spectators-${roomId}`;
    this.io!.to(spectatorRoomId).emit('game-state-updated', gameState);
    
    // Emit round-started event with new cards
    this.io.to(roomId).emit('round-started', {
      round: gameState.currentRound,
      centerCards: gameState.centerCards
    });
    
    // Also emit to spectators
    this.io!.to(spectatorRoomId).emit('round-started', {
      round: gameState.currentRound,
      centerCards: gameState.centerCards
    });
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
    
    // Send full game state to spectators
    const spectatorRoomId = `spectators-${roomId}`;
    this.io!.to(spectatorRoomId).emit('game-state-updated', gameState);
    
    // If game is over, emit game-over event with proper details
    if (gameState.state === GameState.GAME_OVER && gameOverResult) {
      console.log('[RoomManager] Emitting game-over event:', gameOverResult);
      const gameOverData = {
        winnerId: gameOverResult.winnerId,
        reason: gameOverResult.reason,
        scores: gameOverResult.finalScores,
        finalDecks: gameOverResult.finalDecks
      };
      
      this.io.to(roomId).emit('game-over', gameOverData);
      this.io!.to(spectatorRoomId).emit('game-over', gameOverData);
      
      // Check for badges after game ends
      const room = this.rooms.get(roomId);
      if (room) {
        this.checkBadgesAfterGame(room, gameState, gameOverResult);
      }
    }
  }
  
  private async checkBadgesAfterGame(room: GameRoom, gameState: any, gameOverResult: any) {
    console.log('[RoomManager] Checking badges after game for room:', room.id);
    
    const players = gameState.players;
    
    // In solo practice, only check badges for the human player
    const playersToCheck = room.isSoloPractice 
      ? players.filter((p: any) => !p.isAI)
      : players;
    
    for (const player of playersToCheck) {
      try {
        // Initialize stats if needed
        await statisticsService.initializeUserStats(player.id, player.name);
        
        // Check for new badges
        console.log(`[RoomManager] Checking badges for player ${player.name} (${player.id})`);
        const newBadges = await badgeDetectionService.checkBadgesAfterGame(player.id);
        
        // Notify player of new badges
        if (newBadges.length > 0) {
          console.log(`[RoomManager] Player ${player.name} unlocked ${newBadges.length} badges!`);
          this.io!.to(player.socketId).emit('badges-unlocked', newBadges);
        }
      } catch (error) {
        console.error(`[RoomManager] Error checking badges for player ${player.id}:`, error);
      }
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
    
    // If game is active, return full game state
    if (room.state !== GameState.WAITING) {
      const gameManager = this.gameManagers.get(roomId);
      if (gameManager) {
        const fullState = gameManager.getState();
        console.log('[RoomManager] getRoomInfo (active game):', {
          roomId,
          isSoloPractice: room.isSoloPractice,
          state: fullState.state,
          playerCount: fullState.players.length
        });
        return {
          ...fullState,
          roomType: room.roomType || 'classic',
          config,
          isSoloPractice: room.isSoloPractice
        };
      }
    }
    
    const roomInfo = {
      id: room.id,
      roomType: room.roomType || 'classic',
      config,
      isSoloPractice: room.isSoloPractice,
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
    
    console.log('[RoomManager] getRoomInfo:', {
      roomId,
      isSoloPractice: room.isSoloPractice,
      players: roomInfo.players,
      state: room.state
    });
    
    return roomInfo;
  }

  getRoomConfig(roomType: string): any {
    return getRoomTypeConfig(roomType);
  }

  getTotalGamesPlayed(): number {
    return this.totalGamesPlayed;
  }
}

export default new RoomManager();