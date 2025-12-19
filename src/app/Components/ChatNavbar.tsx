'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FriendRequest } from '../hooks/friend';

interface ChatNavbarProps {
}

export default function ChatNavbar() {
  const router = useRouter();

  const handleAccept = async (requestId: string) => {
    await onAcceptRequest(requestId);
  };

  const handleReject = async (requestId: string) => {
    await onRejectRequest(requestId);
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
          <div className="relative">
            <button
              type="button"
              onClick={() => router.push('/connections')}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-indigo-300 hover:text-indigo-500 hover:shadow-md transition"
              aria-label="Friends"
            >
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

