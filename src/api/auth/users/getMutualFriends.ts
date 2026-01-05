import { getAuthToken } from "@/app/utils/auth";

export interface MutualFriend {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface MutualFriendsResponse {
  count: number;
  mutualFriends: MutualFriend[];
}

/**
 * Fetch mutual friends between the logged-in user and another user
 * @param userId - The logged-in user's ID
 * @param otherUserId - The other user's ID
 * @returns Promise with mutual friends data
 */
export const getMutualFriendsAPI = async (
  userId: string,
  otherUserId: string
): Promise<MutualFriendsResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  if (!userId || !otherUserId) {
    throw new Error('Both userId and otherUserId are required');
  }

  const response = await fetch(
    `http://localhost:5000/api/users/${userId}/mutual/${otherUserId}`,
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
    throw new Error(data.message || 'Failed to fetch mutual friends');
  }

  return {
    count: data.count || 0,
    mutualFriends: data.mutualFriends || [],
  };
};

