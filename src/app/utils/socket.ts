/**
 * Socket.IO Singleton Utility
 * 
 * Creates a single Socket.IO client instance that can be reused across the app.
 * Ensures socket is NOT recreated on every render.
 */

import { io, Socket } from 'socket.io-client';
import { getAuthToken, getUserId } from './auth';

// Socket server URL - adjust based on your backend
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

// Singleton socket instance
let socket: Socket | null = null;

/**
 * Get or create the socket instance
 * Returns null if user is not authenticated
 */
export function getSocket(): Socket | null {
  // Return existing socket if already connected
  if (socket && socket.connected) {
    return socket;
  }

  // Check if user is authenticated
  const token = getAuthToken();
  const userId = getUserId();

  if (!token || !userId) {
    console.warn('Cannot create socket: User not authenticated');
    return null;
  }

  // Create new socket connection with auth token
  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Set up connection event listeners
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    
    // Register user with socket server
    if (userId) {
      socket.emit('register', userId);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
}

/**
 * Disconnect and cleanup the socket instance
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

