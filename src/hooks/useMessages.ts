/**
 * Custom hook for fetching and managing messages for a chatroom
 * Handles REST API calls to get messages and manages message state
 */

import { useState, useCallback, useEffect } from 'react';
import { getMessagesAPI, type MessageResponse } from '@/api/auth/chat/getMessages';
import { getUserId } from '@/app/utils/auth';
import type { Message } from '@/api/auth/chat/chat';

/**
 * Transform API message response to Message interface
 */
function transformMessage(msg: MessageResponse, currentUserId: string | null): Message {
  return {
    id: msg._id,
    text: msg.text,
    senderId: msg.sender,
    timestamp: new Date(msg.createdAt),
    isRead: false, // Can be enhanced later
  };
}

/**
 * Hook for fetching and managing messages for a specific chatroom
 */
export function useMessages(chatroomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages when chatroomId changes
  const fetchMessages = useCallback(async () => {
    if (!chatroomId) {
      setMessages([]);
      return;
    }

    const currentUserId = getUserId();
    if (!currentUserId) {
      console.warn('No user ID found, cannot fetch messages');
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const messageResponses = await getMessagesAPI(chatroomId);
      const transformedMessages = messageResponses
        .map(msg => transformMessage(msg, currentUserId))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort chronologically
      
      setMessages(transformedMessages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      console.error('Failed to fetch messages:', err);
      setError(errorMessage);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [chatroomId]);

  // Fetch messages when chatroomId changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Add a new message (for optimistic updates and real-time messages)
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Check if message already exists (avoid duplicates)
      const exists = prev.some(m => m.id === message.id);
      if (exists) {
        return prev;
      }
      
      // Add message and sort chronologically
      const updated = [...prev, message];
      return updated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });
  }, []);

  // Clear messages (when switching chatrooms)
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    fetchMessages,
    addMessage,
    clearMessages,
  };
}

