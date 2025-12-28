'use client';

import { useState, useCallback, useEffect } from 'react';
import { getChatroomsAPI, type ChatroomResponse } from './getChatrooms';
import { getUserId } from '@/app/utils/auth';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isRead?: boolean;
}

export interface ChatRoom {
  id: string;
  friendId: string;
  friendUsername: string;
  friendAvatar?: string;
  messages: Message[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isNewConnection?: boolean;
}

export function useChat() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Transform API chatroom response to ChatRoom interface
  const transformChatroom = useCallback((room: ChatroomResponse, currentUserId: string | null): ChatRoom | null => {
    if (!currentUserId) return null;

    // For non-group chats, find the other participant
    if (!room.isGroup && room.participants.length === 2) {
      const otherParticipant = room.participants.find(p => p._id !== currentUserId);
      if (!otherParticipant) return null;

      return {
        id: room._id,
        friendId: otherParticipant._id,
        friendUsername: otherParticipant.username,
        friendAvatar: undefined, // API doesn't provide avatar in participants
        messages: [], // Messages will be loaded separately if needed
        lastMessage: room.lastMessage?.text,
        lastMessageTime: room.lastMessage?.createdAt ? new Date(room.lastMessage.createdAt) : (room.updatedAt ? new Date(room.updatedAt) : undefined),
        unreadCount: 0, // API doesn't provide unread count, can be enhanced later
        isNewConnection: false,
      };
    }

    // For group chats, we can handle differently if needed
    // For now, skip group chats or handle them with a group name
    return null;
  }, []);

  // Fetch chatrooms from API
  const fetchChatrooms = useCallback(async () => {
    const currentUserId = getUserId();
    if (!currentUserId) {
      console.warn('No user ID found, cannot fetch chatrooms');
      return;
    }

    setIsLoading(true);
    try {
      const rooms = await getChatroomsAPI();
      const transformedRooms = rooms
        .map(room => transformChatroom(room, currentUserId))
        .filter((room): room is ChatRoom => room !== null);
      
      setChatRooms(transformedRooms);
    } catch (error) {
      console.error('Failed to fetch chatrooms:', error);
      // Don't throw, just log the error
    } finally {
      setIsLoading(false);
    }
  }, [transformChatroom]);

  // Fetch chatrooms on mount
  useEffect(() => {
    fetchChatrooms();
  }, [fetchChatrooms]);

  const createChatRoom = useCallback((friendId: string, friendUsername: string, friendAvatar?: string): ChatRoom => {
    const newRoom: ChatRoom = {
      id: `chat_${friendId}_${Date.now()}`,
      friendId,
      friendUsername,
      friendAvatar,
      messages: [],
      unreadCount: 0,
      isNewConnection: true,
    };

    setChatRooms(prev => {
      // Check if chat already exists with this friend
      const existing = prev.find(r => r.friendId === friendId);
      if (existing) {
        return prev;
      }
      return [newRoom, ...prev];
    });

    return newRoom;
  }, []);

  const selectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    
    // Mark messages as read
    setChatRooms(prev => 
      prev.map(room => 
        room.id === chatId 
          ? { ...room, unreadCount: 0 }
          : room
      )
    );
  }, []);

  const sendMessage = useCallback(async (chatId: string, text: string, senderId: string): Promise<boolean> => {
    if (!text.trim()) return false;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      text,
      senderId,
      timestamp: new Date(),
      isRead: false,
    };

    setChatRooms(prev => 
      prev.map(room => {
        if (room.id === chatId) {
          return {
            ...room,
            messages: [...room.messages, newMessage],
            lastMessage: text,
            lastMessageTime: new Date(),
            isNewConnection: false,
          };
        }
        return room;
      })
    );

    return true;
  }, []);

  const getSelectedChat = useCallback((): ChatRoom | null => {
    return chatRooms.find(room => room.id === selectedChatId) || null;
  }, [chatRooms, selectedChatId]);

  const getChatByFriendId = useCallback((friendId: string): ChatRoom | null => {
    return chatRooms.find(room => room.friendId === friendId) || null;
  }, [chatRooms]);

  const markConnectionAsRead = useCallback((chatId: string) => {
    setChatRooms(prev => 
      prev.map(room => 
        room.id === chatId 
          ? { ...room, isNewConnection: false }
          : room
      )
    );
  }, []);

  return {
    chatRooms,
    setChatRooms,
    selectedChatId,
    setSelectedChatId,
    selectChat,
    createChatRoom,
    sendMessage,
    getSelectedChat,
    getChatByFriendId,
    markConnectionAsRead,
    isLoading,
    hasChats: chatRooms.length > 0,
    fetchChatrooms, // Expose fetch function to allow manual refresh
  };
}


