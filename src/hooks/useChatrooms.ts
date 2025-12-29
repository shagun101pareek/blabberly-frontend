/**
 * Custom hook for fetching and managing chatrooms
 * Uses REST API to fetch chatrooms list
 */

import { useState, useEffect, useCallback } from 'react';
import { getChatroomsAPI, type ChatroomResponse } from '@/api/auth/chat/getChatrooms';
import { getUserId } from '@/app/utils/auth';

export interface Chatroom {
  id: string;
  friendId: string;
  friendUsername: string;
  friendAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
}

/**
 * Transform API response to Chatroom interface
 */
const transformChatroom = (room: ChatroomResponse, currentUserId: string | null): Chatroom | null => {
  if (!currentUserId) return null;

  // For non-group chats, find the other participant
  if (!room.isGroup && room.participants.length === 2) {
    const otherParticipant = room.participants.find(p => p._id !== currentUserId);
    if (!otherParticipant) return null;

    return {
      id: room._id,
      friendId: otherParticipant._id,
      friendUsername: otherParticipant.username,
      friendAvatar: undefined,
      lastMessage: room.lastMessage?.text,
      lastMessageTime: room.lastMessage?.createdAt 
        ? new Date(room.lastMessage.createdAt) 
        : (room.updatedAt ? new Date(room.updatedAt) : undefined),
    };
  }

  // Skip group chats for now
  return null;
};

/**
 * Hook to fetch and manage chatrooms
 */
export const useChatrooms = () => {
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChatrooms = useCallback(async () => {
    const currentUserId = getUserId();
    if (!currentUserId) {
      console.warn('No user ID found, cannot fetch chatrooms');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const rooms = await getChatroomsAPI();
      const transformedRooms = rooms
        .map(room => transformChatroom(room, currentUserId))
        .filter((room): room is Chatroom => room !== null);
      
      setChatrooms(transformedRooms);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chatrooms';
      setError(errorMessage);
      console.error('Failed to fetch chatrooms:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch chatrooms on mount
  useEffect(() => {
    fetchChatrooms();
  }, [fetchChatrooms]);

  // Update last message for a chatroom
  const updateLastMessage = useCallback((chatroomId: string, message: string, timestamp: Date) => {
    setChatrooms(prev => 
      prev.map(room => 
        room.id === chatroomId 
          ? { ...room, lastMessage: message, lastMessageTime: timestamp }
          : room
      )
    );
  }, []);

  return {
    chatrooms,
    isLoading,
    error,
    fetchChatrooms,
    updateLastMessage,
  };
};

