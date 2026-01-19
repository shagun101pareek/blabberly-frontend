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
  type?: 'text' | 'image' | 'pdf';
  content?: string; // For image messages: image URL, for text messages: text content
  fileUrl?: string;
  fileName?: string;
}

export interface ChatRoom {
  id: string;
  friendId: string;
  friendUsername: string;
  friendAvatar?: string;
  friendUpdatedAt?: string | Date; // Friend's profile updated timestamp for cache-busting
  messages: Message[];
  lastMessage?: string;
  lastMessageType?: 'text' | 'image' | 'pdf';
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
    setSelectedChatId: setSelectedChatIdInHook,
  } = useChatrooms();

  // Use messages hook for fetching and managing messages for selected chat
  const {
    messages,
    isLoading: messagesLoading,
    addMessage: addMessageToHook,
    fetchMessages,
  } = useMessages(selectedChatId);

  // Refs to access latest values in socket listener without re-setting up listener
  const selectedChatIdRef = useRef<string | null>(null);
  const addMessageToHookRef = useRef(addMessageToHook);
  const updateChatroomRef = useRef(updateChatroom);

  // Keep refs in sync
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    addMessageToHookRef.current = addMessageToHook;
  }, [addMessageToHook]);

  useEffect(() => {
    updateChatroomRef.current = updateChatroom;
  }, [updateChatroom]);

  // Set up socket listeners for receiving messages (only once)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for new messages - append directly to local state
    const handleReceiveMessage = (data: {
      chatroomId: string;
      senderId: string;
      content: string;
      messageId?: string;
      timestamp?: string;
      type?: 'text' | 'image' | 'pdf';
      fileUrl?: string;
      fileName?: string;
    }) => {
      console.log('[useChat] 🔔 receiveMessage event received:', {
        chatroomId: data.chatroomId,
        messageId: data.messageId,
        type: data.type,
        content: data.content?.substring(0, 50),
        timestamp: data.timestamp,
      });

      // Transform socket message to Message format
      // CRITICAL: Preserve ALL fields from socket, especially type, content, fileUrl, fileName
      const newMessage: Message = {
        id: data.messageId || `temp_${Date.now()}`,
        text: data.content || '', // Keep for backward compatibility
        senderId: data.senderId,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        isRead: false,
        status: 'delivered', // Incoming messages are delivered
        // CRITICAL: Preserve type from socket - NEVER default to 'text'
        type: data.type, // Use AS-IS from socket, don't default
        // CRITICAL: Preserve content from socket
        content: data.content,
        // CRITICAL: Preserve fileUrl and fileName from socket
        fileUrl: data.fileUrl,
        fileName: data.fileName,
      };

      const currentChatId = selectedChatIdRef.current;
      console.log('[useChat] Current chatId:', currentChatId, 'Message chatroomId:', data.chatroomId);

      // Append message directly if it's for the current chat
      if (currentChatId === data.chatroomId) {
        console.log('[useChat] ✅ Appending message to current chat');
        addMessageToHookRef.current(newMessage);
      } else {
        console.log('[useChat] ⏭️ Message is for different chat, skipping append');
      }

      // Note: Chat list updates (lastMessage, timestamp, unreadCount) are handled by useChatrooms socket listener
    };

    // Set up listener
    socket.on('receiveMessage', handleReceiveMessage);

    // Cleanup listener on unmount
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, []); // Empty deps - set up listener only once

  // Update chatroom messages when messages change
  // This keeps chatRooms in sync, but getSelectedChat uses messages directly
  useEffect(() => {
    if (!selectedChatId) return;

    console.log('[useChat] 📝 Syncing messages to chatroom, message count:', messages.length);
    updateChatroom(selectedChatId, {
      messages: messages,
    });
  }, [messages, selectedChatId, updateChatroom]);

  // Select a chatroom
  const selectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    setSelectedChatIdInHook(chatId);
    
    // Mark messages as read
    updateChatroom(chatId, {
      unreadCount: 0,
    });

    // Mark messages as seen via API when chat view mounts
    markMessagesAsSeenAPI(chatId).catch((error) => {
      console.error('Failed to mark messages as seen:', error);
    });
  }, [updateChatroom, setSelectedChatIdInHook]);

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
      // CRITICAL: Preserve ALL fields from API response, especially type, content, fileUrl, fileName
      const savedMessage: Message = {
        id: response._id,
        text: response.content || '', // Keep for backward compatibility
        senderId: typeof response.sender === "string" ? response.sender : response.sender?._id || senderId,
        timestamp: new Date(response.createdAt),
        isRead: false,
        status: response.status || 'sent', // Use status from API response
        // CRITICAL: Preserve type from API - NEVER default to 'text'
        type: (response as any).type, // Use AS-IS from API
        // CRITICAL: Preserve content from API
        content: response.content,
        // CRITICAL: Preserve fileUrl and fileName from API
        fileUrl: (response as any).fileUrl || (response as any).file_url,
        fileName: (response as any).fileName || (response as any).file_name,
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
  // IMPORTANT: Always use messages from useMessages hook, not from chatRooms
  // This ensures socket-updated messages are always included
  const getSelectedChat = useCallback((): ChatRoom | null => {
    if (!selectedChatId) return null;
    
    const chatroom = chatRooms.find(room => room.id === selectedChatId);
    if (!chatroom) return null;

    // Always use messages from useMessages hook (includes socket updates)
    // Do NOT use chatroom.messages as it may be stale
    const chatWithMessages: ChatRoom = {
      ...chatroom,
      messages: messages, // Use messages from useMessages hook
    };
    
    console.log('[useChat] getSelectedChat called, message count:', messages.length);
    return chatWithMessages;
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
