// src/utils/index.js

export const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const fmtDateLong = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';

export const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const randomId = (prefix = 'ID') =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}`;

export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export const pct = (val, total) =>
  total === 0 ? 0 : Math.round((val / total) * 100);
