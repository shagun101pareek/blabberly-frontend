/**
 * Custom hook for managing user online status and last seen
 * Combines API fetching with real-time socket presence updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserStatusAPI, UserStatusResponse } from '@/api/auth/users/getUserStatus';
import { getSocket } from '@/app/utils/socket';
import { getUserId } from '@/app/utils/auth';

/**
 * User status state
 */
export interface UserStatus {
  isOnline: boolean;
  lastSeen: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to manage user status with real-time updates
 * 
 * @param userId - The ID of the user to track
 * @param options - Optional configuration
 * @param options.pollInterval - Interval in ms to refetch status (default: 30000 = 30s)
 * @param options.enablePolling - Whether to poll for status updates (default: true)
 * @returns User status state and refresh function
 */
export function useUserStatus(
  userId: string | null | undefined,
  options: {
    pollInterval?: number;
    enablePolling?: boolean;
  } = {}
): UserStatus & { refresh: () => Promise<void> } {
  const { pollInterval = 30000, enablePolling = true } = options;
  
  const [status, setStatus] = useState<UserStatus>({
    isOnline: false,
    lastSeen: null,
    isLoading: true,
    error: null,
  });

  const currentUserId = getUserId();
  const isCurrentUser = userId === currentUserId;
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch user status from API
   */
  const fetchStatus = useCallback(async () => {
    if (!userId) {
      setStatus({
        isOnline: false,
        lastSeen: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await getUserStatusAPI(userId);
      
      setStatus({
        isOnline: response.isOnline,
        lastSeen: response.lastSeen,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user status';
      setStatus({
        isOnline: false,
        lastSeen: null,
        isLoading: false,
        error: errorMessage,
      });
    }
  }, [userId]);

  /**
   * Set up socket listeners for real-time presence updates
   */
  useEffect(() => {
    if (!userId || isCurrentUser) {
      // For current user, we track socket connection directly
      // For other users, we rely on API polling and socket events
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    // Listen for user online/offline events
    // Backend should emit events like: 'userOnline' and 'userOffline' with userId
    const handleUserOnline = (data: { userId: string }) => {
      if (data.userId === userId) {
        setStatus(prev => ({
          ...prev,
          isOnline: true,
        }));
      }
    };

    const handleUserOffline = (data: { userId: string; lastSeen?: string }) => {
      if (data.userId === userId) {
        setStatus(prev => ({
          ...prev,
          isOnline: false,
          lastSeen: data.lastSeen || prev.lastSeen,
        }));
      }
    };

    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);

    return () => {
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
    };
  }, [userId, isCurrentUser]);

  /**
   * Track current user's online status via socket connection
   * For current user, we track socket connection state directly
   * but still fetch initial status from API
   */
  useEffect(() => {
    if (!isCurrentUser || !userId) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    // Update status based on socket connection state
    const updateFromSocket = () => {
      const isConnected = socket.connected;
      setStatus(prev => ({
        ...prev,
        isOnline: isConnected,
      }));
    };

    // Set initial state based on socket connection
    updateFromSocket();

    // Listen for connection events
    socket.on('connect', updateFromSocket);
    socket.on('disconnect', () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
      }));
    });

    return () => {
      socket.off('connect', updateFromSocket);
      socket.off('disconnect');
    };
  }, [isCurrentUser, userId]);

  /**
   * Initial fetch and polling setup
   */
  useEffect(() => {
    if (!userId) {
      return;
    }

    // Initial fetch
    fetchStatus();

    // Set up polling if enabled
    if (enablePolling) {
      pollIntervalRef.current = setInterval(() => {
        fetchStatus();
      }, pollInterval);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [userId, fetchStatus, enablePolling, pollInterval]);

  return {
    ...status,
    refresh: fetchStatus,
  };
}

