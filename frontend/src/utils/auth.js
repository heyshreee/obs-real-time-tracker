export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  }
}

export function removeToken() {
  localStorage.removeItem('token');
}

export function isAuthenticated() {
  const token = getToken();
  return !!token;
}

