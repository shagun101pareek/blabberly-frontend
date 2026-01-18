import { getAuthToken } from "@/app/utils/auth";

export const sendFriendRequestAPI = async (toUserId: string) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const response = await fetch(`${BASE_URL}/api/friend/requests/send`, {
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

