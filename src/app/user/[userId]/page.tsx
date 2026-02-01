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
import { getUserConnectionsCountAPI } from '@/api/auth/users/getUserConnectionsCount';
import ConnectionsModal from '../../Components/ConnectionsModal';
import EditProfileModal from '../../Components/EditProfileModal';
import { useUser } from '../../context/UserContext';
import { getUserProfileImage, addCacheBuster } from '../../types/user';

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
  tagline?: string;
  profileImage?: string; // Primary field from backend
  profilePicture?: string; // Legacy field for backward compatibility
  avatarUrl?: string; // Legacy field for backward compatibility
  onlineStatus?: string;
  updatedAt?: string | Date; // Profile last updated timestamp for cache-busting
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
  const { user } = useUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutualFriendsOpen, setIsMutualFriendsOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [connectionsCount, setConnectionsCount] = useState<number | null>(null);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const isOwnProfile = userId === loggedInUserId || (Array.isArray(userId) && userId[0] === loggedInUserId);

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
        const userIdString = Array.isArray(userId) ? userId[0] : userId;
        const apiUrl = `${BASE_URL}/api/users/${userIdString}`;
        
        console.log('[ProfilePage] Fetching profile for userId:', userIdString, 'URL:', apiUrl);
        
        const res = await fetch(apiUrl, {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = (await res.json()) as Profile;
        if (!isMounted) return;

        console.log('[ProfilePage] Profile data received:', {
          _id: data._id,
          username: data.username,
          profileImage: data.profileImage,
          profilePicture: data.profilePicture,
          avatarUrl: data.avatarUrl,
        });

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

  useEffect(() => {
    const fetchConnectionsCount = async () => {
      if (!profile?._id) return;

      try {
        const data = await getUserConnectionsCountAPI(profile._id);
        setConnectionsCount(data.count);
      } catch (err) {
        console.error('Failed to fetch connections count:', err);
        // Don't set error state, just log it
      }
    };

    if (profile?._id) {
      fetchConnectionsCount();
    }
  }, [profile?._id]);

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

  const handleConnectionsClick = () => {
    setIsConnectionsModalOpen(true);
  };

  const handleEditProfileClick = () => {
    setIsEditProfileModalOpen(true);
  };

  const handleProfileUpdate = async () => {
    // Refresh profile data after update
    if (!userId) return;

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
      const userIdString = Array.isArray(userId) ? userId[0] : userId;
      const res = await fetch(`${BASE_URL}/api/users/${userIdString}`, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const data = (await res.json()) as Profile;
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
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
          className="profile-follow-button"
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
          className="profile-requested-button"
        >
          Requested
        </button>
      );
    }

    if (status === 'pending' && direction === 'received') {
      return (
        <div className="profile-action-buttons-container">
          <button
            type="button"
            onClick={handleAccept}
            className="profile-accept-button"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="profile-reject-button"
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
          className="profile-message-button"
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
        <div className="chat-page user-profile-page-layout">
          <ChatNavbar />
          <div className="chat-main-container">
            <ChatSidebar activeTab={isOwnProfile ? "profile" : "chats"} onTabChange={handleTabChange} />
            <div className="chat-container">
              <div className="profile-hero-container">
                <div className="profile-hero-loading">Loading profile...</div>
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
        <div className="chat-page user-profile-page-layout">
          <ChatNavbar />
          <div className="chat-main-container">
            <ChatSidebar activeTab={isOwnProfile ? "profile" : "chats"} onTabChange={handleTabChange} />
            <div className="chat-container">
              <div className="profile-hero-container">
                <div className="profile-hero-error">{error}</div>
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
  const initials = profile.username?.charAt(0).toUpperCase() || 'U';
  
  const displayBio = typeof profile.bio === "string" && profile.bio.trim().length > 0
    ? profile.bio
    : profile.firstName && profile.firstName.trim().length > 0
      ? `Hi! My name is ${capitalizeFirstLetter(profile.firstName)} and I like to interact with people.`
      : "Hi! I like to interact with people.";

  const displayTagline = typeof profile.tagline === "string" && profile.tagline.trim().length > 0
    ? profile.tagline
    : "Always open to meaningful conversations";

  // Construct avatarUrl from the profile being viewed (not the logged-in user)
  // Create a User object from profile data to use with getUserProfileImage
  const profileUser = {
    id: profile._id,
    username: profile.username,
    profileImage: profile.profileImage || profile.profilePicture || profile.avatarUrl,
    updatedAt: profile.updatedAt,
  };
  
  // Use getUserProfileImage with the profile user data (not the logged-in user)
  const avatarUrl = getUserProfileImage(profileUser);
  const connections = connectionsCount !== null ? connectionsCount : (profile.stats?.connections ?? 0);
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
      <div className="chat-page user-profile-page-layout">
        <ChatNavbar />
        <div className="chat-main-container">
          <ChatSidebar activeTab={isOwnProfile ? "profile" : "chats"} onTabChange={handleTabChange} />
          <div className="chat-container">
            <div className="profile-hero-container">
              <div className="profile-hero-main-content">
                {/* Left Section - Text and Buttons */}
                <div className="profile-hero-left">
                  <div className="user-profile-header-section">
                    <h1 className="user-profile-display-name">
                      {displayName}
                    </h1>
                    {username && (
                      <p className="user-profile-username">
                        @{username}
                      </p>
                    )}
                  </div>
                  <p className="profile-hero-bio">
                    {displayBio}
                  </p>
                  <p className="user-profile-tagline">
                    {displayTagline}
                  </p>
                  <div className="profile-hero-actions">
                    {isOwnProfile ? (
                      <>
                        <button 
                          className="profile-hero-primary-btn"
                          onClick={handleEditProfileClick}
                        >
                          Edit Profile
                        </button>
                        <button className="profile-hero-secondary-btn" onClick={handleConnectionsClick}>
                          View Connections
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M5 12H19M19 12L12 5M19 12L12 19"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="profile-action-buttons-container">
                        {renderActionButtons()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section - Image with Graphics */}
                <div className="profile-hero-right">
                  <div className="profile-hero-image-wrapper">
                    {/* Circular Background */}
                    <div className="profile-hero-circle"></div>
                    {/* Curved Line */}
                    <svg className="profile-hero-curve" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id={`gradient-${profile._id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#9333ea" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 20 100 Q 100 20 180 100"
                        stroke={`url(#gradient-${profile._id})`}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Profile Image */}
                    <div className="profile-hero-avatar-wrapper">
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="profile-hero-avatar"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.profile-hero-avatar-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'profile-hero-avatar-fallback';
                            fallback.textContent = initials;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                    {/* Icons */}
                    <div className="profile-hero-icon profile-hero-icon-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M9 6H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="profile-hero-icon profile-hero-icon-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M8 21L12 17L16 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="profile-hero-icon profile-hero-icon-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 16L8 12L12 16L20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20 12V20H4V4H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Statistics */}
              <div className="profile-hero-stats">
                <button 
                  className="profile-hero-stat profile-hero-stat-clickable"
                  onClick={isOwnProfile ? handleConnectionsClick : undefined}
                  type="button"
                  disabled={!isOwnProfile}
                >
                  <div className="profile-hero-stat-number">{connections}</div>
                  <div className="profile-hero-stat-label">Connections</div>
                </button>
                <div className="profile-hero-stat">
                  <div className="profile-hero-stat-number">100%</div>
                  <div className="profile-hero-stat-label">Active</div>
                </div>
                <button
                  className="profile-hero-stat profile-hero-stat-clickable"
                  onClick={handleMutualFriendsClick}
                  type="button"
                  disabled={mutuals === null}
                >
                  <div className="profile-hero-stat-number">{mutuals || 0}+</div>
                  <div className="profile-hero-stat-label">Mutual Friends</div>
                </button>
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
        {isOwnProfile && (
          <>
            <ConnectionsModal
              isOpen={isConnectionsModalOpen}
              onClose={() => setIsConnectionsModalOpen(false)}
            />
            <EditProfileModal
              isOpen={isEditProfileModalOpen}
              onClose={() => setIsEditProfileModalOpen(false)}
              onUpdate={handleProfileUpdate}
              initialData={{
                username: profile?.username || user?.username || '',
                bio: profile?.bio || '',
                tagline: profile?.tagline || '',
                profilePicture: profile?.profileImage || profile?.profilePicture || profile?.avatarUrl || getUserProfileImage(user),
              }}
            />
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

