'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import { getUserProfileImage } from '../types/user';
import UserSearchInput from './UserSearchInput';
import UserSearchResults from './UserSearchResults';
import { useUserSearch } from '@/hooks/useUserSearch';

interface ChatNavbarProps {
  // No props needed - simplified navbar
}

export default function ChatNavbar({}: ChatNavbarProps) {
  const router = useRouter();
  const { user } = useUser();
  const profileImageUrl = getUserProfileImage(user);
  const initials = user?.username?.charAt(0).toUpperCase() || 'U';
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // User search hook
  const {
    searchQuery,
    searchResults,
    isLoading: isSearchLoading,
    error: searchError,
    setSearchQuery,
    clearResults,
  } = useUserSearch();

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    if (isSearchFocused) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchFocused]);

  const handleProfileClick = () => {
    router.push('/profile');
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
          {/* Search Bar */}
          <div className="chat-navbar-search" ref={searchContainerRef}>
            <UserSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search users by name or username"
            />
            {isSearchFocused && (searchQuery.length >= 2 || isSearchLoading || searchError) && (
              <UserSearchResults
                results={searchResults}
                isLoading={isSearchLoading}
                error={searchError}
              />
            )}
          </div>

          {/* Profile */}
          <button
            type="button"
            className="profile-btn"
            aria-label="Profile"
            onClick={handleProfileClick}
          >
            <img
              src={profileImageUrl}
              alt="Profile"
              className="profile-btn-image"
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('span')) {
                  const span = document.createElement('span');
                  span.textContent = initials;
                  parent.appendChild(span);
                }
              }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
