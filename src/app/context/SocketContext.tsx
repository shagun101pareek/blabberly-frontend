'use client';

/**
 * Socket Context Provider
 * 
 * Initializes Socket.IO connection at the application root level.
 * This ensures users appear online as soon as they're logged in,
 * not just when they visit the chat page.
 * 
 * Why app-level initialization?
 * - Users should appear online immediately after login
 * - Socket connection should persist across all pages
 * - Only one socket connection per browser tab
 * - Proper cleanup on logout and page unload
 */

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket, isSocketConnected } from '../utils/socket';
import { getAuthToken, getUserId } from '../utils/auth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const registeredRef = useRef(false);
  const tokenCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize socket connection if user is authenticated
   * 
   * This effect runs on mount and sets up the socket connection.
   * The socket singleton ensures only one connection per browser tab.
   */
  useEffect(() => {
    const token = getAuthToken();
    const userId = getUserId();

    // Don't connect if no token or userId
    if (!token || !userId) {
      console.log('[SocketContext] No token or userId, skipping socket initialization');
      return;
    }

    // Get or create socket instance (singleton ensures only one connection)
    setIsConnecting(true);
    const newSocket = getSocket();
    
    if (!newSocket) {
      console.warn('[SocketContext] Failed to create socket instance');
      setIsConnecting(false);
      return;
    }

    setSocket(newSocket);

    // Set up connection event listeners
    const handleConnect = () => {
      console.log('[SocketContext] Socket connected:', newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);

      // Register user with socket server (only once)
      if (!registeredRef.current && userId) {
        newSocket.emit('register', userId);
        registeredRef.current = true;
        console.log('[SocketContext] User registered with socket:', userId);
      }
    };

    const handleDisconnect = (reason: string) => {
      console.log('[SocketContext] Socket disconnected:', reason);
      setIsConnected(false);
      setIsConnecting(false);
      // Don't reset registeredRef here - socket may reconnect
    };

    const handleConnectError = (error: Error) => {
      console.error('[SocketContext] Socket connection error:', error);
      setIsConnecting(false);
    };

    // If already connected, handle immediately
    if (newSocket.connected) {
      handleConnect();
    } else {
      // Otherwise, wait for connection
      newSocket.on('connect', handleConnect);
    }

    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('connect_error', handleConnectError);

    // Listen for storage changes (e.g., token removal on logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' && !e.newValue && newSocket) {
        console.log('[SocketContext] Token removed (storage event), disconnecting socket');
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
        setIsConnecting(false);
        registeredRef.current = false;
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Check for token changes periodically (handles same-tab logout)
    // This ensures socket disconnects when token is removed
    tokenCheckIntervalRef.current = setInterval(() => {
      const currentToken = getAuthToken();
      if (!currentToken && newSocket && newSocket.connected) {
        console.log('[SocketContext] Token removed, disconnecting socket');
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
        setIsConnecting(false);
        registeredRef.current = false;
      }
    }, 1000); // Check every second

    // Cleanup on unmount
    return () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('connect_error', handleConnectError);
      window.removeEventListener('storage', handleStorageChange);
      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }
      // Note: We don't disconnect socket here to keep it alive across route changes
      // Socket will be disconnected on logout or page unload via disconnectSocket()
    };
  }, []); // Empty deps - only run on mount

  /**
   * Handle page unload - disconnect socket
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socket) {
        disconnectSocket();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [socket]);

  /**
   * Update connection status when socket state changes
   */
  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    // Check initial connection state
    setIsConnected(socket.connected);

    // Listen for connection state changes
    const handleConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, isConnecting }}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to access socket context
 * Use this in any component to get socket instance and connection status
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

