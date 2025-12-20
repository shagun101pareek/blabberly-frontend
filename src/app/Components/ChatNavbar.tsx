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

  // Close dropdown when clicking outside
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
    <header className="fixed top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            blabberly
          </span>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-4">
          {/* Friends Icon with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => router.push('/connections')}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-indigo-300 hover:text-indigo-500 hover:shadow-md transition"
              aria-label="Friends"
            >
              {friendRequests.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[0.625rem] font-semibold text-white shadow-sm">
                  {friendRequests.length}
                </span>
              )}
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
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

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-30">
                <div className="p-3 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900">Friend Requests</h3>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {friendRequests.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No friend requests
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {friendRequests.slice(0, 5).map((request) => (
                        <div
                          key={request.id}
                          className="p-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
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
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {request.senderUsername}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatTimeAgo(request.createdAt)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleAccept(request.id)}
                                disabled={processingIds.has(request.id) || isLoading}
                                className="p-1.5 rounded-full hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Accept"
                              >
                                {processingIds.has(request.id) ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
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
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                disabled={processingIds.has(request.id) || isLoading}
                                className="p-1.5 rounded-full hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reject"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
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

                {/* See All Link */}
                {friendRequests.length > 0 && (
                  <div className="p-3 border-t border-slate-200">
                    <button
                      onClick={handleSeeAll}
                      className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      See all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User avatar */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-semibold text-white shadow-sm hover:shadow-md transition"
            aria-label="Profile"
          >
            SP
          </button>
        </div>
      </div>
    </header>
  );
}

