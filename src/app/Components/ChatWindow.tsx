'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatRoom } from '../hooks/chat';

interface ChatWindowProps {
  chatRoom: ChatRoom | null;
  currentUserId: string;
  onSendMessage: (chatId: string, text: string) => void;
  onMarkAsRead?: (chatId: string) => void;
}

export default function ChatWindow({ 
  chatRoom, 
  currentUserId, 
  onSendMessage,
  onMarkAsRead 
}: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatRoom?.messages]);

  // Focus input when chat changes
  useEffect(() => {
    if (chatRoom) {
      inputRef.current?.focus();
      if (onMarkAsRead) {
        onMarkAsRead(chatRoom.id);
      }
    }
  }, [chatRoom?.id, onMarkAsRead, chatRoom]);

  const handleSendMessage = () => {
    if (message.trim() && chatRoom) {
      onSendMessage(chatRoom.id, message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // No chat selected state
  if (!chatRoom) {
    return (
      <div className="chat-window chat-window-empty">
        <div className="chat-window-empty-content">
          <div className="chat-window-empty-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7117 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37485 5.27072 7.03255C6.10083 5.69025 7.28825 4.60557 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91565 21 11V11.5Z" fill="url(#emptyGradient)" opacity="0.3"/>
              <defs>
                <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="chat-window-empty-title">Select a conversation</h2>
          <p className="chat-window-empty-text">
            Choose a friend from the list to start chatting
          </p>
        </div>
      </div>
    );
  }

  const isNewConnection = chatRoom.isNewConnection && chatRoom.messages.length === 0;

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
          <div className="chat-window-header-online"></div>
        </div>
        <div className="chat-window-header-info">
          <h3 className="chat-window-header-name">{chatRoom.friendUsername}</h3>
          <p className="chat-window-header-status">Online</p>
        </div>
        <div className="chat-window-header-actions">
          <button className="chat-window-header-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="12" cy="5" r="1" fill="currentColor"/>
              <circle cx="12" cy="19" r="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-window-messages">
        {/* New Connection Welcome */}
        {isNewConnection && (
          <div className="chat-window-new-connection">
            <div className="chat-window-new-connection-card">
              <div className="chat-window-new-connection-avatar">
                {chatRoom.friendAvatar ? (
                  <img src={chatRoom.friendAvatar} alt={chatRoom.friendUsername} />
                ) : (
                  <span>{chatRoom.friendUsername.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="chat-window-new-connection-content">
                <div className="chat-window-new-connection-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  New Connection
                </div>
                <p className="chat-window-new-connection-text">
                  You&apos;re now connected—start blabbering!
                </p>
              </div>
            </div>
            <div className="chat-window-say-hi">
              <span>👋 Say hi!</span>
            </div>
          </div>
        )}

        {/* Messages */}
        {chatRoom.messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-window-message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}
          >
            <div className="chat-window-message-bubble">
              <p className="chat-window-message-text">{msg.text}</p>
              <span className="chat-window-message-time">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-window-input-container">
        <button className="chat-window-input-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21.44 11.05L12.25 20.24C10.45 22.04 7.51 22.04 5.71 20.24C3.91 18.44 3.91 15.5 5.71 13.7L14.9 4.51C16.03 3.38 17.85 3.38 18.98 4.51C20.11 5.64 20.11 7.46 18.98 8.59L9.79 17.78C9.22 18.35 8.32 18.35 7.75 17.78C7.18 17.21 7.18 16.31 7.75 15.74L16.94 6.55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          className="chat-window-input"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="chat-window-input-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="10" r="1" fill="currentColor"/>
            <circle cx="15" cy="10" r="1" fill="currentColor"/>
          </svg>
        </button>
        <button 
          className="chat-window-send-btn"
          onClick={handleSendMessage}
          disabled={!message.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}


