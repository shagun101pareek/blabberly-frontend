/**
 * Socket.IO Singleton Utility
 * 
 * Creates a single Socket.IO client instance that is reused across the app.
 * Prevents multiple socket connections and ensures proper cleanup.
 */

import { io, Socket } from 'socket.io-client';
import { getUserId } from './auth';

let socket: Socket | null = null;

/**
 * Get or create the socket instance
 * @param serverUrl - Socket.IO server URL (defaults to localhost:5000)
 * @returns Socket instance
 */
export const getSocket = (serverUrl: string = 'http://localhost:5000'): Socket | null => {
  // Return existing socket if already connected
  if (socket && socket.connected) {
    return socket;
  }

  // Create new socket connection
  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: false, // We'll connect manually after registration
  });

  return socket;
};

/**
 * Initialize socket connection and register user
 * Should be called once when user logs in or app loads
 */
export const initializeSocket = (): void => {
  const userId = getUserId();
  
  if (!userId) {
    console.warn('Cannot initialize socket: No user ID found');
    return;
  }

  // If socket already exists and is connected, just ensure registration
  if (socket && socket.connected) {
    // Re-register in case of reconnection
    socket.emit('register', userId);
    return;
  }

  const socketInstance = getSocket();
  
  if (!socketInstance) {
    console.error('Failed to create socket instance');
    return;
  }

  // Connect to server
  socketInstance.connect();

  // Register user with socket once connected
  socketInstance.on('connect', () => {
    socketInstance.emit('register', userId);
    console.log('Socket connected and user registered:', userId);
  });

  // Handle connection errors
  socketInstance.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
};

/**
 * Disconnect socket and clean up
 * Should be called on logout or app unmount
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected');
  }
};

/**
 * Get the current socket instance (may be null if not initialized)
 */
export const getSocketInstance = (): Socket | null => {
  return socket;
};

