'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { sendFriendRequestAPI } from '@/api/auth/friends/sendFriendRequestAPI';

export interface User {
  id: string;
  username: string;
  avatar?: string;
  email?: string;
}

export interface SearchResult extends User {
  friendshipStatus: 'none' | 'pending' | 'friends';
}

// Mock user data for demonstration
const mockUsers: User[] = [
  { id: '1', username: 'alex_dev', avatar: '' },
  { id: '2', username: 'sarah_designs', avatar: '' },
  { id: '3', username: 'mike_codes', avatar: '' },
  { id: '4', username: 'emma_writes', avatar: '' },
  { id: '5', username: 'john_builder', avatar: '' },
  { id: '6', username: 'lisa_creates', avatar: '' },
  { id: '7', username: 'david_tech', avatar: '' },
  { id: '8', username: 'anna_pixel', avatar: '' },
  { id: '9', username: 'chris_dev', avatar: '' },
  { id: '10', username: 'kate_ux', avatar: '' },
];

// Custom hook for debouncing
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for searching users
export function useUserSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track pending requests and friends (in real app, this would come from backend)
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<Set<string>>(new Set());

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search users when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Filter mock users based on query
        const filteredUsers = mockUsers.filter(user =>
          user.username.toLowerCase().includes(debouncedQuery.toLowerCase())
        );

        // Add friendship status to results
        const resultsWithStatus: SearchResult[] = filteredUsers.map(user => ({
          ...user,
          friendshipStatus: friends.has(user.id) 
            ? 'friends' 
            : pendingRequests.has(user.id) 
              ? 'pending' 
              : 'none'
        }));

        setSearchResults(resultsWithStatus);
        
      } catch (err) {
        setError('Failed to search users. Please try again.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchUsers();
  }, [debouncedQuery, pendingRequests, friends]);

  const sendFriendRequest = useCallback(async (userId: string) => {
    setError(null);
    try {
      // Call the real API
      await sendFriendRequestAPI(userId);
      
      setPendingRequests(prev => new Set([...prev, userId]));
      
      // Update search results to reflect new status
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, friendshipStatus: 'pending' as const }
            : user
        )
      );
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send friend request';
      setError(errorMessage);
      console.error('Error sending friend request:', err);
      return false;
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading,
    error,
    sendFriendRequest,
    clearSearch,
    pendingRequests,
    friends,
    setFriends,
  };
}

// Hook for getting current user
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'current',
    username: 'current_user',
    avatar: '',
  });

  return { currentUser, setCurrentUser };
}


