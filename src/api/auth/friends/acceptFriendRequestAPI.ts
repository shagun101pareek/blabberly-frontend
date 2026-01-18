import { getAuthToken } from '@/app/utils/auth';

/**
 * Accept a friend request
 * @param requestId - The ID of the friend request to accept
 * @returns Promise resolving to the accepted friend request data
 * @throws Error if authentication fails or API request fails
 */
export async function acceptFriendRequestAPI(requestId: string): Promise<any> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const url = `${BASE_URL}/api/friend/requests/accept/${requestId}`;
  
  console.log('Accepting friend request:', { requestId, url });

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('Accept friend request response status:', response.status, response.statusText);

  // Handle non-OK responses
  if (!response.ok) {
    let errorMessage = 'Failed to accept friend request';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      console.error('Accept friend request error:', errorData);
    } catch (parseError) {
      // If response is not JSON, use status text
      errorMessage = `Failed to accept friend request: ${response.status} ${response.statusText}`;
      console.error('Failed to parse error response:', parseError);
    }
    
    throw new Error(errorMessage);
  }

  // Parse successful response
  let data;
  try {
    data = await response.json();
    console.log('Accept friend request success:', data);
  } catch (parseError) {
    console.error('Failed to parse success response:', parseError);
    throw new Error('Received invalid response from server');
  }

  return data;
}
