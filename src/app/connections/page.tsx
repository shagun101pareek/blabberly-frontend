'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../Components/ProtectedRoute';
import ChatNavbar from '../Components/ChatNavbar';
import ChatSidebar from '../Components/ChatSidebar';
import UserSearchInput from '../Components/UserSearchInput';
import UserSearchResults from '../Components/UserSearchResults';
import MutualFriendsModal from '../Components/MutualFriendsModal';
import { useFriendRequests } from '@/hooks/useFriendRequests';
import { useFriendSuggestions } from '@/hooks/useFriendSuggestions';
import { useFriends } from '@/hooks/useFriends';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useMutualFriends } from '@/hooks/useMutualFriends';
import { getUserId } from '../utils/auth';

export default function ConnectionsPage() {
  const router = useRouter();
  const [processingRequestIds, setProcessingRequestIds] = useState<Set<string>>(new Set());
  const [processingSuggestionIds, setProcessingSuggestionIds] = useState<Set<string>>(new Set());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedMutualFriendsUserId, setSelectedMutualFriendsUserId] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Get logged-in user ID
  const loggedInUserId = getUserId();

  // Hooks
  const {
    incomingRequests,
    acceptRequest,
    rejectRequest,
    isLoading: friendRequestsLoading,
    fetchPendingRequests,
  } = useFriendRequests();

  const { suggestions, sendFriendRequest, isLoading: suggestionsLoading } = useFriendSuggestions();

  const { addFriend } = useFriends();

  const {
    fetchMutualFriends,
    getCachedCount,
    getCachedFriends,
    loading: mutualFriendsLoading,
    error: mutualFriendsError,
  } = useMutualFriends();

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

  const handleAcceptRequest = useCallback(async (requestId: string) => {
    setProcessingRequestIds(prev => new Set([...prev, requestId]));
    const newFriend = await acceptRequest(requestId);
    if (newFriend) {
      addFriend(newFriend);
    }
    setProcessingRequestIds(prev => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  }, [acceptRequest, addFriend]);

  const handleRejectRequest = useCallback(async (requestId: string) => {
    setProcessingRequestIds(prev => new Set([...prev, requestId]));
    await rejectRequest(requestId);
    setProcessingRequestIds(prev => {
      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  }, [rejectRequest]);

  const handleSendFriendRequest = useCallback(async (userId: string) => {
    // Validate userId before processing
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('handleSendFriendRequest: Invalid userId:', userId);
      return;
    }

    console.log('ConnectionsPage: handleSendFriendRequest called with userId:', userId);
    setProcessingSuggestionIds(prev => new Set([...prev, userId]));
    
    try {
      await sendFriendRequest(userId);
    } catch (error) {
      console.error('Error in handleSendFriendRequest:', error);
    } finally {
      setProcessingSuggestionIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }, [sendFriendRequest]);

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

  // Fetch mutual friends for all suggestions on mount
  useEffect(() => {
    if (!loggedInUserId || suggestions.length === 0) return;

    // Fetch mutual friends for each suggestion
    suggestions.forEach((suggestion) => {
      if (suggestion.id) {
        // Only fetch if not already cached
        const cachedCount = getCachedCount(loggedInUserId, suggestion.id);
        if (cachedCount === null) {
          fetchMutualFriends(loggedInUserId, suggestion.id);
        }
      }
    });
  }, [loggedInUserId, suggestions, fetchMutualFriends, getCachedCount]);

  const handleMutualFriendsClick = useCallback(async (otherUserId: string) => {
    if (!loggedInUserId) return;

    // Open modal immediately (will show loading if data not available)
    setSelectedMutualFriendsUserId(otherUserId);

    // Check if we have cached data
    const cachedFriends = getCachedFriends(loggedInUserId, otherUserId);
    
    // If not cached, fetch it (modal will show loading state)
    if (!cachedFriends) {
      await fetchMutualFriends(loggedInUserId, otherUserId);
    }
  }, [loggedInUserId, fetchMutualFriends, getCachedFriends]);

  const handleCloseMutualFriendsModal = useCallback(() => {
    setSelectedMutualFriendsUserId(null);
  }, []);

  return (
    <ProtectedRoute>
      <div className="chat-page flex flex-col">
        {/* Navbar */}
        <ChatNavbar />

        {/* Main Content with Sidebar */}
        <div className="chat-main-container">
          <ChatSidebar activeTab="chats" />
          <div className="chat-container overflow-y-auto">
            <div className="connections-page-container">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-3xl mt-5 font-bold text-slate-900">Connections</h1>
              <p className="mt-2 text-sm text-slate-600">̵
                Manage your friend requests and discover new connections
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-8 connections-search-wrapper" ref={searchContainerRef}>
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

            {/* Friend Requests Section */}
            <div className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Friend Requests</h2>
                {incomingRequests.length > 0 && (
                  <span className="text-sm text-slate-500">
                    {incomingRequests.length} {incomingRequests.length === 1 ? 'request' : 'requests'}
                  </span>
                )}
              </div>

              {incomingRequests.length === 0 ? (
                <div className="connections-empty-state">
                  <svg
                    className="mx-auto h-12 w-12 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <p className="mt-4 text-sm text-slate-500">No pending friend requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="connections-card"
                      onClick={(e) => {
                        // Don't navigate if clicking on buttons
                        if ((e.target as HTMLElement).closest('button')) {
                          return;
                        }
                        router.push(`/user/${request.senderId}`);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="connections-avatar-small">
                          {request.senderAvatar ? (
                            <img
                              src={request.senderAvatar}
                              alt={request.senderUsername}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span>{request.senderUsername.charAt(0).toUpperCase()}</span>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-slate-900">
                            {request.senderUsername}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatTimeAgo(request.createdAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptRequest(request.id);
                            }}
                            disabled={processingRequestIds.has(request.id) || friendRequestsLoading}
                            className="connections-accept-button"
                          >
                            {processingRequestIds.has(request.id) ? (
                              <>
                                <div className="connections-spinner"></div>
                                <span>Accepting...</span>
                              </>
                            ) : (
                              <>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M20 6L9 17L4 12"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span>Accept</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectRequest(request.id);
                            }}
                            disabled={processingRequestIds.has(request.id) || friendRequestsLoading}
                            className="connections-reject-button"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Friend Suggestions Section */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Friend Suggestions</h2>
                {suggestions.length > 0 && (
                  <span className="text-sm text-slate-500">
                    {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
                  </span>
                )}
              </div>

              {suggestions.length === 0 ? (
                <div className="connections-empty-state">
                  <svg
                    className="mx-auto h-12 w-12 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <p className="mt-4 text-sm text-slate-500">No friend suggestions available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id || `suggestion-${index}`}
                      className="connections-card"
                      onClick={(e) => {
                        // Don't navigate if clicking on dismiss button or connect button
                        if ((e.target as HTMLElement).closest('.connections-card-dismiss') || 
                            (e.target as HTMLElement).closest('.connections-connect-button')) {
                          return;
                        }
                        if (suggestion.id) {
                          router.push(`/user/${suggestion.id}`);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Dismiss Button */}
                      <button
                        className="connections-card-dismiss"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Remove suggestion from list
                          // You can implement this functionality if needed
                        }}
                        aria-label="Dismiss suggestion"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>

                      <div className="flex flex-col items-center text-center">
                        {/* Avatar with Mutual Friends Indicator */}
                        <div className="relative mb-4">
                          <div className="connections-avatar-large">
                            {suggestion.avatar ? (
                              <img
                                src={suggestion.avatar}
                                alt={suggestion.username}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span>{suggestion.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {/* Mutual Friends Indicator */}
                          <div className="connections-mutual-friends-badge">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                          </div>
                        </div>

                        {/* Username */}
                        <p className="connections-card-username">
                          {suggestion.username}
                        </p>
                        
                        {/* Mutual Friends Count */}
                        {(() => {
                          if (!loggedInUserId || !suggestion.id) return null;
                          
                          const loadingKey = `${loggedInUserId}:${suggestion.id}`;
                          const isLoading = mutualFriendsLoading[loadingKey];
                          const cachedCount = getCachedCount(loggedInUserId, suggestion.id);
                          
                          // Show loading state
                          if (isLoading && cachedCount === null) {
                            return (
                              <p className="connections-card-mutual" style={{ cursor: 'default', color: '#6b7280' }}>
                                Loading...
                              </p>
                            );
                          }
                          
                          // Only show if count > 0
                          if (cachedCount !== null && cachedCount > 0) {
                            return (
                              <p 
                                className="connections-card-mutual"
                                onClick={() => handleMutualFriendsClick(suggestion.id)}
                                title="Click to see mutual friends"
                              >
                                {cachedCount} {cachedCount === 1 ? 'Mutual Friend' : 'Mutual Friends'}
                              </p>
                            );
                          }
                          
                          return null;
                        })()}

                        {/* Connect Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendFriendRequest(suggestion.id);
                          }}
                          disabled={processingSuggestionIds.has(suggestion.id) || suggestionsLoading}
                          className="connections-connect-button"
                        >
                          {processingSuggestionIds.has(suggestion.id) ? (
                            <>
                              <div className="connections-spinner"></div>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <span>Connect</span>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Mutual Friends Modal */}
        {selectedMutualFriendsUserId && loggedInUserId && (
          <MutualFriendsModal
            isOpen={!!selectedMutualFriendsUserId}
            onClose={handleCloseMutualFriendsModal}
            mutualFriends={getCachedFriends(loggedInUserId, selectedMutualFriendsUserId) || []}
            isLoading={mutualFriendsLoading[`${loggedInUserId}:${selectedMutualFriendsUserId}`] || false}
            error={mutualFriendsError[`${loggedInUserId}:${selectedMutualFriendsUserId}`] || null}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

