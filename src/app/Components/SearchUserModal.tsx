'use client';

import { useEffect, useRef } from 'react';
import { useUserSearch, SearchResult } from '../types/user';

interface SearchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSent?: (userId: string) => void;
}

export default function SearchUserModal({ isOpen, onClose, onRequestSent }: SearchUserModalProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading,
    error,
    sendFriendRequest,
    clearSearch,
  } = useUserSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Clear search when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSendRequest = async (user: SearchResult) => {
    const success = await sendFriendRequest(user.id);
    if (success && onRequestSent) {
      onRequestSent(user.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={handleOverlayClick}>
      <div className="search-modal" ref={modalRef}>
        {/* Header */}
        <div className="search-modal-header">
          <h2 className="search-modal-title">Find Friends</h2>
          <button className="search-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="search-modal-search-container">
          <div className="search-modal-search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search users by username…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-modal-clear" onClick={clearSearch}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="search-modal-results">
          {/* Loading State */}
          {isLoading && (
            <div className="search-modal-loading">
              <div className="search-modal-spinner"></div>
              <span>Searching...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="search-modal-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Empty State - No Query */}
          {!searchQuery && !isLoading && (
            <div className="search-modal-empty">
              <div className="search-modal-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                  <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
                  <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                </svg>
              </div>
              <p className="search-modal-empty-text">Start typing to search for users</p>
            </div>
          )}

          {/* Empty State - No Results */}
          {searchQuery && !isLoading && searchResults.length === 0 && !error && (
            <div className="search-modal-empty">
              <div className="search-modal-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                  <path d="M23 21V19C22.9986 17.177 21.765 15.5857 20 15.13" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
                  <path d="M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="search-modal-empty-text">No users found for &quot;{searchQuery}&quot;</p>
              <p className="search-modal-empty-subtext">Try a different username</p>
            </div>
          )}

          {/* Results List */}
          {searchResults.length > 0 && !isLoading && (
            <div className="search-modal-list">
              {searchResults.map((user, index) => (
                <div 
                  key={user.id} 
                  className="search-modal-user"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="search-modal-user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} />
                    ) : (
                      <span>{user.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="search-modal-user-info">
                    <span className="search-modal-user-name">{user.username}</span>
                  </div>
                  <div className="search-modal-user-action">
                    {user.friendshipStatus === 'friends' ? (
                      <span className="search-modal-status search-modal-status-friends">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Already Friends
                      </span>
                    ) : user.friendshipStatus === 'pending' ? (
                      <span className="search-modal-status search-modal-status-pending">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Request Sent
                      </span>
                    ) : (
                      <button 
                        className="search-modal-add-btn"
                        onClick={() => handleSendRequest(user)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                          <path d="M20 8V14M17 11H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Send Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


