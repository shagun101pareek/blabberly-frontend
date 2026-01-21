'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../Components/ProtectedRoute';
import ChatNavbar from '../Components/ChatNavbar';
import ChatSidebar from '../Components/ChatSidebar';
import { useUser } from '../context/UserContext';
import { uploadProfilePictureAPI } from '@/api/auth/users/uploadProfilePicture';
import { getUserProfileImage } from '../types/user';
import { getAuthToken, getUserId } from '../utils/auth';

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
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const profileImageUrl = getUserProfileImage(user);
  const initials = user?.username?.charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = getUserId();
      if (!userId) {
        setError('User not found');
        setLoading(false);
        return;
      }

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
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Call the profile-picture upload API
      const response = await uploadProfilePictureAPI(file);
      
      // Update user state with the new profileImage
      updateUser({ profileImage: response.profileImage });
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTabChange = (tab: 'chats' | 'settings' | 'profile') => {
    if (tab === 'chats') {
      router.push('/chat');
    }
    // Profile tab is already active, no need to navigate
  };

  const fullName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username
    : user?.username || 'User';
  const displayName = fullName || profile?.username || user?.username || 'User';
  const bio = profile?.bio || 'Welcome to my profile!';
  const connections = profile?.stats?.connections ?? 0;
  const avatarUrl = profile?.profilePicture || profile?.avatarUrl || profileImageUrl;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="chat-page flex flex-col">
          <ChatNavbar />
          <div className="chat-main-container">
            <ChatSidebar activeTab="profile" onTabChange={handleTabChange} />
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
        <div className="chat-page flex flex-col">
          <ChatNavbar />
          <div className="chat-main-container">
            <ChatSidebar activeTab="profile" onTabChange={handleTabChange} />
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

  return (
    <ProtectedRoute>
      <div className="chat-page flex flex-col">
        <ChatNavbar />
        <div className="chat-main-container">
          <ChatSidebar activeTab="profile" onTabChange={handleTabChange} />
          <div className="chat-container">
            <div className="profile-hero-container">
              <div className="profile-hero-main-content">
                {/* Left Section - Text and Buttons */}
                <div className="profile-hero-left">
                  <h1 className="profile-hero-headline">
                    Make <span className="profile-hero-highlight">Connections</span> That Engage, Delight, and Connect
                  </h1>
                  <p className="profile-hero-bio">
                    Hi, I'm {displayName}! {bio}
                  </p>
                  <div className="profile-hero-actions">
                    <button className="profile-hero-primary-btn">
                      Edit Profile
                    </button>
                    <button className="profile-hero-secondary-btn" onClick={() => router.push('/connections')}>
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
                  </div>
                </div>

                {/* Right Section - Image with Graphics */}
                <div className="profile-hero-right">
                <div className="profile-hero-image-wrapper">
                  {/* Circular Background */}
                  <div className="profile-hero-circle"></div>
                  {/* Curved Line */}
                  <svg className="profile-hero-curve" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M 20 100 Q 100 20 180 100"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#9333ea" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
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
                    <button
                      className="profile-hero-upload-btn"
                      onClick={handleProfileImageClick}
                      disabled={isUploading}
                      title="Upload profile picture"
                    >
                      {isUploading ? (
                        <span className="upload-spinner"></span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M12 15V3M12 3L8 7M12 3L16 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 17L2 19C2 20.1046 2.89543 21 4 21L20 21C21.1046 21 22 20.1046 22 19L22 17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
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
                <div className="profile-hero-stat">
                  <div className="profile-hero-stat-number">{connections}+</div>
                  <div className="profile-hero-stat-label">Connections</div>
                </div>
                <div className="profile-hero-stat">
                  <div className="profile-hero-stat-number">100%</div>
                  <div className="profile-hero-stat-label">Active</div>
                </div>
                <div className="profile-hero-stat">
                  <div className="profile-hero-stat-number">{profile?.stats?.mutuals || 0}+</div>
                  <div className="profile-hero-stat-label">Mutual Friends</div>
                </div>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {uploadError && (
              <div className="profile-upload-error">{uploadError}</div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

