'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { updateProfileAPI, UpdateProfileRequest } from '@/api/auth/users/updateProfile';
import { uploadProfilePictureAPI } from '@/api/auth/users/uploadProfilePicture';
import { getUserProfileImage } from '../types/user';
import { useUser } from '../context/UserContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedData?: {
    username?: string;
    bio?: string;
    tagline?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  }) => void;
  initialData?: {
    username?: string;
    bio?: string;
    tagline?: string;
    profilePicture?: string;
  };
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onUpdate,
  initialData,
}: EditProfileModalProps) {
  const { user, updateUser } = useUser();
  const [formData, setFormData] = useState({
    username: initialData?.username || '',
    bio: initialData?.bio || '',
    tagline: initialData?.tagline || '',
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileImageUrl = getUserProfileImage(user);
  const initials = user?.username?.charAt(0).toUpperCase() || 'U';

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        username: initialData.username || '',
        bio: initialData.bio || '',
        tagline: initialData.tagline || '',
      });
      setProfilePicturePreview(initialData.profilePicture || profileImageUrl);
      setProfilePicture(null);
      setError(null);
    }
  }, [isOpen, initialData, profileImageUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setProfilePicture(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, upload profile picture if a new one was selected
      if (profilePicture) {
        setIsUploadingPicture(true);
        try {
          const uploadResponse = await uploadProfilePictureAPI(profilePicture);
          if (uploadResponse.profileImage) {
            // Update user with new profile image and current timestamp for cache-busting
            updateUser({ 
              profileImage: uploadResponse.profileImage,
              updatedAt: new Date().toISOString()
            });
          }
        } catch (uploadError) {
          console.error('Failed to upload profile picture:', uploadError);
          setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload profile picture');
          setIsLoading(false);
          setIsUploadingPicture(false);
          return;
        } finally {
          setIsUploadingPicture(false);
        }
      }

      // Then, update profile data
      const updateData: UpdateProfileRequest = {};
      if (formData.username.trim() !== (initialData?.username || '')) {
        updateData.username = formData.username.trim();
      }
      if (formData.bio.trim() !== (initialData?.bio || '')) {
        updateData.bio = formData.bio.trim();
      }
      if (formData.tagline.trim() !== (initialData?.tagline || '')) {
        updateData.tagline = formData.tagline.trim();
      }

      // Only call API if there are changes
      let updatedProfileData: {
        username?: string;
        bio?: string;
        tagline?: string;
        firstName?: string;
        lastName?: string;
        profilePicture?: string;
      } | undefined = undefined;

      if (Object.keys(updateData).length > 0) {
        const response = await updateProfileAPI(updateData);
        
        // Update user context if username was changed
        if (updateData.username && response.user) {
          updateUser({ username: response.user.username });
        }

        // Extract updated profile data from response
        if (response.user) {
          updatedProfileData = {
            username: response.user.username,
            bio: response.user.bio,
            tagline: response.user.tagline,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            profilePicture: response.user.profilePicture,
          };
        }
      }

      // Call onUpdate callback with updated data for immediate UI update
      if (onUpdate) {
        onUpdate(updatedProfileData);
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isUploadingPicture) {
      setError(null);
      setProfilePicture(null);
      setProfilePicturePreview(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="edit-profile-modal">
        <h2 className="edit-profile-modal-title">Edit Profile</h2>
        
        {error && (
          <div className="edit-profile-modal-error">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {isLoading || isUploadingPicture ? (
          <div className="edit-profile-modal-loading">
            <div className="connections-spinner" style={{ margin: '0 auto' }}></div>
            <p className="mt-4 text-sm text-slate-500">
              {isUploadingPicture ? 'Uploading photo...' : 'Saving changes...'}
            </p>
          </div>
        ) : (
          <div className="edit-profile-modal-content">
            {/* Profile Picture Section */}
            <div className="edit-profile-picture-section">
              <div className="edit-profile-picture-wrapper">
              <div className="edit-profile-picture-preview">
                {profilePicturePreview && 
                 profilePicturePreview !== '/default-avatar.svg' && 
                 !profilePicturePreview.includes('default-avatar') ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile preview"
                    className="edit-profile-picture-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.edit-profile-picture-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'edit-profile-picture-fallback';
                        fallback.textContent = initials;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="edit-profile-picture-fallback">{initials}</div>
                )}
              </div>
              <button
                type="button"
                className="edit-profile-picture-btn"
                onClick={handleProfilePictureClick}
                disabled={isLoading || isUploadingPicture}
              >
                {isUploadingPicture ? (
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
                <span>Change Photo</span>
              </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

          {/* Username Field */}
          <div className="edit-profile-field">
            <label htmlFor="username" className="edit-profile-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              className="edit-profile-input"
              placeholder="Enter username"
              disabled={isLoading || isUploadingPicture}
            />
          </div>

          {/* Tagline Field */}
          <div className="edit-profile-field">
            <label htmlFor="tagline" className="edit-profile-label">
              Tagline
            </label>
            <input
              id="tagline"
              name="tagline"
              type="text"
              value={formData.tagline}
              onChange={handleInputChange}
              className="edit-profile-input"
              placeholder="Enter your tagline"
              disabled={isLoading || isUploadingPicture}
            />
          </div>

          {/* Bio Field */}
          <div className="edit-profile-field">
            <label htmlFor="bio" className="edit-profile-label">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="edit-profile-textarea"
              placeholder="Tell us about yourself"
              rows={4}
              disabled={isLoading || isUploadingPicture}
            />
          </div>
          </div>
        )}

        {!isLoading && !isUploadingPicture && (
          <div className="edit-profile-actions">
            <button
              type="button"
              className="edit-profile-cancel-btn"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="edit-profile-save-btn"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

