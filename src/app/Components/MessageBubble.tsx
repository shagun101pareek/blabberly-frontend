'use client';

import { Message } from '@/api/auth/chat/chat';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  formatTime: (date: Date) => string;
}

export default function MessageBubble({ message, isMine, formatTime }: MessageBubbleProps) {
  const messageType = message.type || 'text';

  const renderContent = () => {
    switch (messageType) {
      case 'image':
        if (!message.fileUrl) return <p className="chat-window-message-text">Image unavailable</p>;
        return (
          <div className="chat-window-message-image-container">
            <img
              src={message.fileUrl}
              alt={message.text || 'Image'}
              className="chat-window-message-image"
              loading="lazy"
            />
            {message.text && (
              <p className="chat-window-message-text chat-window-message-image-caption">
                {message.text}
              </p>
            )}
          </div>
        );

      case 'pdf':
        if (!message.fileUrl) return <p className="chat-window-message-text">Document unavailable</p>;
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
                {message.fileName || message.text || 'Document'}
              </span>
            </a>
            {message.text && message.text !== message.fileName && (
              <p className="chat-window-message-text chat-window-message-pdf-caption">
                {message.text}
              </p>
            )}
          </div>
        );

      default:
        return <p className="chat-window-message-text">{message.text}</p>;
    }
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


