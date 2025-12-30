/**
 * Custom hook for managing socket connection
 * Handles socket connection on app load and cleanup on unmount
 */

import { useEffect, useRef } from 'react';
import { getSocket, disconnectSocket, isSocketConnected } from '@/app/utils/socket';
import { getUserId } from '@/app/utils/auth';

/**
 * Hook to manage socket connection lifecycle
 * Connects socket on mount and registers user
 * Cleans up on unmount
 */
export function useSocketConnection() {
  const registeredRef = useRef(false);

  useEffect(() => {
    const userId = getUserId();
    
    if (!userId) {
      console.warn('Cannot connect socket: User not authenticated');
      return;
    }

    // Get or create socket instance
    const socket = getSocket();
    
    if (!socket) {
      console.warn('Failed to create socket instance');
      return;
    }

    // Register user if socket is connected and not already registered
    const handleConnect = () => {
      if (!registeredRef.current && userId) {
        socket.emit('register', userId);
        registeredRef.current = true;
        console.log('User registered with socket:', userId);
      }
    };

    // If already connected, register immediately
    if (socket.connected && !registeredRef.current) {
      socket.emit('register', userId);
      registeredRef.current = true;
      console.log('User registered with socket (already connected):', userId);
    } else {
      // Otherwise, wait for connection
      socket.on('connect', handleConnect);
    }

    // Cleanup function
    return () => {
      socket.off('connect', handleConnect);
      // Note: We don't disconnect here to keep socket alive across route changes
      // Socket will be disconnected on logout or app close
    };
  }, []); // Empty deps - only run on mount

  return {
    isConnected: isSocketConnected(),
  };
}


