/**
 * Custom hook for fetching and managing messages for a chatroom
 * Handles REST API fetching and Socket.IO real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { getMessagesAPI, type MessageResponse } from '@/api/auth/chat/getMessages';
import { getSocketInstance } from '@/app/utils/socket';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  chatroomId: string;
  timestamp: Date;
}

/**
 * Transform API message response to Message interface
 */
const transformMessage = (msg: MessageResponse): Message => {
  return {
    id: msg._id,
    text: msg.text,
    senderId: msg.sender,
    chatroomId: msg.chatroom,
    timestamp: new Date(msg.createdAt),
  };
};

/**
 * Hook to fetch and manage messages for a specific chatroom
 */
export const useMessages = (chatroomId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages from REST API when chatroom changes
  const fetchMessages = useCallback(async () => {
    if (!chatroomId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiMessages = await getMessagesAPI(chatroomId);
      const transformedMessages = apiMessages.map(transformMessage);
      
      // Sort by timestamp (oldest first)
      transformedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setMessages(transformedMessages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [chatroomId]);

  // Fetch messages when chatroomId changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Set up Socket.IO listener for real-time messages
  useEffect(() => {
    if (!chatroomId) {
      return;
    }

    const socket = getSocketInstance();
    if (!socket || !socket.connected) {
      console.warn('Socket not connected, real-time messages will not work');
      return;
    }

    const handleReceiveMessage = (data: {
      chatroomId: string;
      senderId: string;
      content: string;
      messageId?: string;
      timestamp?: string;
    }) => {
      // Only add message if it belongs to the currently open chatroom
      if (data.chatroomId === chatroomId) {
        const newMessage: Message = {
          id: data.messageId || `msg_${Date.now()}`,
          text: data.content,
          senderId: data.senderId,
          chatroomId: data.chatroomId,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        };

        setMessages(prev => {
          // Check if message already exists (prevent duplicates)
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    };

    // Add listener
    socket.on('receiveMessage', handleReceiveMessage);

    // Cleanup listener on unmount or chatroom change
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [chatroomId]);

  // Add message optimistically (for sending)
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Check if message already exists
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  return {
    messages,
    isLoading,
    error,
    fetchMessages,
    addMessage,
  };
};

