import { getAuthToken } from "@/app/utils/auth";

/**
 * User status response from the backend
 */
export interface UserStatusResponse {
  isOnline: boolean;
  lastSeen: string | null; // ISO date string or null
}

/**
 * Fetch user status from GET /api/users/:id/status
 * 
 * @param userId - The ID of the user to get status for
 * @returns User status with isOnline and lastSeen
 * @throws Error if request fails or user is not authenticated
 */
export const getUserStatusAPI = async (userId: string): Promise<UserStatusResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID provided');
  }

  const response = await fetch(`http://localhost:5000/api/users/${userId}/status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    const errorMessage = (data as any).message || 'Failed to fetch user status';
    throw new Error(errorMessage);
  }

  return data as UserStatusResponse;
};

