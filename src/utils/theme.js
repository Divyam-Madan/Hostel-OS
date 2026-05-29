const THEME_KEY = 'hostel_os_theme';
const THEMES = ['light', 'dark', 'rose'];

export const THEME_META = {
  light: { id: 'light', label: 'Morning Cream', icon: 'sun' },
  dark: { id: 'dark', label: 'Sunset Dark', icon: 'moon' },
  rose: { id: 'rose', label: 'Rose Quartz', icon: 'sparkle' },
};

function normalizeTheme(value) {
  if (value === 'morning' || value === 'morning-cream') return 'light';
  if (value === 'sunset' || value === 'sunset-dark') return 'dark';
  if (value === 'rose' || value === 'rose-quartz') return 'rose';
  return THEMES.includes(value) ? value : 'dark';
}

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_KEY);
  return normalizeTheme(stored);
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return 'dark';
  const next = normalizeTheme(theme);
  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next === 'dark' ? 'dark' : 'light';
  window.localStorage.setItem(THEME_KEY, next);
  try {
    window.dispatchEvent(new CustomEvent('hostel:theme-changed', { detail: { theme: next } }));
  } catch {
    // ignore non-browser / test contexts
  }
  return next;
}

export function syncThemeFromStorage() {
  return applyTheme(getStoredTheme());
}

export function getThemeOptions() {
  return THEMES.map((id) => THEME_META[id]);
}

export { THEME_KEY };
