'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../Components/ProtectedRoute';
import ChatNavbar from '../Components/ChatNavbar';
import ChatSidebar from '../Components/ChatSidebar';
import { useUser } from '../context/UserContext';
import { uploadProfilePictureAPI } from '@/api/auth/users/uploadProfilePicture';
import { getUserProfileImage } from '../types/user';

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Static profile data (will be replaced with API later)
  const [profileData] = useState({
    status: 'Available',
    bio: 'This is my bio',
    username: user?.username || 'username',
    name: 'John Doe',
  });

  const profileImageUrl = getUserProfileImage(user);
  const initials = user?.username?.charAt(0).toUpperCase() || 'U';

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

  return (
    <ProtectedRoute>
      <div className="chat-page flex flex-col">
        <ChatNavbar />
        <div className="chat-main-container">
          <ChatSidebar activeTab="profile" onTabChange={handleTabChange} />
          <div className="chat-container">
            <div className="profile-page-container">
              <div className="profile-content">
                {/* Profile Picture Section */}
                <div className="profile-picture-section">
                  <div className="profile-picture-wrapper">
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="profile-picture-image"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.profile-picture-placeholder')) {
                          const placeholder = document.createElement('div');
                          placeholder.className = 'profile-picture-placeholder';
                          const span = document.createElement('span');
                          span.textContent = initials;
                          placeholder.appendChild(span);
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                    <button
                      className="profile-picture-upload-btn"
                      onClick={handleProfileImageClick}
                      disabled={isUploading}
                      title="Upload profile picture"
                    >
                      {isUploading ? (
                        <span className="upload-spinner"></span>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  {uploadError && (
                    <div className="profile-upload-error">{uploadError}</div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Profile Information Section */}
                <div className="profile-info-section">
                  <div className="profile-field">
                    <label className="profile-field-label">Status</label>
                    <div className="profile-field-value">{profileData.status}</div>
                  </div>

                  <div className="profile-field">
                    <label className="profile-field-label">Bio</label>
                    <div className="profile-field-value">{profileData.bio}</div>
                  </div>

                  <div className="profile-field">
                    <label className="profile-field-label">Username</label>
                    <div className="profile-field-value">{profileData.username}</div>
                  </div>

                  <div className="profile-field">
                    <label className="profile-field-label">Name</label>
                    <div className="profile-field-value">{profileData.name}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

