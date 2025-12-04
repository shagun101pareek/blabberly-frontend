'use client';

import { useState, useCallback } from 'react';

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
  lastSeen?: Date;
  isOnline?: boolean;
}

// Mock incoming friend requests
const mockIncomingRequests: FriendRequest[] = [
  {
    id: 'req1',
    senderId: 'u1',
    senderUsername: 'taylor_swift',
    senderAvatar: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: 'req2',
    senderId: 'u2',
    senderUsername: 'ninja_coder',
    senderAvatar: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 'req3',
    senderId: 'u3',
    senderUsername: 'pixel_artist',
    senderAvatar: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
];

export function useFriendRequests() {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>(mockIncomingRequests);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptRequest = useCallback(async (requestId: string): Promise<Friend | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const request = incomingRequests.find(r => r.id === requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      // Remove from incoming requests
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));

      // Return the new friend
      const newFriend: Friend = {
        id: request.senderId,
        username: request.senderUsername,
        avatar: request.senderAvatar,
        isOnline: true,
      };

      return newFriend;
    } catch (err) {
      setError('Failed to accept friend request');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [incomingRequests]);

  const rejectRequest = useCallback(async (requestId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      return true;
    } catch (err) {
      setError('Failed to reject friend request');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call to fetch fresh requests
      await new Promise(resolve => setTimeout(resolve, 300));
      // In real app, would fetch from backend
    } catch (err) {
      setError('Failed to refresh requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    incomingRequests,
    isLoading,
    error,
    acceptRequest,
    rejectRequest,
    refreshRequests,
    requestCount: incomingRequests.length,
  };
}

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addFriend = useCallback((friend: Friend) => {
    setFriends(prev => {
      // Prevent duplicates
      if (prev.some(f => f.id === friend.id)) {
        return prev;
      }
      return [...prev, friend];
    });
  }, []);

  const removeFriend = useCallback(async (friendId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setFriends(prev => prev.filter(f => f.id !== friendId));
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    friends,
    setFriends,
    addFriend,
    removeFriend,
    isLoading,
    hasFriends: friends.length > 0,
  };
}


