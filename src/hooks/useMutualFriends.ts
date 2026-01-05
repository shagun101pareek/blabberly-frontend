import { useState, useCallback, useRef } from 'react';
import { getMutualFriendsAPI, MutualFriendsResponse } from '@/api/auth/users/getMutualFriends';

interface MutualFriendsCache {
  data: MutualFriendsResponse;
  timestamp: number;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Hook to fetch and cache mutual friends data
 * Prevents duplicate API calls for the same user pair
 */
export function useMutualFriends() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});
  const cacheRef = useRef<Map<string, MutualFriendsCache>>(new Map());

  /**
   * Get cache key for a user pair
   */
  const getCacheKey = useCallback((userId: string, otherUserId: string): string => {
    // Sort IDs to ensure same key regardless of order
    const [id1, id2] = [userId, otherUserId].sort();
    return `${id1}:${id2}`;
  }, []);

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback((cache: MutualFriendsCache): boolean => {
    return Date.now() - cache.timestamp < CACHE_DURATION;
  }, []);

  /**
   * Fetch mutual friends for a user pair
   */
  const fetchMutualFriends = useCallback(
    async (userId: string, otherUserId: string): Promise<MutualFriendsResponse | null> => {
      const cacheKey = getCacheKey(userId, otherUserId);
      const cacheKeyForError = `${userId}:${otherUserId}`;

      // Check cache first
      const cached = cacheRef.current.get(cacheKey);
      if (cached && isCacheValid(cached)) {
        return cached.data;
      }

      // Set loading state
      setLoading(prev => ({ ...prev, [cacheKeyForError]: true }));
      setError(prev => ({ ...prev, [cacheKeyForError]: null }));

      try {
        const data = await getMutualFriendsAPI(userId, otherUserId);
        
        // Update cache
        cacheRef.current.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });

        setLoading(prev => {
          const next = { ...prev };
          delete next[cacheKeyForError];
          return next;
        });

        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mutual friends';
        setError(prev => ({ ...prev, [cacheKeyForError]: errorMessage }));
        setLoading(prev => {
          const next = { ...prev };
          delete next[cacheKeyForError];
          return next;
        });
        return null;
      }
    },
    [getCacheKey, isCacheValid]
  );

  /**
   * Get cached mutual friends count (without fetching)
   */
  const getCachedCount = useCallback(
    (userId: string, otherUserId: string): number | null => {
      const cacheKey = getCacheKey(userId, otherUserId);
      const cached = cacheRef.current.get(cacheKey);
      if (cached && isCacheValid(cached)) {
        return cached.data.count;
      }
      return null;
    },
    [getCacheKey, isCacheValid]
  );

  /**
   * Get cached mutual friends list (without fetching)
   */
  const getCachedFriends = useCallback(
    (userId: string, otherUserId: string): MutualFriendsResponse['mutualFriends'] | null => {
      const cacheKey = getCacheKey(userId, otherUserId);
      const cached = cacheRef.current.get(cacheKey);
      if (cached && isCacheValid(cached)) {
        return cached.data.mutualFriends;
      }
      return null;
    },
    [getCacheKey, isCacheValid]
  );

  /**
   * Clear cache for a specific user pair
   */
  const clearCache = useCallback(
    (userId: string, otherUserId: string) => {
      const cacheKey = getCacheKey(userId, otherUserId);
      cacheRef.current.delete(cacheKey);
    },
    [getCacheKey]
  );

  /**
   * Clear all cache
   */
  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    fetchMutualFriends,
    getCachedCount,
    getCachedFriends,
    loading,
    error,
    clearCache,
    clearAllCache,
  };
}

