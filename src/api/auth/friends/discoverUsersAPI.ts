import { getAuthToken } from "@/app/utils/auth";

export interface DiscoverUser {
  id: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

/**
 * Discover users API response might have _id instead of id
 */
interface DiscoverUserResponse {
  _id?: string;
  id?: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

export const discoverUsersAPI = async (): Promise<DiscoverUser[]> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch("http://localhost:5000/api/users/discover", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to discover users');
  }

  // Normalize the response - handle both _id and id
  const users: DiscoverUserResponse[] = Array.isArray(data) ? data : (data.users || []);
  
  return users.map((user: DiscoverUserResponse) => ({
    id: user.id || user._id || '',
    username: user.username || '',
    avatar: user.avatar,
    isOnline: user.isOnline,
  })).filter(user => user.id); // Filter out users without valid IDs
};
