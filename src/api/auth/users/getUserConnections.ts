import { getAuthToken } from "@/app/utils/auth";

export interface Connection {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  avatarUrl?: string;
}

export interface UserConnectionsResponse {
  connections: Connection[];
}

/**
 * Fetch connections list for the logged-in user
 * @returns Promise with connections list
 */
export const getUserConnectionsAPI = async (): Promise<UserConnectionsResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const response = await fetch(
    `${BASE_URL}/api/users/me/connections`,
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
    throw new Error(data.message || 'Failed to fetch connections');
  }

  // Handle different response structures
  let connectionsArray: Connection[] = [];
  
  if (Array.isArray(data)) {
    // If the response is directly an array
    connectionsArray = data;
  } else if (data.users && Array.isArray(data.users)) {
    // If the response has a users property (actual API response)
    connectionsArray = data.users;
  } else if (data.connections && Array.isArray(data.connections)) {
    // If the response has a connections property
    connectionsArray = data.connections;
  } else if (data.data && Array.isArray(data.data)) {
    // If the response has a data property
    connectionsArray = data.data;
  }

  return {
    connections: connectionsArray,
  };
};

