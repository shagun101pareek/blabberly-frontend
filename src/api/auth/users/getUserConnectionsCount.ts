import { getAuthToken } from "@/app/utils/auth";

export interface UserConnectionsCountResponse {
  count: number;
}

/**
 * Fetch connections count for a user
 * @param userId - The user's ID
 * @returns Promise with connections count
 */
export const getUserConnectionsCountAPI = async (
  userId: string
): Promise<UserConnectionsCountResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  if (!userId) {
    throw new Error('UserId is required');
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const response = await fetch(
    `${BASE_URL}/api/users/${userId}/connections`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch connections count');
  }

  return {
    count: data.count || 0,
  };
};

