'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuthToken, getUserId } from '../../utils/auth';
import { useMutualFriends } from '@/hooks/useMutualFriends';
import MutualFriendsModal from '../../Components/MutualFriendsModal';
import { sendFriendRequestAPI } from '@/api/auth/friends/sendFriendRequestAPI';
import ProtectedRoute from '../../Components/ProtectedRoute';
import ChatNavbar from '../../Components/ChatNavbar';
import ChatSidebar from '../../Components/ChatSidebar';

interface Relationship {
  status: 'none' | 'pending' | 'connected' | null;
  direction: 'sent' | 'received' | null;
}

interface Profile {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePicture?: string;
  avatarUrl?: string;
  onlineStatus?: string;
  stats?: {
    connections?: number;
    mutuals?: number;
  };
  relationship?: Relationship | null;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId;
  const loggedInUserId = getUserId();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutualFriendsOpen, setIsMutualFriendsOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const {
    fetchMutualFriends,
    getCachedCount,
    getCachedFriends,
    loading: mutualFriendsLoading,
    error: mutualFriendsError,
  } = useMutualFriends();

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = getAuthToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const BASE_URL =
          process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
        const res = await fetch(`${BASE_URL}/api/users/${userId}`, {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = (await res.json()) as Profile;
        if (!isMounted) return;

        setProfile(data);
        setRelationship(data.relationship ?? null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load profile');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!loggedInUserId || !profile?._id) return;

    const cachedCount = getCachedCount(loggedInUserId, profile._id);
    if (cachedCount === null) {
      fetchMutualFriends(loggedInUserId, profile._id);
    }
  }, [loggedInUserId, profile?._id, fetchMutualFriends, getCachedCount]);

  const handleFollow = async () => {
    if (!userId || isFollowing) return;

    const userIdString = Array.isArray(userId) ? userId[0] : userId;
    if (!userIdString) return;

    setIsFollowing(true);
    try {
      await sendFriendRequestAPI(userIdString);
      setRelationship({
        status: 'pending',
        direction: 'sent',
      });
    } catch (err) {
      console.error('Failed to send friend request:', err);
    } finally {
      setIsFollowing(false);
    }
  };

  const handleAccept = () => {
    console.log('accept request');
  };

  const handleReject = () => {
    console.log('reject request');
  };

  const handleMessage = () => {
    // Navigate to chat page - TODO: implement chat room creation/navigation
    router.push('/chat');
  };

  const handleTabChange = (tab: 'chats' | 'settings' | 'profile') => {
    if (tab === 'chats') {
      router.push('/chat');
    } else if (tab === 'profile') {
      router.push('/profile');
    }
  };

  const handleMutualFriendsClick = async () => {
    if (!loggedInUserId || !profile?._id) return;

    setIsMutualFriendsOpen(true);

    const cachedFriends = getCachedFriends(loggedInUserId, profile._id);
    if (!cachedFriends) {
      await fetchMutualFriends(loggedInUserId, profile._id);
    }
  };

  const renderActionButtons = () => {
    const rel = relationship;

    const status = rel?.status ?? null;
    const direction = rel?.direction ?? null;

    if ((status === null || status === 'none') && direction === null) {
      return (
        <button
          type="button"
          onClick={handleFollow}
          disabled={isFollowing}
          className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isFollowing ? 'Sending...' : 'Follow'}
        </button>
      );
    }

    if (status === 'pending' && direction === 'sent') {
      return (
        <button
          type="button"
          disabled
          className="px-4 py-2 rounded-full bg-gray-200 text-gray-600 text-sm font-medium cursor-default"
        >
          Requested
        </button>
      );
    }

    if (status === 'pending' && direction === 'received') {
      return (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-2 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="px-4 py-2 rounded-full border border-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Reject
          </button>
        </div>
      );
    }

    if (status === 'connected' && direction === null) {
      return (
        <button
          type="button"
          onClick={handleMessage}
          className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Message
        </button>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="chat-page flex flex-col">
          <ChatNavbar />
          <div className="chat-main-container">
            <ChatSidebar activeTab="chats" onTabChange={handleTabChange} />
            <div className="chat-container">
              <div className="w-full flex items-center justify-center py-20">
                <p className="text-gray-500 text-sm">Loading profile...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="chat-page flex flex-col">
          <ChatNavbar />
          <div className="chat-main-container">
            <ChatSidebar activeTab="chats" onTabChange={handleTabChange} />
            <div className="chat-container">
              <div className="w-full flex items-center justify-center py-20 px-4">
                <div className="max-w-md w-full bg-white shadow-sm rounded-xl p-6">
                  <p className="text-red-600 text-sm mb-2">Something went wrong</p>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return null;
  }

  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getDisplayName = () => {
    const firstName = profile.firstName || '';
    const lastName = profile.lastName || '';
    const username = profile.username || '';
    
    if (firstName && lastName) {
      return `${capitalizeFirstLetter(firstName)} ${capitalizeFirstLetter(lastName)}`;
    }
    if (firstName) {
      return capitalizeFirstLetter(firstName);
    }
    if (lastName) {
      return capitalizeFirstLetter(lastName);
    }
    return username || 'User';
  };

  const displayName = getDisplayName();
  const username = profile.username || '';
  const bio = profile.bio || '';
  const avatarUrl =
    profile.profilePicture || profile.avatarUrl || '/default-avatar.svg';
  const connections = profile.stats?.connections ?? null;
  const mutualsFromProfile = profile.stats?.mutuals ?? null;

  let mutuals: number | null = mutualsFromProfile;
  if (loggedInUserId && profile._id) {
    const cachedCount = getCachedCount(loggedInUserId, profile._id);
    if (cachedCount !== null) {
      mutuals = cachedCount;
    }
  }

  const mutualFriendsList =
    loggedInUserId && profile._id
      ? getCachedFriends(loggedInUserId, profile._id) || []
      : [];

  const mutualKey =
    loggedInUserId && profile._id
      ? `${loggedInUserId}:${profile._id}`
      : null;

  return (
    <ProtectedRoute>
      <div className="chat-page flex flex-col">
        <ChatNavbar />
        <div className="chat-main-container">
          <ChatSidebar activeTab="chats" onTabChange={handleTabChange} />
          <div className="chat-container overflow-y-auto">
            <div className="w-full bg-gray-50 flex justify-center px-4 py-8">
              <div className="w-full max-w-[1400px] bg-white shadow-sm rounded-2xl px-8 py-10 flex flex-col md:flex-row gap-10">
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="mb-3">
                          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 break-words mb-2">
                            {displayName}
                          </h1>
                          {username && (
                            <p className="text-base sm:text-lg text-gray-500">
                              @{username}
                            </p>
                          )}
                        </div>
                        <div className="mt-3">{renderActionButtons()}</div>
                      </div>
                    </div>

                    {bio && (
                      <p className="mt-5 text-sm md:text-base text-gray-700 whitespace-pre-line">
                        {bio}
                      </p>
                    )}

                    {(connections !== null || mutuals !== null) && (
                      <div className="mt-6 flex flex-wrap gap-6 text-sm">
                        {connections !== null && (
                          <div>
                            <span className="font-semibold text-gray-900">
                              {connections}
                            </span>
                            <span className="ml-1 text-gray-500">Connections</span>
                          </div>
                        )}
                        {mutuals !== null && (
                          <button
                            type="button"
                            onClick={handleMutualFriendsClick}
                            className="flex items-center gap-1 text-sm text-gray-700 hover:text-indigo-600 underline-offset-2 hover:underline"
                          >
                            <span className="font-semibold">
                              {mutuals}
                            </span>
                            <span>Mutual friends</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="user-profile-avatar-container">
                  <div className="user-profile-avatar-wrapper">
                    <div className="user-profile-avatar">
                      <img
                        src={avatarUrl}
                        alt={displayName || 'Profile picture'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {mutualKey && (
          <MutualFriendsModal
            isOpen={isMutualFriendsOpen}
            onClose={() => setIsMutualFriendsOpen(false)}
            mutualFriends={mutualFriendsList}
            isLoading={!!mutualFriendsLoading[mutualKey]}
            error={mutualFriendsError[mutualKey] ?? null}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

