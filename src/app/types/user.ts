'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { sendFriendRequestAPI } from '@/api/auth/friends/sendFriendRequestAPI';

/**
 * User interface
 * 
 * Architecture Note: Profile pictures are returned as part of the user object.
 * - Use `profileImage` field for profile picture URL (primary)
 * - `avatar` is kept for backward compatibility
 * - DO NOT call profile-picture API on page load
 * - Only call PUT /api/users/profile-picture when user selects a new image
 */
export interface User {
  id: string;
  username: string;
  /** Profile picture URL from user object (primary field) */
  profileImage?: string;
  /** Avatar URL (kept for backward compatibility, prefer profileImage) */
  avatar?: string;
  email?: string;
  /** Timestamp when user profile was last updated (for cache-busting profile images) */
  updatedAt?: string | Date;
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
    
    // Validate userId before making API call
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      const errorMsg = 'Invalid user ID provided';
      console.error('sendFriendRequest: Invalid userId:', userId);
      setError(errorMsg);
      return false;
    }
    
    try {
      console.log('Calling sendFriendRequestAPI with userId:', userId);
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

/**
 * Add cache-busting query parameter to an image URL
 * 
 * @param url - Image URL to add cache-busting to
 * @param timestamp - Timestamp to use for cache-busting (Date, string, or number)
 * @returns URL with cache-busting query parameter
 */
export function addCacheBuster(url: string, timestamp?: string | Date | number): string {
  if (!url) return url;
  
  // Don't add cache-buster to default avatars or data URLs
  if (url === '/default-avatar.svg' || url.startsWith('data:') || url.includes('default-avatar')) {
    return url;
  }
  
  // Convert timestamp to number (milliseconds)
  let cacheBuster: number;
  if (timestamp) {
    if (typeof timestamp === 'string') {
      cacheBuster = new Date(timestamp).getTime();
    } else if (timestamp instanceof Date) {
      cacheBuster = timestamp.getTime();
    } else {
      cacheBuster = timestamp;
    }
  } else {
    // Fallback to current timestamp if no timestamp provided
    cacheBuster = Date.now();
  }
  
  // Add cache-busting query parameter
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${cacheBuster}`;
}

/**
 * Get profile image URL from user object with cache-busting
 * 
 * Architecture Rule: Profile picture is returned as part of the user object (field: profileImage).
 * Backend returns relative paths (e.g., /uploads/profile-pics/abc123.jpeg) which need to be
 * prefixed with the backend base URL (from NEXT_PUBLIC_BASE_URL env variable) for proper rendering.
 * 
 * This function automatically adds a cache-busting query parameter using user.updatedAt or
 * falls back to current timestamp to ensure browsers reload the image when it's updated.
 * 
 * @param user - User object
 * @param defaultAvatar - Default avatar URL to return if no profile image is available
 * @returns Profile image URL (with backend prefix and cache-busting if needed) or default avatar
 */
export function getUserProfileImage(user: User | null | undefined, defaultAvatar?: string): string {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const DEFAULT_AVATAR = defaultAvatar || '/default-avatar.svg';
  
  if (!user) return DEFAULT_AVATAR;
  
  // Prioritize profileImage (backend field) over avatar (legacy)
  const profileImage = user.profileImage || user.avatar;
  
  // If profileImage exists and is non-empty, prefix with backend URL
  if (profileImage && profileImage.trim() !== '') {
    let imageUrl: string;
    
    // Check if it's already a full URL (starts with http:// or https://)
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
      imageUrl = profileImage;
    } else {
      // Otherwise, it's a relative path from the backend - prefix with backend URL
      imageUrl = `${BASE_URL}${profileImage}`;
    }
    
    // Add cache-busting query parameter using user.updatedAt or fallback to current timestamp
    return addCacheBuster(imageUrl, user.updatedAt);
  }
  
  // Return default avatar if no profile image is available (no cache-busting needed)
  return DEFAULT_AVATAR;
}

