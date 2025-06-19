import { io, Socket } from 'socket.io-client';
import type { RoomTypeInfo } from '../types/roomTypes';

let socket: Socket;

// Check if socket already exists on window (for HMR)
if (import.meta.hot && (window as any).__socket) {
  console.log('[SocketService] Reusing existing socket from HMR');
  socket = (window as any).__socket;
} else {
  // Initialize socket connection
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3024';
  console.log('[SocketService] Creating new socket connection to:', serverUrl);
  
  socket = io(serverUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[SocketService] Connected to server, socket ID:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[SocketService] Disconnected from server, reason:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[SocketService] Connection error:', error.message);
  });

  // Store on window for HMR
  if (import.meta.hot) {
    (window as any).__socket = socket;
  }
}

class SocketService {
  private socket: Socket = socket;

  connect(_url?: string): void {
    // Socket is already connected at module load
    console.log('[SocketService] connect() called - socket already initialized');
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket.on(event, callback);
  }

  emit(event: string, ...args: any[]): void {
    this.socket.emit(event, ...args);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket.off(event, callback);
  }

  // Room type methods
  getRoomTypes(callback: (roomTypes: RoomTypeInfo[]) => void): void {
    this.socket.emit('get-room-types', callback);
  }

  createRoom(playerName: string, roomType: string = 'classic', isSoloPractice: boolean = false, callback?: (response: any) => void): void {
    this.socket.emit('create-room', { playerName, roomType, isSoloPractice }, callback);
  }

  joinRoom(roomId: string, playerName: string, callback?: (response: any) => void): void {
    this.socket.emit('join-room', { roomId, playerName }, callback);
  }
}

// Handle HMR cleanup
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('[SocketService] HMR update accepted');
  });
  
  import.meta.hot.dispose(() => {
    console.log('[SocketService] HMR disposing - keeping socket alive');
  });
}

export default new SocketService();