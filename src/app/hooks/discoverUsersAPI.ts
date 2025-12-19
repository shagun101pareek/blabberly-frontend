import { getAuthToken } from "../utils/auth";

export interface DiscoverUser {
  id: string;
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

  return data;
};
