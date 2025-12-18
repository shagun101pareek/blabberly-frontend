import { getAuthToken } from "../utils/auth";

export interface PendingFriendRequestResponse {
  count: number;
  requests: Array<{
    _id: string;
    fromUser: {
      _id: string;
      username: string;
    };
    createdAt: string;
  }>;
}

export const getPendingFriendRequestsAPI = async (): Promise<PendingFriendRequestResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch("http://localhost:5000/api/friend/requests/pending", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch pending friend requests');
  }

  return data;
};
