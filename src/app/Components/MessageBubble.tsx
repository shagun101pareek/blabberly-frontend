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
  
  // CRITICAL: Log message.type BEFORE rendering to debug
  console.log('[MessageBubble] 🎨 Rendering message:', {
    id: message.id,
    type: message.type,
    content: message.content?.substring(0, 50),
    hasContent: !!message.content,
  });

  // CRITICAL: Use message.type AS-IS - NEVER default to 'text'
  // If type is undefined, that indicates a data issue, but we should still render
  const messageType = message.type;

  // CRITICAL: Warn if type is missing (indicates backend issue)
  if (messageType === undefined) {
    console.warn('[MessageBubble] ⚠️ Message missing type field:', {
      id: message.id,
      content: message.content?.substring(0, 50),
    });
  }

  const renderContent = () => {
    // STRICT: If message.type === "image", render <img src={message.content} />
    if (messageType === 'image') {
      if (!message.content) {
        console.warn('[MessageBubble] ⚠️ Image message missing content:', message.id);
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

    // STRICT: If message.type === "text", render <p>{message.content}</p>
    if (messageType === 'text') {
      const textContent = message.content || message.text || '';
      // CRITICAL: Don't render empty text messages
      if (!textContent.trim()) {
        console.warn('[MessageBubble] ⚠️ Attempting to render empty text message, returning null:', {
          id: message.id,
        });
        return null; // Don't render empty text bubbles
      }
      return <p className="chat-window-message-text">{textContent}</p>;
    }

    // STRICT: If message.type === "pdf", render PDF link
    if (messageType === 'pdf') {
      if (!message.fileUrl) {
        console.warn('[MessageBubble] ⚠️ PDF message missing fileUrl:', message.id);
        return null;
      }
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

    // CRITICAL: If type is undefined or unknown, render as text but log warning
    // This should NOT happen if backend is sending type correctly
    console.warn('[MessageBubble] ⚠️ Unknown or missing message type, rendering as text:', {
      id: message.id,
      type: messageType,
      content: message.content?.substring(0, 50),
    });
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
