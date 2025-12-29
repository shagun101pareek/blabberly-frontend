'use client';

import Image from 'next/image';
import type { Chatroom } from '@/hooks/useChatrooms';
import type { FriendRequest } from '@/hooks/useFriendRequests';

interface ChatListProps {
  chatRooms: Chatroom[];
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
    <>
    <div className="chat-list-search">
        <input
          type="text"
          placeholder="Search conversations..."
          className="chat-list-search-input"
        />
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
            <div className="chat-list-item-avatar">
              {room.friendUsername.charAt(0).toUpperCase()}
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
    </>
  );
}

