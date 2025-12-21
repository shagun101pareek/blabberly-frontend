'use client';

import { useState, useCallback, useEffect } from 'react';
import { getPendingFriendRequestsAPI } from '../api/auth/friends/getPendingFriendRequests';
import { acceptFriendRequestAPI } from '../api/auth/friends/acceptFriendRequestAPI';

export interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  createdAt: Date;
}

export interface Friend {
  id: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

export function useFriendRequests() {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPendingFriendRequestsAPI();

      const formattedRequests: FriendRequest[] = response.requests.map(req => ({
        id: req._id,
        senderId: req.fromUser._id,
        senderUsername: req.fromUser.username,
        senderAvatar: req.fromUser.avatar,
        createdAt: new Date(req.createdAt),
      }));

      setIncomingRequests(formattedRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
      setIncomingRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const acceptRequest = useCallback(
    async (requestId: string): Promise<Friend | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const request = incomingRequests.find(r => r.id === requestId);
        if (!request) {
          const errorMsg = 'Request not found';
          console.error('Accept request error:', errorMsg);
          setError(errorMsg);
          return null;
        }

        console.log('Calling acceptFriendRequestAPI with requestId:', requestId);
        const response = await acceptFriendRequestAPI(requestId);
        console.log('Accept request API response:', response);

        setIncomingRequests(prev =>
          prev.filter(r => r.id !== requestId)
        );

        return {
          id: request.senderId,
          username: request.senderUsername,
          avatar: request.senderAvatar,
          isOnline: true,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to accept request';
        console.error('Accept request error:', err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [incomingRequests]
  );

  const rejectRequest = useCallback(async (requestId: string): Promise<boolean> => {
    // Backend endpoint not implemented yet
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    return true;
  }, []);

  return {
    incomingRequests,
    isLoading,
    error,
    requestCount: incomingRequests.length,
    fetchPendingRequests,
    acceptRequest,
    rejectRequest,
  };
}
