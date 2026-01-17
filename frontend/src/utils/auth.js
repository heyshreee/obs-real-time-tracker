export function getToken() {
  // Token is HttpOnly, cannot be accessed by JS
  return null;
}

export function setToken(token) {
  // No-op, handled by HttpOnly cookie
}

export function removeToken() {
  // We need an endpoint to clear cookie, but for now just clear local state if any
}

export function isAuthenticated() {
  // This is tricky with HttpOnly cookies. We usually check a user profile endpoint.
  // For now, we'll assume if we have a user object in context, we are auth'd.
  return true;
}

