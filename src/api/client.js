/**
 * REST client for HostelOS backend. Uses Vite proxy: /api → http://localhost:5000
 */

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
  const url = `/api${path.startsWith('/') ? path : `/${path}`}`;
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
