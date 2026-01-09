/**
 * Custom hook for fetching and managing chatrooms
 * Handles REST API calls to get chatrooms list
 */

import { useState, useCallback, useEffect } from 'react';
import { getChatroomsAPI, type ChatroomResponse } from '@/api/auth/chat/getChatrooms';
import { getUserId } from '@/app/utils/auth';
import type { ChatRoom } from '@/api/auth/chat/chat';

/**
 * Transform API chatroom response to ChatRoom interface
 */
function transformChatroom(room: ChatroomResponse, currentUserId: string | null): ChatRoom | null {
  if (!currentUserId) return null;

  // For non-group chats, find the other participant
  if (!room.isGroup && room.participants.length === 2) {
    const otherParticipant = room.participants.find(p => p._id !== currentUserId);
    if (!otherParticipant) return null;

    // Extract profile picture URL (prioritize profileImage, fallback to profilePicture)
    const profileImage = otherParticipant.profileImage || otherParticipant.profilePicture;
    let friendAvatar: string | undefined = undefined;
    
    if (profileImage && profileImage.trim() !== '') {
      const BACKEND_BASE_URL = 'http://localhost:5000';
      // If it's already a full URL, use it as-is
      if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
        friendAvatar = profileImage;
      } else {
        // Otherwise, it's a relative path from the backend - prefix with backend URL
        friendAvatar = `${BACKEND_BASE_URL}${profileImage}`;
      }
    }

    return {
      id: room._id,
      friendId: otherParticipant._id,
      friendUsername: otherParticipant.username,
      friendAvatar,
      friendUpdatedAt: otherParticipant.updatedAt,
      messages: [], // Messages will be loaded separately
      lastMessage: room.lastMessage?.text,
      lastMessageTime: room.lastMessage?.createdAt 
        ? new Date(room.lastMessage.createdAt) 
        : (room.updatedAt ? new Date(room.updatedAt) : undefined),
      unreadCount: 0, // Can be enhanced later
      isNewConnection: false,
    };
  }

  // Skip group chats for now
  return null;
}

/**
 * Hook for fetching and managing chatrooms
 */
export function useChatrooms() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chatrooms from API
  const fetchChatrooms = useCallback(async () => {
    const currentUserId = getUserId();
    if (!currentUserId) {
      console.warn('No user ID found, cannot fetch chatrooms');
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const rooms = await getChatroomsAPI();
      const transformedRooms = rooms
        .map(room => transformChatroom(room, currentUserId))
        .filter((room): room is ChatRoom => room !== null);
      
      // Preserve existing messages when updating chatrooms
      // This prevents socket-updated messages from being lost
      setChatRooms(prev => {
        const existingMessagesMap = new Map(
          prev.map(room => [room.id, room.messages])
        );
        
        return transformedRooms.map(newRoom => {
          const existingMessages = existingMessagesMap.get(newRoom.id);
          // Preserve messages if they exist (from socket updates or previous fetch)
          // Only use empty array if this is a brand new chatroom
          return {
            ...newRoom,
            messages: existingMessages || newRoom.messages,
          };
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chatrooms';
      console.error('Failed to fetch chatrooms:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch chatrooms on mount
  useEffect(() => {
    fetchChatrooms();
  }, [fetchChatrooms]);

  // Update a specific chatroom
  const updateChatroom = useCallback((chatroomId: string, updates: Partial<ChatRoom>) => {
    setChatRooms(prev =>
      prev.map(room =>
        room.id === chatroomId ? { ...room, ...updates } : room
      )
    );
  }, []);

  // Add a new chatroom (for new connections)
  const addChatroom = useCallback((chatroom: ChatRoom) => {
    setChatRooms(prev => {
      // Check if chatroom already exists
      const existing = prev.find(r => r.id === chatroom.id || r.friendId === chatroom.friendId);
      if (existing) {
        return prev;
      }
      return [chatroom, ...prev];
    });
  }, []);

  return {
    chatRooms,
    isLoading,
    error,
    fetchChatrooms,
    updateChatroom,
    addChatroom,
  };
}

