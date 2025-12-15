'use client';

import Image from 'next/image';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface ChatListProps {
  chats: Chat[];
  selectedChat: number | null;
  onSelectChat: (chatId: number) => void;
}

export default function ChatList({ chats, selectedChat, onSelectChat }: ChatListProps) {
  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2 className="chat-list-title">Blabberly</h2>
        <button className="chat-list-new-chat-button">
          <Image 
            src="/Images/Blabberly_logo.png" 
            alt="Blabberly Logo" 
            width={40} 
            height={40}
          />
        </button>
      </div>
      
      <div className="chat-list-search">
        <input 
          type="text" 
          placeholder="Search conversations..."
          className="chat-list-search-input"
        />
      </div>

      <div className="chat-list-items">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-list-item ${selectedChat === chat.id ? 'chat-list-item-active' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="chat-list-item-avatar">
              {chat.name.charAt(0).toUpperCase()}
            </div>
            <div className="chat-list-item-content">
              <div className="chat-list-item-header">
                <h3 className="chat-list-item-name">{chat.name}</h3>
                <span className="chat-list-item-timestamp">{chat.timestamp}</span>
              </div>
              <div className="chat-list-item-footer">
                <p className="chat-list-item-message">{chat.lastMessage}</p>
                {chat.unread > 0 && (
                  <span className="chat-list-item-unread">{chat.unread}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

