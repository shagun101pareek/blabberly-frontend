'use client';

import { useState } from 'react';
import { FriendRequest, useFriendRequests } from '@/hooks/useFriendRequests';

interface FriendRequestBannerProps {
  requests: FriendRequest[];
}

export default function FriendRequestBanner({
  requests,
}: FriendRequestBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { acceptRequest, rejectRequest, isLoading: isProcessing } = useFriendRequests();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  if (requests.length === 0) {
    return null;
  }

  const handleAccept = async (requestId: string) => {
    setProcessingIds(prev => new Set([...prev, requestId]));
    const newFriend = await acceptRequest(requestId);
    if (newFriend) {
      // Optionally add the new friend to a global state or trigger a refresh
    }
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  };

  const handleReject = async (requestId: string) => {
    setProcessingIds(prev => new Set([...prev, requestId]));
    await rejectRequest(requestId);
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
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

  return (
    <div className="friend-request-banner">
      {/* Collapsed Header */}
      <button 
        className="friend-request-banner-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="friend-request-banner-left">
          <div className="friend-request-banner-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 8V14M17 11H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="friend-request-banner-text">Friend Requests</span>
          <span className="friend-request-banner-badge">{requests.length}</span>
        </div>
        <div className={`friend-request-banner-chevron ${isExpanded ? 'expanded' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {/* Expanded Panel */}
      <div className={`friend-request-banner-panel ${isExpanded ? 'expanded' : ''}`}>
        <div className="friend-request-banner-list">
          {requests.map((request, index) => (
            <div 
              key={request.id} 
              className={`friend-request-item ${processingIds.has(request.id) ? 'processing' : ''}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="friend-request-item-avatar">
                {request.senderAvatar ? (
                  <img src={request.senderAvatar} alt={request.senderUsername} />
                ) : (
                  <span>{request.senderUsername.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="friend-request-item-info">
                <span className="friend-request-item-name">{request.senderUsername}</span>
                <span className="friend-request-item-time">{formatTimeAgo(request.createdAt)}</span>
              </div>
              <div className="friend-request-item-actions">
                <button 
                  className="friend-request-btn friend-request-btn-accept"
                  onClick={() => handleAccept(request.id)}
                  disabled={processingIds.has(request.id) || isProcessing}
                  title="Accept"
                >
                  {processingIds.has(request.id) ? (
                    <div className="friend-request-btn-spinner"></div>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <button 
                  className="friend-request-btn friend-request-btn-reject"
                  onClick={() => handleReject(request.id)}
                  disabled={processingIds.has(request.id) || isProcessing}
                  title="Reject"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


