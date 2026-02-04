'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoom, Message } from '@/api/auth/chat/chat';
import UserStatus from './UserStatus';
import { useSocket } from '../context/SocketContext';
import MessageBubble from './MessageBubble';
import { uploadMessageFileAPI } from '@/api/auth/chat/uploadMessageFile';

interface UIMessage extends Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'seen';
  content?: string; // For image messages, content contains the image URL
}

interface ChatWindowProps {
  chatRoom: ChatRoom | null;
  currentUserId: string;
  onSendMessage: (chatId: string, text: string) => void; // kept for compatibility
  onMarkAsRead?: (chatId: string) => void;
  hasFriends?: boolean;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function ChatWindow({
  chatRoom,
  currentUserId,
  onSendMessage,
  onMarkAsRead,
  hasFriends = false,
  isMobile = false,
  onCloseMobile,
}: ChatWindowProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { socket } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isSendingFileRef = useRef(false); // CRITICAL: Track if we're sending a file to prevent text send

  // Helper function to normalize image URLs (convert relative to absolute)
  const normalizeImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    // If already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If relative path, prefix with backend URL
    if (url.startsWith('/')) {
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
      return `${BASE_URL}${url}`;
    }
    return url;
  };

  /* =============================
     REST → UI SYNC (MERGE SAFELY)
  ============================== */
  useEffect(() => {
    if (!chatRoom?.messages) {
      setMessages([]);
      return;
    }

    console.log('[ChatWindow] 📥 Messages from chatRoom BEFORE normalization:', chatRoom.messages.map((m: any) => ({
      id: m.id || m._id,
      type: m.type,
      content: m.content?.substring(0, 50),
      fileUrl: m.fileUrl,
    })));

    const normalized: UIMessage[] = chatRoom.messages.map((m: any) => {
      // CRITICAL: Use message.type AS-IS from API - NEVER default to 'text'
      // If type is missing, that's a backend issue, but we should preserve what we get
      const messageType = m.type; // Use AS-IS, no fallback
      
      // CRITICAL: Use content AS-IS from API
      const content = m.content || m.text || '';
      
      const normalizedMsg: UIMessage = {
        id: m.id || m._id,
        text: m.text || '', // Keep for backward compatibility, but use content for rendering
        senderId: m.senderId || m.sender?._id || m.sender,
        timestamp: new Date(m.timestamp || m.createdAt),
        status: m.status || 'sent',
        type: messageType, // Use AS-IS from API
        content: content, // Store content for MessageBubble to render
        fileUrl: m.fileUrl || m.file_url,
        fileName: m.fileName || m.file_name,
        isRead: m.isRead || false,
      };

      console.log('[ChatWindow] 🔍 Normalizing message:', {
        id: normalizedMsg.id,
        type: normalizedMsg.type,
        content: normalizedMsg.content?.substring(0, 50),
      });

      return normalizedMsg;
    });

    console.log('[ChatWindow] 📤 Messages AFTER normalization, BEFORE setMessages:', normalized.map(m => ({
      id: m.id,
      type: m.type,
      content: m.content?.substring(0, 50),
    })));

    setMessages((prev) => {
      const map = new Map<string, UIMessage>();
      
      // CRITICAL: First, add all existing messages (including optimistic ones)
      // This preserves optimistic messages with blob URLs and fixes any that lost content
      prev.forEach((m) => {
        // CRITICAL: Fix optimistic messages that lost their content
        if (m.id.startsWith('temp-')) {
          // If optimistic image message lost content but has fileUrl, restore it
          if (m.type === 'image' && !m.content && m.fileUrl) {
            console.warn('[ChatWindow] ⚠️ Restoring lost content in optimistic message from fileUrl:', m.id);
            m = { ...m, content: m.fileUrl };
          }
          // If optimistic image message has no content and no fileUrl, skip it (broken message)
          if (m.type === 'image' && !m.content && !m.fileUrl) {
            console.warn('[ChatWindow] ⚠️ Skipping broken optimistic message (no content, no fileUrl):', m.id);
            return; // Skip broken optimistic messages
          }
        }
        map.set(m.id, m);
      });
      
      // CRITICAL: Filter out empty text messages and duplicate text messages for images
      normalized.forEach((m) => {
        // CRITICAL: Filter out ALL empty/whitespace messages regardless of type
        const textContent = m.content?.trim() || '';
        const isTextType = m.type === 'text' || !m.type; // Include undefined type as potential text
        
        if (isTextType && !textContent) {
          console.warn('[ChatWindow] ⚠️ Filtering out empty text message in sync (type may be undefined):', {
            messageId: m.id,
            type: m.type,
            content: m.content,
            senderId: m.senderId,
          });
          return; // Skip empty text messages
        }
        
        // Filter out text messages that match image messages
        if (m.type === 'text' && textContent) {
          // Check if there's already an image message from the same sender
          const hasMatchingImage = Array.from(map.values()).some(
            (existing) =>
              existing.type === 'image' &&
              existing.senderId === m.senderId &&
              (existing.content === textContent || 
               existing.fileUrl === textContent ||
               // Match if timestamps are very close (within 5 seconds)
               (Math.abs(existing.timestamp.getTime() - m.timestamp.getTime()) < 5000))
          );
          
          if (hasMatchingImage) {
            console.log('[ChatWindow] ⚠️ Filtering out duplicate text message for image in sync:', {
              textMessageId: m.id,
              textContent: textContent.substring(0, 50),
            });
            return; // Skip duplicate text messages
          }
        }
        
        // CRITICAL: If message has no type but has fileUrl, it's likely an image
        if (!m.type && m.fileUrl && !textContent) {
          console.warn('[ChatWindow] ⚠️ Message in sync has fileUrl but no type - treating as image:', {
            messageId: m.id,
            fileUrl: m.fileUrl?.substring(0, 50),
          });
          m.type = 'image';
          m.content = m.fileUrl;
        }
        
        // CRITICAL: Remove matching optimistic messages before adding real message
        // This prevents duplicate images (optimistic blob URL + real server URL)
        if (m.type === 'image' || m.type === 'pdf') {
          const mFileUrl = m.fileUrl || m.content;
          const extractFilename = (url: string | undefined): string => {
            if (!url) return '';
            try {
              const urlObj = new URL(url.startsWith('http') ? url : `http://dummy${url}`);
              const pathParts = urlObj.pathname.split('/');
              return pathParts[pathParts.length - 1];
            } catch {
              const parts = url.split('/');
              return parts[parts.length - 1];
            }
          };
          
          const mFilename = extractFilename(mFileUrl);
          
          // Find and remove matching optimistic messages
          for (const [key, existing] of map.entries()) {
            if (existing.id.startsWith('temp-') && 
                existing.senderId === m.senderId && 
                existing.type === m.type) {
              
              const existingFileUrl = existing.fileUrl || existing.content;
              const existingFilename = extractFilename(existingFileUrl);
              
              // Match by filename or timestamp proximity
              const filenamesMatch = mFilename && existingFilename && mFilename === existingFilename;
              const fileUrlsMatch = mFileUrl === existingFileUrl;
              const timestampsClose = Math.abs(existing.timestamp.getTime() - m.timestamp.getTime()) < 3000;
              
              if (fileUrlsMatch || filenamesMatch || timestampsClose) {
                console.log('[ChatWindow] ✅ Removing optimistic message in sync (replaced by real message):', {
                  optimisticId: existing.id,
                  realId: m.id,
                  matchReason: fileUrlsMatch ? 'fileUrl' : filenamesMatch ? 'filename' : 'timestamp',
                });
                
                // Revoke blob URL if it exists
                if (existing.content?.startsWith('blob:')) {
                  URL.revokeObjectURL(existing.content);
                }
                
                map.delete(key); // Remove optimistic message
                break; // Only remove one matching optimistic message
              }
            }
          }
        }
        
        map.set(m.id, m);
      });
      
      const merged = Array.from(map.values()).sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      
      console.log('[ChatWindow] ✅ Messages AFTER setMessages:', merged.map(m => ({
        id: m.id,
        type: m.type,
        content: m.content?.substring(0, 50),
        isEmpty: m.type === 'text' && !m.content?.trim(),
      })));
      
      return merged;
    });
  }, [chatRoom?.id]);

  /* =============================
     JOIN CHAT ROOM (EARLY + SAFE)
  ============================== */
  useEffect(() => {
    if (!socket || !chatRoom?.id) return;

    const join = () => socket.emit('joinChat', chatRoom.id);

    if (socket.connected) join();
    socket.on('connect', join);

    return () => {
      socket.off('connect', join);
      socket.emit('leaveChat', chatRoom.id);
    };
  }, [socket, chatRoom?.id]);

  /* =============================
     RECEIVE MESSAGE (REAL-TIME)
  ============================== */
  useEffect( () => {
    if (!socket) return;
    
      const handleReceiveMessage = (msg: any) => {
        console.log('[ChatWindow] 🔔 Socket receiveMessage BEFORE transform:', {
          _id: msg._id,
          type: msg.type,
          typeIsUndefined: msg.type === undefined,
          content: msg.content,
          contentLength: msg.content?.length,
          contentIsEmpty: !msg.content || msg.content.trim() === '',
          fileUrl: msg.fileUrl,
          senderId: msg.sender?._id || msg.sender || msg.senderId,
          fullMessage: JSON.stringify(msg).substring(0, 200),
        });

        // CRITICAL: Use message.type AS-IS from socket - NEVER default to 'text'
        const messageType = msg.type; // Use AS-IS, no fallback
        
        // CRITICAL: Use content AS-IS from socket
        const content = msg.content || msg.text || '';
        
        const incoming: UIMessage = {
          id: msg._id || msg.id,
          text: msg.text || '', // Keep for backward compatibility, but use content for rendering
          senderId: msg.sender?._id || msg.sender || msg.senderId,
          timestamp: new Date(msg.createdAt || msg.timestamp),
          status: msg.status || 'sent',
          type: messageType, // Use AS-IS from socket
          content: content, // Store content for MessageBubble to render
          fileUrl: msg.fileUrl || msg.file_url,
          fileName: msg.fileName || msg.file_name,
          isRead: msg.isRead || false,
        };

        console.log('[ChatWindow] ✅ Socket message AFTER transform:', {
          id: incoming.id,
          type: incoming.type,
          content: incoming.content?.substring(0, 50),
        });
    
        setMessages((prev) => {
          // CRITICAL: Filter out ALL empty/whitespace messages regardless of type
          // If content is empty and type is text or undefined, it's likely a bad message
          const contentTrimmed = incoming.content?.trim() || '';
          const isTextType = incoming.type === 'text' || !incoming.type; // Include undefined type as potential text
          
          if (isTextType && !contentTrimmed) {
            console.warn('[ChatWindow] ⚠️ BLOCKING empty text message (type may be undefined):', {
              messageId: incoming.id,
              type: incoming.type,
              content: incoming.content,
              senderId: incoming.senderId,
            });
            return prev; // Don't add empty text messages
          }
          
          // CRITICAL: Filter out text messages that match image message content
          // This prevents backend from creating duplicate text messages for images
          if (incoming.type === 'text' && contentTrimmed) {
            // Check if there's already an image message from the same sender (recently sent)
            // Check both before and after (in case text arrives first)
            const hasMatchingImage = prev.some(
            (m) =>
                m.type === 'image' &&
                m.senderId === incoming.senderId &&
                // Match if text content equals image fileUrl or content
                (m.content === contentTrimmed || m.fileUrl === contentTrimmed ||
                 // Also match if timestamps are very close (within 5 seconds) - same send action
                 (Math.abs(m.timestamp.getTime() - incoming.timestamp.getTime()) < 5000))
            );
            
            if (hasMatchingImage) {
              console.log('[ChatWindow] ⚠️ BLOCKING duplicate text message for image:', {
                textMessageId: incoming.id,
                textContent: contentTrimmed.substring(0, 50),
                senderId: incoming.senderId,
              });
              return prev; // Don't add the duplicate text message
            }
          }
          
          // CRITICAL: Also check if incoming message has no type but has fileUrl (should be image)
          // If backend sends message with fileUrl but no type, it's likely an image
          if (!incoming.type && incoming.fileUrl && !contentTrimmed) {
            console.warn('[ChatWindow] ⚠️ Message has fileUrl but no type and empty content - treating as image:', {
              messageId: incoming.id,
              fileUrl: incoming.fileUrl?.substring(0, 50),
            });
            // Update type to image
            incoming.type = 'image';
            incoming.content = incoming.fileUrl;
          }

          // CRITICAL: Final check - if this is an empty message from same sender as recent image, block it
          // This catches cases where backend sends empty text message even after image
          if (!contentTrimmed && incoming.senderId === currentUserId) {
            // Check if we recently sent an image (within last 5 seconds)
            const recentImageSent = prev.some(
              (m) =>
                m.type === 'image' &&
                m.senderId === currentUserId &&
                Math.abs(m.timestamp.getTime() - incoming.timestamp.getTime()) < 5000
            );
            
            if (recentImageSent) {
              console.warn('[ChatWindow] ⚠️ BLOCKING empty message sent right after image:', {
                messageId: incoming.id,
                type: incoming.type,
                senderId: incoming.senderId,
              });
              return prev; // Don't add empty message sent after image
            }
          }

          // CRITICAL: Remove matching optimistic message
          // Match optimistic messages with real messages even if URLs differ (blob URL vs server URL)
          const withoutTemp = prev.filter((m) => {
            // Skip if not an optimistic message from same sender
            if (!m.id.startsWith('temp-') || m.senderId !== incoming.senderId) {
              return true; // Keep this message
            }

            // For text messages: match by exact content
            if (m.type === 'text' && incoming.type === 'text') {
              return m.content !== incoming.content; // Remove if content matches
            }

            // For image/PDF messages: match by type and fileUrl OR timestamp proximity
            if (m.type === incoming.type && (m.type === 'image' || m.type === 'pdf')) {
              // Match if fileUrls match (even if one is blob URL and other is server URL)
              const mFileUrl = m.fileUrl || m.content;
              const incomingFileUrl = incoming.fileUrl || incoming.content;
              
              // Extract filename from URLs for comparison (more reliable than full URL)
              const extractFilename = (url: string | undefined): string => {
                if (!url) return '';
                // Extract last part of URL path (filename)
                try {
                  const urlObj = new URL(url.startsWith('http') ? url : `http://dummy${url}`);
                  const pathParts = urlObj.pathname.split('/');
                  return pathParts[pathParts.length - 1];
                } catch {
                  const parts = url.split('/');
                  return parts[parts.length - 1];
                }
              };

              const mFilename = extractFilename(mFileUrl);
              const incomingFilename = extractFilename(incomingFileUrl);
              
              // Match if:
              // 1. FileUrls match exactly
              // 2. Filenames match (handles blob URL vs server URL)
              // 3. Timestamps are very close (within 3 seconds) + same type + same sender
              const fileUrlsMatch = mFileUrl === incomingFileUrl;
              const filenamesMatch = mFilename && incomingFilename && mFilename === incomingFilename;
              const timestampsClose = Math.abs(m.timestamp.getTime() - incoming.timestamp.getTime()) < 3000;
              
              const matches = fileUrlsMatch || filenamesMatch || (timestampsClose && m.type === incoming.type);
              
              if (matches) {
                console.log('[ChatWindow] ✅ Matching optimistic message for removal:', {
                  optimisticId: m.id,
                  optimisticContent: m.content?.substring(0, 50),
                  realId: incoming.id,
                  realContent: incoming.content?.substring(0, 50),
                  matchReason: fileUrlsMatch ? 'fileUrl' : filenamesMatch ? 'filename' : 'timestamp',
                });
              }
              
              return !matches; // Remove if matches, keep if doesn't match
            }

            // Default: keep message if no match found
            return true;
          });
    
          // Don't add if message already exists
          if (withoutTemp.some((m) => m.id === incoming.id)) {
            return withoutTemp;
          }
    
          // CRITICAL: Final safety check before adding - ensure we're not adding empty text messages
          if ((incoming.type === 'text' || !incoming.type) && !contentTrimmed) {
            console.warn('[ChatWindow] ⚠️ FINAL BLOCK - Attempted to add empty text message:', {
              messageId: incoming.id,
              type: incoming.type,
            });
            return withoutTemp; // Don't add empty text messages
          }
    
          return [...withoutTemp, incoming];
        });
    
        // ✅ ACKNOWLEDGE DELIVERY (THIS IS THE KEY)
        socket.emit("messageDelivered", {
          messageId: incoming.id,
        });
      };
    
      socket.on('receiveMessage', handleReceiveMessage);
    
      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
      };
    }, [socket]);
    

  useEffect(() => {
    if (!socket) return;
  
    const handleStatusUpdate = ({
      messageId,
      status,
    }: {
      messageId: string;
      status: 'delivered' | 'seen';
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status } : m
        )
      );
    };
  
    socket.on("messageStatusUpdated", handleStatusUpdate);
  
    return () => {
      socket.off("messageStatusUpdated", handleStatusUpdate);
    };
  }, [socket]);

  /* =============================
   TYPING INDICATOR (RECEIVE)
============================== */
useEffect(() => {
  if (!socket || !chatRoom?.id) return;

  let typingTimeout: NodeJS.Timeout | null = null;

  const handleTyping = (data: any) => {
    // Check if typing event is for current chatroom and not from current user
    const chatroomId = data.chatroomId || data.chatId;
    const userId = data.userId || data.user?._id || data.user;
    
    // Debug: Uncomment to see typing events
    // console.log('[Typing] Received typing event:', { data, chatroomId, userId, currentChatroomId: chatRoom.id, currentUserId });
    
    if (chatroomId === chatRoom.id && userId !== currentUserId) {
      setIsTyping(true);
      
      // Auto-clear typing indicator after 3 seconds if stopTyping isn't received
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      typingTimeout = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }
  };

  const handleStopTyping = (data: any) => {
    // Check if stopTyping event is for current chatroom and not from current user
    const chatroomId = data.chatroomId || data.chatId;
    const userId = data.userId || data.user?._id || data.user;
    
    if (chatroomId === chatRoom.id && userId !== currentUserId) {
      setIsTyping(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }
    }
  };

  socket.on('typing', handleTyping);
  socket.on('stopTyping', handleStopTyping);

  return () => {
    socket.off('typing', handleTyping);
    socket.off('stopTyping', handleStopTyping);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    setIsTyping(false);
  };
}, [socket, chatRoom?.id, currentUserId]);

  

  /* =============================
     SCROLL
  ============================== */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* =============================
     FOCUS + READ
  ============================== */
  useEffect(() => {
    if (chatRoom) {
      inputRef.current?.focus();
      onMarkAsRead?.(chatRoom.id);
    }
  }, [chatRoom?.id, onMarkAsRead]);

  /* =============================
     FILE UPLOAD HANDLER
     CRITICAL: This handles ONLY file/image uploads - text send logic MUST NOT execute
  ============================== */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatRoom || !socket) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (!isImage && !isPDF) {
      alert('Please select an image or PDF file');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // CRITICAL: Set flag to prevent text send logic from executing
    isSendingFileRef.current = true;
    setIsUploading(true);

    // CRITICAL: Create optimistic message IMMEDIATELY with blob URL for instant display
    const tempId = `temp-${Date.now()}`;
    const fileType = isImage ? 'image' : 'pdf';
    
    // For images, use blob URL for immediate display
    // For PDFs, we can't preview, so content stays empty
    const blobUrl = isImage ? URL.createObjectURL(file) : '';
    
    // CRITICAL: Ensure content is NEVER undefined
    // For images, use blob URL; for PDFs, use empty string (not undefined)
    const optimisticContent = isImage ? (blobUrl || '') : '';
    
    const tempMessage: UIMessage = {
      id: tempId,
      text: '', // Keep for backward compatibility
      senderId: currentUserId,
      timestamp: new Date(),
      status: 'sent',
      type: fileType, // CRITICAL: 'image' or 'pdf'
      content: optimisticContent, // CRITICAL: Blob URL for images, empty string for PDFs (NEVER undefined)
      fileUrl: blobUrl || '', // Temporary blob URL, will be replaced with server URL
      fileName: file.name,
      isRead: false,
    };

    console.log('[ChatWindow] 📤 Creating optimistic message IMMEDIATELY:', {
      id: tempMessage.id,
      type: tempMessage.type,
      content: tempMessage.content?.substring(0, 50) || 'EMPTY',
      contentIsUndefined: tempMessage.content === undefined,
      isBlobUrl: tempMessage.content?.startsWith('blob:'),
      fileName: tempMessage.fileName,
    });
    
    // CRITICAL: Verify content is set before adding
    if (tempMessage.type === 'image' && !tempMessage.content) {
      console.error('[ChatWindow] ❌ ERROR: Image optimistic message has no content!', tempMessage);
      // Fallback: use file name or placeholder
      tempMessage.content = blobUrl || `file://${file.name}`;
    }

    // Add optimistic message immediately for instant display
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Upload file in background
      const uploadResponse = await uploadMessageFileAPI(file, chatRoom.id, chatRoom.friendId);
      
      const normalizedFileUrl = normalizeImageUrl(uploadResponse.fileUrl);
      
      console.log('[ChatWindow] 📥 Upload response:', {
        fileUrl: uploadResponse.fileUrl,
        normalized: normalizedFileUrl,
        fileType: uploadResponse.fileType,
      });
      
      // CRITICAL: Update optimistic message with server URL
      // Replace blob URL with real server URL
      setMessages((prev) => {
        return prev.map((m) => {
          if (m.id === tempId) {
            // Revoke blob URL to free memory
            if (m.content?.startsWith('blob:')) {
              URL.revokeObjectURL(m.content);
            }
            
            // CRITICAL: Ensure content is NEVER undefined
            // Use server URL, fallback to blob URL, fallback to empty string
            const serverUrl = normalizedFileUrl || uploadResponse.fileUrl || '';
            const updatedContent = serverUrl || blobUrl || m.content || '';
            
            const updated: UIMessage = {
              ...m,
              content: updatedContent, // CRITICAL: NEVER undefined
              fileUrl: serverUrl || blobUrl || m.fileUrl || '', // Server URL
        fileName: uploadResponse.fileName,
            };
            
            console.log('[ChatWindow] 🔄 Updated optimistic message with server URL:', {
              tempId: updated.id,
              oldContent: m.content?.substring(0, 50) || 'EMPTY',
              newContent: updated.content?.substring(0, 50) || 'EMPTY',
              contentIsUndefined: updated.content === undefined,
            });
            
            // CRITICAL: Final safety check
            if (updated.content === undefined) {
              console.error('[ChatWindow] ❌ CRITICAL: Updated message has undefined content!', updated);
              updated.content = serverUrl || blobUrl || '';
            }
            
            return updated;
          }
          return m;
        });
      });

      // CRITICAL: For image/PDF messages, send ONLY file metadata, NOT text content
      // Backend should use fileUrl and type to create the message, not content
      // DO NOT send content field at all for file messages to prevent backend from creating text messages
      const fileMessagePayload: any = {
        chatroomId: chatRoom.id,
        type: uploadResponse.fileType, // CRITICAL: Always send type ('image' or 'pdf')
        fileUrl: uploadResponse.fileUrl, // CRITICAL: File URL for backend
        fileName: uploadResponse.fileName,
      };
      
      // CRITICAL: Only include content for PDFs if needed, NEVER for images
      // For images, omit content entirely to prevent backend from creating text message
      if (uploadResponse.fileType === 'pdf') {
        // PDFs might need empty content, but images should have NO content field
        fileMessagePayload.content = '';
      }
      // For images, we explicitly DO NOT include content field
      
      console.log('[ChatWindow] 📤 Sending file message payload:', {
        type: fileMessagePayload.type,
        hasContent: 'content' in fileMessagePayload,
        fileUrl: fileMessagePayload.fileUrl?.substring(0, 50),
      });
      
      socket.emit('sendMessage', fileMessagePayload);
      
      socket.emit('stopTyping', { chatroomId: chatRoom.id });
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
      
      // Remove optimistic message and revoke blob URL on error
      setMessages((prev) => {
        const failedMessage = prev.find((m) => m.id === tempId);
        if (failedMessage?.content?.startsWith('blob:')) {
          URL.revokeObjectURL(failedMessage.content);
        }
        return prev.filter((m) => m.id !== tempId);
      });
    } finally {
      setIsUploading(false);
      isSendingFileRef.current = false; // CRITICAL: Reset flag after file send completes
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /* =============================
     SEND TEXT MESSAGE (SOCKET-ONLY)
     CRITICAL: Only sends TEXT messages - images/files are handled by handleFileSelect
     This function MUST NOT execute when sending images/files
  ============================== */
  const handleSendMessage = () => {
    // CRITICAL: Early return if sending a file - prevent text send logic from executing
    if (isSendingFileRef.current) {
      console.warn('[ChatWindow] ⚠️ Blocked text send - file send in progress');
      return;
    }

    // CRITICAL: Early return if uploading a file
    if (isUploading) {
      console.warn('[ChatWindow] ⚠️ Blocked text send - file upload in progress');
      return;
    }

    // CRITICAL: Only send if there's actual text content (non-empty after trim)
    const messageText = message.trim();
    if (!messageText || !chatRoom || !socket) {
      return; // Early return - no text to send
    }

    console.log('[ChatWindow] 📤 Sending TEXT message:', {
      content: messageText.substring(0, 50),
      length: messageText.length,
    });

      const tempMessage: UIMessage = {
        id: `temp-${Date.now()}`,
      text: messageText, // Keep for backward compatibility
        senderId: currentUserId,
        timestamp: new Date(),
        status: 'sent',
      type: 'text', // CRITICAL: Explicitly set type as 'text'
      content: messageText, // Store content for MessageBubble
        isRead: false,
      };

    // Optimistic UI - add message immediately
    setMessages((prev) => [...prev, tempMessage]);

    // CRITICAL: Send ONLY text messages here
    // For images/PDFs, handleFileSelect sends type: 'image' or 'pdf'
    socket.emit('sendMessage', {
      chatroomId: chatRoom.id,
      type: 'text', // CRITICAL: Explicitly set type as 'text'
      content: messageText, // Only text content - never empty
    });
    socket.emit('stopTyping', { chatroomId: chatRoom.id });

    setMessage(''); // Clear input after sending
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // CRITICAL: Prevent Enter key from triggering text send if we're sending a file
    if (e.key === 'Enter' && !e.shiftKey) {
      // Early return if sending file - prevents text send logic
      if (isSendingFileRef.current || isUploading) {
        e.preventDefault();
        return;
      }
      
      // Only send text if there's actual text content
      const messageText = message.trim();
      if (!messageText) {
        e.preventDefault();
        return;
      }
      
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);

  /* =============================
     EMPTY STATES
  ============================== */
  if (!chatRoom) {
    return (
      <div className="chat-window chat-window-empty">
        <div className="chat-window-empty-content">
          <h2 className="chat-window-empty-title">
            {hasFriends ? 'Start a conversation' : 'Select a conversation'}
          </h2>
          <p className="chat-window-empty-text">
            Choose a friend from the list to begin chatting
          </p>
        </div>
      </div>
    );
  }

  const isNewConnection =
    chatRoom.isNewConnection && messages.length === 0;

  const handleProfileClick = () => {
    if (chatRoom?.friendId) {
      router.push(`/user/${chatRoom.friendId}`);
    }
  };

  // Helper function to normalize image URLs (convert relative to absolute)
  const normalizeAvatarUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    // If already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If relative path, prefix with backend URL
    if (url.startsWith('/')) {
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
      return `${BASE_URL}${url}`;
    }
    return url;
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <div 
          className="chat-window-header-avatar"
          onClick={handleProfileClick}
          style={{ cursor: 'pointer' }}
        >
          {chatRoom.friendAvatar ? (
            <img 
              src={normalizeAvatarUrl(chatRoom.friendAvatar) || chatRoom.friendAvatar} 
              alt={chatRoom.friendUsername}
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('span.chat-window-header-avatar-fallback')) {
                  const span = document.createElement('span');
                  span.className = 'chat-window-header-avatar-fallback';
                  span.textContent = chatRoom.friendUsername.charAt(0).toUpperCase();
                  parent.appendChild(span);
                }
              }}
            />
          ) : (
            <span>{chatRoom.friendUsername.charAt(0).toUpperCase()}</span>
          )}
          <UserStatus userId={chatRoom.friendId} variant="dot" />
        </div>

        <div className="chat-window-header-info">
          <h3 
            className="chat-window-header-name"
            onClick={handleProfileClick}
            style={{ cursor: 'pointer' }}
          >
            {chatRoom.friendUsername}
          </h3>
          <UserStatus userId={chatRoom.friendId} variant="inline" />
        </div>

        <div className="chat-window-header-actions">
          {isMobile && onCloseMobile && (
            <button
              type="button"
              className="chat-window-close-btn"
              onClick={onCloseMobile}
              aria-label="Back to conversations"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-window-messages">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={isMine}
              formatTime={formatTime}
            />
          );
        })}
        {isTyping && (
          <div className="chat-window-typing">
            <div className="chat-window-typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-window-input-container">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="chat-window-file-input"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="chat-window-attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Attach file"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          className="chat-window-input"
          placeholder="Write a message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          
            if (!socket || !chatRoom) return;
          
            socket.emit('typing', { chatroomId: chatRoom.id });
          
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
          
            typingTimeoutRef.current = setTimeout(() => {
              socket.emit('stopTyping', { chatroomId: chatRoom.id });
            }, 1000);
          }}
          
          onKeyDown={handleKeyDown}
        />
        <button
          type="button" // CRITICAL: Prevent form submission
          className="chat-window-send-btn"
          onClick={handleSendMessage}
          disabled={!message.trim() || isUploading} // isUploading covers file send case
        >
          {isUploading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
