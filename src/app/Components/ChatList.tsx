'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import FriendRequestBanner from './FriendRequestBanner';
import { FriendRequest } from '../hooks/friend';
import { ChatRoom } from '../hooks/chat';
import { useDebounce, SearchResult } from '../hooks/user';

// Mock user data for search (same as in user.ts hook)
const mockUsers = [
  { id: '1', username: 'alex_dev', avatar: '' },
  { id: '2', username: 'sarah_designs', avatar: '' },
  { id: '3', username: 'mike_codes', avatar: '' },
  { id: '4', username: 'emma_writes', avatar: '' },
  { id: '5', username: 'john_builder', avatar: '' },
  { id: '6', username: 'lisa_creates', avatar: '' },
  { id: '7', username: 'david_tech', avatar: '' },
  { id: '8', username: 'anna_pixel', avatar: '' },
  { id: '9', username: 'chris_dev', avatar: '' },
  { id: '10', username: 'kate_ux', avatar: '' },
];

interface ChatListProps {
  chatRooms: ChatRoom[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  friendRequests: FriendRequest[];
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onNewChat?: () => void;
}

export default function ChatList({ 
  chatRooms, 
  selectedChatId, 
  onSelectChat,
  friendRequests,
  onAcceptRequest,
  onRejectRequest,
  onNewChat,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search users when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Simulate search delay
    const timer = setTimeout(() => {
      const results = mockUsers
        .filter(user => 
          user.username.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
        .map(user => ({
          ...user,
          friendshipStatus: 'none' as const
        }));
      
      setSearchResults(results);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [debouncedQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUserClick = (userId: string) => {
    // Open the search modal to complete adding the friend
    if (onNewChat) {
      onNewChat();
    }
    handleClearSearch();
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    }
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const showSearchResults = searchQuery.trim().length > 0;

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2 className="chat-list-title">Blabberly</h2>
        <button className="chat-list-new-chat-button" onClick={onNewChat} title="Find Friends">
          <Image 
            src="/Images/Blabberly_logo.png" 
            alt="Blabberly Logo" 
            width={40} 
            height={40}
          />
        </button>
      </div>
      
      {/* Friend Request Banner */}
      <FriendRequestBanner
        requests={friendRequests}
        onAccept={onAcceptRequest}
        onReject={onRejectRequest}
      />
      
      {/* Search Bar - Only show when user has friends/chats */}
      {chatRooms.length > 0 && (
        <div className="chat-list-search">
          <div className="chat-list-search-wrapper">
            <svg 
              className="chat-list-search-icon" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none"
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search conversations..."
              className="chat-list-search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            {searchQuery && (
              <button className="chat-list-search-clear" onClick={handleClearSearch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
                  <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="chat-list-search-results">
              {isSearching ? (
                <div className="chat-list-search-loading">
                  <div className="chat-list-search-spinner"></div>
                  <span>Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="chat-list-search-results-header">
                    <span>Users</span>
                  </div>
                  {searchResults.map((user) => (
                    <div 
                      key={user.id} 
                      className="chat-list-search-result-item"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <div className="chat-list-search-result-avatar">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} />
                        ) : (
                          <span>{user.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="chat-list-search-result-info">
                        <span className="chat-list-search-result-name">
                          {user.username}
                        </span>
                        <span className="chat-list-search-result-action">
                          Click to add friend
                        </span>
                      </div>
                      <svg 
                        className="chat-list-search-result-arrow" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none"
                      >
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ))}
                </>
              ) : (
                <div className="chat-list-search-no-results">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
                  </svg>
                  <span>No users found for &quot;{searchQuery}&quot;</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="chat-list-items">
        {chatRooms.length === 0 ? (
          <div className="chat-list-empty" onClick={onNewChat}>
            <div className="chat-list-empty-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                <path d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21" stroke="url(#emptyGrad)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8.5" cy="7" r="4" stroke="url(#emptyGrad)" strokeWidth="1.5"/>
                <path d="M20 8V14M17 11H23" stroke="url(#emptyGrad)" strokeWidth="1.5" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="chat-list-empty-text">Add new friends to Blabber!</p>
            <p className="chat-list-empty-subtext">Start connecting with people to begin chatting</p>
            <button className="chat-list-empty-cta">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Find Friends
            </button>
          </div>
        ) : (
          chatRooms.map((room) => (
            <div
              key={room.id}
              className={`chat-list-item ${selectedChatId === room.id ? 'chat-list-item-active' : ''} ${room.isNewConnection ? 'chat-list-item-new' : ''}`}
              onClick={() => onSelectChat(room.id)}
            >
              <div className="chat-list-item-avatar">
                {room.friendAvatar ? (
                  <img src={room.friendAvatar} alt={room.friendUsername} />
                ) : (
                  room.friendUsername.charAt(0).toUpperCase()
                )}
                {room.isNewConnection && (
                  <div className="chat-list-item-new-badge">New</div>
                )}
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
                    {room.lastMessage || (room.isNewConnection ? '👋 Say hi!' : 'Start chatting...')}
                  </p>
                  {room.unreadCount > 0 && (
                    <span className="chat-list-item-unread">{room.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
