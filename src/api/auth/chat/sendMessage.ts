import { getAuthToken } from "@/app/utils/auth";

export interface SendMessageResponse {
  _id: string;
  content: string;
  sender: {
    _id: string;
    username: string;
  } | string;
  chatroom: string;
  createdAt: string;
  updatedAt: string;
  status: 'sent' | 'delivered' | 'seen';
  readBy?: string[];
  __v?: number;
}

/**
 * Send a message via POST /api/messages/send
 * @param chatroomId - The ID of the chatroom
 * @param receiverId - The ID of the message receiver
 * @param content - The message content
 * @returns The saved message with status field
 */
export const sendMessageAPI = async (chatroomId: string, receiverId: string, content: string): Promise<SendMessageResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const response = await fetch(`${BASE_URL}/api/messages/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      chatroomId,
      receiverId,
      content,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    const errorMessage = (data as any).message || 'Failed to send message';
    throw new Error(errorMessage);
  }

  return data;
};

