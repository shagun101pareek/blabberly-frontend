import { getAuthToken } from "@/app/utils/auth";

/**
 * Mark messages as seen via PUT /api/messages/seen
 * @param chatroomId - The ID of the chatroom
 */
export const markMessagesAsSeenAPI = async (chatroomId: string): Promise<void> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch('http://localhost:5000/api/messages/seen', {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      chatroomId,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    const errorMessage = (data as any).message || 'Failed to mark messages as seen';
    throw new Error(errorMessage);
  }
};

