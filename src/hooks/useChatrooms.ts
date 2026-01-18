/**
 * Custom hook for fetching and managing chatrooms
 * Handles REST API calls to get chatrooms list
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { getChatroomsAPI, type ChatroomResponse } from '@/api/auth/chat/getChatrooms';
import { getUserId } from '@/app/utils/auth';
import type { ChatRoom } from '@/api/auth/chat/chat';
import { useSocket } from '@/app/context/SocketContext';

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
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
      // If it's already a full URL, use it as-is
      if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
        friendAvatar = profileImage;
      } else {
        // Otherwise, it's a relative path from the backend - prefix with backend URL
        friendAvatar = `${BASE_URL}${profileImage}`;
      }
    }

    // Determine preview text based on lastMessage type
    let previewText = room.lastMessage?.text || '';
    if (room.lastMessage) {
      // Check if backend sends type info (may need to adjust based on actual API response)
      const messageType = (room.lastMessage as any).type || 'text';
      if (messageType === 'image') {
        previewText = '📷 Photo';
      } else if (messageType === 'pdf') {
        previewText = '📄 Document';
      }
    }

    return {
      id: room._id,
      friendId: otherParticipant._id,
      friendUsername: otherParticipant.username,
      friendAvatar,
      friendUpdatedAt: otherParticipant.updatedAt,
      messages: [], // Messages will be loaded separately
      lastMessage: previewText,
      lastMessageType: (room.lastMessage as any)?.type || 'text',
      lastMessageTime: room.lastMessage?.createdAt 
        ? new Date(room.lastMessage.createdAt) 
        : (room.updatedAt ? new Date(room.updatedAt) : undefined),
      unreadCount: 0,
      isNewConnection: false,
    };
  }

  // Skip group chats for now
  return null;
}

/**
 * Sort chatrooms by lastMessageTime DESC (most recent first)
 */
function sortChatroomsByLastMessage(rooms: ChatRoom[]): ChatRoom[] {
  return [...rooms].sort((a, b) => {
    const timeA = a.lastMessageTime?.getTime() || 0;
    const timeB = b.lastMessageTime?.getTime() || 0;
    return timeB - timeA;
  });
}

/**
 * Extract text from lastMessage (handles both string and object formats)
 */
function extractLastMessageText(lastMessage: string | { text?: string; content?: string } | undefined): string {
  if (!lastMessage) return '';
  if (typeof lastMessage === 'string') return lastMessage;
  return lastMessage.text || lastMessage.content || '';
}

/**
 * Truncate message preview to 30 characters
 */
function truncateMessage(text: string | undefined, maxLength: number = 30): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

/**
 * Hook for fetching and managing chatrooms
 */
export function useChatrooms() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const selectedChatIdRef = useRef<string | null>(null);

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
        const existingUnreadMap = new Map(
          prev.map(room => [room.id, room.unreadCount])
        );
        
        const updated = transformedRooms.map(newRoom => {
          const existingMessages = existingMessagesMap.get(newRoom.id);
          const existingUnread = existingUnreadMap.get(newRoom.id);
          // Preserve messages if they exist (from socket updates or previous fetch)
          // Only use empty array if this is a brand new chatroom
          // Preserve unreadCount if it exists (from socket updates)
          return {
            ...newRoom,
            messages: existingMessages || newRoom.messages,
            unreadCount: existingUnread !== undefined ? existingUnread : newRoom.unreadCount,
          };
        });
        
        return sortChatroomsByLastMessage(updated);
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

  // Socket listeners for real-time chat list updates
  useEffect(() => {
    if (!socket) return;

    // Handle receiveMessage event
    const handleReceiveMessage = (data: {
      chatroomId: string;
      senderId: string;
      content: string | { text?: string; content?: string };
      messageId?: string;
      timestamp?: string;
      createdAt?: string;
      type?: 'text' | 'image' | 'pdf';
    }) => {
      const timestamp = data.timestamp || data.createdAt;
      const messageTime = timestamp ? new Date(timestamp) : new Date();
      const isActiveChat = selectedChatIdRef.current === data.chatroomId;
      
      // Extract content text (handle both string and object)
      const contentText = typeof data.content === 'string' 
        ? data.content 
        : extractLastMessageText(data.content);
      
      const messageType = data.type || 'text';
      
      // Determine preview text based on type
      let previewText = contentText;
      if (messageType === 'image') {
        previewText = '📷 Photo';
      } else if (messageType === 'pdf') {
        previewText = '📄 Document';
      }

      setChatRooms(prev => {
        const updated = prev.map(room => {
          if (room.id === data.chatroomId) {
            return {
              ...room,
              lastMessage: truncateMessage(previewText, 30),
              lastMessageType: messageType,
              lastMessageTime: messageTime,
              unreadCount: isActiveChat ? 0 : (room.unreadCount + 1),
            };
          }
          return room;
        });
        
        return sortChatroomsByLastMessage(updated);
      });
    };

    // Handle chatListUpdated event
    const handleChatListUpdated = (data: {
      chatroomId: string;
      lastMessage?: string | { text?: string; content?: string; sender?: string; createdAt?: string };
      lastMessageType?: 'text' | 'image' | 'pdf';
      lastMessageTime?: string;
      unreadCount?: number;
    }) => {
      setChatRooms(prev => {
        const updated = prev.map(room => {
          if (room.id === data.chatroomId) {
            const lastMessageText = data.lastMessage 
              ? extractLastMessageText(data.lastMessage as string | { text?: string; content?: string })
              : room.lastMessage;
            
            // Determine preview text based on type
            let previewText = lastMessageText;
            const messageType = data.lastMessageType || room.lastMessageType || 'text';
            if (messageType === 'image') {
              previewText = '📷 Photo';
            } else if (messageType === 'pdf') {
              previewText = '📄 Document';
            }
            
            // Extract timestamp from lastMessage object if it's an object
            let lastMessageTime = room.lastMessageTime;
            if (data.lastMessageTime) {
              lastMessageTime = new Date(data.lastMessageTime);
            } else if (data.lastMessage && typeof data.lastMessage === 'object' && data.lastMessage.createdAt) {
              lastMessageTime = new Date(data.lastMessage.createdAt);
            }
            
            return {
              ...room,
              lastMessage: previewText ? truncateMessage(previewText, 30) : room.lastMessage,
              lastMessageType: messageType,
              lastMessageTime,
              unreadCount: data.unreadCount !== undefined ? data.unreadCount : room.unreadCount,
            };
          }
          return room;
        });
        
        return sortChatroomsByLastMessage(updated);
      });
    };

    // Remove existing listeners before adding new ones
    socket.off('receiveMessage', handleReceiveMessage);
    socket.off('chatListUpdated', handleChatListUpdated);

    // Register listeners
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('chatListUpdated', handleChatListUpdated);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('chatListUpdated', handleChatListUpdated);
    };
  }, [socket]);

  // Expose method to set selected chat ID for unread count logic
  const setSelectedChatId = useCallback((chatId: string | null) => {
    selectedChatIdRef.current = chatId;
    
    // Reset unread count when chat is opened
    if (chatId) {
      setChatRooms(prev =>
        prev.map(room =>
          room.id === chatId ? { ...room, unreadCount: 0 } : room
        )
      );
    }
  }, []);

  // Update a specific chatroom
  const updateChatroom = useCallback((chatroomId: string, updates: Partial<ChatRoom>) => {
    setChatRooms(prev => {
      const updated = prev.map(room =>
        room.id === chatroomId 
          ? { 
              ...room, 
              ...updates,
              lastMessage: updates.lastMessage 
                ? truncateMessage(
                    typeof updates.lastMessage === 'string' 
                      ? updates.lastMessage 
                      : extractLastMessageText(updates.lastMessage as any),
                    30
                  ) 
                : room.lastMessage,
            } 
          : room
      );
      
      // Auto-sort if lastMessageTime was updated
      if (updates.lastMessageTime) {
        return sortChatroomsByLastMessage(updated);
      }
      
      return updated;
    });
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
    setSelectedChatId,
  };
}

