import axios from 'axios';

export async function acceptFriendRequestAPI(requestId: string): Promise<any> {
  const token = localStorage.getItem('token'); 

  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await axios.put(
      `/api/friend/requests/accept/${requestId}`,
      {}, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || `API error: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('No response received from server. Please try again.');
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
    throw new Error('An unknown error occurred.');
  }
}
