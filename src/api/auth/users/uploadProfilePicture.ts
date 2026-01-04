/**
 * Profile Picture Upload API
 * 
 * IMPORTANT ARCHITECTURE RULES:
 * - This API is UPLOAD ONLY - DO NOT call on page load
 * - Profile picture is returned as part of the user object (field: profileImage)
 * - Only call this API when user explicitly selects a new image
 * - After successful upload, update local user state with returned profileImage
 * 
 * Mental Model: Upload APIs are NEVER fetch APIs.
 */

import { getAuthToken } from '@/app/utils/auth';

export interface UploadProfilePictureResponse {
  profileImage: string;
  message?: string;
}

/**
 * Upload a profile picture
 * 
 * @param file - Image file to upload
 * @returns Response containing the new profileImage URL
 * @throws Error if upload fails
 * 
 * @example
 * ```ts
 * const handleImageSelect = async (file: File) => {
 *   try {
 *     const response = await uploadProfilePictureAPI(file);
 *     // Update local user state with response.profileImage
 *     setUser(prev => prev ? { ...prev, profileImage: response.profileImage } : null);
 *   } catch (error) {
 *     console.error('Failed to upload profile picture:', error);
 *   }
 * };
 * ```
 */
export const uploadProfilePictureAPI = async (
  file: File
): Promise<UploadProfilePictureResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Create FormData for file upload
  // IMPORTANT: The backend expects the field name to be "profileImage"
  const formData = new FormData();
  formData.append('profileImage', file);

  const response = await fetch('http://localhost:5000/api/users/profile-picture', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Note: Don't set Content-Type header - browser will set it with boundary for FormData
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload profile picture');
  }

  return {
    profileImage: data.profileImage || data.profile_image || '',
    message: data.message,
  };
};

