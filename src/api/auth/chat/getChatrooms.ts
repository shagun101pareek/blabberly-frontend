import { getAuthToken } from "@/app/utils/auth";

export interface ChatroomParticipant {
  _id: string;
  username: string;
  email: string;
  profileImage?: string;
  profilePicture?: string; // Alternative field name for backward compatibility
  updatedAt?: string; // User profile last updated timestamp for cache-busting
}

export interface ChatroomLastMessage {
  text: string;
  sender: string;
  createdAt: string;
}

export interface ChatroomResponse {
  _id: string;
  participants: ChatroomParticipant[];
  isGroup: boolean;
  lastMessage?: ChatroomLastMessage;
  updatedAt: string;
}

export interface GetChatroomsResponse {
  rooms: ChatroomResponse[];
}

/**
 * Fetch all chatrooms for the authenticated user
 * @returns Array of chatrooms
 */
export const getChatroomsAPI = async (): Promise<ChatroomResponse[]> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const response = await fetch(`${BASE_URL}/api/chatrooms`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    const errorMessage = (data as any).message || 'Failed to fetch chatrooms';
    throw new Error(errorMessage);
  }

  const responseData = data as GetChatroomsResponse;
  return responseData.rooms || [];
};

