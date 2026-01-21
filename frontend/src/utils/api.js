export const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/v1`;
  }
  // return import.meta.env.PROD ? 'https://api-obs-iota.vercel.app/api/v1' : 'https://api-9ne7dgt9v-sris-projects-8ff08b1b.vercel.app/api/v1';
  return import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1';
};

const API_URL = getApiUrl();

export async function apiRequest(endpoint, options = {}) {
  // Token is now handled via HttpOnly cookie
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Requested-With': 'XMLHttpRequest', // CSRF Protection
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Important for sending cookies
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

