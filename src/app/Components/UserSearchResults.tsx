'use client';

import React from 'react';
import { SearchUser } from '@/hooks/useUserSearch';

interface UserSearchResultsProps {
  results: SearchUser[];
  isLoading: boolean;
  error: string | null;
  onSendRequest?: (userId: string) => void;
}

export default function UserSearchResults({
  results,
  isLoading,
  error,
  onSendRequest,
}: UserSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="connections-search-results">
        <div className="connections-search-loading">
          <div className="connections-spinner" style={{ margin: '0 auto' }}></div>
          <p>Searching...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="connections-search-results">
        <div className="connections-search-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="connections-search-results">
        <div className="connections-search-empty">
          <p>No users found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="connections-search-results">
      <div className="connections-search-results-list">
        {results.map((user) => {
          const fullName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(' ') || user.username;

          return (
            <div key={user._id} className="connections-search-result-item">
              <div className="connections-search-result-avatar">
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </div>
              <div className="connections-search-result-info">
                <p className="connections-search-result-name">{fullName}</p>
                <p className="connections-search-result-username">@{user.username}</p>
              </div>
              <button
                className="connections-search-result-button"
                onClick={() => onSendRequest?.(user._id)}
              >
                Send Request
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

