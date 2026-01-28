'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { getAuthToken, getUserId, getUser } from '../utils/auth';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from token/localStorage on mount
  useEffect(() => {
    const initializeUser = async () => {
      const token = getAuthToken();
      const userId = getUserId();
      
      if (token && userId) {
        const user = await getUser(token, userId); 
        // For now, create a basic user object from available data
        // Later, you can fetch from get-me API if available
        // Check if user data exists in localStorage (set from login/signup)
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          try {
            const parsedUser = JSON.parse(storedUserData);
            setUser(parsedUser);
          } catch (e) {
            // Fallback to basic user object
            setUser({
              id: userId,
              username: 'User',
              profileImage: undefined,
              avatar: undefined,
            });
          }
        } else {
          setUser({
            id: userId,
            username: user?.username,
            profileImage: user?.profileImage,
            avatar: undefined,
          });
        }
      }
      setIsLoading(false);
    };

    initializeUser();
  }, []);

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updates } : null;
      // Store updated user in localStorage for persistence
      if (updated) {
        localStorage.setItem('userData', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const setUserWithStorage = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('userData', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('userData');
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser: setUserWithStorage, updateUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  console.log('user', context?.user);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

