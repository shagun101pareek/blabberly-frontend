'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatRoom } from '@/api/auth/chat/chat';
import UserStatus from './UserStatus';
import { useSocket } from '../context/SocketContext';

interface UIMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'seen';
}

interface ChatWindowProps {
  chatRoom: ChatRoom | null;
  currentUserId: string;
  onSendMessage: (chatId: string, text: string) => void; // kept for compatibility
  onMarkAsRead?: (chatId: string) => void;
  hasFriends?: boolean;
}

export default function ChatWindow({
  chatRoom,
  currentUserId,
  onSendMessage,
  onMarkAsRead,
  hasFriends = false,
}: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { socket } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  /* =============================
     REST → UI SYNC (MERGE SAFELY)
  ============================== */
  useEffect(() => {
    if (!chatRoom?.messages) {
      setMessages([]);
      return;
    }

    const normalized: UIMessage[] = chatRoom.messages.map((m: any) => ({
      id: m.id || m._id,
      text: m.text || m.content,
      senderId: m.senderId || m.sender?._id || m.sender,
      timestamp: new Date(m.timestamp || m.createdAt),
      status: m.status || 'sent',
    }));

    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      normalized.forEach((m) => map.set(m.id, m));
      return Array.from(map.values()).sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
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
        const incoming: UIMessage = {
          id: msg._id,
          text: msg.content,
          senderId: msg.sender?._id || msg.sender,
          timestamp: new Date(msg.createdAt),
          status: msg.status || 'sent',
        };
    
        setMessages((prev) => {
          // remove matching optimistic message
          const withoutTemp = prev.filter(
            (m) =>
              !(
                m.id.startsWith('temp-') &&
                m.senderId === incoming.senderId &&
                m.text === incoming.text
              )
          );
    
          if (withoutTemp.some((m) => m.id === incoming.id)) {
            return withoutTemp;
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
     SEND MESSAGE (SOCKET-ONLY)
  ============================== */
  const handleSendMessage = () => {
    if (!message.trim() || !chatRoom || !socket) return;

    const tempMessage: UIMessage = {
      id: `temp-${Date.now()}`,
      text: message,
      senderId: currentUserId,
      timestamp: new Date(),
      status: 'sent',
    };

    // optimistic UI
    setMessages((prev) => [...prev, tempMessage]);

    socket.emit('sendMessage', {
      chatroomId: chatRoom.id,
      content: message,
    });
    socket.emit('stopTyping', { chatroomId: chatRoom.id });


    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <div className="chat-window-header-avatar">
          {chatRoom.friendAvatar ? (
            <img src={chatRoom.friendAvatar} alt={chatRoom.friendUsername} />
          ) : (
            <span>{chatRoom.friendUsername.charAt(0).toUpperCase()}</span>
          )}
          <UserStatus userId={chatRoom.friendId} variant="dot" />
        </div>

        <div className="chat-window-header-info">
          <h3 className="chat-window-header-name">
            {chatRoom.friendUsername}
          </h3>
          <UserStatus userId={chatRoom.friendId} variant="inline" />
        </div>
      </div>

      {/* Messages */}
      <div className="chat-window-messages">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;

          return (
            <div
              key={msg.id}
              className={`chat-window-message ${isMine ? 'sent' : 'received'}`}
            >
              <div className="chat-window-message-bubble">
                <p className="chat-window-message-text">{msg.text}</p>
                <div className="chat-window-message-footer">
                  <span className="chat-window-message-time">
                    {formatTime(msg.timestamp)}
                  </span>
                  {isMine && (
                    <span className="chat-window-message-status">
                      {msg.status === 'seen'
                        ? '✔✔'
                        : msg.status === 'delivered'
                        ? '✔✔'
                        : '✔'}
                    </span>
                  )}
                </div>
              </div>
            </div>
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
          className="chat-window-send-btn"
          onClick={handleSendMessage}
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
