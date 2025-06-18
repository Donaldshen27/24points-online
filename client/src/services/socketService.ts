import { io, Socket } from 'socket.io-client';
import type { RoomTypeInfo } from '../types/roomTypes';

class SocketService {
  private socket: Socket | null = null;

  connect(url?: string): void {
    // If socket exists, check its state
    if (this.socket) {
      if (this.socket.connected) {
        console.log('Socket already connected, skipping connection');
        return;
      }
      // If socket exists but is disconnected, remove it first
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Use environment variable or fallback to localhost for development
    const serverUrl = url || import.meta.env.VITE_SERVER_URL || 'http://localhost:3024';
    console.log('Connecting to server URL:', serverUrl);
    console.log('Environment variables:', import.meta.env);
    this.socket = io(serverUrl, {
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (this.socket) {
      this.socket.emit(event, ...args);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Room type methods
  getRoomTypes(callback: (roomTypes: RoomTypeInfo[]) => void): void {
    if (this.socket) {
      this.socket.emit('get-room-types', callback);
    }
  }

  createRoom(playerName: string, roomType: string = 'classic', isSoloPractice: boolean = false, callback?: (response: any) => void): void {
    if (this.socket) {
      this.socket.emit('create-room', { playerName, roomType, isSoloPractice }, callback);
    }
  }

  joinRoom(roomId: string, playerName: string, callback?: (response: any) => void): void {
    if (this.socket) {
      this.socket.emit('join-room', { roomId, playerName }, callback);
    }
  }
}

export default new SocketService();