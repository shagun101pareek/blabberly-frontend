import { getAuthToken } from "../utils/auth";

export interface PendingFriendRequestResponse {
  requests: Array<{
    _id: string;
    fromUser: {
      _id: string;
      email: string;
      username: string;
      avatar?: string;
    };
    toUser: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }>;
}

export interface PendingFriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  createdAt: string;
}

export const getPendingFriendRequestsAPI = async (): Promise<PendingFriendRequest[]> => {
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
    throw new Error((data as any).message || 'Failed to fetch pending friend requests');
  }

  const typedData = data as PendingFriendRequestResponse;

  // Transform API response to our format
  return typedData.requests.map(req => ({
    id: req._id,
    senderId: req.fromUser._id,
    senderUsername: req.fromUser.username,
    senderAvatar: req.fromUser.avatar,
    createdAt: req.createdAt,
  }));
};
