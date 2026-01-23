/**
 * Update Profile API
 * 
 * Updates user profile information including bio, tagline, and username
 */

import { getAuthToken } from '@/app/utils/auth';

export interface UpdateProfileRequest {
  bio?: string;
  tagline?: string;
  username?: string;
}

export interface UpdateProfileResponse {
  message?: string;
  user?: {
    _id: string;
    username: string;
    bio?: string;
    tagline?: string;
    profilePicture?: string;
    [key: string]: any;
  };
}

/**
 * Update user profile
 * 
 * @param data - Profile data to update (bio, tagline, username)
 * @returns Response containing updated user data
 * @throws Error if update fails
 * 
 * @example
 * ```ts
 * try {
 *   const response = await updateProfileAPI({
 *     bio: "Building Blabberly, one API at a time",
 *     tagline: "Full Stack Developer",
 *     username: "newusername"
 *   });
 *   console.log('Profile updated:', response);
 * } catch (error) {
 *   console.error('Failed to update profile:', error);
 * }
 * ```
 */
export const updateProfileAPI = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const response = await fetch(`${BASE_URL}/api/users/me/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || 'Failed to update profile');
  }

  return responseData;
};


