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

      const formatted = users.map(user => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        isOnline: user.isOnline,
      }));

      setSuggestions(formatted);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const sendFriendRequest = useCallback(async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await sendFriendRequestAPI(userId);

      setPendingRequests(prev => new Set([...prev, userId]));
      setSuggestions(prev => prev.filter(u => u.id !== userId));

      return true;
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
