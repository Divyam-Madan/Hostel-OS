/**
 * REST client for HostelOS backend. Uses Vite proxy: /api → http://localhost:5000
 */
const TOKEN_KEY = 'hostel_os_token';
const SESSION_EXPIRED_EVENT = 'hostel:session-expired';
const AUTH_FAILED_EVENT = 'hostel:auth-failed';

let authFailureHandled = false;

function dispatchAuthFailure(detail) {
  if (authFailureHandled) return false;
  authFailureHandled = true;
  try {
    window.dispatchEvent(new CustomEvent(AUTH_FAILED_EVENT, { detail }));
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail }));
  } catch {
    // ignore event errors in non-browser contexts
  }
  return true;
}

export function resetAuthFailureState() {
  authFailureHandled = false;
}

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
  const BASE_URL = import.meta.env.VITE_API_URL || '/api';
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (e) {
    // Network / CORS / backend unreachable
    const ne = new Error('Network error: backend unreachable or CORS issue');
    ne.cause = e;
    ne.isNetwork = true;
    throw ne;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Normalize messages for common statuses so UI can show meaningful text
    let msg = data.message || `Request failed (${res.status})`;
    if (res.status === 401) msg = data.message || 'Invalid credentials';
    else if (res.status === 403) msg = data.message || 'Forbidden';
    else if (res.status >= 500) msg = data.message || 'Server error';

    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    err.isAuthError = res.status === 401;

    if (res.status === 401 && getStoredToken()) {
      dispatchAuthFailure({ path, status: res.status, message: msg });
    }
    throw err;
  }
  return data;
}

async function request(method, path, body, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const normalizedBody = body === undefined || body === null || isFormData || typeof body === 'string'
    ? body
    : JSON.stringify(body);
  const init = { ...options, method, body: normalizedBody };
  return api(path, init);
}

const client = {
  get: (path, options = {}) => request('GET', path, undefined, options),
  post: (path, body, options = {}) => request('POST', path, body, options),
  patch: (path, body, options = {}) => request('PATCH', path, body, options),
  put: (path, body, options = {}) => request('PUT', path, body, options),
  delete: (path, options = {}) => request('DELETE', path, undefined, options),
};

export default client;
