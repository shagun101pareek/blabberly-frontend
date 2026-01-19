/**
 * Custom hook for fetching and managing messages for a chatroom
 * - Fetches persisted messages via REST
 * - Supports optimistic + socket updates
 * - Safe on page refresh
 */

import { useState, useCallback, useEffect, useRef } from "react";
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
  status?: 'sent' | 'delivered' | 'seen';
  type?: 'text' | 'image' | 'pdf';
  content?: string; // For image messages: image URL, for text messages: text content
  fileUrl?: string;
  fileName?: string;
}

/**
 * Transform backend message → frontend message
 * CRITICAL: Preserve ALL fields from backend, especially type, content, fileUrl, fileName
 */
function transformMessage(msg: any): Message {
  console.log('[useMessages] 🔍 transformMessage - BEFORE transform:', {
    _id: msg._id,
    type: msg.type,
    content: msg.content?.substring(0, 50),
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
  });

  const transformed: Message = {
    id: msg._id || msg.id,
    text: msg.text || msg.content || '', // Keep for backward compatibility
    senderId:
      typeof msg.sender === "string" ? msg.sender : msg.sender?._id,
    timestamp: new Date(msg.createdAt || msg.timestamp),
    isRead: msg.isRead || false,
    status: msg.status || 'sent',
    // CRITICAL: Preserve type from backend - NEVER default to 'text'
    type: msg.type, // Use AS-IS from backend, don't default
    // CRITICAL: Preserve content from backend
    content: msg.content,
    // CRITICAL: Preserve fileUrl and fileName from backend
    fileUrl: msg.fileUrl || msg.file_url,
    fileName: msg.fileName || msg.file_name,
  };

  console.log('[useMessages] ✅ transformMessage - AFTER transform:', {
    id: transformed.id,
    type: transformed.type,
    content: transformed.content?.substring(0, 50),
    fileUrl: transformed.fileUrl,
    fileName: transformed.fileName,
  });

  return transformed;
}

/**
 * Hook for fetching & managing messages of a chatroom
 */
export function useMessages(chatroomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousChatroomIdRef = useRef<string | null>(null);

  /**
   * Fetch messages from backend (REST)
   * Merges with existing messages to prevent overwriting socket-updated state
   */
  const fetchMessages = useCallback(async () => {
    if (!chatroomId) {
      setMessages([]);
      previousChatroomIdRef.current = null;
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError("User not authenticated");
      return;
    }

    const isNewChatroom = previousChatroomIdRef.current !== chatroomId;
    previousChatroomIdRef.current = chatroomId;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getMessagesAPI(chatroomId);

      console.log('[useMessages] 📥 API response BEFORE transform:', response.map((m: any) => ({
        _id: m._id,
        type: m.type,
        content: m.content?.substring(0, 50),
        fileUrl: m.fileUrl,
      })));

      const transformed = response
        .map(transformMessage)
        .sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );

      console.log('[useMessages] 📤 Messages AFTER transform, BEFORE setMessages:', transformed.map(m => ({
        id: m.id,
        type: m.type,
        content: m.content?.substring(0, 50),
        fileUrl: m.fileUrl,
      })));

      // If switching to a new chatroom, replace messages
      // Otherwise, merge to preserve socket-updated messages
      if (isNewChatroom) {
        console.log('[useMessages] New chatroom, replacing messages');
        setMessages(transformed);
      } else {
        console.log('[useMessages] Same chatroom, merging messages');
        setMessages(prev => {
          // Create a map of existing messages by ID for quick lookup
          const existingMap = new Map(prev.map(m => [m.id, m]));
          
          // Add/update messages from fetch
          transformed.forEach(msg => {
            existingMap.set(msg.id, msg);
          });

          // Convert back to array and sort
          const merged = Array.from(existingMap.values());
          return merged.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );
        });
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setError("Failed to load messages");
      // Only clear messages if switching chatrooms
      if (isNewChatroom) {
        setMessages([]);
      }
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
    console.log('[useMessages] ➕ Adding message via addMessage:', {
      messageId: message.id,
      type: message.type,
      content: message.content?.substring(0, 50) || message.text?.substring(0, 50),
      timestamp: message.timestamp,
    });
    
    setMessages(prev => {
      // Avoid duplicates
      if (prev.some(m => m.id === message.id)) {
        console.log('[useMessages] ⚠️ Duplicate message detected, skipping:', message.id);
        return prev;
      }

      const updated = [...prev, message];
      const sorted = updated.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      
      console.log('[useMessages] ✅ Message added, new count:', sorted.length);
      return sorted;
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
