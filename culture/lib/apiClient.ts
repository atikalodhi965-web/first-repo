const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/**
 * A basic API client wrapper around fetch for making requests to the backend server.
 * Automatically adds Content-Type JSON headers and handles errors.
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Ensure endpoint starts with a slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${path}`;

  // Get token from local storage (zustand persist)
  let token = null;
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        token = parsed?.state?.token;
      } catch (e) {
        console.error("Failed to parse auth token", e);
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if the response is successful
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
    }

    // Try to parse the response as JSON
    const data = await response.json().catch(() => ({}));
    return data as T;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}
