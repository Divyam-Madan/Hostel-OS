/**
 * REST client for HostelOS backend. Uses Vite proxy: /api → http://localhost:5000
 */
console.log("BASE_URL:", import.meta.env.VITE_API_URL);
const TOKEN_KEY = 'hostel_os_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/**
 * @param {string} path - e.g. '/auth/login' (no /api prefix)
 * @param {RequestInit} options
 */
export async function api(path, options = {}) {
  console.log("BASE_URL:", import.meta.env.VITE_API_URL); // 👈 ADD THIS LINE

  const BASE_URL = import.meta.env.VITE_API_URL || '/api';
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
