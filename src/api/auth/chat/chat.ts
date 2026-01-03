'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useChatrooms } from '@/hooks/useChatrooms';
import { useMessages } from '@/hooks/useMessages';
import { getSocket } from '@/app/utils/socket';
import { getUserId } from '@/app/utils/auth';
import { sendMessageAPI } from './sendMessage';
import { markMessagesAsSeenAPI } from './markMessagesAsSeen';

// Type definitions
export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isRead: boolean;
  status?: 'sent' | 'delivered' | 'seen';
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

/**
 * Main chat hook that integrates:
 * - Chatrooms fetching (REST API)
 * - Messages fetching (REST API)
 * - Real-time messaging (Socket.IO)
 */
export function useChat() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  // Use chatrooms hook for fetching and managing chatrooms
  const {
    chatRooms,
    isLoading: chatroomsLoading,
    fetchChatrooms,
    updateChatroom,
    addChatroom,
  } = useChatrooms();

  // Use messages hook for fetching and managing messages for selected chat
  const {
    messages,
    isLoading: messagesLoading,
    addMessage: addMessageToHook,
    fetchMessages,
  } = useMessages(selectedChatId);

  // Ref to track socket listeners to avoid duplicates
  const listenersSetupRef = useRef(false);

  // Set up socket listeners for receiving messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket || listenersSetupRef.current) return;

    // Listen for new messages - ONLY trigger re-fetch, DO NOT save messages
    const handleReceiveMessage = (data: {
      chatroomId: string;
      senderId: string;
      content: string;
      messageId?: string;
      timestamp?: string;
    }) => {
      // Socket events may be used ONLY to trigger a re-fetch of messages
      // DO NOT append messages directly from socket events
      if (selectedChatId === data.chatroomId) {
        // Trigger re-fetch to get updated messages with correct statuses
        fetchMessages();
      }

      // Update chatroom last message info (for chat list display)
      updateChatroom(data.chatroomId, {
        lastMessage: data.content,
        lastMessageTime: data.timestamp ? new Date(data.timestamp) : new Date(),
        // Increment unread count if not the current chat
        unreadCount: selectedChatId === data.chatroomId ? 0 : 1,
      });
    };

    // Listen for message sent acknowledgment - trigger re-fetch to get updated statuses
    const handleMessageSent = (data: {
      chatroomId: string;
      messageId: string;
    }) => {
      // Trigger re-fetch to get updated message statuses from backend
      if (selectedChatId === data.chatroomId) {
        fetchMessages();
      }
    };

    // Set up listeners
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageSent', handleMessageSent);
    listenersSetupRef.current = true;

    // Cleanup listeners on unmount
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageSent', handleMessageSent);
      listenersSetupRef.current = false;
    };
  }, [selectedChatId, fetchMessages, updateChatroom]);

  // Update chatroom messages when messages change
  useEffect(() => {
    if (!selectedChatId) return;

    updateChatroom(selectedChatId, {
      messages: messages,
    });
  }, [messages, selectedChatId, updateChatroom]);

  // Select a chatroom
  const selectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    
    // Mark messages as read
    updateChatroom(chatId, {
      unreadCount: 0,
    });

    // Mark messages as seen via API when chat view mounts
    markMessagesAsSeenAPI(chatId).catch((error) => {
      console.error('Failed to mark messages as seen:', error);
    });
  }, [updateChatroom]);

  // Send a message via POST /api/messages/send
  const sendMessage = useCallback(async (chatId: string, text: string, senderId: string): Promise<boolean> => {
    if (!text.trim()) return false;

    // Get the chatroom to extract receiverId (friendId)
    const chatroom = chatRooms.find(room => room.id === chatId);
    if (!chatroom) {
      console.error('Chatroom not found');
      return false;
    }

    try {
      // Call the send API with receiverId and content
      const response = await sendMessageAPI(chatId, chatroom.friendId, text);

      // Transform API response to Message format
      const savedMessage: Message = {
        id: response._id,
        text: response.content,
        senderId: typeof response.sender === "string" ? response.sender : response.sender?._id || senderId,
        timestamp: new Date(response.createdAt),
        isRead: false,
        status: response.status || 'sent', // Use status from API response
      };

      // Add message to UI from API response
      if (selectedChatId === chatId) {
        addMessageToHook(savedMessage);
      }

      // Update chatroom with saved message
      updateChatroom(chatId, {
        lastMessage: text,
        lastMessageTime: savedMessage.timestamp,
        isNewConnection: false,
      });

      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      // Do NOT show the message if API fails
      return false;
    }
  }, [selectedChatId, addMessageToHook, updateChatroom, chatRooms]);

  // Get selected chat with messages
  const getSelectedChat = useCallback((): ChatRoom | null => {
    if (!selectedChatId) return null;
    
    const chatroom = chatRooms.find(room => room.id === selectedChatId);
    if (!chatroom) return null;

    // Return chatroom with current messages
    return {
      ...chatroom,
      messages: messages,
    };
  }, [chatRooms, selectedChatId, messages]);

  // Get chat by friend ID
  const getChatByFriendId = useCallback((friendId: string): ChatRoom | null => {
    return chatRooms.find(room => room.friendId === friendId) || null;
  }, [chatRooms]);

  // Create a new chatroom (for new connections)
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

    addChatroom(newRoom);
    return newRoom;
  }, [addChatroom]);

  // Mark connection as read
  const markConnectionAsRead = useCallback((chatId: string) => {
    updateChatroom(chatId, {
      isNewConnection: false,
    });
  }, [updateChatroom]);

  return {
    chatRooms,
    selectedChatId,
    selectChat,
    createChatRoom,
    sendMessage,
    getSelectedChat,
    getChatByFriendId,
    markConnectionAsRead,
    isLoading: chatroomsLoading || messagesLoading,
    hasChats: chatRooms.length > 0,
    fetchChatrooms,
    // Expose setChatRooms for backward compatibility if needed
    setChatRooms: (rooms: ChatRoom[]) => {
      // This is a no-op since chatrooms are managed by useChatrooms hook
      // Kept for backward compatibility
      console.warn('setChatRooms is deprecated, use updateChatroom or addChatroom instead');
    },
    setSelectedChatId,
  };
}
