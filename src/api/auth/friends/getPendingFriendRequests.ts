// hooks/getPendingFriendRequestsAPI.ts

import { getAuthToken } from "@/app/utils/auth";
import { GetPendingFriendRequestsResponse } from "@/app/types/friends";

export const getPendingFriendRequestsAPI =
  async (): Promise<GetPendingFriendRequestsResponse> => {
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      "http://localhost:5000/api/friend/requests/pending",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch pending friend requests");
    }

    return data;
  };
