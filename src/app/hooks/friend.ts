'use client';

import { useState, useCallback } from 'react';
import { sendFriendRequestAPI } from './sendFriendRequestAPI';
import { getPendingFriendRequestsAPI } from './getPendingFriendRequestsAPI';
import { acceptFriendRequestAPI } from './acceptFriendRequestAPI';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

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

export function useFriendRequests() {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchPendingRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPendingFriendRequestsAPI();
      
      // Transform API response to FriendRequest format
      const transformedRequests: FriendRequest[] = response.requests.map((req) => ({
        id: req._id,
        senderId: req.fromUser._id,
        senderUsername: req.fromUser.username,
        senderAvatar: undefined, // API doesn't provide avatar yet
        createdAt: new Date(req.createdAt),
      }));

      setIncomingRequests(transformedRequests);
      setTotalCount(response.count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pending friend requests';
      setError(errorMessage);
      console.error('Error fetching pending friend requests:', err);
      setIncomingRequests([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptRequest = useCallback(async (requestId: string): Promise<Friend | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await acceptFriendRequestAPI(requestId);

      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));

      toast.success(`You are now friends with ${response.friend.username}`);
      
      // Optionally refresh friends list and chatrooms list
      // For now, we'll just return the new friend
      const newFriend: Friend = {
        id: response.friend.id,
        username: response.friend.username,
        avatar: response.friend.avatar,
        isOnline: true, 
      };

      return newFriend;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept friend request';
      
      if (errorMessage.includes('401')) {
        toast.error('Session expired. Please log in again.');
        router.push('/login'); 
      } else if (errorMessage.includes('404')) {
        toast.error('Friend request not found.');
      } else {
        toast.error(errorMessage);
      }
      setError(errorMessage);
      console.error('Error accepting friend request:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const rejectRequest = useCallback(async (requestId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      toast.info('Friend request rejected.');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject friend request';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshRequests = useCallback(async () => {
    await fetchPendingRequests();
  }, [fetchPendingRequests]);

  return {
    incomingRequests,
    totalCount,
    isLoading,
    error,
    acceptRequest,
    rejectRequest,
    refreshRequests,
    fetchPendingRequests,
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
  const [suggestions, setSuggestions] = useState<Friend[]>(mockFriendSuggestions);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

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


