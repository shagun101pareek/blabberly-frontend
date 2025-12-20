'use client';

import { useState, useCallback } from 'react';

export interface Friend {
  id: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addFriend = useCallback((friend: Friend) => {
    setFriends(prev =>
      prev.some(f => f.id === friend.id) ? prev : [...prev, friend]
    );
  }, []);

  const removeFriend = useCallback(async (friendId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      setFriends(prev => prev.filter(f => f.id !== friendId));
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    friends,
    isLoading,
    hasFriends: friends.length > 0,
    addFriend,
    removeFriend,
    setFriends, // useful for initial fetch later
  };
}
