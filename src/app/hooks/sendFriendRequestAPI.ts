import { getAuthToken } from "../utils/auth";

export const sendFriendRequestAPI = async (toUserId: string) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch("http://localhost:5000/api/friend/requests/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ toUserId }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send friend request');
  }

  return data;
};

