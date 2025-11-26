'use client';

import { useState } from 'react';

interface ChatData {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface ChatViewProps {
  selectedChat: number | null;
  chatData?: ChatData;
}

export default function ChatView({ selectedChat, chatData }: ChatViewProps) {
  const [message, setMessage] = useState('');

  // Sample messages for demonstration
  const sampleMessages = selectedChat ? [
    {
      id: 1,
      text: 'Hey there!',
      sender: 'them',
      timestamp: '10:30 AM'
    },
    {
      id: 2,
      text: 'Hi! How can I help you?',
      sender: 'me',
      timestamp: '10:31 AM'
    },
    {
      id: 3,
      text: chatData?.lastMessage || 'Latest message',
      sender: 'them',
      timestamp: chatData?.timestamp || '2:30 PM'
    }
  ] : [];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle sending message logic here
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  if (!selectedChat) {
    return (
      <div className="chat-view chat-view-empty">
        <div className="chat-view-empty-content">
          <div className="chat-view-empty-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="url(#gradient)" opacity="0.3"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="chat-view-empty-title">Welcome to Blabberly</h2>
          <p className="chat-view-empty-text">
            Select a conversation from the left to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view">
      {/* Chat Header */}
      <div className="chat-view-header">
        <div className="chat-view-header-avatar">
          {chatData?.name.charAt(0).toUpperCase()}
        </div>
        <div className="chat-view-header-info">
          <h3 className="chat-view-header-name">{chatData?.name}</h3>
          <p className="chat-view-header-status">Online</p>
        </div>
        <div className="chat-view-header-actions">
          <button className="chat-view-header-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-view-messages">
        {sampleMessages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.sender === 'me' ? 'chat-message-sent' : 'chat-message-received'}`}
          >
            <div className="chat-message-bubble">
              <p className="chat-message-text">{msg.text}</p>
              <span className="chat-message-timestamp">{msg.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="chat-view-input-container">
        <button className="chat-view-attach-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.5 6V17.5C16.5 19.71 14.71 21.5 12.5 21.5C10.29 21.5 8.5 19.71 8.5 17.5V5C8.5 3.62 9.62 2.5 11 2.5C12.38 2.5 13.5 3.62 13.5 5V15.5C13.5 16.05 13.05 16.5 12.5 16.5C11.95 16.5 11.5 16.05 11.5 15.5V6H10V15.5C10 16.88 11.12 18 12.5 18C13.88 18 15 16.88 15 15.5V5C15 2.79 13.21 1 11 1C8.79 1 7 2.79 7 5V17.5C7 20.54 9.46 23 12.5 23C15.54 23 18 20.54 18 17.5V6H16.5Z" fill="currentColor"/>
          </svg>
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          className="chat-view-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button className="chat-view-emoji-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM15.5 11C16.33 11 17 10.33 17 9.5C17 8.67 16.33 8 15.5 8C14.67 8 14 8.67 14 9.5C14 10.33 14.67 11 15.5 11ZM8.5 11C9.33 11 10 10.33 10 9.5C10 8.67 9.33 8 8.5 8C7.67 8 7 8.67 7 9.5C7 10.33 7.67 11 8.5 11ZM12 17.5C14.33 17.5 16.31 16.04 17.11 14H6.89C7.69 16.04 9.67 17.5 12 17.5Z" fill="currentColor"/>
          </svg>
        </button>
        <button 
          className="chat-view-send-button"
          onClick={handleSendMessage}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

