'use client';

import { useState, useCallback, useEffect } from 'react';
import { discoverUsersAPI } from '../api/auth/friends/discoverUsersAPI';
import { sendFriendRequestAPI } from '../api/auth/friends/sendFriendRequestAPI';

export interface FriendSuggestion {
  id: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

export function useFriendSuggestions() {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const users = await discoverUsersAPI();
      
      // discoverUsersAPI already normalizes the data and filters invalid IDs
      setSuggestions(users);
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const sendFriendRequest = useCallback(async (userId: string): Promise<boolean> => {
    // Validate userId before making API call
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('sendFriendRequest: Invalid userId:', userId);
      return false;
    }

    setIsLoading(true);
    try {
      console.log('useFriendSuggestions: Sending friend request to userId:', userId);
      await sendFriendRequestAPI(userId);

      setPendingRequests(prev => new Set([...prev, userId]));
      setSuggestions(prev => prev.filter(u => u.id !== userId));

      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    pendingRequests,
    fetchSuggestions,
    sendFriendRequest,
  };
}
