'use client';

import Image from 'next/image';
import type { ChatRoom } from '@/api/auth/chat/chat';
import type { FriendRequest } from '@/hooks/useFriendRequests';

interface ChatListProps {
  chatRooms: ChatRoom[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  friendRequests?: FriendRequest[];
  onNewChat?: () => void;
}

function formatTime(date?: Date) {
  if (!date) return '';
  try {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function ChatList({
  chatRooms,
  selectedChatId,
  onSelectChat,
  friendRequests,
  onNewChat,
}: ChatListProps) {
  const rooms = chatRooms || [];

  return (
    <div className="chat-list-sidebar">
      <div className="chat-list-search">
        <div className="chat-list-search-wrapper">
          <svg className="chat-list-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            className="chat-list-search-input"
          />
        </div>
      </div>
      <div className="chat-list">
        {/* Simple pending requests indicator at top of list (can be enhanced later) */}
        {friendRequests && friendRequests.length > 0 && (
          <div className="chat-list-item chat-list-item-new">
            <div className="chat-list-item-content">
              <div className="chat-list-item-header">
                <h3 className="chat-list-item-name">
                  {friendRequests.length} pending friend
                  {friendRequests.length > 1 ? ' requests' : ' request'}
                </h3>
              </div>
              <div className="chat-list-item-footer">
                <p className="chat-list-item-message">
                  Open requests from people who want to connect with you.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="chat-list-items">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`chat-list-item ${selectedChatId === room.id ? 'chat-list-item-active' : ''}`}
              onClick={() => onSelectChat(room.id)}
            >
              <div className="chat-list-item-avatar-wrapper">
                <div className="chat-list-item-avatar">
                  {room.friendAvatar ? (
                    <img src={room.friendAvatar} alt={room.friendUsername} />
                  ) : (
                    <span>{room.friendUsername.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="chat-list-item-online"></div>
              </div>
              <div className="chat-list-item-content">
                <div className="chat-list-item-header">
                  <h3 className="chat-list-item-name">{room.friendUsername}</h3>
                  <span className="chat-list-item-timestamp">
                    {formatTime(room.lastMessageTime)}
                  </span>
                </div>
                <div className="chat-list-item-footer">
                  <p className="chat-list-item-message">
                    {room.lastMessage || 'Say hi to your new friend!'}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {rooms.length === 0 && (!friendRequests || friendRequests.length === 0) && (
            <div className="chat-list-empty">
              <div className="chat-list-empty-text">No conversations yet</div>
              <div className="chat-list-empty-subtext">
                Start a new chat by finding friends.
              </div>
              <button
                type="button"
                className="chat-list-empty-cta"
                onClick={onNewChat}
              >
                Find friends
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

