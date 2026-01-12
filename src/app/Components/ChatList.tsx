'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ChatRoom } from '@/api/auth/chat/chat';
import type { FriendRequest } from '@/hooks/useFriendRequests';
import UserStatus from './UserStatus';

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
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today: show time only
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  } catch {
    return '';
  }
}

function truncateMessage(text: string | undefined, maxLength: number = 30): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

/**
 * Avatar component for chat list items
 * Displays profile picture if available, otherwise shows initials
 * Appends cache-busting query parameter to profile picture URLs
 */
function ChatAvatar({ room }: { room: ChatRoom }) {
  const [imageError, setImageError] = useState(false);
  const hasProfilePicture = room.friendAvatar && !imageError;

  if (hasProfilePicture && room.friendAvatar) {
    // Append cache-busting query parameter using updatedAt or current timestamp
    const cacheBuster = room.friendUpdatedAt 
      ? (typeof room.friendUpdatedAt === 'string' 
          ? new Date(room.friendUpdatedAt).getTime() 
          : room.friendUpdatedAt.getTime())
      : Date.now();
    
    const imageUrl = `${room.friendAvatar}${room.friendAvatar.includes('?') ? '&' : '?'}v=${cacheBuster}`;

    return (
      <Image
        src={imageUrl}
        alt={room.friendUsername}
        width={44}
        height={44}
        className="chat-list-item-avatar-image"
        onError={() => setImageError(true)}
        unoptimized
      />
    );
  }

  return (
    <span className="chat-list-item-avatar-initials">
      {room.friendUsername.charAt(0).toUpperCase()}
    </span>
  );
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
                  <ChatAvatar room={room} />
                </div>
                <UserStatus
                  userId={room.friendId}
                  variant="dot"
                  className="chat-list-item-online-wrapper"
                />
              </div>
              <div className="chat-list-item-content">
                <div className="chat-list-item-header">
                  <h3 className="chat-list-item-name">{room.friendUsername}</h3>
                  <div className="chat-list-item-header-right">
                    <span className="chat-list-item-timestamp">
                      {formatTime(room.lastMessageTime)}
                    </span>
                    {room.unreadCount > 0 && (
                      <span className="chat-list-item-unread-badge">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="chat-list-item-footer">
                  <p className="chat-list-item-message">
                    {room.lastMessageType === 'image' 
                      ? '📷 Photo'
                      : room.lastMessageType === 'pdf'
                      ? '📄 Document'
                      : truncateMessage(room.lastMessage) || 'Say hi to your new friend!'}
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

