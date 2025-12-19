'use client';

import { useState, useCallback, useEffect } from 'react';
import { sendFriendRequestAPI } from './sendFriendRequestAPI';
import { getPendingFriendRequestsAPI, PendingFriendRequest } from './getPendingFriendRequestsAPI';
import { discoverUsersAPI, DiscoverUser } from './discoverUsersAPI';
import { acceptFriendRequestAPI } from './acceptFriendRequestAPI';

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
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending friend requests on mount
  useEffect(() => {
    const fetchPendingRequests = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const pendingRequests = await getPendingFriendRequestsAPI();
        // Convert API response to FriendRequest format
        // getPendingFriendRequestsAPI already returns the correct format, just need to convert createdAt to Date
        const formattedRequests: FriendRequest[] = pendingRequests.map(req => ({
          id: req.id,
          senderId: req.senderId,
          senderUsername: req.senderUsername,
          senderAvatar: req.senderAvatar,
          createdAt: new Date(req.createdAt),
        }));
        setIncomingRequests(formattedRequests);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pending friend requests';
        setError(errorMessage);
        console.error('Error fetching pending friend requests:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingRequests();
  }, []);

  const acceptRequest = useCallback(async (requestId: string): Promise<Friend | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the real API
      const response = await acceptFriendRequestAPI(requestId);

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept friend request';
      setError(errorMessage);
      console.error('Error accepting friend request:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [incomingRequests]);

  const rejectRequest = useCallback(async (requestId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement reject API call when backend endpoint is available
      // For now, just remove from local state
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject friend request';
      setError(errorMessage);
      console.error('Error rejecting friend request:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pendingRequests = await getPendingFriendRequestsAPI();
      // Convert API response to FriendRequest format
      const formattedRequests: FriendRequest[] = pendingRequests.map(req => ({
        id: req.id,
        senderId: req.senderId,
        senderUsername: req.senderUsername,
        senderAvatar: req.senderAvatar,
        createdAt: new Date(req.createdAt),
      }));
      setIncomingRequests(formattedRequests);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh requests';
      setError(errorMessage);
      console.error('Error refreshing friend requests:', err);
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

// Mock friend suggestions (users not yet friends)
const mockFriendSuggestions: Friend[] = [
  {
    id: 'sug1',
    username: 'alex_dev',
    avatar: '',
    isOnline: true,
  },
  {
    id: 'sug2',
    username: 'sarah_designs',
    avatar: '',
    isOnline: false,
  },
  {
    id: 'sug3',
    username: 'mike_codes',
    avatar: '',
    isOnline: true,
  },
  {
    id: 'sug4',
    username: 'emma_writes',
    avatar: '',
    isOnline: true,
  },
  {
    id: 'sug5',
    username: 'john_builder',
    avatar: '',
    isOnline: false,
  },
  {
    id: 'sug6',
    username: 'lisa_creates',
    avatar: '',
    isOnline: true,
  },
];

export function useFriendSuggestions() {
  const [suggestions, setSuggestions] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  // Fetch discover users on mount
  useEffect(() => {
    const fetchDiscoverUsers = async () => {
      setIsLoading(true);
      try {
        const discoverUsers = await discoverUsersAPI();
        // Convert API response to Friend format
        const formattedSuggestions: Friend[] = discoverUsers.map(user => ({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          isOnline: user.isOnline,
        }));
        setSuggestions(formattedSuggestions);
      } catch (err) {
        console.error('Error fetching discover users:', err);
        // Fallback to empty array on error
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiscoverUsers();
  }, []);

  const sendFriendRequest = useCallback(async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Call the real API
      await sendFriendRequestAPI(userId);
      
      setPendingRequests(prev => new Set([...prev, userId]));
      
      // Remove from suggestions after sending request
      setSuggestions(prev => prev.filter(s => s.id !== userId));
      
      return true;
    } catch (err) {
      console.error('Error sending friend request:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    sendFriendRequest,
    pendingRequests,
  };
}


