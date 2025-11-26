'use client';

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
        <h2 className="chat-list-title">Messages</h2>
        <button className="chat-list-new-chat-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
          </svg>
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

