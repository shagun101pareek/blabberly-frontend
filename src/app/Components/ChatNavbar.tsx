'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FriendRequest } from '@/hooks/useFriendRequests';

interface ChatNavbarProps {
  friendRequests?: FriendRequest[];
  onAcceptRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
  isLoading?: boolean;
}

export default function ChatNavbar({
  friendRequests = [],
  onAcceptRequest,
  onRejectRequest,
  isLoading = false,
}: ChatNavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleAccept = async (requestId: string) => {
    if (!onAcceptRequest) return;
    setProcessingIds(prev => new Set([...prev, requestId]));
    try {
      await onAcceptRequest(requestId);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    if (!onRejectRequest) return;
    setProcessingIds(prev => new Set([...prev, requestId]));
    try {
      await onRejectRequest(requestId);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleSeeAll = () => {
    setIsDropdownOpen(false);
    router.push('/connections');
  };

  return (
    <header className="chat-navbar">
      <div className="chat-navbar-container">
        {/* Brand */}
        <div className="chat-navbar-brand">
          <span className="chat-navbar-logo">Blabberly</span>
        </div>

        {/* Right section */}
        <div className="chat-navbar-right">
          {/* Friends */}
          <div className="friends-wrapper" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => router.push('/connections')}
              className="friends-button"
              aria-label="Friends"
            >
              {friendRequests.length > 0 && (
                <span className="friend-badge">
                  {friendRequests.length}
                </span>
              )}

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="8.5"
                  cy="7"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M20 8V14M17 11H23"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="friend-dropdown">
                <div className="friend-dropdown-header">
                  <h3 className="friend-dropdown-title">Friend Requests</h3>
                </div>

                <div className="friend-dropdown-body">
                  {friendRequests.length === 0 ? (
                    <div className="friend-empty">
                      No friend requests
                    </div>
                  ) : (
                    <div className="friend-list">
                      {friendRequests.slice(0, 5).map(request => (
                        <div key={request.id} className="friend-item">
                          <div className="friend-row">
                            {/* Avatar */}
                            <div className="friend-avatar">
                              {request.senderAvatar ? (
                                <img
                                  src={request.senderAvatar}
                                  alt={request.senderUsername}
                                />
                              ) : (
                                <span>
                                  {request.senderUsername.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="friend-info">
                              <p className="friend-name">
                                {request.senderUsername}
                              </p>
                              <p className="friend-time">
                                {formatTimeAgo(request.createdAt)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="friend-actions">
                              <button
                                onClick={() => handleAccept(request.id)}
                                disabled={processingIds.has(request.id) || isLoading}
                                className="accept-btn"
                                title="Accept"
                              >
                                {processingIds.has(request.id) ? (
                                 <div className="accept-spinner" />
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path
                                      d="M20 6L9 17L4 12"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </button>

                              <button
                                onClick={() => handleReject(request.id)}
                                disabled={processingIds.has(request.id) || isLoading}
                                className="reject-btn"
                                title="Reject"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path
                                    d="M18 6L6 18M6 6L18 18"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {friendRequests.length > 0 && (
                  <div className="friend-dropdown-footer">
                    <button
                      onClick={handleSeeAll}
                      className="see-all-btn"
                    >
                      See all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <button
            type="button"
            className="profile-btn"
            aria-label="Profile"
          >
            SP
          </button>
        </div>
      </div>
    </header>
  );
}
