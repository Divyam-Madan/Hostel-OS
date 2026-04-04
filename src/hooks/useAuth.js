// src/hooks/useAuth.js
// Handles both student and admin sessions.
// Persists in localStorage; hydrates role from GET /api/admin/profile or /api/user/profile.

import { useState, useCallback, useEffect } from 'react';
import { api, getStoredToken, setStoredToken } from '../api/client';

const SESSION_KEY = 'hostel_os_auth';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function buildUser(u, role) {
  if (!u) return null;
  return {
    id:         u.id || u._id,
    name:       u.name || u.username,
    username:   u.username || u.name,
    email:      u.email,
    employeeId: u.employeeId || null,
    photo:      u.photo || (u.name || u.username || '?')[0].toUpperCase(),
    room:       u.roomNumber || u.room || '',
    role,
  };
}

export function useAuth() {
  const [auth, setAuthState] = useState(() => {
    const token   = getStoredToken();
    const session = loadSession();
    if (token && session?.role) return { ...session, token, hydrating: false };
    if (token && !session?.role) return { token, role: null, user: null, hydrating: true };
    return null;
  });

  const applySession = useCallback((payload) => {
    const { token, role, user } = payload;
    setStoredToken(token);
    const u = user?.name || user?.username
      ? { ...user, role }
      : buildUser(user, role);
    const session = {
      role,
      user: u,
      loggedInAt: Date.now(),
      expiresAt:  Date.now() + SESSION_TTL,
    };
    saveSession(session);
    setAuthState({ ...session, token, hydrating: false });
  }, []);

  const login = useCallback((payload) => {
    if (typeof payload === 'string') return;
    applySession(payload);
  }, [applySession]);

  const logout = useCallback(() => {
    setStoredToken('');
    localStorage.removeItem(SESSION_KEY);
    setAuthState(null);
  }, []);

  // Hydrate from server if we have a token but no cached session
  useEffect(() => {
    const token = getStoredToken();
    if (!token || !auth?.hydrating) return;

    let cancelled = false;
    (async () => {
      try {
        // Try admin profile first (if token belongs to admin)
        let data;
        try {
          data = await api('/admin/profile');
          if (data?.admin || data?.user) {
            if (!cancelled) {
              applySession({
                token,
                role: 'admin',
                user: buildUser(data.admin || data.user, 'admin'),
              });
            }
            return;
          }
        } catch { /* not an admin token */ }

        // Fall back to student profile
        data = await api('/user/profile');
        if (!cancelled && data?.user) {
          applySession({
            token,
            role: data.role || 'student',
            user: buildUser(data.user, data.role || 'student'),
          });
        }
      } catch {
        if (!cancelled) logout();
      }
    })();
    return () => { cancelled = true; };
  }, [auth?.hydrating, applySession, logout]);

  const token     = getStoredToken();
  const isLoggedIn = !!token && !!auth?.role && !auth?.hydrating;

  return {
    isLoggedIn,
    hydrating: !!token && !!auth?.hydrating,
    role:  auth?.role  || null,
    user:  auth?.user  || null,
    token: auth?.token || token,
    login,
    logout,
  };
}
