/**
 * Custom hook for fetching and managing messages for a chatroom
 * - Fetches persisted messages via REST
 * - Supports optimistic + socket updates
 * - Safe on page refresh
 */

import { useState, useCallback, useEffect } from "react";
import { getMessagesAPI } from "@/api/auth/chat/getMessages";
import { getUserId } from "@/app/utils/auth";

/**
 * Message shape used by UI
 */
export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isRead: boolean;
}

/**
 * Transform backend message → frontend message
 */
function transformMessage(msg: any): Message {
  return {
    id: msg._id,
    text: msg.content, // ✅ backend field
    senderId:
      typeof msg.sender === "string" ? msg.sender : msg.sender?._id,
    timestamp: new Date(msg.createdAt),
    isRead: false, // can be extended later
  };
}

/**
 * Hook for fetching & managing messages of a chatroom
 */
export function useMessages(chatroomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch messages from backend (REST)
   */
  const fetchMessages = useCallback(async () => {
    if (!chatroomId) {
      setMessages([]);
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError("User not authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getMessagesAPI(chatroomId);

      const transformed = response
        .map(transformMessage)
        .sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );

      setMessages(transformed);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setError("Failed to load messages");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [chatroomId]);

  /**
   * Fetch messages whenever chatroom changes
   * (This now works correctly on page refresh)
   */
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /**
   * Add message (socket / optimistic update)
   */
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Avoid duplicates
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }

      const updated = [...prev, message];
      return updated.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
    });
  }, []);

  /**
   * Clear messages (optional, when switching chats)
   */
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
