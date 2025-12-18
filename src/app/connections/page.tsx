'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../Components/ProtectedRoute';
import ChatNavbar from '../Components/ChatNavbar';
import ChatSidebar from '../Components/ChatSidebar';
import { useFriendRequests, useFriendSuggestions, useFriends } from '../hooks/friend';

export default function ConnectionsPage() {
  const router = useRouter();
  const [processingRequestIds, setProcessingRequestIds] = useState<Set<string>>(new Set());
  const [processingSuggestionIds, setProcessingSuggestionIds] = useState<Set<string>>(new Set());

  // Hooks
  const {
    incomingRequests,
    acceptRequest,
    rejectRequest,
    isLoading: friendRequestsLoading,
  } = useFriendRequests();

  const { suggestions, sendFriendRequest, isLoading: suggestionsLoading } = useFriendSuggestions();

  const { addFriend } = useFriends();

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
    setProcessingSuggestionIds(prev => new Set([...prev, userId]));
    await sendFriendRequest(userId);
    setProcessingSuggestionIds(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
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

  return (
    <ProtectedRoute>
      <div className="chat-page flex flex-col">
        {/* Navbar */}
        <ChatNavbar
          friendRequests={incomingRequests}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          isLoading={friendRequestsLoading}
        />

        {/* Main Content with Sidebar */}
        <div className="chat-main-container pt-16">
          <ChatSidebar activeTab="chats" />
          <div className="chat-container overflow-y-auto">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Connections</h1>
              <p className="mt-2 text-sm text-slate-600">
                Manage your friend requests and discover new connections
              </p>
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
                <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
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
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-semibold">
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
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={processingRequestIds.has(request.id) || friendRequestsLoading}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {processingRequestIds.has(request.id) ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={processingRequestIds.has(request.id) || friendRequestsLoading}
                            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="relative mb-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-semibold">
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
                          {suggestion.isOnline && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>

                        {/* Username */}
                        <p className="text-base font-medium text-slate-900 mb-1">
                          {suggestion.username}
                        </p>
                        <p className="text-xs text-slate-500 mb-4">
                          {suggestion.isOnline ? 'Online' : 'Offline'}
                        </p>

                        {/* Add Friend Button */}
                        <button
                          onClick={() => handleSendFriendRequest(suggestion.id)}
                          disabled={processingSuggestionIds.has(suggestion.id) || suggestionsLoading}
                          className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {processingSuggestionIds.has(suggestion.id) ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Sending...</span>
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
                                  d="M20 8V14M17 11H23"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <circle
                                  cx="8.5"
                                  cy="7"
                                  r="4"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                              </svg>
                              <span>Add Friend</span>
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
      </div>
    </ProtectedRoute>
  );
}

