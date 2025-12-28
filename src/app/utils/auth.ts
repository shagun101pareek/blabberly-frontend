/**
 * Authentication utility functions
 */

/**
 * Store authentication token in localStorage
 */
export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Decode JWT token to get user ID
 * Note: This is a simple base64 decode. In production, you should verify the token signature.
 */
export const getUserIdFromToken = (): string | null => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.userId || payload.id || payload._id || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Store user ID in localStorage
 */
export const setUserId = (userId: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', userId);
  }
};

/**
 * Get user ID from localStorage or token
 */
export const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    // First try to get from localStorage
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) return storedUserId;

    // Fallback to extracting from token
    return getUserIdFromToken();
  }
  return null;
};

