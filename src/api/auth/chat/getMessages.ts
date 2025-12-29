import { getAuthToken } from "@/app/utils/auth";

export interface MessageResponse {
  _id: string;
  text: string;
  sender: string;
  chatroom: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetMessagesResponse {
  messages: MessageResponse[];
}

/**
 * Fetch all messages for a specific chatroom
 * @param chatroomId - The ID of the chatroom
 * @returns Array of messages
 */
export const getMessagesAPI = async (chatroomId: string): Promise<MessageResponse[]> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`http://localhost:5000/api/chat/chatrooms/${chatroomId}/messages`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    const errorMessage = (data as any).message || 'Failed to fetch messages';
    throw new Error(errorMessage);
  }

  const responseData = data as GetMessagesResponse;
  return responseData.messages || [];
};

