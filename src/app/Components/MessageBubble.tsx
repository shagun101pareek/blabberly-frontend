'use client';

import { useState } from 'react';
import { Message } from '@/api/auth/chat/chat';
import Modal from './Modal';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  formatTime: (date: Date) => string;
}

export default function MessageBubble({ message, isMine, formatTime }: MessageBubbleProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messageType = message.type || 'text';

  const renderContent = () => {
    if (messageType === 'image') {
      // STRICT: If message.type === "image", render <img src={message.content} />
      if (!message.content) {
        return null;
      }
      
      // Normalize URL if it's relative (convert to absolute server URL)
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
      const normalizedUrl = message.content.startsWith('http://') || message.content.startsWith('https://') 
        ? message.content 
        : message.content.startsWith('/') 
          ? `${BASE_URL}${message.content}`
          : message.content;
      
      return (
        <div className="chat-window-message-image-container">
          <div 
            className="chat-window-message-image-wrapper"
            onClick={() => setSelectedImage(normalizedUrl)}
          >
            <img
              src={normalizedUrl}
              alt="Image"
              className="chat-window-message-image"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <Modal 
            isOpen={selectedImage !== null} 
            onClose={() => setSelectedImage(null)}
            className="image-modal"
          >
            <div className="image-modal-content">
              <img
                src={selectedImage || ''}
                alt="Image"
                className="image-modal-image"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </Modal>
        </div>
      );
    }

    if (messageType === 'text') {
      // STRICT: If message.type === "text", render <p>{message.content}</p>
      return <p className="chat-window-message-text">{message.content || message.text || ''}</p>;
    }

    if (messageType === 'pdf') {
      if (!message.fileUrl) return null;
      return (
        <div className="chat-window-message-pdf-container">
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-window-message-pdf-link"
          >
            <svg
              className="chat-window-message-pdf-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span className="chat-window-message-pdf-text">
              {message.fileName || message.content || message.text || ''}
            </span>
          </a>
        </div>
      );
    }

    // Default fallback (shouldn't happen)
    return <p className="chat-window-message-text">{message.content || message.text || ''}</p>;
  };

  return (
    <div className={`chat-window-message ${isMine ? 'sent' : 'received'}`}>
      <div className="chat-window-message-bubble">
        {renderContent()}
        <div className="chat-window-message-footer">
          <span className="chat-window-message-time">
            {formatTime(message.timestamp)}
          </span>
          {isMine && (
            <span className="chat-window-message-status">
              {message.status === 'seen'
                ? '✔✔'
                : message.status === 'delivered'
                ? '✔✔'
                : '✔'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
