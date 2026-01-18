'use client';

import { useEffect, useState } from 'react';

interface Message {
  _id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

interface ChatData {
  id: number;
  name: string;
}

interface ChatViewProps {
  selectedChat: number | null;
  chatData?: ChatData;
}

export default function ChatView({ selectedChat, chatData }: ChatViewProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  // Fetch messages when chat changes
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      try {
        const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
        const res = await fetch(
          `${BASE_URL}/api/messages/${selectedChat}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
      const res = await fetch(
        `${BASE_URL}/api/messages/${selectedChat}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ text: message }),
        }
      );

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (!selectedChat) {
    return (
      <div className="chat-view chat-view-empty">
        <div className="chat-view-empty-content">
          <h2>Welcome to Blabberly</h2>
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view">
      {/* Header */}
      <div className="chat-view-header">
        <div className="chat-view-header-avatar">
          {chatData?.name.charAt(0).toUpperCase()}
        </div>
        <div className="chat-view-header-info">
          <h3>{chatData?.name}</h3>
          <p>Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-view-messages">
        {messages.length === 0 && (
          <p className="chat-empty-text">No messages yet</p>
        )}

        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`chat-message ${
              msg.sender === 'me'
                ? 'chat-message-sent'
                : 'chat-message-received'
            }`}
          >
            <div className="chat-message-bubble">
              <p>{msg.text}</p>
              <span>{msg.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="chat-view-input-container">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}
