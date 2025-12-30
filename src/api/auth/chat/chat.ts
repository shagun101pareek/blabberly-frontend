'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useChatrooms } from '@/hooks/useChatrooms';
import { useMessages } from '@/hooks/useMessages';
import { getSocket } from '@/app/utils/socket';
import { getUserId } from '@/app/utils/auth';

// Type definitions
export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isRead: boolean;
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

    // Listen for new messages
    const handleReceiveMessage = (data: {
      chatroomId: string;
      senderId: string;
      content: string;
      messageId?: string;
      timestamp?: string;
    }) => {
      const currentUserId = getUserId();
      if (!currentUserId) return;

      // Create message object
      const newMessage: Message = {
        id: data.messageId || `msg_${Date.now()}`,
        text: data.content,
        senderId: data.senderId,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        isRead: false,
      };

      // If message belongs to currently open chat, add it to messages
      if (selectedChatId === data.chatroomId) {
        addMessageToHook(newMessage);
      }

      // Update chatroom with new last message
      updateChatroom(data.chatroomId, {
        lastMessage: data.content,
        lastMessageTime: newMessage.timestamp,
        // Increment unread count if not the current chat
        unreadCount: selectedChatId === data.chatroomId ? 0 : 1,
      });
    };

    // Listen for message sent acknowledgment (optional, for confirmation)
    const handleMessageSent = (data: {
      chatroomId: string;
      messageId: string;
    }) => {
      // Message was successfully sent to server
      // You can use this to update message status if needed
      console.log('Message sent confirmation:', data);
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
  }, [selectedChatId, addMessageToHook, updateChatroom]);

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
  }, [updateChatroom]);

  // Send a message via socket
  const sendMessage = useCallback(async (chatId: string, text: string, senderId: string): Promise<boolean> => {
    if (!text.trim()) return false;

    const socket = getSocket();
    if (!socket || !socket.connected) {
      console.error('Socket not connected, cannot send message');
      return false;
    }

    // Create optimistic message (shows immediately)
    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`, // Temporary ID, will be replaced by server
      text,
      senderId,
      timestamp: new Date(),
      isRead: false,
    };

    // Add message optimistically to UI
    if (selectedChatId === chatId) {
      addMessageToHook(optimisticMessage);
    }

    // Update chatroom with optimistic message
    updateChatroom(chatId, {
      lastMessage: text,
      lastMessageTime: optimisticMessage.timestamp,
      isNewConnection: false,
    });

    // Emit message via socket
    socket.emit('sendMessage', {
      chatroomId: chatId,
      senderId: senderId,
      content: text,
    });

    return true;
  }, [selectedChatId, addMessageToHook, updateChatroom]);

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
