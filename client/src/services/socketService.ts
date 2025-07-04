import { io, Socket } from 'socket.io-client';
import type { RoomTypeInfo } from '../types/roomTypes';
import { authService } from './authService';

let socket: Socket;

// Check if socket already exists on window (for HMR)
if (import.meta.hot && (window as any).__socket) {
  console.log('[SocketService] Reusing existing socket from HMR');
  socket = (window as any).__socket;
} else {
  // Initialize socket connection
  let serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3024';
  // Ensure serverUrl doesn't have a trailing slash
  serverUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
  console.log('[SocketService] Creating new socket connection to:', serverUrl);
  
  socket = io(serverUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
    auth: (cb) => {
      // Get auth token from localStorage
      const token = localStorage.getItem('accessToken');
      cb({ token });
    }
  });

  socket.on('connect', () => {
    console.log('[SocketService] Connected to server, socket ID:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[SocketService] Disconnected from server, reason:', reason);
  });

  socket.on('connect_error', async (error) => {
    console.error('[SocketService] Connection error:', error.message);
    
    // Handle authentication errors specifically
    if (error.message && error.message.includes('jwt expired')) {
      console.log('[SocketService] JWT expired, attempting to refresh token...');
      
      // Try to refresh the token
      const newToken = await authService.refreshAccessToken();
      if (newToken) {
        // Update the auth callback with new token
        socket.auth = (cb) => {
          cb({ token: newToken });
        };
        
        // Reconnect with new token
        socket.connect();
      } else {
        console.error('[SocketService] Failed to refresh token, user needs to login again');
      }
    }
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

  // Reconnect with updated auth token
  reconnectWithAuth(): void {
    console.log('[SocketService] Reconnecting with updated auth...');
    
    // Update auth callback with new token
    this.socket.auth = (cb) => {
      const token = localStorage.getItem('accessToken');
      cb({ token });
    };
    
    // Disconnect and reconnect
    this.socket.disconnect();
    this.socket.connect();
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