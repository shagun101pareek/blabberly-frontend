'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuthToken } from '@/app/utils/auth';

export interface SearchUser {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface UseUserSearchReturn {
  searchQuery: string;
  searchResults: SearchUser[];
  isLoading: boolean;
  error: string | null;
  setSearchQuery: (query: string) => void;
  clearResults: () => void;
}

export function useUserSearch(): UseUserSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      // Handle both array response and object with users property
      const users = Array.isArray(data) ? data : (data.users || []);
      setSearchResults(users);
    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to search users');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear results if query is too short
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Set loading state immediately
    setIsLoading(true);

    // Debounce the API call
    debounceTimerRef.current = setTimeout(() => {
      searchUsers(searchQuery);
    }, 400);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, searchUsers]);

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length === 0) {
      setSearchResults([]);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    searchQuery,
    searchResults,
    isLoading,
    error,
    setSearchQuery: handleSetSearchQuery,
    clearResults,
  };
}

