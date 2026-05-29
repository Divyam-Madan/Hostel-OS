// src/components/layout/Topbar.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Search, LogOut, Settings, X, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { api } from '../../api/client';
import { Modal, Field, useToast } from '../ui';
import { applyTheme, getStoredTheme, getThemeOptions, syncThemeFromStorage } from '../../utils/theme';

const PAGE_TITLES = {
  dashboard: 'Dashboard', 'my-info': 'My Profile', attendance: 'Attendance',
  'entry-exit': 'Entry / Exit Logs', room: 'Room Allotment', mess: 'Mess Management',
  laundry: 'Laundry Slots', complaints: 'Complaints', leave: 'Leave & Outing',
  fees: 'Hostel Fees', 'lost-found': 'Lost & Found', events: 'Events & Hackathons',
  gym: 'Gym & Wellness', counselling: 'Counselling Portal', hospital: 'Hospital & Ambulance',
  admin: 'Admin Dashboard', timetable: 'Timetable & Alerts',
  'admin-dashboard': 'Warden Intelligence Dashboard',
  'admin-complaints': 'Warden Complaints Desk',
  'admin-leaves': 'Leave Approval Console',
  'admin-events': 'Campus Events Control',
  'admin-feedback': 'Mess Feedback Analysis',
  'admin-wellbeing': 'Wellbeing Operations',
  'admin-students': 'Student Directory',
  'admin-laundry': 'Laundry Management',
  'admin-timetable': 'Timetable Control',
};

const SEARCH_GROUP_TITLES = {
  timetable: 'Timetable',
  events: 'Events',
  complaints: 'Complaints',
  lostFound: 'Lost & Found',
  fees: 'Fees',
  counselling: 'Counselling',
  laundry: 'Laundry',
  leaves: 'Leave requests',
  wellbeing: 'Wellbeing',
  students: 'Students',
};

function formatTime(value) {
  if (!value) return '';
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? '' : dt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function highlightText(text, query) {
  const value = String(text || '');
  const q = String(query || '').trim();
  if (!q) return value;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = value.split(new RegExp(`(${escaped})`, 'ig'));
  return parts.map((part, index) => (
    part.toLowerCase() === q.toLowerCase()
      ? <mark key={`${part}-${index}`} style={{ background: 'rgba(245,158,11,0.24)', color: 'inherit', padding: 0 }}>{part}</mark>
      : <span key={`${part}-${index}`}>{part}</span>
  ));
}

export default function Topbar({ activePage, onLogout, onNavigate, role, user }) {
  const toast = useToast();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchGroups, setSearchGroups] = useState({});
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [activeTheme, setActiveTheme] = useState(getStoredTheme());
  const [settingsDraft, setSettingsDraft] = useState({
    theme: getStoredTheme(),
    notifications: true,
    email: true,
    profileVisible: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    logoutAll: true,
  });
  const searchRef = useRef(null);
  const searchCacheRef = useRef(new Map());
  const activeFetchControllerRef = useRef(null);
  const fetchSeqRef = useRef(0);
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const themeOptions = useMemo(() => getThemeOptions(), []);
  const activeThemeIndex = Math.max(themeOptions.findIndex((option) => option.id === activeTheme), 0);
  const searchItems = useMemo(() => {
    const order = role === 'admin'
      ? ['timetable', 'events', 'complaints', 'leaves', 'wellbeing', 'students', 'lostFound', 'fees', 'laundry']
      : ['timetable', 'events', 'complaints', 'lostFound', 'fees', 'counselling', 'laundry'];
    return order.flatMap((key) => (searchGroups[key] || []).map((item) => ({ ...item, category: key })));
  }, [searchGroups, role]);
  const hasSearchQuery = searchQuery.trim().length > 0;

  const notificationPath = '/notifications';
  const profilePath = role === 'admin' ? '/admin/profile' : '/user/profile';
  const passwordPath = role === 'admin' ? '/admin/change-password' : '/user/change-password';

  useEffect(() => {
    syncThemeFromStorage();
    const onThemeChanged = () => {
      const next = syncThemeFromStorage();
      setActiveTheme(next);
    };
    window.addEventListener('hostel:theme-changed', onThemeChanged);
    window.addEventListener('storage', onThemeChanged);
    setActiveTheme(getStoredTheme());
    return () => {
      window.removeEventListener('hostel:theme-changed', onThemeChanged);
      window.removeEventListener('storage', onThemeChanged);
    };
  }, []);

  const setTheme = (next) => {
    applyTheme(next);
    setActiveTheme(next);
    setSettingsDraft((prev) => ({ ...prev, theme: next }));
  };

  useEffect(() => {
    let mounted = true;
    const loadNotifications = async () => {
      setNotifLoading(true);
      setNotifError('');
      try {
        const data = await api(notificationPath);
        if (!mounted) return;
        setNotifications(data.notifications || []);
      } catch (err) {
        if (!mounted) return;
        setNotifError(err.message || 'Failed to load notifications');
      } finally {
        if (mounted) setNotifLoading(false);
      }
    };
    loadNotifications();
    const onRefresh = () => loadNotifications();
    window.addEventListener('hostel:notifications', onRefresh);
    window.addEventListener('hostel:alerts', onRefresh);
    return () => {
      mounted = false;
      window.removeEventListener('hostel:notifications', onRefresh);
      window.removeEventListener('hostel:alerts', onRefresh);
    };
  }, [notificationPath]);

  useEffect(() => {
    if (!settingsOpen) return;
    setSettingsDraft((prev) => ({
      ...prev,
      theme: getStoredTheme(),
      notifications: localStorage.getItem('hostel_os_notify') !== 'false',
      email: localStorage.getItem('hostel_os_email') !== 'false',
      profileVisible: localStorage.getItem('hostel_os_profile') !== 'false',
    }));
  }, [settingsOpen]);

  useEffect(() => {
    if (!searchOpen) return undefined;

    let mounted = true;
    const cache = searchCacheRef.current;
    const controllerForThisEffect = { controller: null };

    const onPointerDown = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onEscape);

    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchGroups({});
      setSearchLoading(false);
      return () => {
        document.removeEventListener('mousedown', onPointerDown);
        window.removeEventListener('keydown', onEscape);
      };
    }

    // Return cached results if available
    if (cache.has(q)) {
      setSearchGroups(cache.get(q));
      setSearchLoading(false);
      return () => {
        document.removeEventListener('mousedown', onPointerDown);
        window.removeEventListener('keydown', onEscape);
      };
    }

    // Debounce + AbortController per-request
    const seq = ++fetchSeqRef.current;
    let timer = null;
    timer = setTimeout(async () => {
      if (!mounted) return;
      // Abort any previous in-flight fetch
      try {
        activeFetchControllerRef.current?.abort();
      } catch {}
      const controller = new AbortController();
      activeFetchControllerRef.current = controller;
      controllerForThisEffect.controller = controller;

      setSearchLoading(true);
      try {
        const data = await api(`/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!mounted) return;
        // ignore stale responses (sequence mismatch or query changed)
        if (fetchSeqRef.current !== seq || searchQuery.trim() !== q) return;

        const results = data.results || data;
        const grouped = {
          timetable: results.timetable || [],
          events: results.events || [],
          complaints: results.complaints || [],
          lostFound: results.lostFound || [],
          fees: results.fees || [],
          counselling: results.counselling || [],
          laundry: results.laundry || [],
          students: results.students || [],
          leaves: results.leaves || [],
          wellbeing: results.wellbeing || [],
        };

        // Cache recent query
        try {
          cache.set(q, grouped);
          // keep cache size reasonable (simple LRU-like): trim to 50 entries
          if (cache.size > 50) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
        } catch {}

        setSearchGroups(grouped);
        setActiveSearchIndex(0);
      } catch (err) {
        // ignore aborts
        if (controllerForThisEffect.controller?.signal?.aborted) return;
        toast.error(err.message || 'Search failed');
      } finally {
        if (mounted) setSearchLoading(false);
      }
    }, 350);

    return () => {
      mounted = false;
      clearTimeout(timer);
      try {
        controllerForThisEffect.controller?.abort();
      } catch {}
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
    };
  }, [searchOpen, searchQuery, role, toast]);

  const openSearchResult = (item) => {
    if (!item) return;
    onNavigate(item.page);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const markAllRead = async () => {
    try {
      await api(`${notificationPath}/read-all`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      toast.error(err.message || 'Could not update notifications');
    }
  };

  const openSettingsFromProfile = async () => {
    try {
      const data = await api(profilePath);
      const profile = data.user || {};
      setSettingsDraft((prev) => ({
        ...prev,
        theme: profile.settings?.theme || prev.theme,
        notifications: profile.settings?.notifications ?? prev.notifications,
        email: profile.settings?.email ?? prev.email,
        profileVisible: profile.settings?.profileVisible ?? prev.profileVisible,
      }));
      setSettingsOpen(true);
    } catch (err) {
      toast.error(err.message || 'Could not load settings');
    }
  };

  const saveSettings = async () => {
    const settings = {
      // Backend profiles currently support dark/light; keep rose as a local visual preference.
      theme: settingsDraft.theme === 'rose' ? 'light' : settingsDraft.theme,
      notifications: settingsDraft.notifications,
      email: settingsDraft.email,
      profileVisible: settingsDraft.profileVisible,
    };
    try {
      setSettingsSaving(true);
      await api(profilePath, {
        method: 'PATCH',
        body: JSON.stringify({ settings }),
      });
      applyTheme(settingsDraft.theme);
      localStorage.setItem('hostel_os_notify', String(settings.notifications));
      localStorage.setItem('hostel_os_email', String(settings.email));
      localStorage.setItem('hostel_os_profile', String(settings.profileVisible));

      if (settingsDraft.newPassword) {
        if (settingsDraft.newPassword !== settingsDraft.confirmPassword) {
          throw new Error('New password and confirmation must match');
        }
        if (settingsDraft.newPassword.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        if (role === 'admin' && user?.id === 'admin') {
          throw new Error('Built-in admin password is managed by environment config');
        }
        await api(passwordPath, {
          method: 'POST',
          body: JSON.stringify({
            currentPassword: settingsDraft.currentPassword,
            newPassword: settingsDraft.newPassword,
            logoutAll: settingsDraft.logoutAll,
          }),
        });
        toast.success('Password updated. Please sign in again on other devices.');
      }

      toast.success('Settings saved');
      setSettingsOpen(false);
      setSettingsDraft((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err.message || 'Could not save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <header id="topbar-sticky" ref={searchRef} style={{ height: 56, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent 24%), var(--bg2)', flexShrink: 0, position: 'relative', zIndex: 50, boxShadow: '0 1px 0 rgba(255,255,255,0.02)' }}>
      <h1 style={{ fontFamily: 'var(--font2)', fontWeight: 600, fontSize: 16, flex: 1, color: 'var(--text)' }}>
        {PAGE_TITLES[activePage] || 'HostelOS'}
      </h1>

      <div style={{ position: 'relative', minWidth: 240, maxWidth: 420, flex: 1 }}>
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent), var(--bg3)', border: '1px solid var(--border2)', borderRadius: 12, padding: '9px 12px', color: 'var(--text3)', fontSize: 13, cursor: 'text', transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background-color 160ms ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'var(--border3)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Search size={14} />
          <span style={{ flex: 1, textAlign: 'left' }}>{searchQuery ? searchQuery : 'Search timetable, events, fees...'}</span>
          {searchOpen && <X size={14} />}
        </button>
        {searchOpen && (
          <div className="notif-popover" style={{ position: 'absolute', top: 46, left: 0, right: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%), var(--bg2)', border: '1px solid var(--border2)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 60 }}>
            <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
              <input
                autoFocus
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across hostel data"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchOpen(false);
                    setSearchQuery('');
                    return;
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveSearchIndex((index) => Math.min(index + 1, Math.max(searchItems.length - 1, 0)));
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveSearchIndex((index) => Math.max(index - 1, 0));
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    openSearchResult(searchItems[activeSearchIndex]);
                  }
                }}
              />
            </div>
            <div style={{ maxHeight: 340, overflow: 'auto' }}>
              {!hasSearchQuery ? null : searchLoading ? (
                <div style={{ padding: 16, color: 'var(--text3)', fontSize: 13 }}>Searching…</div>
              ) : searchItems.length === 0 ? (
                <div style={{ padding: 16, color: 'var(--text3)', fontSize: 13 }}>No results found.</div>
              ) : (
                (role === 'admin'
                  ? ['timetable', 'events', 'complaints', 'leaves', 'wellbeing', 'students', 'lostFound', 'fees', 'laundry']
                  : ['timetable', 'events', 'complaints', 'lostFound', 'fees', 'counselling', 'laundry']).map((groupKey) => {
                  const items = searchGroups[groupKey] || [];
                  if (items.length === 0) return null;
                  return (
                    <div key={groupKey} style={{ borderBottom: '1px solid var(--border)' }}>
                      <div style={{ padding: '8px 14px', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--text3)', background: 'var(--bg3)' }}>{SEARCH_GROUP_TITLES[groupKey] || groupKey}</div>
                      {items.map((item) => {
                        const index = searchItems.findIndex((result) => result.id === item.id && result.category === groupKey);
                        return (
                          <button
                            key={`${groupKey}-${item.id}`}
                            type="button"
                            onMouseEnter={() => setActiveSearchIndex(index)}
                            onClick={() => openSearchResult({ ...item, category: groupKey })}
                            style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', background: activeSearchIndex === index ? 'var(--accent-glow)' : 'transparent', cursor: 'pointer' }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{highlightText(item.title, searchQuery)}</div>
                            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{highlightText(item.subtitle, searchQuery)}</div>
                            {item.detail && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{highlightText(item.detail, searchQuery)}</div>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="theme-switcher" aria-label="Theme selector" role="group">
        <div className="theme-switcher-thumb" style={{ transform: `translateX(${activeThemeIndex * 100}%)` }} />
        {themeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`theme-option ${activeTheme === option.id ? 'active' : ''}`}
            onClick={() => setTheme(option.id)}
            aria-label={`Switch to ${option.label}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button className="btn-icon" onClick={() => setNotifOpen(o => !o)} style={{ position: 'relative' }}>
          <Bell size={16} />
          {unread > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', border: '1.5px solid var(--bg2)' }} />}
        </button>
        {notifOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setNotifOpen(false)} />
            <div className="animate-fadeUp" style={{ position: 'absolute', top: 44, right: 0, width: 340, maxHeight: 420, background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%), var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                <button type="button" onClick={markAllRead} style={{ fontSize: 11, color: 'var(--accent2)', cursor: 'pointer', border: 'none', background: 'transparent' }}>Mark all read</button>
              </div>
              <div style={{ overflow: 'auto' }}>
                {notifLoading ? (
                  <div style={{ padding: 16, color: 'var(--text3)', fontSize: 13 }}>Loading notifications…</div>
                ) : notifError ? (
                  <div style={{ padding: 16, color: 'var(--danger)', fontSize: 13 }}>{notifError}</div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: 16, color: 'var(--text3)', fontSize: 13 }}>No notifications yet.</div>
                ) : notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={async () => {
                      try {
                        await api(`${notificationPath}/${n.id}/read`, { method: 'PATCH', body: JSON.stringify({ read: !n.read }) });
                        setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: !item.read } : item)));
                      } catch (err) {
                        toast.error(err.message || 'Could not update notification');
                      }
                    }}
                    style={{ width: '100%', display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'rgba(196,131,83,0.05)', cursor: 'pointer', transition: 'transform .16s ease, background-color .16s ease', textAlign: 'left' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = n.read ? 'rgba(255,255,255,0.02)' : 'rgba(196,131,83,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(196,131,83,0.05)'; }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: n.read ? 'var(--border3)' : 'var(--accent)' }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, fontWeight: n.read ? 500 : 700 }}>{n.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{n.message}</p>
                      <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{formatTime(n.createdAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <button className="btn-icon" onClick={openSettingsFromProfile}><Settings size={15} /></button>

      {/* Logout button */}
      <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(184,91,51,0.22)', background: 'transparent', cursor: 'pointer', color: 'var(--red)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)', transition: 'all .2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,91,51,0.09)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <LogOut size={13} />
        <span className="hide-mobile">Sign Out</span>
      </button>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" width={620}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="theme-switcher" style={{ width: 340 }}>
              <div className="theme-switcher-thumb" style={{ transform: `translateX(${Math.max(themeOptions.findIndex((option) => option.id === settingsDraft.theme), 0) * 100}%)` }} />
              {themeOptions.map((option) => (
                <button
                  key={`settings-${option.id}`}
                  type="button"
                  className={`theme-option ${settingsDraft.theme === option.id ? 'active' : ''}`}
                  onClick={() => {
                    setSettingsDraft((prev) => ({ ...prev, theme: option.id }));
                    setTheme(option.id);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSettingsDraft((prev) => ({ ...prev, logoutAll: !prev.logoutAll }))}>
              <ShieldCheck size={14} /> Logout all devices: {settingsDraft.logoutAll ? 'On' : 'Off'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSettingsDraft((prev) => ({ ...prev, notifications: !prev.notifications }))}>
              Notifications: {settingsDraft.notifications ? 'On' : 'Off'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSettingsDraft((prev) => ({ ...prev, email: !prev.email }))}>
              Email updates: {settingsDraft.email ? 'On' : 'Off'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSettingsDraft((prev) => ({ ...prev, profileVisible: !prev.profileVisible }))}>
              Profile visibility: {settingsDraft.profileVisible ? 'Public' : 'Hidden'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSettingsDraft((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))}>
              <SlidersHorizontal size={14} /> Reset password fields
            </button>
          </div>

          <Field label="Current password">
            <input className="input" type="password" value={settingsDraft.currentPassword} onChange={(e) => setSettingsDraft((prev) => ({ ...prev, currentPassword: e.target.value }))} />
          </Field>
          <Field label="New password">
            <input className="input" type="password" value={settingsDraft.newPassword} onChange={(e) => setSettingsDraft((prev) => ({ ...prev, newPassword: e.target.value }))} />
          </Field>
          <Field label="Confirm new password">
            <input className="input" type="password" value={settingsDraft.confirmPassword} onChange={(e) => setSettingsDraft((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSettingsOpen(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={saveSettings} disabled={settingsSaving}>{settingsSaving ? 'Saving…' : 'Save settings'}</button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
